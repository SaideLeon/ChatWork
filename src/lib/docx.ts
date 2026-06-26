import JSZip from "jszip";
import { DocxPart, PartCategory } from "@/types";
import { v4 as uuid } from "uuid";

// ─── Part metadata mapping ────────────────────────────────────────────────────

interface PartMeta {
  label: string;
  category: PartCategory;
  isEditable: boolean;
}

function getPartMeta(name: string): PartMeta {
  if (name === "word/document.xml")
    return { label: "Documento Principal", category: "document", isEditable: true };
  if (name.startsWith("word/header"))
    return { label: `Cabeçalho (${name})`, category: "header", isEditable: true };
  if (name.startsWith("word/footer"))
    return { label: `Rodapé (${name})`, category: "footer", isEditable: true };
  if (name === "word/styles.xml")
    return { label: "Estilos", category: "styles", isEditable: true };
  if (name === "word/numbering.xml")
    return { label: "Numeração e Listas", category: "numbering", isEditable: true };
  if (name === "word/settings.xml")
    return { label: "Definições", category: "settings", isEditable: false };
  return { label: name, category: "other", isEditable: false };
}

// ─── DOCX → Parts ─────────────────────────────────────────────────────────────

export async function unpackDocx(buffer: ArrayBuffer): Promise<{
  parts: DocxPart[];
  zipData: Record<string, string | ArrayBuffer>;
}> {
  const zip = await JSZip.loadAsync(buffer);
  const parts: DocxPart[] = [];
  const zipData: Record<string, string | ArrayBuffer> = {};

  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const isXml =
      name.endsWith(".xml") ||
      name.endsWith(".rels") ||
      name === "[Content_Types].xml";

    if (isXml) {
      const content = await file.async("text");
      zipData[name] = content;

      const meta = getPartMeta(name);
      parts.push({
        id: uuid(),
        name,
        label: meta.label,
        xmlContent: content,
        htmlPreview: xmlToHtmlPreview(content, name),
        category: meta.category,
        isEditable: meta.isEditable,
      });
    } else {
      zipData[name] = await file.async("arraybuffer");
    }
  }

  // Sort: document first, then headers/footers, then rest
  const order: PartCategory[] = [
    "document", "header", "footer", "styles", "numbering", "settings", "other",
  ];
  parts.sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
  );

  return { parts, zipData };
}

// ─── Parts + original zip → DOCX buffer ──────────────────────────────────────

export async function repackDocx(
  zipData: Record<string, string | ArrayBuffer>,
  updatedParts: DocxPart[]
): Promise<Blob> {
  const zip = new JSZip();

  // Merge: start from original, overlay updated XML
  const updated: Record<string, string | ArrayBuffer> = { ...zipData };
  for (const part of updatedParts) {
    updated[part.name] = part.xmlContent;
  }

  for (const [name, content] of Object.entries(updated)) {
    if (typeof content === "string") {
      zip.file(name, content);
    } else {
      zip.file(name, content);
    }
  }

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

// ─── XML → HTML preview (lightweight renderer) ───────────────────────────────

export function xmlToHtmlPreview(xml: string, partName: string): string {
  if (!partName.startsWith("word/")) return escapeXmlForDisplay(xml);

  try {
    // Parse the XML string into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    if (partName === "word/document.xml" || partName.startsWith("word/header") || partName.startsWith("word/footer")) {
      return renderWordBody(doc);
    }

    if (partName === "word/styles.xml") {
      return renderStylesSummary(doc);
    }

    return `<pre class="xml-viewer p-4 text-xs overflow-auto">${escapeHtml(formatXml(xml))}</pre>`;
  } catch {
    return `<pre class="xml-viewer p-4 text-xs">${escapeHtml(xml)}</pre>`;
  }
}

function renderWordBody(doc: Document): string {
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const body = doc.getElementsByTagNameNS(ns, "body")[0]
    || doc.getElementsByTagName("w:body")[0];

  if (!body) return "<p class='text-gray-400 text-sm p-4'>Corpo do documento não encontrado.</p>";

  let html = '<div class="doc-preview px-8 py-6 min-h-full">';

  const paragraphs = body.childNodes;
  for (let i = 0; i < paragraphs.length; i++) {
    const node = paragraphs[i] as Element;
    if (!node.tagName) continue;

    const tagLocal = node.tagName.split(":").pop() || "";

    if (tagLocal === "p") {
      html += renderParagraph(node);
    } else if (tagLocal === "tbl") {
      html += renderTable(node);
    } else if (tagLocal === "sectPr") {
      // section properties — skip visual
    }
  }

  html += "</div>";
  return html;
}

function renderParagraph(pNode: Element): string {
  const pPr = pNode.querySelector("pPr, w\\:pPr");
  const styleId = pPr?.querySelector("pStyle, w\\:pStyle")?.getAttribute("w:val") || "";
  const jc = pPr?.querySelector("jc, w\\:jc")?.getAttribute("w:val") || "";

  const align = jc === "center" ? "text-center" : jc === "right" ? "text-right" : jc === "both" ? "text-justify" : "";

  // Heading detection
  const headingMap: Record<string, string> = {
    Heading1: "h1", Heading2: "h2", Heading3: "h3",
    "1": "h1", "2": "h2", "3": "h3",
    heading1: "h1", heading2: "h2", heading3: "h3",
    Title: "h1",
  };
  const tag = headingMap[styleId] || "p";

  let content = "";
  const runs = pNode.querySelectorAll("r, w\\:r");
  if (runs.length === 0) return `<${tag} class="${align} mb-1"><br/></${tag}>`;

  for (let r = 0; r < runs.length; r++) {
    content += renderRun(runs[r]);
  }

  const styles: Record<string, string> = {
    h1: "text-xl font-bold mt-4 mb-2",
    h2: "text-lg font-semibold mt-3 mb-1",
    h3: "text-base font-semibold mt-2 mb-1",
    p: "mb-1 text-sm leading-relaxed",
  };

  return `<${tag} class="${styles[tag] || "mb-1 text-sm"} ${align}">${content || "&nbsp;"}</${tag}>`;
}

function renderRun(rNode: Element): string {
  const rPr = rNode.querySelector("rPr, w\\:rPr");
  const bold = rPr?.querySelector("b, w\\:b");
  const italic = rPr?.querySelector("i, w\\:i");
  const underline = rPr?.querySelector("u, w\\:u");

  const texts = rNode.querySelectorAll("t, w\\:t");
  let text = "";
  for (let t = 0; t < texts.length; t++) {
    text += escapeHtml(texts[t].textContent || "");
  }

  if (!text) return "";

  if (bold) text = `<strong>${text}</strong>`;
  if (italic) text = `<em>${text}</em>`;
  if (underline) text = `<u>${text}</u>`;

  return text;
}

function renderTable(tblNode: Element): string {
  let html = '<table class="w-full my-3 border-collapse text-sm">';
  const rows = tblNode.querySelectorAll("tr, w\\:tr");

  for (let r = 0; r < rows.length; r++) {
    html += "<tr>";
    const cells = rows[r].querySelectorAll("tc, w\\:tc");
    for (let c = 0; c < cells.length; c++) {
      const cellParagraphs = cells[c].querySelectorAll("p, w\\:p");
      let cellContent = "";
      for (let p = 0; p < cellParagraphs.length; p++) {
        const runs = cellParagraphs[p].querySelectorAll("r, w\\:r");
        for (let rr = 0; rr < runs.length; rr++) {
          cellContent += renderRun(runs[rr]);
        }
      }
      html += `<td class="border border-black p-1.5">${cellContent || "&nbsp;"}</td>`;
    }
    html += "</tr>";
  }

  html += "</table>";
  return html;
}

function renderStylesSummary(doc: Document): string {
  const styles = doc.querySelectorAll("style, w\\:style");
  let html = '<div class="p-4"><h3 class="font-semibold text-sm mb-3 text-gray-600">Estilos definidos</h3><div class="space-y-1">';
  for (let i = 0; i < Math.min(styles.length, 30); i++) {
    const s = styles[i];
    const name = s.querySelector("name, w\\:name")?.getAttribute("w:val") || s.getAttribute("w:styleId") || "?";
    const type = s.getAttribute("w:type") || "";
    html += `<div class="flex items-center gap-2 text-xs py-1 border-b border-gray-100">
      <span class="text-gray-400 w-20">${type}</span>
      <span class="font-mono text-gray-700">${escapeHtml(name)}</span>
    </div>`;
  }
  html += "</div></div>";
  return html;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXmlForDisplay(xml: string): string {
  return `<pre class="xml-viewer p-4 text-xs overflow-auto">${escapeHtml(formatXml(xml))}</pre>`;
}

export function formatXml(xml: string): string {
  let formatted = "";
  let indent = 0;
  const tab = "  ";

  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent--;
    formatted += tab.repeat(Math.max(0, indent)) + "<" + node + ">\n";
    if (node.match(/^<?\w[^/]*[^/]$/) && !node.startsWith("?")) indent++;
  });

  return formatted
    .trim()
    .replace(/^</, "")
    .replace(/>$/, "");
}

export function highlightXml(xml: string): string {
  return escapeHtml(xml)
    .replace(/(&lt;\/?[\w:]+)/g, '<span class="xml-tag">$1</span>')
    .replace(/([\w:]+)=/g, '<span class="xml-attr">$1</span>=')
    .replace(/="([^"]*)"/g, '="<span class="xml-value">$1</span>"');
}
