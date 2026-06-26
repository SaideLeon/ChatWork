// ─── Document types ─────────────────────────────────────────────────────────

export interface DocxPart {
  id: string;
  name: string;          // e.g. "word/document.xml"
  label: string;         // human label, e.g. "Documento Principal"
  xmlContent: string;    // raw XML string
  htmlPreview: string;   // HTML rendered for preview
  category: PartCategory;
  isEditable: boolean;
}

export type PartCategory =
  | "document"
  | "header"
  | "footer"
  | "styles"
  | "numbering"
  | "settings"
  | "other";

export interface DocxSession {
  id: string;
  originalName: string;
  parts: DocxPart[];
  createdAt: number;
  editHistory: EditRecord[];
}

export interface EditRecord {
  id: string;
  timestamp: number;
  partId: string;
  partName: string;
  instruction: string;
  before: string;       // XML before
  after: string;        // XML after
  appliedBy: "ai" | "manual";
}

// ─── Chat types ──────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  editApplied?: boolean;
  editRecord?: EditRecord;
  isLoading?: boolean;
}

// ─── API types ───────────────────────────────────────────────────────────────

export interface UploadResponse {
  sessionId: string;
  parts: DocxPart[];
  originalName: string;
}

export interface ParseResponse {
  parts: DocxPart[];
}

export interface EditRequest {
  sessionId: string;
  partId: string;
  instruction: string;
  xmlContent: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

export interface EditResponse {
  newXml: string;
  htmlPreview: string;
  explanation: string;
  editRecord: EditRecord;
}

export interface ExportRequest {
  sessionId: string;
}

// ─── UI types ────────────────────────────────────────────────────────────────

export type ViewMode = "preview" | "xml" | "split";

export interface EditorState {
  selectedPartId: string | null;
  viewMode: ViewMode;
  isEditing: boolean;
  isChatOpen: boolean;
}
