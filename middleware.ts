import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/circles", "/tasks"];

export async function middleware(request: NextRequest) {
  const res = await updateSession(request);
    const url = new URL(request.url);
  const path = url.pathname;

  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isProtected || path.startsWith("/onboarding")) return res;

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
