import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { unpackDocx } from "@/lib/docx";
import { setSession } from "@/lib/sessions";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Apenas ficheiros .docx são suportados." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const { parts, zipData } = await unpackDocx(buffer);

    const sessionId = uuid();

    setSession(sessionId, {
      id: sessionId,
      originalName: file.name,
      parts,
      createdAt: Date.now(),
      editHistory: [],
      zipData,
    });

    return NextResponse.json({
      sessionId,
      parts: parts.map((p) => ({
        id: p.id,
        name: p.name,
        label: p.label,
        category: p.category,
        isEditable: p.isEditable,
        htmlPreview: p.htmlPreview,
        // Do NOT send full XML to client on upload — too large
        xmlContent: p.isEditable ? p.xmlContent : "",
      })),
      originalName: file.name,
    });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      { error: "Erro ao processar o documento." },
      { status: 500 }
    );
  }
}
