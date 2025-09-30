"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Student = { id: string; name: string };
type InfaqByDay = { [studentId: string]: { [day: number]: number } };
type InfaqSummary = { [studentId: string]: number };

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Fungsi untuk format mata uang
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
  const classId = searchParams.get("class_id") || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [infaqByDay, setInfaqByDay] = useState<InfaqByDay>({});
  const [infaqSummary, setInfaqSummary] = useState<InfaqSummary>({});
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (classId) {
      fetch(`/api/classes/${classId}/details`).then(res => res.json()).then(data => setClassName(data.name || ""));
    }
  }, [classId]);

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

    const tableFooter = [
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
      headStyles: { fillColor: [41, 128, 185] },
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
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Monitoring Infaq {className ? `Kelas ${className}` : ""}</h1>
            <p className="text-sm text-gray-500 mt-1">Laporan Infaq Bulan: <strong>{monthNames[selectedMonth]} {selectedYear}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard-monitoring" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors">
                <ArrowLeft size={18} /><span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm transition-colors">
                <Home size={18} /><span>Home</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 items-center w-full md:w-auto">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
              {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <button onClick={fetchData} className="col-span-2 sm:col-auto w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">
              <RefreshCw size={18} /><span>Refresh</span>
            </button>
          </div>
          <button onClick={handleDownloadPDF} className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">
            <FileText size={16} /><span>PDF</span>
          </button>
        </div>

        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data laporan...</p>) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 font-semibold text-left sticky left-0 bg-gray-100 z-10 border-r min-w-[200px]">Nama Siswa</th>
                  {dateHeaders.map(day => (
                    <th key={day} className="p-3 font-semibold text-center border-l min-w-[70px]">{String(day).padStart(2, '0')}</th>
                  ))}
                  <th className="p-3 font-semibold text-right sticky right-0 bg-gray-100 z-10 border-l min-w-[150px]">Total Infaq</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
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
                ))}
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