"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Zap, Eye, MessageSquare, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".docx")) {
        setError("Apenas ficheiros .docx são suportados.");
        return;
      }
      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(await res.text());
        const { sessionId } = await res.json();
        router.push(`/editor/${sessionId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar ficheiro.");
        setIsUploading(false);
      }
    },
    [router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <FileText size={16} className="text-white" />
        </div>
        <span className="font-semibold text-white text-lg tracking-tight">ChatWork</span>
        <span className="text-surface-300 text-sm ml-1">— Editor de Documentos Word</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-xs font-medium mb-6">
            <Zap size={12} />
            Edição por linguagem natural com IA
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Edite documentos Word<br />
            <span className="text-brand-400">conversando com IA</span>
          </h1>
          <p className="text-surface-300 text-lg leading-relaxed">
            Faça upload do seu .docx, escolha as secções a editar e veja as alterações em tempo real.
            Quando terminar, exporte o ficheiro actualizado.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`
            w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? "border-brand-500 bg-brand-950/50 scale-[1.02]"
              : "border-surface-700 bg-surface-900/50 hover:border-brand-600 hover:bg-surface-900"
            }
            ${isUploading ? "pointer-events-none opacity-60" : ""}
          `}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".docx";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full spinner" />
              <p className="text-surface-300 text-sm">A processar documento...</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-brand-400" />
              </div>
              <p className="text-white font-medium mb-1">
                Arraste o seu .docx aqui
              </p>
              <p className="text-surface-400 text-sm mb-4">
                ou clique para seleccionar ficheiro
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-colors">
                Seleccionar Ficheiro
                <ArrowRight size={14} />
              </span>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-2xl w-full">
          {[
            {
              icon: <Upload size={20} />,
              title: "Descompacta o DOCX",
              desc: "Extrai e analisa o XML interno automaticamente",
            },
            {
              icon: <MessageSquare size={20} />,
              title: "Edita por conversa",
              desc: "Diga o que quer mudar em linguagem natural",
            },
            {
              icon: <Eye size={20} />,
              title: "Pré-visualização ao vivo",
              desc: "Veja as alterações enquanto são aplicadas",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-xl bg-surface-900 border border-surface-800"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center text-brand-400 mb-3">
                {f.icon}
              </div>
              <p className="text-white text-sm font-medium mb-1">{f.title}</p>
              <p className="text-surface-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
