import { NextResponse } from "next/server";

export function middleware(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith(".wasm")) {
        const response = NextResponse.next();
        response.headers.set("Content-Type", "application/wasm");
        return response;
    }

    return NextResponse.next();
}
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
