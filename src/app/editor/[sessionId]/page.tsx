"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { DocxPart, ChatMessage, DocxSession } from "@/types";
import { v4 as uuid } from "uuid";
import Sidebar from "@/components/editor/Sidebar";
import PreviewPanel from "@/components/editor/PreviewPanel";
import ChatPanel from "@/components/editor/ChatPanel";
import Topbar from "@/components/editor/Topbar";

export default function EditorPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<Partial<DocxSession> | null>(null);
  const [parts, setParts] = useState<DocxPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "xml">("preview");
  const [error, setError] = useState<string | null>(null);

  const conversationHistory = useRef<{ role: string; content: string }[]>([]);

  // Load session
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/parse/${sessionId}`);
        if (!res.ok) throw new Error("Sessão inválida ou expirada.");
        const data = await res.json();
        setSession(data);
        setParts(data.parts);
        // Auto-select document principal
        const doc = data.parts.find((p: DocxPart) => p.name === "word/document.xml");
        setSelectedPartId(doc?.id ?? data.parts[0]?.id ?? null);

        // Welcome message
        setMessages([
          {
            id: uuid(),
            role: "assistant",
            content: `Documento **${data.originalName}** carregado com sucesso! Encontrei **${data.parts.length} partes** no ficheiro.\n\nSeleccione uma secção na barra lateral e diga-me o que deseja editar.`,
            timestamp: Date.now(),
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [sessionId]);

  const selectedPart = parts.find((p) => p.id === selectedPartId) ?? null;

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!selectedPartId || !sessionId || isEditing) return;

      const userMsg: ChatMessage = {
        id: uuid(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      const loadingMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setIsEditing(true);

      conversationHistory.current.push({ role: "user", content: text });

      try {
        const res = await fetch("/api/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            partId: selectedPartId,
            instruction: text,
            conversationHistory: conversationHistory.current.slice(-8),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro na edição.");

        // Update part in state
        setParts((prev) =>
          prev.map((p) =>
            p.id === selectedPartId
              ? { ...p, xmlContent: data.newXml, htmlPreview: data.htmlPreview }
              : p
          )
        );

        conversationHistory.current.push({
          role: "assistant",
          content: data.explanation,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading
              ? {
                  ...m,
                  content: data.explanation,
                  isLoading: false,
                  editApplied: true,
                  editRecord: data.editRecord,
                }
              : m
          )
        );
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Erro desconhecido.";
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading
              ? { ...m, content: `❌ ${errMsg}`, isLoading: false }
              : m
          )
        );
      } finally {
        setIsEditing(false);
      }
    },
    [selectedPartId, sessionId, isEditing]
  );

  const handleExport = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error("Falha na exportação.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "documento_editado.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao exportar.");
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full spinner" />
          <p className="text-surface-400 text-sm">A carregar documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <p className="text-red-400 mb-2 font-medium">{error}</p>
          <a href="/" className="text-brand-400 text-sm hover:underline">
            ← Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      <Topbar
        originalName={session?.originalName ?? "Documento"}
        editCount={session?.editHistory?.length ?? 0}
        onExport={handleExport}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          parts={parts}
          selectedPartId={selectedPartId}
          onSelectPart={(id) => {
            setSelectedPartId(id);
            conversationHistory.current = [];
          }}
        />
        <PreviewPanel
          part={selectedPart}
          viewMode={viewMode}
        />
        <ChatPanel
          messages={messages}
          isEditing={isEditing}
          selectedPart={selectedPart}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
