"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  X,
  Loader2,
  Edit,
  Trash2,
  Check,
  RotateCcw,
  ArrowLeft,
  Home,
} from "lucide-react";

// Tipe data
type Student = { id: string; name: string };
type ScaleType = "numerik" | "kualitatif";
type AssessmentAspect = { id: string; name: string; scale_type: ScaleType };
type Scores = { [studentId: string]: { [aspectId: string]: string | number } };

const QUALITATIVE_SCALES = ["Sangat Baik", "Baik", "Cukup", "Kurang"];
const getTodayString = () =>
  new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

export default function AssessmentContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  // State Management
  const [students, setStudents] = useState<Student[]>([]);
  const [aspects, setAspects] = useState<AssessmentAspect[]>([]);
  const [scores, setScores] = useState<Scores>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAspectName, setNewAspectName] = useState("");
  const [newAspectScale, setNewAspectScale] = useState<ScaleType>("kualitatif");
  const [isSubmittingAspect, setIsSubmittingAspect] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("...");
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [editMode, setEditMode] = useState(true);

  // --- (Semua fungsi handler seperti fetchAssessmentData, handleCreateAspect, dll. biarkan sama persis) ---
  const fetchAssessmentData = useCallback(async (date: string) => {
      if (!classId) return;
      setLoading(true);
      try {
        const [studentsRes, aspectsRes, classDetailsRes, scoresRes] = await Promise.all([
          fetch(`/api/students?class_id=${classId}`),
          fetch(`/api/assessment/aspects?class_id=${classId}&date=${date}`),
          fetch(`/api/classes/${classId}/details`),
          fetch(`/api/assessment/scores?class_id=${classId}&date=${date}`),
        ]);
        if (!studentsRes.ok || !aspectsRes.ok || !classDetailsRes.ok || !scoresRes.ok) {
          throw new Error("Gagal memuat data awal.");
        }
        const studentsData = await studentsRes.json();
        const aspectsData = await aspectsRes.json();
        const classData = await classDetailsRes.json();
        const scoresData = await scoresRes.json();
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setAspects(Array.isArray(aspectsData) ? aspectsData : []);
        setClassName(classData.name || "...");
        setScores(scoresData || {});
        setEditMode(true);
      } catch (error) {
        console.error("Error:", error);
        alert("Gagal memuat data penilaian.");
      } finally {
        setLoading(false);
      }
    },
    [classId]
  );
  useEffect(() => { if (classId) { fetchAssessmentData(selectedDate); } }, [selectedDate, classId, fetchAssessmentData]);
  const handleCreateAspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAspectName.trim()) { alert("Nama aspek tidak boleh kosong."); return; }
    setIsSubmittingAspect(true);
    try {
      const res = await fetch("/api/assessment/aspects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newAspectName, scale_type: newAspectScale, class_id: classId, date: selectedDate, }), });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat aspek baru.");
      await fetchAssessmentData(selectedDate);
      setNewAspectName("");
      setIsModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmittingAspect(false);
    }
  };
  const handleScoreChange = ( studentId: string, aspectId: string, value: string | number ) => { setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [aspectId]: value }, })); };
  const handleSaveAllScores = async () => {
    setIsSavingScores(true);
    try {
      const res = await fetch("/api/assessment/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, date: selectedDate, scores }), });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data nilai.");
      alert(data.message || "Nilai berhasil disimpan!");
      setEditMode(false);
    } catch (error) {
      alert( error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan." );
    } finally {
      setIsSavingScores(false);
    }
  };
  const handleDeleteAspect = async (aspectId: string) => {
    if (!confirm("Yakin ingin menghapus aspek penilaian ini? Semua nilai yang sudah diisi pada aspek ini akan ikut terhapus.")) return;
    try {
      const res = await fetch(`/api/assessment/aspects/${aspectId}`, { method: "DELETE", });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Gagal menghapus aspek."); }
      alert("Aspek berhasil dihapus.");
      await fetchAssessmentData(selectedDate);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    }
  };
  const handleResetScores = () => { if (confirm("Apakah Anda yakin ingin mereset semua nilai yang telah diisi di form ini? Perubahan ini hanya akan diterapkan setelah Anda menekan tombol Simpan.")) { setScores({}); } };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Form Penilaian Siswa Kelas {className}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/dashboard-assessment" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </Link>
                <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                    <Home size={18} />
                    <span>Home</span>
                </Link>
            </div>
        </div>
        
        {/* Kontrol */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Penilaian</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="p-2 border rounded-md bg-white w-full sm:w-auto"
              />
            </div>
            {editMode && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-sm w-full sm:w-auto"
              >
                <Plus size={18} />
                Tambah Aspek Penilaian
              </button>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24}/>
                </button>
              <h2 className="text-2xl font-bold mb-6">Tambah Aspek Penilaian Baru</h2>
              <form onSubmit={handleCreateAspect} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aspek</label>
                  <input type="text" value={newAspectName} onChange={(e) => setNewAspectName(e.target.value)} className="border p-3 w-full rounded-lg" placeholder="Contoh: Hafalan, Tajwid" required disabled={isSubmittingAspect}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skala Penilaian</label>
                  <select value={newAspectScale} onChange={(e) => setNewAspectScale(e.target.value as ScaleType)} className="border p-3 w-full rounded-lg bg-white" disabled={isSubmittingAspect}>
                    <option value="kualitatif">Kualitatif (Sangat Baik - Kurang)</option>
                    <option value="numerik">Numerik (1 - 100)</option>
                  </select>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400" disabled={isSubmittingAspect}>
                    {isSubmittingAspect && <Loader2 size={18} className="animate-spin"/>}
                    {isSubmittingAspect ? 'Membuat...' : 'Buat Aspek'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabel Penilaian */}
        {loading ? <p className="text-center py-12">Memuat data...</p> : (
            <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                    <th className="p-4 font-semibold sticky left-0 bg-gray-100 z-10 w-48">Nama Siswa</th>
                    {aspects.map(aspect => (
                    <th key={aspect.id} className="p-4 font-semibold min-w-[150px]">
                      <div className="flex items-center justify-between gap-2">
                        <span>{aspect.name}</span>
                        {editMode && (
                          <button onClick={() => handleDeleteAspect(aspect.id)} className="text-red-400 hover:text-red-600" title="Hapus Aspek">
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {students.map(student => (
                    <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800 sticky left-0 bg-white z-10">{student.name}</td>
                    {aspects.map(aspect => (
                        <td key={aspect.id} className="p-2">
                        {aspect.scale_type === 'kualitatif' ? (
                            <select className="w-full p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed" value={scores[student.id]?.[aspect.id] as string || ''} onChange={(e) => handleScoreChange(student.id, aspect.id, e.target.value)} disabled={!editMode}>
                            <option value="" disabled>-- Pilih --</option>
                            {QUALITATIVE_SCALES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input type="number" min="0" max="100" className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed" value={scores[student.id]?.[aspect.id] as number || ''} onChange={(e) => handleScoreChange(student.id, aspect.id, e.target.valueAsNumber)} disabled={!editMode}/>
                        )}
                        </td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        
        {/* Tombol Aksi Bawah */}
        {aspects.length > 0 && !loading && (
          <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-4">
            {/* PERUBAHAN: Tombol "Tambah Aspek" di bagian bawah ini dihapus */}
            {/* <div> {editMode && ( <button>...</button> )} </div> */}
            
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 w-full sm:w-auto">
              {editMode ? (
                <>
                  <button onClick={handleResetScores} className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 flex items-center gap-2 w-full sm:w-auto justify-center">
                    <RotateCcw size={18} />
                    Reset Nilai
                  </button>
                  <button onClick={handleSaveAllScores} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg flex items-center gap-2 disabled:bg-green-400 w-full sm:w-auto justify-center" disabled={isSavingScores}>
                    {isSavingScores ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    {isSavingScores ? 'Menyimpan...' : 'Simpan & Kunci'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} className="px-8 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Edit size={20} />
                  Edit Penilaian
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}