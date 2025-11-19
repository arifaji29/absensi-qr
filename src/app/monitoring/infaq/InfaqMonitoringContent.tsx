"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw, FileText, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable, { CellInput } from "jspdf-autotable";

// Tipe Data
type Student = { id: string; name: string };
type InfaqByDay = { [studentId: string]: { [day: number]: number } };
type InfaqSummary = { [studentId: string]: number };

// Tipe untuk daftar kelas (Dropdown)
type ClassItem = {
  id: string;
  name: string;
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function InfaqMonitoringContent() {
  const searchParams = useSearchParams();
  
  // 1. State Class ID (inisialisasi dari URL)
  const [classId, setClassId] = useState(searchParams.get("class_id") || "");
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [infaqByDay, setInfaqByDay] = useState<InfaqByDay>({});
  const [infaqSummary, setInfaqSummary] = useState<InfaqSummary>({});
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("");

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const dateHeaders = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const grandTotal = useMemo(() => {
    return Object.values(infaqSummary).reduce((sum, amount) => sum + amount, 0);
  }, [infaqSummary]);

  // 2. Fetch Daftar Semua Kelas (Untuk Dropdown)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setAvailableClasses(data || []);
        }
      } catch (error) {
        console.error("Gagal memuat daftar kelas", error);
      }
    };
    fetchClasses();
  }, []);

  // 3. Fetch Data Infaq
  const fetchData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/monitoring/infaq?class_id=${classId}&month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      
      const { students, infaqByDay, infaqSummary } = await res.json();
      setStudents(students || []);
      setInfaqByDay(infaqByDay || {});
      setInfaqSummary(infaqSummary || {});

    } catch (error) {
      console.error("Gagal memuat data monitoring:", error);
    } finally {
      setLoading(false);
    }
  }, [classId, selectedMonth, selectedYear]);

  // Trigger fetch saat filter berubah
  useEffect(() => {
    if (classId) {
        fetchData();
    }
  }, [fetchData, classId]);

  // Update nama kelas saat classId berubah
  useEffect(() => {
    if (classId) {
      fetch(`/api/classes/${classId}/details`)
        .then(res => res.json())
        .then(data => setClassName(data.name || ""));
    } else {
        setClassName("");
        setStudents([]);
    }
  }, [classId]);

  // Handler Ganti Kelas
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    // Update URL browser tanpa reload agar bookmarkable
    const url = new URL(window.location.href);
    url.searchParams.set('class_id', newClassId);
    window.history.pushState({}, '', url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.text(`Laporan Infaq Bulanan Kelas ${className}`, 14, 15);
    doc.text(`Bulan: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 22);

    const tableColumn = ["No.", "Nama Siswa", "Total Infaq"];
    const tableRows = students.map((student, index) => [
      index + 1,
      student.name,
      formatCurrency(infaqSummary[student.id] || 0)
    ]);
    
    const tableFooter: CellInput[][] = [
        [{ 
            content: 'Total Infaq Kelas', 
            colSpan: 2, 
            styles: { halign: 'right', fontStyle: 'bold' } 
        },
        { 
            content: formatCurrency(grandTotal), 
            styles: { halign: 'right', fontStyle: 'bold' } 
        }]
    ];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      foot: tableFooter,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [232, 232, 232], textColor: '#000' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right' },
      }
    });

    doc.save(`Laporan_Infaq_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Monitoring Infaq {className ? `Kelas ${className}` : ""}</h1>
            <p className="text-sm text-gray-500 mt-1">Laporan Infaq Bulan: <strong>{monthNames[selectedMonth]} {selectedYear}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm transition-colors">
                <Home size={18} /><span>Home</span>
            </Link>
          </div>
        </div>

        {/* Controls & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-2 items-center w-full md:w-auto">
            
            {/* DROPDOWN KELAS (BARU) */}
            <select 
                value={classId} 
                onChange={(e) => handleClassChange(e.target.value)} 
                className="w-full sm:w-auto p-2 border rounded-md bg-white text-sm font-medium min-w-[150px]"
            >
                <option value="" disabled>Pilih Kelas</option>
                {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
            </select>

            <div className="flex gap-2 w-full sm:w-auto">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
                {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>

            <button 
                onClick={fetchData} 
                disabled={!classId}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={!classId || students.length === 0}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            <FileText size={16} /><span>PDF</span>
          </button>
        </div>

        {/* Table Content */}
        {!classId ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed rounded-lg">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-2"/>
                <p className="text-gray-500 font-medium">Silakan pilih kelas terlebih dahulu untuk melihat data.</p>
            </div>
        ) : loading ? (
            <p className="text-center text-gray-500 py-8">Memuat data laporan...</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 font-semibold text-left sticky left-0 bg-gray-100 z-10 border-r min-w-[120px] sm:min-w-[200px]">Nama Siswa</th>
                  {dateHeaders.map(day => (
                    <th key={day} className="p-3 font-semibold text-center border-l min-w-[50px]">{String(day).padStart(2, '0')}</th>
                  ))}
                  <th className="p-3 font-semibold text-right sticky right-0 bg-gray-100 z-10 border-l min-w-[100px] sm:min-w-[150px]">Total Infaq</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                    students.map((student) => (
                    <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="p-2 font-medium text-gray-800 sticky left-0 bg-white z-10 whitespace-nowrap border-r">{student.name}</td>
                        {dateHeaders.map(day => (
                        <td key={day} className="p-2 text-center border-l font-mono text-xs">
                            {infaqByDay[student.id]?.[day] ? (infaqByDay[student.id][day] / 1000) + 'k' : '-'}
                        </td>
                        ))}
                        <td className="p-2 text-right sticky right-0 bg-white z-10 border-l font-mono font-semibold text-gray-700">
                        {formatCurrency(infaqSummary[student.id] || 0)}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={dateHeaders.length + 2} className="text-center p-8 text-gray-500">
                            <p className="font-semibold">Tidak Ada Data</p>
                            <p className="text-xs">Belum ada data infaq pada periode ini.</p>
                        </td>
                    </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold text-gray-800">
                  <td colSpan={dateHeaders.length + 1} className="p-3 text-right sticky left-0 bg-gray-200 z-10 border-r">
                    Total Infaq Kelas
                  </td>
                  <td className="p-3 text-right sticky right-0 bg-gray-200 z-10 border-l font-mono">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}