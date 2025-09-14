"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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

  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Ambil data monitoring
  const fetchData = useCallback(
    async (startDate: string, endDate: string) => {
      if (!classId) return;
      setLoading(true);

      const dates: string[] = [];
      const start = new Date(startDate);
      const finalDate = new Date(endDate);

      for (let d = new Date(start); d <= finalDate; d.setDate(d.getDate() + 1)) {
        dates.push(formatDateToYYYYMMDD(new Date(d)));
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
    },
    [classId]
  );

  // Ambil detail kelas
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!classId) return;
      try {
        const res = await fetch(`/api/classes/${classId}/details`);
        if (!res.ok) throw new Error("Gagal ambil detail kelas");
        const classData = await res.json();
        setClassName(classData.name || "");
      } catch (error) {
        console.error("Gagal mengambil detail kelas", error);
      }
    };
    fetchClassDetails();
  }, [classId]);

  // Update data saat bulan / tahun berubah
  const loadData = useCallback(() => {
    const startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1));
    const endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
    fetchData(startDate, endDate);
  }, [selectedMonth, selectedYear, fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status.toLowerCase()) {
      case "hadir":
        return "bg-green-100 text-green-800";
      case "sakit":
        return "bg-red-100 text-red-800 font-bold";
      case "izin":
        return "bg-yellow-100 text-yellow-800";
      case "alpha":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-white";
    }
  };

  // Export ke Excel
  const handleDownloadExcel = () => {
    const worksheetData: (string | number)[][] = [];
    worksheetData.push(["Nama Siswa", ...dateHeaders]);

    monitoringData.forEach((student) => {
      const row: (string | number)[] = [student.name];
      dateHeaders.forEach((date) => {
        const record = student.attendance_records.find((r) => r.date === date);
        row.push(record?.status || "-");
      });
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");

    const bulan = monthNames[selectedMonth];
    const tahun = selectedYear;
    const namaFile = `Absensi_${className || "kelas"}_${bulan}_${tahun}.xlsx`;

    XLSX.writeFile(workbook, namaFile);
  };

  // Export ke PDF (landscape + kolom nama lebih lebar)
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const tableColumn: string[] = ["Nama Siswa", ...dateHeaders];
    const tableRows: (string | number)[][] = [];

    monitoringData.forEach((student) => {
      const rowData: (string | number)[] = [student.name];
      dateHeaders.forEach((date) => {
        const record = student.attendance_records.find((r) => r.date === date);
        rowData.push(record?.status || "-");
      });
      tableRows.push(rowData);
    });

    const bulan = monthNames[selectedMonth];
    const tahun = selectedYear;
    const judul = `Laporan Kehadiran ${className ? `Kelas ${className}` : ""} - ${bulan} ${tahun}`;
    const namaFile = `Absensi_${className || "kelas"}_${bulan}_${tahun}.pdf`;

    doc.text(judul, 14, 15);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 6 },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 20 }, // kolom nama siswa lebih lebar
      },
    });

    doc.save(namaFile);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Monitoring Kehadiran {className ? `Kelas ${className}` : "..."}
      </h1>

      {/* Pilih bulan & tahun + tombol aksi */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border items-center">
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full p-2 border rounded-md bg-white"
          >
            {monthNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full p-2 border rounded-md bg-white"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 lg:justify-end flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            <span>Excel</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Download size={18} />
            <span>PDF</span>
          </button>
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

      {/* Tabel */}
      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border p-2 text-left sticky left-0 bg-gray-100 z-20">
                  Nama Siswa
                </th>
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
                      const status: AttendanceStatus = record?.status || "-";
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
                  <td colSpan={dateHeaders.length + 1} className="text-center p-4">
                    Tidak ada data siswa untuk ditampilkan pada bulan ini.
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
