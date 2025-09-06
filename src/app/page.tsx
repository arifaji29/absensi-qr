"use client";

import Link from 'next/link';

// Komponen Ikon sederhana menggunakan SVG inline
const IconPresensi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" />
  </svg>
);

const IconPengajar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconMonitoring = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
);

const IconLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
)

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50/50 p-8 text-center">
      <div className="w-full max-w-4xl">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
            <IconLogo />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-green-800">
          SISTEM PRESENSI DAN MONITORING SISWA
        </h1>
        <p className="mt-2 text-2xl font-light text-green-700">
          TPQ MIFTAHUL HUDA
        </p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Tombol Presensi */}
          <Link href="/classes" className="block">
            <div className="group flex flex-col items-center justify-center gap-4 rounded-xl border border-green-200 bg-white p-8 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                <div className="text-green-500 transition-transform group-hover:scale-110">
                    <IconPresensi />
                </div>
                <h2 className="text-2xl font-semibold text-green-900">
                    Presensi
                </h2>
                <p className="text-sm text-gray-500">
                    Mulai sesi absensi, lihat riwayat, dan validasi kehadiran.
                </p>
            </div>
          </Link>

          {/* Tombol Pengajar */}
          <Link href="/teachers" className="block">
            <div className="group flex flex-col items-center justify-center gap-4 rounded-xl border border-green-200 bg-white p-8 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                <div className="text-green-500 transition-transform group-hover:scale-110">
                    <IconPengajar />
                </div>
                <h2 className="text-2xl font-semibold text-green-900">
                    Pengajar
                </h2>
                <p className="text-sm text-gray-500">
                    Kelola data pengajar yang ditugaskan untuk mengajar di kelas.
                </p>
            </div>
          </Link>

          {/* Tombol Monitoring (Non-aktif) */}
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-8 cursor-not-allowed"
            title="Fitur ini sedang dalam pengembangan"
          >
            <div className="text-gray-400">
                <IconMonitoring />
            </div>
            <h2 className="text-2xl font-semibold text-gray-400">
              Monitoring
            </h2>
            <p className="text-sm text-gray-400">
              (Dalam Pengembangan) Pantau laporan dan perkembangan siswa.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
