"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Save, Edit, Calendar, AlertTriangle } from "lucide-react";

// Tipe data
type Teacher = {
  id: string;
  name: string;
};

type JournalEntry = {
  id?: string;
  materi: string;
  deskripsi: string;
  catatan: string;
  teacher_id: string;
};

// Fungsi helper untuk format tanggal
const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta'});

export default function JournalPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [className, setClassName] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [journalEntry, setJournalEntry] = useState<JournalEntry>({
    materi: "",
    deskripsi: "",
    catatan: "",
    teacher_id: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fungsi untuk mengambil data jurnal dan detail kelas
  const fetchDataForDate = useCallback(async (date: string) => {
    if (!classId) return;
    setLoading(true);
    setIsEditing(false);

    try {
      const [classRes, teachersRes, journalRes] = await Promise.all([
        fetch(`/api/classes/${classId}/details`),
        fetch(`/api/classes/${classId}/teachers`),
        fetch(`/api/journal?class_id=${classId}&date=${date}`),
      ]);

      if (!classRes.ok || !teachersRes.ok) throw new Error("Gagal memuat detail kelas atau pengajar");
      
      const classData = await classRes.json();
      const teachersData = await teachersRes.json();
      setClassName(classData.name || "");
      setTeachers(Array.isArray(teachersData) ? teachersData : []);

      if (journalRes.ok) {
        const journalData = await journalRes.json();
        if (journalData) {
          setJournalEntry({
            id: journalData.id,
            materi: journalData.materi || "",
            deskripsi: journalData.deskripsi || "",
            catatan: journalData.catatan || "",
            teacher_id: journalData.teacher_id || "",
          });
          setIsEditing(false);
        } else {
          setJournalEntry({ materi: "", deskripsi: "", catatan: "", teacher_id: teachersData[0]?.id || "" });
          setIsEditing(true);
        }
      } else {
        setJournalEntry({ materi: "", deskripsi: "", catatan: "", teacher_id: teachersData[0]?.id || "" });
        setIsEditing(true);
      }

    } catch (error) {
      console.error("Gagal memuat data:", error);
      alert("Terjadi kesalahan saat memuat data jurnal.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchDataForDate(selectedDate);
    } else {
      setLoading(false);
    }
  }, [selectedDate, classId, fetchDataForDate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJournalEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!journalEntry.teacher_id || !journalEntry.materi) {
      alert("Pengajar dan Materi Wajib diisi.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...journalEntry,
          class_id: classId,
          date: selectedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan jurnal");
      }
      
      alert("Jurnal berhasil disimpan!");
      await fetchDataForDate(selectedDate);
      
    } catch (error) {
      console.error("Error saving journal:", error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Jurnal Pembelajaran {className ? `Kelas ${className}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? "Memuat..." : (classId ? formatDate(selectedDate) : "Error")}
            </p>
          </div>
          {/* === PERUBAHAN UTAMA: Tombol Home Ditambahkan === */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard-journal" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={16} /> <span>Kembali</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                <Home size={16} />
                <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Form Jurnal */}
        {loading ? (
          <p className="text-center text-gray-500 py-8">Memuat data jurnal...</p>
        ) : !classId ? (
          <div className="text-center py-10 px-6 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-lg font-semibold text-red-800">ID Kelas Tidak Ditemukan</h3>
              <p className="mt-1 text-sm text-red-700">
                URL tidak valid. Harap akses halaman ini dari menu Jurnal di halaman utama.
              </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Kontrol Tanggal dan Pengajar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label htmlFor="journal-date" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
                <div className="relative">
                    <input type="date" id="journal-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={getTodayString()} className="p-2 border rounded-md bg-white w-full pr-10" />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>
              <div>
                <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-1">Pengajar Bertugas</label>
                <select name="teacher_id" id="teacher_id" value={journalEntry.teacher_id} onChange={handleInputChange} disabled={!isEditing} className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200/50 disabled:cursor-not-allowed">
                  <option value="">-- Pilih Pengajar --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="materi" className="block text-sm font-medium text-gray-700 mb-1">Materi yang Diajarkan</label>
                <input type="text" id="materi" name="materi" value={journalEntry.materi} onChange={handleInputChange} disabled={!isEditing} className="w-full border p-2 rounded disabled:bg-gray-200/50" placeholder="Contoh: Iqro 1 Hal. 1-3, Hafalan Surat An-Nas" />
              </div>
              <div>
                <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pembelajaran</label>
                <textarea id="deskripsi" name="deskripsi" rows={5} value={journalEntry.deskripsi} onChange={handleInputChange} disabled={!isEditing} className="w-full border p-2 rounded disabled:bg-gray-200/50" placeholder="Jelaskan secara singkat kegiatan pembelajaran hari ini..."></textarea>
              </div>
              <div>
                <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                <input type="text" id="catatan" name="catatan" value={journalEntry.catatan} onChange={handleInputChange} disabled={!isEditing} className="w-full border p-2 rounded disabled:bg-gray-200/50" placeholder="Catatan tambahan untuk siswa atau kelas..." />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-4 pt-4 border-t">
                {isEditing ? (
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400">
                        <Save size={16} />
                        <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 font-semibold">
                        <Edit size={16} />
                        <span>Edit Jurnal</span>
                    </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

