"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Kumpulan Ikon SVG
const IconKelas = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 3H8v4h8V3z" />
  </svg>
);
const IconSiswa = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
  </svg>
);
const IconPresensi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18M9 16l2 2 4-4" />
  </svg>
);
const IconPengajar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconMonitoring = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);


export default function HomePage() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleProtectedRoute = (path: string) => {
    if (!session) {
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50/50 p-8 text-center">
      <div className="w-full max-w-6xl">
        <div className="mx-auto mb-6 h-28 w-28 rounded-full bg-green-100 flex items-center justify-center shadow-md overflow-hidden">
          <img
            src="/logoTPQ.png"
            alt="Logo TPQ"
            className="h-32 w-32 object-contain"
          />
        </div>

        <h1 className="text-4xl md:text-3xl font-bold text-green-800">
          SISTEM ABSENSI DAN MONITORING SISWA
        </h1>
        <p className="mt-2 text-2xl font-semibold text-green-600">
          TPQ MIFTAKHUL HUDA, WERDI
        </p>

        {/* ======================================================== */}
        {/* PERUBAHAN UTAMA: Tombol Login/Logout kembali ke sini    */}
        {/* ======================================================== */}
        <div className="mt-8 flex justify-center items-center gap-4">
          {session ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm text-gray-600">
                Login sebagai:{" "}
                <span className="font-semibold text-green-700">
                  {session.user.email}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition shadow-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>

        {/* Menu Aplikasi */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          <div
            onClick={() => handleProtectedRoute("/classes")}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
          >
            <div className="text-green-500 group-hover:scale-110 transition-transform">
              <IconKelas />
            </div>
            <h2 className="text-xl font-semibold text-green-900">Kelas</h2>
            <p className="text-sm text-gray-500">
              Kelola data kelas dan pengaturan.
            </p>
          </div>

          <div
            onClick={() => handleProtectedRoute("/dashboard-students")}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
          >
            <div className="text-green-500 group-hover:scale-110 transition-transform">
              <IconSiswa />
            </div>
            <h2 className="text-xl font-semibold text-green-900">Siswa</h2>
            <p className="text-sm text-gray-500">Kelola data siswa TPQ.</p>
          </div>

          <div
            onClick={() => handleProtectedRoute("/dashboard-attendance")}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
          >
            <div className="text-green-500 group-hover:scale-110 transition-transform">
              <IconPresensi />
            </div>
            <h2 className="text-xl font-semibold text-green-900">Absensi</h2>
            <p className="text-sm text-gray-500">
              Mulai sesi absensi & validasi kehadiran.
            </p>
          </div>

          <div
            onClick={() => handleProtectedRoute("/teachers")}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
          >
            <div className="text-green-500 group-hover:scale-110 transition-transform">
              <IconPengajar />
            </div>
            <h2 className="text-xl font-semibold text-green-900">Pengajar</h2>
            <p className="text-sm text-gray-500">
              Kelola data pengajar di kelas.
            </p>
          </div>
          
          <Link href="/dashboard-monitoring" className="block">
            <div className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
              <div className="text-green-500 group-hover:scale-110 transition-transform">
                <IconMonitoring />
              </div>
              <h2 className="text-xl font-semibold text-green-900">
                Monitoring
              </h2>
              <p className="text-sm text-gray-500">
                Pantau laporan siswa (kehadiran, pembelajaran, nilai).
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}