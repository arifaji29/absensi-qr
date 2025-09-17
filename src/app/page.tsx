"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/auth-helpers-nextjs";
import { LogOut, LogIn, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

// 1. IMPORT SWIPER
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


// Kumpulan Ikon SVG (Tidak ada perubahan di sini)
const IconKelas = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 3H8v4h8V3z" /></svg>
);
const IconSiswa = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a7.5 7.5 0 0 1 13 0" /></svg>
);
const IconPresensi = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18M9 16l2 2 4-4" /></svg>
);
const IconPengajar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconMonitoring = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
);

// 2. DATA UNTUK SLIDER (Ganti dengan path gambar Anda)
const sliderImages = [
    { id: 1, src: "/images/info1.jpg", alt: "Informasi Penerimaan Santri Baru" },
    { id: 2, src: "/images/info2.jpg", alt: "Jadwal Kegiatan TPQ" },
    { id: 3, src: "/images/info3.jpg", alt: "Pengumuman Libur" },
];


export default function HomePage() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<Session | null>(null);
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
    <main className="relative flex min-h-screen flex-col items-center bg-green-50/50 p-4 sm:p-8 text-center">

      <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
              <Image
                src="/logoTPQ.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-green-800">SIABSOR v.2.0</span>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Halo, <span className="font-semibold text-green-700">{session.user?.user_metadata?.full_name || "Pengguna"}</span>
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition text-sm shadow-sm"
              >
                <LogIn size={12} />
                <span>Login</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition text-sm"
              >
                <UserPlus size={12} />
                <span>Daftar</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Konten Utama */}
      <div className="w-full max-w-6xl mt-24 sm:mt-28">
        <h1 className="text-3xl md:text-4xl font-bold text-green-800">
          SIABSOR
        </h1>
        <h2 className="text-md sm:text-lg font-semibold text-green-800 mt-1">
          Sistem Absensi dan Monitoring Siswa
        </h2>
        <p className="mt-2 text-xl sm:text-2xl font-semibold text-green-600">
          TPQ MIFTAKHUL HUDA WERDI
        </p>

        {/* 3. Slider/Carousel Informasi */}
        <div className="w-full max-w-4xl mx-auto mt-8 relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            pagination={{ clickable: true }}
            loop={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            className="rounded-xl shadow-lg"
          >
            {sliderImages.map((image) => (
              <SwiperSlide key={image.id}>
                <div className="aspect-video w-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    priority={image.id === 1} // Prioritaskan load gambar pertama
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Tombol Navigasi Kustom */}
          <div className="swiper-button-prev absolute top-1/2 left-2 -translate-y-1/2 z-10 p-2 bg-white/50 hover:bg-white/80 rounded-full cursor-pointer transition">
             <ChevronLeft className="text-green-800" />
          </div>
          <div className="swiper-button-next absolute top-1/2 right-2 -translate-y-1/2 z-10 p-2 bg-white/50 hover:bg-white/80 rounded-full cursor-pointer transition">
            <ChevronRight className="text-green-800" />
          </div>
        </div>

        {/* Menu Aplikasi */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            {/* ... sisa kode menu (tidak ada perubahan) ... */}
            <div onClick={() => handleProtectedRoute("/classes")} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"><div className="text-green-500 group-hover:scale-110 transition-transform"><IconKelas /></div><h2 className="text-xl font-semibold text-green-900">Kelas</h2><p className="text-sm text-gray-500">Kelola data kelas dan pengaturan.</p></div>
            <div onClick={() => handleProtectedRoute("/dashboard-students")} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"><div className="text-green-500 group-hover:scale-110 transition-transform"><IconSiswa /></div><h2 className="text-xl font-semibold text-green-900">Siswa</h2><p className="text-sm text-gray-500">Kelola data siswa TPQ.</p></div>
            <div onClick={() => handleProtectedRoute("/dashboard-attendance")} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"><div className="text-green-500 group-hover:scale-110 transition-transform"><IconPresensi /></div><h2 className="text-xl font-semibold text-green-900">Absensi</h2><p className="text-sm text-gray-500">Mulai sesi absensi & validasi kehadiran.</p></div>
            <div onClick={() => handleProtectedRoute("/teachers")} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"><div className="text-green-500 group-hover:scale-110 transition-transform"><IconPengajar /></div><h2 className="text-xl font-semibold text-green-900">Pengajar</h2><p className="text-sm text-gray-500">Kelola data pengajar di kelas.</p></div>
            <Link href="/dashboard-monitoring" className="block col-span-2 sm:col-span-1"><div className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"><div className="text-green-500 group-hover:scale-110 transition-transform"><IconMonitoring /></div><h2 className="text-xl font-semibold text-green-900">Monitoring</h2><p className="text-sm text-gray-500">Pantau laporan siswa (kehadiran, pembelajaran, nilai).</p></div></Link>
        </div>
      </div>
    </main>
  );
}