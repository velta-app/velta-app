import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image
     * - favicon, manifest, icons, service-worker files (sw, swe-worker, workbox)
     * - static assets by extension
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|swe-worker-.*|workbox-.*|icons/|.*\\.(?:png|svg|ico|webp|js|map)$).*)",
  ],
};
