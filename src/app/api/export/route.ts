import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";
import { repackDocx } from "@/lib/docx";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId em falta." }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
    }

    const blob = await repackDocx(session.zipData, session.parts);
    const arrayBuffer = await blob.arrayBuffer();

    const filename = session.originalName.replace(/\.docx$/i, "") + "_editado.docx";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    console.error("[export]", err);
    return NextResponse.json({ error: "Erro ao exportar documento." }, { status: 500 });
  }
}
