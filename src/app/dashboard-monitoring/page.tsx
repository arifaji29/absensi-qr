"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
// useRouter tidak lagi diperlukan jika kita hanya menggunakan Link
// import { useRouter } from "next/navigation";

type ClassItem = { id: string; name: string };

export default function DashboardMonitoringPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  // const router = useRouter(); // Tidak perlu lagi

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Monitoring</h1>

      {/* Tombol navigasi */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Menggunakan Link untuk navigasi 'Back' agar lebih konsisten */}
        <Link
          href="/"
          className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Home size={18} />
          <span>Home</span>
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Memuat data kelas...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Kelas
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Aksi Monitoring
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {cls.name}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {/* --- PERUBAHAN DI SINI --- */}
                    <Link href={`/monitoring/attendance?class_id=${cls.id}`}>
                      <button className="px-4 py-2  font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-transform transform hover:scale-105">
                        Kehadiran
                      </button>
                    </Link>
                    {/* Saya juga sesuaikan link lainnya untuk konsistensi */}
                    <Link href={`/monitoring/pembelajaran?class_id=${cls.id}`}>
                       <button className="px-4 py-2 font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-transform transform hover:scale-105">
                        Pembelajaran
                      </button>
                    </Link>
                    <Link href={`/monitoring/nilai?class_id=${cls.id}`}>
                       <button className="px-4 py-2 font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-transform transform hover:scale-105">
                        Nilai
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}