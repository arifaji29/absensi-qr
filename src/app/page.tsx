"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/auth-helpers-nextjs";
import { LogOut, LogIn, UserPlus, ChevronLeft, ChevronRight, X, BookOpen, GraduationCap, ClipboardCheck } from "lucide-react";

// 1. IMPORT SWIPER
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Tipe data untuk kelas
type ClassData = {
  id: string;
  name: string;
};

// Kumpulan Ikon SVG
const IconKelas = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 3H8v4h8V3z" /></svg> );
const IconSiswa = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a7.5 7.5 0 0 1 13 0" /></svg> );
const IconPresensi = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18M9 16l2 2 4-4" /></svg> );
const IconPengajar = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> );
const IconJurnal = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> );
const IconMonitoring = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg> );

// PERUBAHAN 1: Menambahkan ikon untuk menu Penilaian
const IconPenilaian = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg> );

// Ikon untuk menu publik
const IconKehadiran = () => <ClipboardCheck width="40" height="40" />;
const IconPembelajaran = () => <BookOpen width="40" height="40" />;
const IconNilai = () => <GraduationCap width="40" height="40" />;

const sliderImages = [
    { id: 1, src: "/images/info1.jpg", alt: "Informasi Penerimaan Santri Baru" },
    { id: 2, src: "/images/info2.jpg", alt: "Jadwal Kegiatan TPQ" },
    { id: 3, src: "/images/info3.jpg", alt: "Pengumuman Libur" },
];

const adminMenuItems = [
    { id: 'kelas', title: 'Kelas', description: 'Kelola data kelas dan pengaturan.', icon: <IconKelas />, href: '/classes' },
    { id: 'siswa', title: 'Siswa', description: 'Kelola data siswa TPQ.', icon: <IconSiswa />, href: '/dashboard-students' },
    { id: 'absensi', title: 'Absensi', description: 'Mulai sesi absensi & validasi kehadiran.', icon: <IconPresensi />, href: '/dashboard-attendance' },
    { id: 'pengajar', title: 'Pengajar', description: 'Kelola data pengajar di kelas.', icon: <IconPengajar />, href: '/teachers' },
    { id: 'jurnal', title: 'Jurnal', description: 'Input jurnal pembelajaran harian.', icon: <IconJurnal />, href: '/dashboard-journal' },
    // PERUBAHAN 2: Menambahkan item menu Penilaian
    { id: 'penilaian', title: 'Penilaian', description: 'Input & kelola perkembangan nilai siswa.', icon: <IconPenilaian />, href: '/dashboard-assessment' },
    { id: 'monitoring', title: 'Monitoring', description: 'Pantau semua laporan siswa.', icon: <IconMonitoring />, href: '/dashboard-monitoring' },
];

// ... (Sisa kode tidak ada perubahan)
const publicMenuItems = [
    { id: 'kehadiran', title: 'Kehadiran', description: 'Lihat laporan kehadiran siswa.', icon: <IconKehadiran />, target: 'attendance' },
    { id: 'pembelajaran', title: 'Pembelajaran', description: 'Lihat jurnal pembelajaran harian.', icon: <IconPembelajaran />, target: 'learning' },
    { id: 'nilai', title: 'Nilai', description: 'Lihat perkembangan nilai siswa.', icon: <IconNilai />, target: 'grades' },
];

const ClassSelectionModal = ({ isOpen, onClose, classes, menuType }: { isOpen: boolean; onClose: () => void; classes: ClassData[]; menuType: string }) => {
    if (!isOpen) return null;

    let title = "Pilih Kelas";
    let basePath = "/monitoring";

    if (menuType === 'attendance') {
        title = "Pilih Kelas untuk Laporan Kehadiran";
        basePath = "/monitoring/attendance";
    } else if (menuType === 'learning') {
        title = "Pilih Kelas untuk Laporan Pembelajaran";
        basePath = "/monitoring/learning";
    } else if (menuType === 'grades') {
        title = "Pilih Kelas untuk Laporan Nilai";
        basePath = "monitoring/assessment"; // Arahkan ke form penilaian
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto border-t border-b py-4">
                    {classes.length > 0 ? (
                        classes.map((cls) => (
                            <Link key={cls.id} href={`${basePath}?class_id=${cls.id}`} className="block">
                                <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors font-semibold text-gray-800">
                                    Kelas {cls.name}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">Tidak ada kelas yang tersedia.</p>
                    )}
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Tutup</button>
                </div>
            </div>
        </div>
    );
};

export default function HomePage() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<Session | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("");
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name').order('name', { ascending: true });
        if (data) setClasses(data);
    };
    fetchClasses();

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const openModal = (menuTarget: string) => {
    setSelectedMenu(menuTarget);
    setIsModalOpen(true);
  };

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center bg-green-50/50 p-4 sm:p-8 text-center">
        <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
            <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        <Image src="/logoTPQ.png" alt="Logo" width={40} height={40} className="rounded-full object-cover" />
                    </div>
                </div>
                <span className="text-sm font-semibold text-green-800">SIABSOR v.1.0</span>
            </div>
            <div className="flex items-center gap-2">
            {session ? (
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        Halo, <span className="font-semibold text-green-700">{session.user?.user_metadata?.full_name || "Pengguna"}</span>
                    </span>
                    <button onClick={handleLogout} className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-sm" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Link href="/login" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition text-sm shadow-sm">
                        <LogIn size={12} />
                        <span>Login</span>
                    </Link>
                    <Link href="/register" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition text-sm">
                        <UserPlus size={12} />
                        <span>Daftar</span>
                    </Link>
                </div>
            )}
            </div>
        </header>

        <div className="w-full max-w-6xl mt-24 sm:mt-28">
            <h1 className="text-3xl md:text-4xl font-bold text-green-800">SIABSOR</h1>
            <h2 className="text-md sm:text-lg font-semibold text-green-800 mt-1">Sistem Absensi dan Monitoring Siswa</h2>
            <p className="mt-2 text-xl sm:text-2xl font-semibold text-green-600">TPQ MIFTAKHUL HUDA WERDI</p>
            <div className="w-full max-w-4xl mx-auto mt-8 relative">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
                pagination={{ clickable: true }}
                loop={true}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                className="rounded-xl shadow-lg"
            >
                {sliderImages.map((image) => (
                <SwiperSlide key={image.id}>
                    <div className="aspect-video w-full">
                    <Image src={image.src} alt={image.alt} fill className="object-cover" priority={image.id === 1} />
                    </div>
                </SwiperSlide>
                ))}
            </Swiper>
            <div className="swiper-button-prev absolute top-1/2 left-2 -translate-y-1/2 z-10 p-2 bg-white/50 hover:bg-white/80 rounded-full cursor-pointer transition">
                <ChevronLeft className="text-green-800" />
            </div>
            <div className="swiper-button-next absolute top-1/2 right-2 -translate-y-1/2 z-10 p-2 bg-white/50 hover:bg-white/80 rounded-full cursor-pointer transition">
                <ChevronRight className="text-green-800" />
            </div>
            </div>

            {/* Menu Aplikasi */}
            <div className="mt-12">
                {session ? (
                    // Tampilan untuk pengguna yang sudah login
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {adminMenuItems.map((menu) => (
                            <Link key={menu.id} href={menu.href} className="block">
                                <div className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                                    <div className="text-green-500 group-hover:scale-110 transition-transform">{menu.icon}</div>
                                    <h2 className="text-xl font-semibold text-green-900">{menu.title}</h2>
                                    <p className="text-sm text-gray-500 text-center">{menu.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    // Tampilan untuk pengguna yang belum login
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Monitoring Publik</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
                            {publicMenuItems.map((menu) => (
                                <div key={menu.id} onClick={() => openModal(menu.target)} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-white p-6 shadow-lg transition-all hover:border-green-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                                    <div className="text-green-500 group-hover:scale-110 transition-transform">{menu.icon}</div>
                                    <h2 className="text-xl font-semibold text-green-900">{menu.title}</h2>
                                    <p className="text-sm text-gray-500 text-center">{menu.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>
      <ClassSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={classes}
        menuType={selectedMenu}
      />
    </>
  );
}