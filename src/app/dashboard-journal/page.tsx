"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Home, BookOpen, LayoutDashboard } from "lucide-react";

// Tipe data
type Teacher = {
  id: string;
  name: string;
};

type ClassWithTeachers = {
  id: string;
  name: string;
  teachers: Teacher[];
};

export default function JournalDashboard() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Gagal memuat data kelas");
      setClasses(await res.json());
    } catch (err) {
      alert("Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Dashboard Jurnal Pembelajaran
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pilih kelas untuk membuat atau melihat jurnal pembelajaran.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              {/* PERUBAHAN: Ukuran ikon diperbesar */}
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              {/* PERUBAHAN: Ukuran ikon diperbesar */}
              <Home size={18} />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Tombol Aksi Navigasi Tambahan */}
        <div className="mb-6">
          <Link href="/dashboard-monitoring" className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-cyan-600 text-white px-5 py-2 rounded-lg hover:bg-cyan-700 transition-colors font-semibold shadow-sm">
            {/* PERUBAHAN: Ukuran ikon diperbesar */}
            <LayoutDashboard size={20} />
            <span>Lihat Dashboard Monitoring</span>
          </Link>
        </div>

        {/* Tabel Data Kelas */}
        {loading ? (
          <p className="text-center text-gray-500 py-8">Memuat data kelas...</p>
        ) : (
          <div className="overflow-x-auto">
            {classes.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-gray-600">
                  <tr>
                    <th className="p-4 font-semibold">Kelas</th>
                    <th className="p-4 font-semibold">Pengajar</th>
                    <th className="p-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50 border-b last:border-b-0">
                      <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{cls.name}</td>
                      <td className="p-4 text-gray-700">
                        {cls.teachers.length > 0 ? cls.teachers.map((t) => t.name).join(", ") : <span className="text-gray-400">Belum ada</span>}
                      </td>
                      <td className="p-4 text-center">
                        {/* PERUBAHAN UTAMA: Tombol dibuat lebih responsif */}
                        <Link
                          href={`/journal?class_id=${cls.id}`}
                          className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
                        >
                          <BookOpen size={16} />
                          {/* Teks diubah agar responsif */}
                          <span className="sm:hidden">Buat Jurnal</span>
                          <span className="hidden sm:inline">Buat Jurnal Pembelajaran</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">Belum Ada Kelas</h3>
                <p className="text-gray-500 mt-2">Silakan tambahkan data kelas terlebih dahulu di halaman Manajemen Kelas.</p>
                <Link href="/classes" className="mt-4 inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm">
                  Pergi ke Manajemen Kelas
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}