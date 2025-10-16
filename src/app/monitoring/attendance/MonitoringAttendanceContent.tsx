"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
// Menggunakan <a> sebagai pengganti <Link>
import { ArrowLeft, Home, RefreshCw, FileText, BarChart, CalendarDays } from "lucide-react";

// Tipe data global untuk library dari CDN
declare const jspdf: any;

// Tipe data
type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha" | "-" | "Belum Hadir";
type AttendanceRecord = { date: string; status: AttendanceStatus };
type MonitoringData = {
  student_id: string;
  name: string;
  attendance_records: AttendanceRecord[];
};
type AttendanceStats = {
  student_id: string;
  name: string;
  Hadir: number;
  Sakit: number;
  Izin: number;
  Alpha: number;
  percentage: number;
};

// Interface untuk jsPDF autotable
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
  const [classId, setClassId] = useState("");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('class_id') || '';
    setClassId(idFromUrl);
  }, []);

  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [dateHeaders, setDateHeaders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'stats'>('stats');
  const [activeDaysCount, setActiveDaysCount] = useState(0);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Fungsi untuk memuat script dari CDN
  useEffect(() => {
    const loadScript = (src: string, id: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Gagal memuat script: ${src}`));
        document.head.appendChild(script);
      });
    };

    // Hapus pemuatan script XLSX
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-script")
    .then(() => {
      return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js", "jspdf-autotable-script");
    }).then(() => {
      setScriptsLoaded(true);
    }).catch(error => {
      console.error("Gagal memuat library eksternal:", error);
      alert("Gagal memuat fungsi download. Silakan refresh halaman.");
    });
  }, []);

  const fetchData = useCallback(async (startDate: string, endDate: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/monitoring/attendance?class_id=${classId}&start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const { monitoringData, activeDaysCount } = await res.json();
      setMonitoringData(Array.isArray(monitoringData) ? monitoringData : []);
      setActiveDaysCount(activeDaysCount || 0);
    } catch (error) {
      console.error("Gagal memuat data monitoring:", error);
    } finally {
      setLoading(false);
    }
  }, [classId]);
  
  useEffect(() => {
    const dates: string[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(selectedYear, selectedMonth, day);
        dates.push(formatDateToYYYYMMDD(currentDate));
    }
    setDateHeaders(dates);
  }, [selectedMonth, selectedYear]);

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
    if (classId) {
      loadData();
    }
  }, [loadData, classId]);

  const getStatusClasses = (status: AttendanceStatus) => {
    switch (status) {
      case "Hadir": return "bg-green-100 text-green-800 font-semibold";
      case "Sakit": return "bg-orange-100 text-orange-800 font-semibold";
      case "Izin": return "bg-yellow-100 text-yellow-800 font-semibold";
      case "Alpha": return "bg-gray-200 text-gray-700 font-semibold";
      default: return "text-gray-400";
    }
  };

  const statisticsData: AttendanceStats[] = useMemo(() => {
    if (!monitoringData || activeDaysCount === 0) {
      return (monitoringData || []).map(student => ({
        student_id: student.student_id, name: student.name,
        Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, percentage: 0,
      }));
    }
    return monitoringData.map(student => {
      const counts: { [key in "Hadir" | "Sakit" | "Izin" | "Alpha"]: number } = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
      student.attendance_records.forEach(record => {
        if (record.status in counts) {
          counts[record.status as keyof typeof counts]++;
        }
      });
      const percentage = (counts.Hadir / activeDaysCount) * 100;
      return {
        student_id: student.student_id, name: student.name,
        ...counts,
        percentage: Math.round(percentage) 
      };
    });
  }, [monitoringData, activeDaysCount]);
  
  const handleDownloadPDF = () => {
    const doc = new (window as any).jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const tableColumn = ["Nama", ...dateHeaders.map(d => new Date(d + 'T00:00:00').toLocaleDateString("id-ID", { day: '2-digit' }))];
    const tableRows = monitoringData.map(student => [student.name, ...dateHeaders.map(date => {
      const record = student.attendance_records.find(r => r.date === date);
      if (!record || !record.status || record.status === 'Belum Hadir') return "-";
      return record.status.charAt(0);
    })]);
    doc.text(`Laporan Kehadiran Harian Kelas ${className} - ${monthNames[selectedMonth]} ${selectedYear}`, 14, 15);
    
    // PERBAIKAN: Gunakan doc.autoTable sebagai method
    (doc as any).autoTable({
      head: [tableColumn], body: tableRows, startY: 25,
      styles: { fontSize: 8, cellPadding: 1, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
      columnStyles: { 0: { cellWidth: 25, halign: 'left' } },
    });
    
    const finalY = (doc as unknown as jsPDFWithLastTable).lastAutoTable.finalY;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpha", 14, finalY + 10);
    doc.save(`Absensi_Harian_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  const handleDownloadStatsPDF = () => {
    const doc = new (window as any).jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const tableColumn = ["Nama Siswa", "Hadir", "Sakit", "Izin", "Alpha", "Kehadiran (%)"];
    const tableRows = statisticsData.map(stat => [ stat.name, stat.Hadir, stat.Sakit, stat.Izin, stat.Alpha, `${stat.percentage}%` ]);
    doc.text(`Statistik Kehadiran Kelas ${className} - ${monthNames[selectedMonth]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Jumlah Hari Aktif: ${activeDaysCount} hari`, 14, 22);

    // PERBAIKAN: Gunakan doc.autoTable sebagai method
    (doc as any).autoTable({
        head: [tableColumn], body: tableRows, startY: 28,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: { 0: { halign: 'left' }, 5: { fontStyle: 'bold' } },
    });
    doc.save(`Statistik_Absensi_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
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
              <a href="/dashboard-monitoring" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                <ArrowLeft size={16} />
                <span>Back</span>
              </a>
            <a href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={16} />
              <span>Home</span>
            </a>
          </div>
        </div>
        
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
                   <BarChart size={16} /><span>Lihat Statistik</span>
                 </button>
            ) : (
                 <button onClick={() => setViewMode('daily')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold text-sm">
                   <CalendarDays size={16} /><span>Lihat Harian</span>
                 </button>
            )}
            
            <div className="w-full sm:w-auto">
              <button onClick={viewMode === 'daily' ? handleDownloadPDF : handleDownloadStatsPDF} disabled={!scriptsLoaded} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm disabled:bg-red-400 disabled:cursor-not-allowed">
                <FileText size={16} /> <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data laporan...</p>) : (
          <>
            {viewMode === 'stats' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-sm font-semibold text-blue-800">
                        Jumlah Hari Aktif Bulan Ini: <span className="text-lg">{activeDaysCount}</span> hari
                    </p>
                </div>
            )}
          
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
              <p><strong>Keterangan:</strong> H = Hadir, S = Sakit, I = Izin, A = Alpha</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

