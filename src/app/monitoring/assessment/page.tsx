"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipe Data
type Student = { id: string; name: string };
type Aspect = { id: string; name: string; scale_type: 'numerik' | 'kualitatif' };
type Scores = { [studentId: string]: { [aspectId: string]: string | number } };

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function AssessmentMonitoringPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [scores, setScores] = useState<Scores>({});
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const fetchData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/monitoring/assessment?class_id=${classId}&month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      
      const { students, aspects, scores } = await res.json();
      setStudents(students || []);
      setAspects(aspects || []);
      setScores(scores || {});

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
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.text(`Laporan Penilaian Bulanan Kelas ${className}`, 14, 15);
    doc.text(`Bulan: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 22);

    const tableColumn = ["Nama Siswa", ...aspects.map(a => a.name)];
    const tableRows = students.map(student => [
      student.name,
      ...aspects.map(aspect => scores[student.id]?.[aspect.id] || "-")
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Laporan_Penilaian_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Monitoring Penilaian {className ? `Kelas ${className}` : ""}</h1>
            <p className="text-sm text-gray-500 mt-1">Laporan Penilaian Bulan: <strong>{monthNames[selectedMonth]} {selectedYear}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard-monitoring" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                <ArrowLeft size={18} /><span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <Home size={18} /><span>Home</span>
            </Link>
          </div>
        </div>

        {/* Kontrol */}
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

        {/* Tabel Penilaian */}
        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data laporan...</p>) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left font-semibold sticky left-0 bg-gray-100 z-10 border-r">Nama Siswa</th>
                  {aspects.map(aspect => <th key={aspect.id} className="p-3 font-semibold text-center border-l">{aspect.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.length > 0 && aspects.length > 0 ? (
                  students.map(student => (
                    <tr key={student.id} className="border-b last:border-b-0">
                      <td className="p-2 font-medium text-gray-800 sticky left-0 bg-white z-10 whitespace-nowrap border-r">{student.name}</td>
                      {aspects.map(aspect => (
                        <td key={aspect.id} className="p-2 text-center border-l">
                          {scores[student.id]?.[aspect.id] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={aspects.length + 1} className="text-center p-8 text-gray-500">
                      <h3 className="text-lg font-semibold">Tidak Ada Data</h3>
                      <p>Belum ada data penilaian pada periode ini.</p>
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