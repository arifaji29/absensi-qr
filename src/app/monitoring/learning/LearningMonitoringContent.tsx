"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, BookCopy, AlertTriangle, RefreshCw, BookOpen } from "lucide-react";

// Tipe data untuk jurnal yang akan ditampilkan
type JournalLog = {
  id: string;
  materi: string;
  deskripsi: string;
  catatan: string | null;
  date: string;
  class_name: string;
  teacher_name: string;
};

// Tipe untuk daftar kelas
type ClassItem = {
  id: string;
  name: string;
};

// Daftar nama bulan untuk dropdown
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Fungsi helper format tanggal YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Fungsi helper tampilan tanggal Indonesia
const formatDateDisplay = (dateString: string) =>
  new Date(dateString).toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  });

export default function LearningMonitoringContent() {
  const searchParams = useSearchParams();
  
  // State Class ID (diinisialisasi dari URL jika ada)
  const [classId, setClassId] = useState(searchParams.get("class_id") || "");
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  const [journals, setJournals] = useState<JournalLog[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false); // Default false agar tidak loading terus saat awal jika tidak ada classId

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // 1. Fetch Daftar Semua Kelas (Untuk Dropdown)
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

  // 2. Fetch Data Jurnal
  const fetchData = useCallback(
    async (class_id: string, startDate: string, endDate: string) => {
      if (!class_id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/monitoring/learning?class_id=${class_id}&start_date=${startDate}&end_date=${endDate}`
        );
        if (!res.ok) throw new Error("Gagal memuat data jurnal");

        const data = await res.json();
        // Sort data: terbaru di atas
        data.sort(
          (a: JournalLog, b: JournalLog) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setJournals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch jurnal gagal:", err);
        // alert("Terjadi kesalahan saat memuat data."); // Optional: disable alert agar tidak mengganggu
        setJournals([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );
  
  // Handler Refresh Data
  const handleRefresh = useCallback(() => {
    if (classId) {
      const startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1));
      const endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
      fetchData(classId, startDate, endDate);
    }
  }, [classId, selectedMonth, selectedYear, fetchData]);

  // 3. Update Nama Kelas saat classId berubah
  useEffect(() => {
    if (!classId) {
        setClassName("");
        return;
    }
    const fetchClassName = async () => {
      try {
        const res = await fetch(`/api/classes/${classId}/details`);
        if(res.ok) {
            const data = await res.json();
            setClassName(data.name || "");
        }
      } catch (error) {
        console.error("Gagal mengambil nama kelas", error);
      }
    };
    fetchClassName();
  }, [classId]);

  // 4. Trigger fetch data saat filter berubah
  useEffect(() => {
    handleRefresh(); 
  }, [handleRefresh]);

  // Handler Ganti Kelas
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    setJournals([]); // Reset jurnal saat ganti kelas
    
    // Update URL browser tanpa reload
    const url = new URL(window.location.href);
    url.searchParams.set('class_id', newClassId);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Monitoring Jurnal {className ? `Kelas ${className}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Laporan jurnal harian yang diinput oleh pengajar.
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

        {/* SECTION FILTER (Selalu Muncul) */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Data Laporan
            </label>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                {/* Dropdown Kelas */}
                <select 
                    value={classId} 
                    onChange={(e) => handleClassChange(e.target.value)} 
                    className="w-full sm:w-auto p-2 border rounded-md bg-white text-sm min-w-[150px]"
                >
                    <option value="" disabled>Pilih Kelas</option>
                    {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>

                {/* Dropdown Bulan & Tahun */}
                <div className="flex gap-2 w-full sm:w-auto">
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                        className="w-full sm:w-auto p-2 border rounded-md bg-white text-sm"
                    >
                        {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))} 
                        className="w-full sm:w-auto p-2 border rounded-md bg-white text-sm"
                    >
                        {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>

                {/* Tombol Refresh */}
                <button
                    onClick={handleRefresh}
                    disabled={loading || !classId}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors w-full sm:w-auto flex justify-center"
                    aria-label="Refresh data"
                >
                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                </button>
            </div>
        </div>

        {/* SECTION KONTEN */}
        {!classId ? (
          <div className="text-center py-12 px-6 bg-blue-50 border border-blue-100 rounded-lg border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-blue-300 mb-2" />
            <h3 className="text-lg font-semibold text-blue-800">
              Pilih Kelas Terlebih Dahulu
            </h3>
            <p className="mt-1 text-sm text-blue-600">
              Silakan pilih kelas dari dropdown di atas untuk melihat jurnal pembelajaran.
            </p>
          </div>
        ) : loading ? (
            <div className="text-center py-12">
                <RefreshCw className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-gray-500">Memuat data jurnal...</p>
            </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Laporan Bulan {monthNames[selectedMonth]} {selectedYear}
            </h2>
            {journals.length > 0 ? (
              <div className="space-y-6">
                {journals.map((journal) => (
                  <div
                    key={journal.id}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="bg-gray-50 p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {formatDateDisplay(journal.date)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Diisi oleh: <span className="font-medium text-gray-700">{journal.teacher_name}</span>
                        </p>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b last:border-b-0">
                          <td className="p-3 bg-gray-50/50 font-semibold text-gray-600 w-1/4 md:w-1/6 align-top">Materi</td>
                          <td className="p-3 text-gray-800">{journal.materi}</td>
                        </tr>
                        <tr className="border-b last:border-b-0">
                          <td className="p-3 bg-gray-50/50 font-semibold text-gray-600 align-top">Deskripsi</td>
                          <td className="p-3 text-gray-800 whitespace-pre-wrap">{journal.deskripsi}</td>
                        </tr>
                        <tr className="last:border-b-0">
                          <td className="p-3 bg-gray-50/50 font-semibold text-gray-600 align-top">Catatan</td>
                          <td className="p-3 text-gray-500 italic">{journal.catatan || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed">
                <BookCopy className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-lg font-semibold text-gray-600">Belum Ada Jurnal</h3>
                <p className="text-gray-500 mt-1">Tidak ada data jurnal pada periode ini.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}