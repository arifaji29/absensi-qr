"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Users } from "lucide-react";

type Teacher = { id: string; name: string };
type ClassWithTeachers = { id: string; name: string; teachers: Teacher[] };

export default function AttendanceDashboard() {
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Presensi</h1>

      {/* Tombol navigasi */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Back → ke Home */}
        <Link href="/">
          <button className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </Link>

        {/* Home */}
        <Link href="/">
          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700">
            <Home size={18} />
            <span>Home</span>
          </button>
        </Link>

        {/* Dashboard Siswa */}
        <Link href="/dashboard-students">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Users size={18} />
            <span>Dashboard Siswa</span>
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
                    <Link href={`/attendance?class_id=${cls.id}`}>
                      <button className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-600">
                        Presensi
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
