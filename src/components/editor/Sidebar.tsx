"use client";

import { DocxPart, PartCategory } from "@/types";
import { FileText, AlignLeft, AlignCenter, Sliders, List, Settings, File } from "lucide-react";

interface SidebarProps {
  parts: DocxPart[];
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
}

const categoryIcons: Record<PartCategory, React.ReactNode> = {
  document: <FileText size={14} />,
  header: <AlignCenter size={14} />,
  footer: <AlignCenter size={14} />,
  styles: <Sliders size={14} />,
  numbering: <List size={14} />,
  settings: <Settings size={14} />,
  other: <File size={14} />,
};

const categoryColors: Record<PartCategory, string> = {
  document: "text-brand-400",
  header: "text-emerald-400",
  footer: "text-teal-400",
  styles: "text-amber-400",
  numbering: "text-orange-400",
  settings: "text-surface-400",
  other: "text-surface-400",
};

const categoryLabels: Record<PartCategory, string> = {
  document: "Documento",
  header: "Cabeçalhos",
  footer: "Rodapés",
  styles: "Estilos",
  numbering: "Numeração",
  settings: "Definições",
  other: "Outros",
};

export default function Sidebar({ parts, selectedPartId, onSelectPart }: SidebarProps) {
  // Group by category
  const grouped = parts.reduce<Record<string, DocxPart[]>>((acc, part) => {
    const cat = part.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(part);
    return acc;
  }, {});

  const order: PartCategory[] = ["document", "header", "footer", "styles", "numbering", "settings", "other"];

  return (
    <aside className="w-64 shrink-0 border-r border-surface-800 bg-surface-900 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-800">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
          Partes do Documento
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {order.map((cat) => {
          const catParts = grouped[cat];
          if (!catParts?.length) return null;

          return (
            <div key={cat} className="mb-1">
              <div className="px-4 py-1.5 flex items-center gap-2">
                <span className={`${categoryColors[cat]} opacity-60`}>
                  {categoryIcons[cat]}
                </span>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                  {categoryLabels[cat]}
                </span>
              </div>

              {catParts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => part.isEditable && onSelectPart(part.id)}
                  disabled={!part.isEditable}
                  className={`
                    part-card w-full text-left px-4 py-2.5 flex items-start gap-2.5
                    border-l-2 transition-all
                    ${selectedPartId === part.id
                      ? "border-brand-500 bg-brand-950/40 text-white"
                      : part.isEditable
                      ? "border-transparent hover:border-surface-600 hover:bg-surface-800 text-surface-300 hover:text-white"
                      : "border-transparent text-surface-600 cursor-not-allowed opacity-50"
                    }
                  `}
                >
                  <span className={`mt-0.5 shrink-0 ${categoryColors[cat]}`}>
                    {categoryIcons[cat]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">
                      {part.label}
                    </p>
                    <p className="text-[10px] text-surface-500 truncate mt-0.5 font-mono">
                      {part.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-surface-800">
        <p className="text-[10px] text-surface-500 text-center">
          {parts.filter((p) => p.isEditable).length} partes editáveis
        </p>
      </div>
    </aside>
  );
}
