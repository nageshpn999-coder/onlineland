import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

/**
 * Pages kept from the old onlineland.in (digital visiting cards, demos, poster) live in public/ as
 * folder/index.html with relative links (e.g. "og.jpg"), so they must be served at a URL ending in "/".
 */
const LEGACY = /^\/(c\/[^/]+|demo\/dental(\/dental2)?|poster)\/?$/;

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const legacy = pathname.match(LEGACY);
  if (legacy) {
    // A plain URL keeps the trailing slash (NextURL would normalise it away).
    const url = new URL(req.url);
    if (!pathname.endsWith('/')) {
      url.pathname = `${pathname}/`;
      return NextResponse.redirect(url, 308);
    }
    url.pathname = `${pathname}index.html`;
    return NextResponse.rewrite(url);
  }
  // Everything else: no trailing slash (Next's default, done here because of skipTrailingSlashRedirect).
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const url = new URL(req.url);
    url.pathname = pathname.replace(/\/+$/, '');
    return NextResponse.redirect(url, 308);
  }
  return intl(req);
}

export const config = {
  // Skip Next internals and any path with a file extension (e.g. blog.html, /c/siri/photo.jpg).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
