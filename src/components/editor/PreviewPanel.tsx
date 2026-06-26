"use client";

import { DocxPart } from "@/types";
import { formatXml, highlightXml } from "@/lib/docx";
import { FileText } from "lucide-react";

interface PreviewPanelProps {
  part: DocxPart | null;
  viewMode: "preview" | "xml";
}

export default function PreviewPanel({ part, viewMode }: PreviewPanelProps) {
  if (!part) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <FileText size={40} className="text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500 text-sm">Seleccione uma parte para pré-visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-950">
      {/* Part label bar */}
      <div className="px-5 py-2.5 border-b border-surface-800 bg-surface-900 flex items-center gap-2 shrink-0">
        <FileText size={14} className="text-brand-400" />
        <span className="text-sm font-medium text-white">{part.label}</span>
        <span className="text-xs text-surface-500 font-mono ml-1">{part.name}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "preview" ? (
          <div className="min-h-full p-6 flex justify-center">
            <div
              className="w-full max-w-[794px] min-h-[1123px] shadow-2xl rounded-sm"
              style={{ background: "#fff" }}
              dangerouslySetInnerHTML={{ __html: part.htmlPreview }}
            />
          </div>
        ) : (
          <div className="p-4">
            <pre
              className="xml-viewer text-xs leading-relaxed whitespace-pre-wrap break-all"
              dangerouslySetInnerHTML={{
                __html: highlightXml(formatXml(part.xmlContent)),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
