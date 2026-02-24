import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isRCSothebys = process.env.NEXT_PUBLIC_SITE_TEMPLATE === 'rcsothebys-custom';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // RC Sotheby's: redirect /team → /agents (preserve subpaths and query params)
  if (isRCSothebys && pathname.startsWith('/team')) {
    const newPath = pathname.replace(/^\/team/, '/agents');
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/team', '/team/:path*'],
};
