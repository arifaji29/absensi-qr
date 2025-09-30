"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Home, HandCoins, LayoutDashboard, Wallet } from "lucide-react";

// Tipe data
type Teacher = { id: string; name: string };
type ClassWithTeachers = { id: string; name: string; teachers: Teacher[] };

// Fungsi untuk format mata uang
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function InfaqDashboardPage() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [totalInfaq, setTotalInfaq] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil data kelas dan total infaq secara bersamaan
      const [classesRes, totalInfaqRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/infaq/total")
      ]);

      if (!classesRes.ok || !totalInfaqRes.ok) throw new Error("Gagal memuat data");
      
      const classesData = await classesRes.json();
      const totalInfaqData = await totalInfaqRes.json();

      setClasses(Array.isArray(classesData) ? classesData : []);
      setTotalInfaq(totalInfaqData.totalInfaq || 0);

    } catch (err) {
      console.error(err);
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
              Dashboard Infaq
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pilih kelas untuk mencatat infaq atau kelola data infaq global.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={18} />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={18} />
              <span>Home</span>
            </Link>
          </div>
        </div>
        
        {/* Kartu Informasi Saldo Global & Tombol Aksi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Kartu Saldo */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <Wallet size={32} />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">Jumlah Saldo Global Infaq</p>
                        <p className="text-3xl font-bold tracking-tight">
                            {loading ? 'Memuat...' : formatCurrency(totalInfaq)}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Tombol Aksi */}
            <div className="bg-gray-50 p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-gray-800">Aksi Lanjutan</h3>
                    <p className="text-sm text-gray-500">Lihat semua laporan atau kelola data infaq.</p>
                </div>
                <Link href="/monitoring/infaq-global" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-semibold shadow-sm w-full sm:w-auto">
                    <LayoutDashboard size={20} />
                    <span>Kelola Infaq Global</span>
                </Link>
            </div>
        </div>

        {/* Tabel Data Kelas */}
        {loading ? (
          <p className="text-center text-gray-500 py-8">Memuat data kelas...</p>
        ) : (
          <div className="overflow-x-auto">
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
                        <Link href={`/infaq?class_id=${cls.id}`} className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-xs font-semibold shadow-sm transition-colors">
                            <HandCoins size={16} />
                            <span>Catat Infaq</span>
                        </Link>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}