"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha" | "-";

type AttendanceRecord = { date: string; status: AttendanceStatus };
type MonitoringData = {
  student_id: string;
  name: string;
  nis: string;
  attendance_records: AttendanceRecord[];
};

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// --- FUNGSI BARU UNTUK FORMAT TANGGAL ---
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AttendanceMonitoringContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [dateHeaders, setDateHeaders] = useState<string[]>([]);

  const [filterMode, setFilterMode] = useState<"last7days" | "monthly">("monthly");
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const fetchData = useCallback(async (startDate: string, endDate: string) => {
    if (!classId) return;
    setLoading(true);

    const dates: string[] = [];
    // pakai let karena diubah tiap iterasi
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      dates.push(formatDateToYYYYMMDD(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setDateHeaders(dates);

    try {
      const res = await fetch(
        `/api/monitoring/attendance?class_id=${classId}&start_date=${startDate}&end_date=${endDate}`
      );
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const data: MonitoringData[] = await res.json();
      setMonitoringData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal memuat data monitoring:", error);
      setMonitoringData([]);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!classId) return;
      try {
        const res = await fetch(`/api/classes/${classId}/details`);
        const classData = await res.json();
        setClassName(classData.name || "");
      } catch (error) {
        console.error("Gagal mengambil detail kelas", error);
      }
    };
    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    let startDate: string;
    let endDate: string;

    if (filterMode === "last7days") {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      startDate = formatDateToYYYYMMDD(sevenDaysAgo);
      endDate = formatDateToYYYYMMDD(today);
    } else {
      startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1));
      endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
    }

    fetchData(startDate, endDate);
  }, [filterMode, selectedMonth, selectedYear, fetchData]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status.toLowerCase()) {
      case "hadir": return "bg-green-100 text-green-800";
      case "sakit": return "bg-red-100 text-red-800 font-bold";
      case "izin": return "bg-yellow-100 text-yellow-800";
      case "alpha": return "bg-gray-200 text-gray-700";
      default: return "bg-white";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Monitoring Kehadiran {className ? `Kelas ${className}` : "..."}
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border items-center">
        <div className="flex items-center gap-2">
          <label className="font-medium whitespace-nowrap">Tampilkan Data:</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as "last7days" | "monthly")}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="last7days">7 Hari Terakhir</option>
            <option value="monthly">Per Bulan</option>
          </select>
        </div>

        {filterMode === "monthly" && (
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full p-2 border rounded-md bg-white"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full p-2 border rounded-md bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 lg:justify-end">
          <Link href="/dashboard-monitoring">
            <button className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Home size={18} />
              <span>Home</span>
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border p-2 text-left sticky left-0 bg-gray-100 z-20">Nama Siswa</th>
                {dateHeaders.map((date) => (
                  <th key={date} className="border p-2 whitespace-nowrap">
                    {new Date(date).toLocaleDateString("id-ID", {
                      timeZone: "UTC",
                      day: "2-digit",
                      month: "short",
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monitoringData.length > 0 ? (
                monitoringData.map((student) => (
                  <tr key={student.student_id}>
                    <td className="border p-2 font-medium sticky left-0 bg-white z-10 whitespace-nowrap">
                      {student.name}
                    </td>
                    {dateHeaders.map((date) => {
                      const record = student.attendance_records.find((r) => r.date === date);
                      const status: AttendanceStatus = record?.status as AttendanceStatus || "-";
                      return (
                        <td
                          key={date}
                          className={`border p-2 text-center ${getStatusColor(status)}`}
                        >
                          {status}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={dateHeaders.length + 1}
                    className="text-center p-4"
                  >
                    Tidak ada data siswa untuk ditampilkan pada rentang waktu ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
