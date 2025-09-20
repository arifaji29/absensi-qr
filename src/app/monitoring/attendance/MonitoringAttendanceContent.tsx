"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw, FileText, FileSpreadsheet, BarChart, CalendarDays } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipe data
type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha" | "Libur" | "-" | "Belum Hadir";
type AttendanceRecord = { date: string; status: AttendanceStatus };
type MonitoringData = {
  student_id: string;
  name: string;
  nis: string;
  attendance_records: AttendanceRecord[];
};
type AttendanceStats = {
  student_id: string;
  name: string;
  Hadir: number;
  Sakit: number;
  Izin: number;
  Alpha: number;
  Libur: number;
  percentage: number;
};

interface jsPDFWithLastTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

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

export default function AttendanceMonitoringPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [dateHeaders, setDateHeaders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'stats'>('daily');

  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const fetchData = useCallback(async (startDate: string, endDate: string) => {
    if (!classId) return;
    setLoading(true);

    const dates: string[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      dates.push(formatDateToYYYYMMDD(currentDate));
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
  }, [classId, selectedMonth, selectedYear]);

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

  const loadData = useCallback(() => {
    const startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1));
    const endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
    fetchData(startDate, endDate);
  }, [selectedMonth, selectedYear, fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusClasses = (status: AttendanceStatus) => {
    switch (status) {
      case "Hadir": return "bg-green-100 text-green-800 font-semibold";
      case "Sakit": return "bg-orange-100 text-orange-800 font-semibold";
      case "Izin": return "bg-yellow-100 text-yellow-800 font-semibold";
      case "Libur": return "bg-red-100 text-red-800 font-semibold";
      case "Alpha": return "bg-gray-200 text-gray-700 font-semibold";
      default: return "text-gray-400";
    }
  };

  const statisticsData: AttendanceStats[] = useMemo(() => {
    if (!monitoringData || monitoringData.length === 0) return [];
    
    let effectiveDays = 0;
    const today = new Date();
    const currentDay = today.getDate();
    
    if (selectedYear < today.getFullYear() || (selectedYear === today.getFullYear() && selectedMonth < today.getMonth())) {
      effectiveDays = dateHeaders.length;
    } else if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) {
      effectiveDays = currentDay;
    } else {
      effectiveDays = 0;
    }
    
    if (effectiveDays === 0) {
      return monitoringData.map(student => ({
        ...student,
        Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Libur: 0, percentage: 0
      }));
    }

    return monitoringData.map(student => {
      const counts: { [key in "Hadir" | "Sakit" | "Izin" | "Alpha" | "Libur"]: number } = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Libur: 0 };
      
      // === PERBAIKAN TYPE ERROR DI SINI ===
      student.attendance_records.forEach(record => {
        const status = record.status;
        // Periksa secara eksplisit apakah status adalah salah satu yang ingin kita hitung
        if (status === "Hadir" || status === "Sakit" || status === "Izin" || status === "Alpha" || status === "Libur") {
          counts[status]++;
        }
      });
      
      const presentAndHoliday = counts.Hadir + counts.Libur;
      const percentage = (presentAndHoliday / effectiveDays) * 100;
      
      return {
        student_id: student.student_id,
        name: student.name,
        ...counts,
        percentage: parseFloat(percentage.toFixed(1))
      };
    });
  }, [monitoringData, dateHeaders, selectedMonth, selectedYear]);
  
  const handleDownloadExcel = () => {
    const header = ["Nama Siswa", ...dateHeaders.map(d => new Date(d + 'T00:00:00').toLocaleDateString("id-ID", { day: '2-digit', month: 'short' }))];
    const body = monitoringData.map(student => {
        const row: { [key: string]: string } = { "Nama Siswa": student.name };
        dateHeaders.forEach(date => {
            const record = student.attendance_records.find(r => r.date === date);
            row[new Date(date + 'T00:00:00').toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })] = record?.status || "-";
        });
        return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(body);
    XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: "A1" });
    const legend = [["Keterangan:"], ["H = Hadir"], ["S = Sakit"], ["I = Izin"], ["A = Alpha"], ["L = Libur"]];
    XLSX.utils.sheet_add_aoa(worksheet, legend, { origin: `A${body.length + 3}` });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi Harian");
    XLSX.writeFile(workbook, `Absensi_Harian_${className}_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const tableColumn = ["Nama", ...dateHeaders.map(d => new Date(d + 'T00:00:00').toLocaleDateString("id-ID", { day: '2-digit' }))];
    const tableRows = monitoringData.map(student => [student.name, ...dateHeaders.map(date => {
        const record = student.attendance_records.find(r => r.date === date);
        if (!record || !record.status || record.status === 'Belum Hadir') return "-";
        return record.status.charAt(0);
    })]);
    doc.text(`Laporan Kehadiran Harian Kelas ${className} - ${monthNames[selectedMonth]} ${selectedYear}`, 14, 15);
    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 25,
      styles: { fontSize: 8, cellPadding: 1, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
      columnStyles: { 0: { cellWidth: 25, halign: 'left' } },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const status = data.cell.raw?.toString();
          if (status === 'L') data.cell.styles.textColor = '#E53E3E';
        }
      },
    });
    const finalY = (doc as jsPDFWithLastTable).lastAutoTable.finalY;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpha, L = Libur", 14, finalY + 10);
    doc.save(`Absensi_Harian_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  const handleDownloadStatsExcel = () => {
    const header = ["Nama Siswa", "Hadir", "Sakit", "Izin", "Alpha", "Persentase Kehadiran (%)"];
    const body = statisticsData.map(stat => ({
      "Nama Siswa": stat.name,
      "Hadir": stat.Hadir,
      "Sakit": stat.Sakit,
      "Izin": stat.Izin,
      "Alpha": stat.Alpha,
      "Persentase Kehadiran (%)": `${stat.percentage}%`
    }));
    const worksheet = XLSX.utils.json_to_sheet(body);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistik Absensi");
    XLSX.writeFile(workbook, `Statistik_Absensi_${className}_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
  };

  const handleDownloadStatsPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const tableColumn = ["Nama Siswa", "Hadir", "Sakit", "Izin", "Alpha", "Kehadiran (%)"];
    const tableRows = statisticsData.map(stat => [
      stat.name,
      stat.Hadir,
      stat.Sakit,
      stat.Izin,
      stat.Alpha,
      `${stat.percentage}%`
    ]);
    doc.text(`Statistik Kehadiran Kelas ${className} - ${monthNames[selectedMonth]} ${selectedYear}`, 14, 15);
    autoTable(doc, {
      head: [tableColumn], 
      body: tableRows, 
      startY: 25,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { halign: 'left' }, 5: { fontStyle: 'bold' } },
    });
    doc.save(`Statistik_Absensi_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        {/* Header */}
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
        
        {/* Kontrol */}
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
              <span>Refresh Data</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {viewMode === 'daily' ? (
                 <button onClick={() => setViewMode('stats')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold text-sm">
                   <BarChart size={16} />
                   <span>Statistik</span>
                 </button>
            ) : (
                <button onClick={() => setViewMode('daily')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold text-sm">
                  <CalendarDays size={16} />
                  <span>Lihat Harian</span>
                </button>
            )}
            
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              {viewMode === 'daily' ? (
                <>
                  <button onClick={handleDownloadExcel} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm">
                    <FileSpreadsheet size={16} /> <span>Excel</span>
                  </button>
                  <button onClick={handleDownloadPDF} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">
                    <FileText size={16} /> <span>PDF</span>
                  </button>
                </>
              ) : (
                <>
                   <button onClick={handleDownloadStatsExcel} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm">
                    <FileSpreadsheet size={16} /> <span>Excel</span>
                  </button>
                  <button onClick={handleDownloadStatsPDF} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">
                    <FileText size={16} /> <span>PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data laporan...</p>) : (
          <>
            {viewMode === 'daily' ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-3 text-left font-semibold sticky left-0 bg-gray-100 z-10 border-r">Nama Siswa</th>
                      {dateHeaders.map((date) => (
                        <th key={date} className="p-3 font-semibold whitespace-nowrap text-center border-l">
                          {new Date(date + 'T00:00:00').toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
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
                                {status === 'Belum Hadir' ? '-' : status.charAt(0)}
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
            ) : (
               <div className="overflow-x-auto border rounded-lg">
                 <table className="w-full text-sm">
                   <thead className="bg-gray-100 text-gray-600">
                     <tr>
                       <th className="p-3 text-left font-semibold">Nama Siswa</th>
                       <th className="p-3 font-semibold text-center">Hadir</th>
                       <th className="p-3 font-semibold text-center">Sakit</th>
                       <th className="p-3 font-semibold text-center">Izin</th>
                       <th className="p-3 font-semibold text-center">Alpha</th>
                       <th className="p-3 font-semibold text-center">Persentase Kehadiran (%)</th>
                     </tr>
                   </thead>
                   <tbody>
                     {statisticsData.length > 0 ? (
                       statisticsData.map((stat) => (
                         <tr key={stat.student_id} className="border-b last:border-b-0 hover:bg-gray-50">
                           <td className="p-2 font-medium text-gray-800">{stat.name}</td>
                           <td className="p-2 text-center">{stat.Hadir}</td>
                           <td className="p-2 text-center">{stat.Sakit}</td>
                           <td className="p-2 text-center">{stat.Izin}</td>
                           <td className="p-2 text-center">{stat.Alpha}</td>
                           <td className={`p-2 text-center font-bold ${stat.percentage >= 80 ? 'text-green-600' : stat.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                             {stat.percentage}%
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan={6} className="text-center p-8 text-gray-500">
                           <h3 className="text-lg font-semibold">Tidak Ada Data</h3>
                           <p>Belum ada data untuk ditampilkan statistiknya.</p>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            )}
            
            <div className="mt-4 text-left text-xs text-gray-600">
                <p><strong>Keterangan:</strong> H = Hadir, S = Sakit, I = Izin, A = Alpha, L = Libur</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

