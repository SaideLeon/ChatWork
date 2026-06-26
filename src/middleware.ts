import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Inject API key header for internal API calls
  const requestHeaders = new Headers(req.headers);

  if (req.nextUrl.pathname.startsWith("/api/edit")) {
    requestHeaders.set(
      "x-anthropic-api-key",
      process.env.ANTHROPIC_API_KEY ?? ""
    );
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: "/api/:path*",
};
