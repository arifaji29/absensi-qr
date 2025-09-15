// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  // Penting: teruskan headers supaya cookie supabase terbaca
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Jika user sudah login & coba akses /login → redirect ke home
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Daftar route yang wajib login
  const protectedRoutes = [
    "/classes",
    "/attendance",
    "/students",
    "/teachers",
    "/dashboard-students",
    "/dashboard-attendance",
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Jika belum login dan akses route dilindungi → redirect ke login
  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
