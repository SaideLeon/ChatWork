import { DocxSession } from "@/types";

// In-memory store — for production replace with Redis / DB
const sessions = new Map<string, DocxSession & { zipData: Record<string, string | ArrayBuffer> }>();

export function setSession(
  id: string,
  session: DocxSession & { zipData: Record<string, string | ArrayBuffer> }
): void {
  sessions.set(id, session);

  // Auto-expire after 2 hours
  setTimeout(() => sessions.delete(id), 2 * 60 * 60 * 1000);
}

export function getSession(
  id: string
): (DocxSession & { zipData: Record<string, string | ArrayBuffer> }) | undefined {
  return sessions.get(id);
}

export function updateSession(
  id: string,
  update: Partial<DocxSession>
): boolean {
  const session = sessions.get(id);
  if (!session) return false;
  sessions.set(id, { ...session, ...update });
  return true;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}
