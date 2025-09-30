import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Penting: getSession akan secara otomatis mencoba me-refresh token.
  // Inilah yang menyebabkan Auth Request.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // 1. Jika pengguna sudah login dan mencoba mengakses halaman login/register,
  //    arahkan mereka ke halaman utama.
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Daftar route yang wajib login
  const protectedRoutes = [
    "/classes",
    "/attendance",
    "/students",
    "/journal",
    "/teachers",
    "/assessment",
    "/infaq",
    "/dashboard-students",
    "/dashboard-monitoring",
    "/dashboard-journal",
    "/dashboard-attendance",
    "/dashboard-assessment",
    "/dashboard-infaq",

  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 2. === PERBAIKAN UTAMA ADA DI SINI ===
  // Jika pengguna BELUM login, DAN mencoba mengakses rute yang dilindungi,
  // DAN dia TIDAK sedang berada di halaman login, baru lakukan redirect.
  if (!session && isProtectedRoute) {
    // Pengecualian pathname !== '/login' adalah fallback,
    // tapi logika utamanya adalah isProtectedRoute
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Jika semua kondisi di atas tidak terpenuhi, biarkan permintaan berlanjut.
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * PENTING: Jangan kecualikan /login atau /register dari matcher,
     * agar logika redirect saat sudah login bisa berjalan.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

