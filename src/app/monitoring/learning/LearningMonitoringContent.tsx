"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Calendar, BookCopy, AlertTriangle } from "lucide-react";

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

// Fungsi helper
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateString: string) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  });

export default function LearningMonitoringContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [journals, setJournals] = useState<JournalLog[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    formatDateToYYYYMMDD(new Date())
  );
  const [viewTitle, setViewTitle] = useState("Laporan 7 Hari Terakhir");

  // Fungsi untuk mengambil data jurnal dari API
  const fetchData = useCallback(
    async (class_id: string, startDate: string, endDate: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/monitoring/learning?class_id=${class_id}&start_date=${startDate}&end_date=${endDate}`
        );
        if (!res.ok) throw new Error("Gagal memuat data jurnal");

        const data = await res.json();
        data.sort(
          (a: JournalLog, b: JournalLog) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setJournals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch jurnal gagal:", err);
        alert("Terjadi kesalahan saat memuat data.");
        setJournals([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Ambil nama kelas
  useEffect(() => {
    if (!classId) return;
    const fetchClassName = async () => {
      try {
        const res = await fetch(`/api/classes/${classId}/details`);
        const data = await res.json();
        setClassName(data.name || "");
      } catch (error) {
        console.error("Gagal mengambil nama kelas", error);
      }
    };
    fetchClassName();
  }, [classId]);

  // Ambil data 7 hari terakhir saat pertama kali dimuat
  useEffect(() => {
    if (classId) {
      const today = new Date();
      const endDate = formatDateToYYYYMMDD(today);
      const startDate = formatDateToYYYYMMDD(
        new Date(today.setDate(today.getDate() - 6))
      );
      setViewTitle("Laporan 7 Hari Terakhir");
      fetchData(classId, startDate, endDate);
    } else {
      setLoading(false);
    }
  }, [classId, fetchData]);

  // Fungsi untuk memilih tanggal
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setViewTitle(`Laporan untuk tanggal: ${formatDateDisplay(date)}`);
    fetchData(classId, date, date);
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
              href="/dashboard-monitoring"
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Konten */}
        {!classId ? (
          <div className="text-center py-10 px-6 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-semibold text-red-800">
              ID Kelas Tidak Ditemukan
            </h3>
            <p className="mt-1 text-sm text-red-700">
              URL tidak valid. Harap akses halaman ini dari menu Monitoring.
            </p>
          </div>
        ) : loading ? (
          <p className="text-center text-gray-500 py-12">Memuat data jurnal...</p>
        ) : (
          <div>
            <div className="mb-6">
              <label
                htmlFor="journal-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pilih Tanggal Laporan
              </label>
              <div className="relative max-w-xs">
                <input
                  type="date"
                  id="journal-date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={formatDateToYYYYMMDD(new Date())}
                  className="p-2 border rounded-md bg-white w-full pr-10"
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {viewTitle}
            </h2>

            {journals.length > 0 ? (
              <div className="space-y-6">
                {journals.map((journal) => (
                  <div
                    key={journal.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-50 p-4 border-b">
                      <h3 className="font-bold text-lg text-gray-800">
                        {formatDateDisplay(journal.date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Diisi oleh: {journal.teacher_name}
                      </p>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3 bg-gray-50 font-semibold text-gray-600 w-1/4 md:w-1/6">
                            Materi
                          </td>
                          <td className="p-3 text-gray-800">{journal.materi}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 bg-gray-50 font-semibold text-gray-600">
                            Deskripsi
                          </td>
                          <td className="p-3 text-gray-800 whitespace-pre-wrap">
                            {journal.deskripsi}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 bg-gray-50 font-semibold text-gray-600">
                            Catatan
                          </td>
                          <td className="p-3 text-gray-500 italic">
                            {journal.catatan || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                <BookCopy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-gray-700">
                  Belum Ada Jurnal
                </h3>
                <p className="text-gray-500 mt-1">
                  Tidak ada data jurnal pembelajaran yang diinput pada periode
                  ini.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
