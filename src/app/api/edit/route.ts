import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession, updateSession } from "@/lib/sessions";
import { xmlToHtmlPreview } from "@/lib/docx";
import { EditRecord } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, partId, instruction, conversationHistory } = body;

    if (!sessionId || !partId || !instruction) {
      return NextResponse.json({ error: "Parâmetros em falta." }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
    }

    const part = session.parts.find((p) => p.id === partId);
    if (!part) {
      return NextResponse.json({ error: "Parte não encontrada." }, { status: 404 });
    }

    // Build system prompt
    const systemPrompt = `Você é um especialista em edição de documentos Word (formato OOXML / DOCX).
O utilizador vai pedir alterações a um ficheiro XML de um documento Word.

REGRAS IMPORTANTES:
1. Retorne APENAS o XML modificado, sem explicações fora do XML.
2. Mantenha toda a estrutura XML válida e os namespaces intactos.
3. Faça APENAS as alterações pedidas pelo utilizador.
4. Não remova nada que não foi pedido para remover.
5. Preserve todos os atributos e elementos existentes que não foram mencionados.
6. Após o XML, adicione uma linha com "---EXPLICAÇÃO---" e depois uma explicação curta em português do que foi alterado.

A parte sendo editada é: "${part.label}" (${part.name})`;

    const messages = [
      ...conversationHistory.slice(-6), // keep last 6 for context
      {
        role: "user",
        content: `Aqui está o XML actual:\n\n\`\`\`xml\n${part.xmlContent}\n\`\`\`\n\nInstrução: ${instruction}`,
      },
    ];

    // Call Anthropic API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      throw new Error(`API error: ${err}`);
    }

    const aiData = await anthropicRes.json();
    const rawResponse = aiData.content?.[0]?.text || "";

    // Split XML from explanation
    const [xmlPart, explanationPart] = rawResponse.split("---EXPLICAÇÃO---");

    // Extract XML (remove possible ``` fences)
    let newXml = xmlPart
      .replace(/```xml\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const explanation = explanationPart?.trim() || "Alteração aplicada com sucesso.";

    // Validate it's XML-like
    if (!newXml.startsWith("<") && !newXml.includes("<?xml")) {
      throw new Error("A IA não retornou XML válido.");
    }

    // Generate new HTML preview
    const htmlPreview = xmlToHtmlPreview(newXml, part.name);

    // Build edit record
    const editRecord: EditRecord = {
      id: uuid(),
      timestamp: Date.now(),
      partId: part.id,
      partName: part.label,
      instruction,
      before: part.xmlContent,
      after: newXml,
      appliedBy: "ai",
    };

    // Update session
    const updatedParts = session.parts.map((p) =>
      p.id === partId ? { ...p, xmlContent: newXml, htmlPreview } : p
    );

    updateSession(sessionId, {
      parts: updatedParts,
      editHistory: [...session.editHistory, editRecord],
    });

    return NextResponse.json({
      newXml,
      htmlPreview,
      explanation,
      editRecord,
    });
  } catch (err) {
    console.error("[edit]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao processar edição.",
      },
      { status: 500 }
    );
  }
}
