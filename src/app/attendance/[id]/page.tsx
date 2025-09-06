"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = {
  id: string;
  student_id: string;
  status: "hadir" | "izin" | "sakit" | "alpha";
  check_in_time: string | null;
  students: {
    name: string;
    nis: string;
  };
};

export default function AttendancePage({ params }: { params: { class_id: string } }) {
  const { class_id } = params;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  async function loadAttendance() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?class_id=${class_id}`);
      if (!res.ok) throw new Error("Gagal memuat absensi");
      const data = await res.json();
      setRecords(data);
      setIsStarted(data.length > 0);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat absensi.");
    } finally {
      setLoading(false);
    }
  }

  async function startAttendance() {
    if (!confirm("Mulai absensi untuk hari ini?")) return;
    try {
      const res = await fetch(`/api/attendance/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id }),
      });
      if (!res.ok) throw new Error("Gagal memulai absensi");
      await loadAttendance();
    } catch (error) {
      console.error(error);
      alert("Gagal memulai absensi.");
    }
  }

  async function markPresent(nis: string) {
    try {
      const res = await fetch(`/api/attendance/check`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nis, class_id }),
      });
      if (!res.ok) throw new Error("Gagal mencatat kehadiran");
      await loadAttendance();
    } catch (error) {
      console.error(error);
      alert("Gagal mencatat kehadiran.");
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [class_id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Presensi Kelas</h1>

      {!isStarted && (
        <button
          onClick={startAttendance}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
        >
          Mulai Absensi
        </button>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">NIS</th>
              <th className="border p-2">Nama</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Waktu Hadir</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="border p-2">{r.students.nis}</td>
                  <td className="border p-2">{r.students.name}</td>
                  <td className="border p-2 capitalize">{r.status}</td>
                  <td className="border p-2">
                    {r.check_in_time
                      ? new Date(r.check_in_time).toLocaleTimeString("id-ID")
                      : "-"}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => markPresent(r.students.nis)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Tandai Hadir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
