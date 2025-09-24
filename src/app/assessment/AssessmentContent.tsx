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
  const [newAspectScale, setNewAspectScale] =
    useState<ScaleType>("kualitatif");
  const [isSubmittingAspect, setIsSubmittingAspect] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("...");
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [editMode, setEditMode] = useState(true);

  const fetchAssessmentData = useCallback(
    async (date: string) => {
      if (!classId) return;
      setLoading(true);
      try {
        const [studentsRes, aspectsRes, classDetailsRes, scoresRes] =
          await Promise.all([
            fetch(`/api/students?class_id=${classId}`),
            fetch(`/api/assessment/aspects?class_id=${classId}&date=${date}`),
            fetch(`/api/classes/${classId}/details`),
            fetch(`/api/assessment/scores?class_id=${classId}&date=${date}`),
          ]);
        if (
          !studentsRes.ok ||
          !aspectsRes.ok ||
          !classDetailsRes.ok ||
          !scoresRes.ok
        ) {
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

  useEffect(() => {
    if (classId) {
      fetchAssessmentData(selectedDate);
    }
  }, [selectedDate, classId, fetchAssessmentData]);

  const handleCreateAspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAspectName.trim()) {
      alert("Nama aspek tidak boleh kosong.");
      return;
    }
    setIsSubmittingAspect(true);
    try {
      const res = await fetch("/api/assessment/aspects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAspectName,
          scale_type: newAspectScale,
          class_id: classId,
          date: selectedDate,
        }),
      });
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

  const handleScoreChange = (
    studentId: string,
    aspectId: string,
    value: string | number
  ) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [aspectId]: value },
    }));
  };

  const handleSaveAllScores = async () => {
    setIsSavingScores(true);
    try {
      const res = await fetch("/api/assessment/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, date: selectedDate, scores }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data nilai.");

      alert(data.message || "Nilai berhasil disimpan!");
      setEditMode(false);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan."
      );
    } finally {
      setIsSavingScores(false);
    }
  };

  const handleDeleteAspect = async (aspectId: string) => {
    if (
      !confirm(
        "Yakin ingin menghapus aspek penilaian ini? Semua nilai yang sudah diisi pada aspek ini akan ikut terhapus."
      )
    )
      return;
    try {
      const res = await fetch(`/api/assessment/aspects/${aspectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus aspek.");
      }
      alert("Aspek berhasil dihapus.");
      await fetchAssessmentData(selectedDate);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    }
  };

  const handleResetScores = () => {
    if (
      confirm(
        "Apakah Anda yakin ingin mereset semua nilai yang telah diisi di form ini? Perubahan ini hanya akan diterapkan setelah Anda menekan tombol Simpan."
      )
    ) {
      setScores({});
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Penilaian - {className}
        </h1>
        <Link
          href="/"
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <Home className="w-5 h-5 mr-2" />
          Beranda
        </Link>
      </div>

      {/* Pilih Tanggal */}
      <div className="mb-4">
        <label className="mr-2 font-medium text-gray-700">Tanggal:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded p-1"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2">Memuat data...</span>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border p-2">No</th>
                  <th className="border p-2">Nama Siswa</th>
                  {aspects.map((aspect) => (
                    <th key={aspect.id} className="border p-2">
                      <div className="flex items-center justify-between">
                        <span>{aspect.name}</span>
                        {editMode && (
                          <button
                            onClick={() => handleDeleteAspect(aspect.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">{student.name}</td>
                    {aspects.map((aspect) => (
                      <td key={aspect.id} className="border p-2 text-center">
                        {editMode ? (
                          aspect.scale_type === "numerik" ? (
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={
                                scores[student.id]?.[aspect.id]?.toString() || ""
                              }
                              onChange={(e) =>
                                handleScoreChange(
                                  student.id,
                                  aspect.id,
                                  e.target.value
                                )
                              }
                              className="border rounded p-1 w-20 text-center"
                            />
                          ) : (
                            <select
                              value={
                                scores[student.id]?.[aspect.id]?.toString() || ""
                              }
                              onChange={(e) =>
                                handleScoreChange(
                                  student.id,
                                  aspect.id,
                                  e.target.value
                                )
                              }
                              className="border rounded p-1"
                            >
                              <option value="">Pilih</option>
                              {QUALITATIVE_SCALES.map((scale) => (
                                <option key={scale} value={scale}>
                                  {scale}
                                </option>
                              ))}
                            </select>
                          )
                        ) : (
                          <span>
                            {scores[student.id]?.[aspect.id]?.toString() || "-"}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {editMode ? (
              <>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Tambah Aspek
                </button>
                <button
                  onClick={handleSaveAllScores}
                  disabled={isSavingScores}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSavingScores ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Simpan Nilai
                </button>
                <button
                  onClick={handleResetScores}
                  className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Nilai
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit Nilai
              </button>
            )}
          </div>

          {/* Modal Tambah Aspek */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Tambah Aspek Penilaian
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateAspect}>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Nama Aspek
                    </label>
                    <input
                      type="text"
                      value={newAspectName}
                      onChange={(e) => setNewAspectName(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Contoh: Disiplin"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Skala Penilaian
                    </label>
                    <select
                      value={newAspectScale}
                      onChange={(e) =>
                        setNewAspectScale(e.target.value as ScaleType)
                      }
                      className="w-full border rounded p-2"
                    >
                      <option value="kualitatif">Kualitatif</option>
                      <option value="numerik">Numerik (0-100)</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingAspect}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmittingAspect ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
