"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Download, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipe data
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
  return date.toISOString().split('T')[0];
};

export default function AttendanceMonitoringPage() {
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
  const fetchData = useCallback(async (startDate: string, endDate: string) => {
    if (!classId) return;
    setLoading(true);

    const dates: string[] = [];
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      dates.push(formatDateToYYYYMMDD(new Date(d)));
    }
    setDateHeaders(dates);

    try {
      const res = await fetch(`/api/monitoring/attendance?class_id=${classId}&start_date=${startDate}&end_date=${endDate}`);
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

  // Fungsi pewarnaan status
  const getStatusClasses = (status: AttendanceStatus) => {
    switch (status) {
      case "Hadir": return "bg-green-100 text-green-800 font-semibold";
      case "Sakit": return "bg-red-100 text-red-800 font-semibold";
      case "Izin": return "bg-yellow-100 text-yellow-800 font-semibold";
      case "Alpha": return "bg-gray-200 text-gray-700 font-semibold";
      default: return "text-gray-400";
    }
  };

  // Fungsi Export ke Excel
  const handleDownloadExcel = () => {
    const header = ["Nama Siswa", ...dateHeaders.map(d => new Date(d).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' }))];
    const body = monitoringData.map(student => {
      const row: { [key: string]: string } = { "Nama Siswa": student.name };
      dateHeaders.forEach(date => {
        const record = student.attendance_records.find(r => r.date === date);
        row[new Date(date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })] = record?.status || "-";
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(body, { header: header });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");
    XLSX.writeFile(workbook, `Absensi_${className}_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
  };
  
  // Fungsi Export ke PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const tableColumn = ["Nama Siswa", ...dateHeaders.map(d => new Date(d).toLocaleDateString("id-ID", { day: '2-digit' }))];
    const tableRows = monitoringData.map(student => [student.name, ...dateHeaders.map(date => student.attendance_records.find(r => r.date === date)?.status || "-")]);
    doc.text(`Laporan Kehadiran Kelas ${className} - ${monthNames[selectedMonth]} ${selectedYear}`, 14, 15);
    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 25,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { cellWidth: 35 } },
    });
    doc.save(`Absensi_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Monitoring Kehadiran {className ? `Kelas ${className}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Laporan Bulan: <strong>{monthNames[selectedMonth]} {selectedYear}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard-monitoring" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Panel Kontrol */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-2 items-center w-full md:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
                {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button onClick={loadData} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">
              <RefreshCw size={16} />
              <span>Lihat</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadExcel} className="w-1/2 md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm">
              <FileSpreadsheet size={16} />
              <span>Excel</span>
            </button>
            <button onClick={handleDownloadPDF} className="w-1/2 md:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">
              <FileText size={16} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Tabel Laporan */}
        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data laporan...</p>) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left font-semibold sticky left-0 bg-gray-100 z-10 border-r">Nama Siswa</th>
                  {dateHeaders.map((date) => (
                    <th key={date} className="p-3 font-semibold whitespace-nowrap text-center border-l">
                      {new Date(date).toLocaleDateString("id-ID", { timeZone: "UTC", day: "2-digit", month: "short" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monitoringData.length > 0 ? (
                  monitoringData.map((student) => (
                    <tr key={student.student_id} className="border-b last:border-b-0">
                      <td className="p-2 font-medium text-gray-800 sticky left-0 bg-white z-10 whitespace-nowrap border-r">{student.name}</td>
                      {dateHeaders.map((date) => {
                        const record = student.attendance_records.find((r) => r.date === date);
                        const status: AttendanceStatus = record?.status || "-";
                        return (
                          <td key={date} className={`p-2 text-center border-l ${getStatusClasses(status)}`}>
                            {status.charAt(0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={dateHeaders.length + 1} className="text-center p-8 text-gray-500">
                        <h3 className="text-lg font-semibold">Tidak Ada Data</h3>
                        <p>Belum ada data kehadiran siswa pada periode ini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}