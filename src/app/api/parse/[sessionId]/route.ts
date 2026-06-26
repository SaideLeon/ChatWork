import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = getSession(params.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    originalName: session.originalName,
    createdAt: session.createdAt,
    editHistory: session.editHistory,
    parts: session.parts.map((p) => ({
      id: p.id,
      name: p.name,
      label: p.label,
      category: p.category,
      isEditable: p.isEditable,
      htmlPreview: p.htmlPreview,
      xmlContent: p.xmlContent,
    })),
  });
}
