"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type Teacher = { id: string; name: string };
type ClassWithTeachers = { id: string; name: string; teachers: Teacher[] };

export default function DashboardStudentsPage() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Siswa</h1>

      {/* Tombol navigasi */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Tombol Back → langsung ke halaman utama */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Tombol Home */}
        <Link href="/">
          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700">
            <Home size={18} />
            <span>Home</span>
          </button>
        </Link>

        {/* Tombol Dashboard Presensi */}
        <Link href="/dashboard-attendance">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <CalendarCheck size={18} />
            <span>Dashboard Presensi</span>
          </button>
        </Link>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Kelas</th>
                <th className="p-4 text-left">Pengajar</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50 border-b">
                  <td className="p-4 font-medium">{cls.name}</td>
                  <td className="p-4">
                    {cls.teachers.length > 0
                      ? cls.teachers.map((t) => t.name).join(", ")
                      : "-"}
                  </td>
                  <td className="p-4 text-center">
                    <Link href={`/students?class_id=${cls.id}`}>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Daftar Siswa
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
