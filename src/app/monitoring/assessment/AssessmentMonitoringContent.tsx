"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipe Data
type Student = { id: string; name: string };
type Aspect = { id: string; name: string; scale_type: "numerik" | "kualitatif" };
type Scores = { [studentId: string]: { [aspectId: string]: string | number } };

// Tipe untuk daftar kelas (Dropdown)
type ClassItem = {
  id: string;
  name: string;
};

const monthNames = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

export default function AssessmentMonitoringContent() {
  const searchParams = useSearchParams();
  
  // 1. State untuk Class ID (inisialisasi dari URL jika ada)
  const [classId, setClassId] = useState(searchParams.get("class_id") || "");
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [scores, setScores] = useState<Scores>({});
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("");

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

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

  // 3. Fetch Data Penilaian
  const fetchData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/monitoring/assessment?class_id=${classId}&month=${selectedMonth}&year=${selectedYear}`
      );
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

  // Trigger fetch saat filter berubah
  useEffect(() => {
    if (classId) {
        fetchData();
    }
  }, [fetchData, classId]);

  // Fetch Detail Kelas (Nama Kelas untuk Header)
  useEffect(() => {
    if (classId) {
      fetch(`/api/classes/${classId}/details`)
        .then((res) => res.json())
        .then((data) => setClassName(data.name || ""));
    } else {
        setClassName("");
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
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.text(`Laporan Penilaian Bulanan Kelas ${className}`, 14, 15);
    doc.text(`Bulan: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 22);

    const tableColumn = ["Nama Siswa", ...aspects.map((a) => a.name)];
    const tableRows = students.map((student) => [
      student.name,
      ...aspects.map((aspect) => scores[student.id]?.[aspect.id] || "-"),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(
      `Laporan_Penilaian_${className}_${monthNames[selectedMonth]}_${selectedYear}.pdf`
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Monitoring Penilaian {className ? `Kelas ${className}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Laporan Penilaian Bulan:{" "}
              <strong>
                {monthNames[selectedMonth]} {selectedYear}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Kontrol Filter */}
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
                <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-white text-sm"
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
                className="w-full p-2 border rounded-md bg-white text-sm"
                >
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(
                    (year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                    )
                )}
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
            <FileText size={16} />
            <span>PDF</span>
          </button>
        </div>

        {/* Tabel Penilaian */}
        {!classId ? (
             <div className="text-center py-12 border rounded-lg border-dashed bg-gray-50">
                 <p className="text-gray-500 font-medium">Silakan pilih kelas terlebih dahulu untuk melihat data.</p>
             </div>
        ) : loading ? (
          <p className="text-center text-gray-500 py-8">
            Memuat data laporan...
          </p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left font-semibold sticky left-0 bg-gray-100 z-10 border-r min-w-[200px]">
                    Nama Siswa
                  </th>
                  {aspects.map((aspect) => (
                    <th
                      key={aspect.id}
                      className="p-3 font-semibold text-center border-l min-w-[100px]"
                    >
                      {aspect.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length > 0 && aspects.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="p-2 font-medium text-gray-800 sticky left-0 bg-white z-10 whitespace-nowrap border-r">
                        {student.name}
                      </td>
                      {aspects.map((aspect) => (
                        <td
                          key={aspect.id}
                          className="p-2 text-center border-l"
                        >
                          {scores[student.id]?.[aspect.id] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={aspects.length + 1}
                      className="text-center p-8 text-gray-500"
                    >
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