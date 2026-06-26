"use client";

import { FileText, Download, Eye, Code, Home } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  originalName: string;
  editCount: number;
  onExport: () => void;
  viewMode: "preview" | "xml";
  onViewModeChange: (mode: "preview" | "xml") => void;
}

export default function Topbar({
  originalName,
  editCount,
  onExport,
  viewMode,
  onViewModeChange,
}: TopbarProps) {
  return (
    <header className="h-14 border-b border-surface-800 bg-surface-900 flex items-center px-4 gap-3 shrink-0">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-white hover:text-brand-300 transition-colors mr-2"
      >
        <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
          <FileText size={14} />
        </div>
        <span className="font-semibold text-sm">ChatWork</span>
      </Link>

      <div className="w-px h-5 bg-surface-700" />

      {/* Document name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-surface-400 text-sm truncate">{originalName}</span>
        {editCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-brand-900 border border-brand-700 text-brand-300 text-xs">
            {editCount} edição{editCount !== 1 ? "ões" : ""}
          </span>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-800">
        <button
          onClick={() => onViewModeChange("preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === "preview"
              ? "bg-surface-700 text-white"
              : "text-surface-400 hover:text-white"
          }`}
        >
          <Eye size={13} />
          Pré-visualização
        </button>
        <button
          onClick={() => onViewModeChange("xml")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === "xml"
              ? "bg-surface-700 text-white"
              : "text-surface-400 hover:text-white"
          }`}
        >
          <Code size={13} />
          XML
        </button>
      </div>

      {/* Export */}
      <button
        onClick={onExport}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
      >
        <Download size={14} />
        Exportar .docx
      </button>

      {/* Home */}
      <Link
        href="/"
        className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
        title="Novo documento"
      >
        <Home size={16} />
      </Link>
    </header>
  );
}
