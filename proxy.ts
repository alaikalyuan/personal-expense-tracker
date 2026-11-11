import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own authentication and webhooks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.webmanifest (PWA manifest)
     * - icons/ (PWA icons)
     * - robots.txt, sitemap.xml, llms.txt (crawler files must never hit auth)
     * - sw.js (browsers refuse to register a service worker served behind a redirect)
     * - offline.html (the service worker caches it at install, before any session exists)
     * - static file extensions (.svg, .png, .jpg, .webmanifest, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|icons|robots\\.txt|sitemap\\.xml|llms\\.txt|sw\\.js|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};

