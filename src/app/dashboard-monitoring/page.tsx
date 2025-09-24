"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, BookOpen, BarChart2, CalendarDays } from "lucide-react";

type ClassItem = { 
  id: string; 
  name: string 
};

export default function DashboardMonitoringPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/classes");
        if (!res.ok) throw new Error("Gagal memuat data kelas");
        setClasses(await res.json());
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat memuat data kelas.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Dashboard Monitoring
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pilih kelas untuk melihat laporan kehadiran, pembelajaran, dan nilai.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
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
                    <th className="p-4 font-semibold">Aksi Monitoring</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                        {cls.name}
                      </td>
                      <td className="p-4">
                        {/* Kontainer Tombol Aksi yang Responsif */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link 
                            href={`/monitoring/attendance?class_id=${cls.id}`} 
                            className="flex items-center justify-center gap-2 px-4 py-2 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                          >
                            <CalendarDays size={14} />
                            <span>Kehadiran</span>
                          </Link>
                          <Link 
                            href={`/monitoring/learning?class_id=${cls.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                          >
                            <BookOpen size={14} />
                            <span>Pembelajaran</span>
                          </Link>
                          <Link 
                            href={`/monitoring/assessment?class_id=${cls.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                          >
                            <BarChart2 size={14} />
                            <span>Nilai</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">Belum Ada Kelas</h3>
                <p className="text-gray-500 mt-2">Anda perlu menambahkan data kelas terlebih dahulu untuk melihat monitoring.</p>
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