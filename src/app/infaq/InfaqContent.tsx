"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Edit, Check, Loader2 } from "lucide-react";

type Student = { id: string; name: string };
type InfaqData = { [studentId: string]: { amount: number; description?: string } };

const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function InfaqContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  const [students, setStudents] = useState<Student[]>([]);
  const [infaqData, setInfaqData] = useState<InfaqData>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [className, setClassName] = useState("...");
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const fetchData = useCallback(async (date: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const [studentsRes, infaqRes, classDetailsRes] = await Promise.all([
        fetch(`/api/students?class_id=${classId}`),
        fetch(`/api/infaq?class_id=${classId}&date=${date}`),
        fetch(`/api/classes/${classId}/details`),
      ]);
      if (!studentsRes.ok || !infaqRes.ok || !classDetailsRes.ok) throw new Error("Gagal memuat data");

      const studentsData = await studentsRes.json();
      const infaqData = await infaqRes.json();
      const classData = await classDetailsRes.json();

      setStudents(studentsData || []);
      setInfaqData(infaqData || {});
      setClassName(classData.name || "...");
      setEditMode(true);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data infaq.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) fetchData(selectedDate);
  }, [selectedDate, classId, fetchData]);

  const handleAmountChange = (studentId: string, amount: number) => {
    setInfaqData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], amount: amount || 0 },
    }));
  };

  const handleSaveInfaq = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/infaq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, date: selectedDate, infaqData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");
      alert(data.message || "Data infaq berhasil disimpan!");
      setEditMode(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Form Infaq Kelas {className}</h1>
          </div>
          {/* PERBAIKAN: className untuk tombol diisi lengkap */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard-infaq" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={18} />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={18} />
              <span>Home</span>
            </Link>
          </div>
        </div>
        
        {/* Kontrol Tanggal */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Infaq</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border rounded-md bg-white w-full sm:w-auto"/>
        </div>

        {/* Tabel Infaq */}
        {loading ? <p className="text-center py-12">Memuat data...</p> : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="p-4 font-semibold w-16">No.</th>
                  <th className="p-4 font-semibold">Nama Siswa</th>
                  <th className="p-4 font-semibold">Nominal Infaq (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-3 text-center">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{student.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={infaqData[student.id]?.amount || ''}
                        onChange={(e) => handleAmountChange(student.id, e.target.valueAsNumber)}
                        disabled={!editMode}
                        className="w-full p-2 border rounded-md text-right disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="mt-6 flex justify-end">
          {editMode ? (
            <button onClick={handleSaveInfaq} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg flex items-center gap-2 justify-center disabled:bg-green-400" disabled={isSaving}>
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {isSaving ? 'Menyimpan...' : 'Simpan & Kunci'}
            </button>
          ) : (
            <button onClick={() => setEditMode(true)} className="px-8 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow-lg flex items-center gap-2 justify-center">
              <Edit size={20} />
              Edit Infaq
            </button>
          )}
        </div>
      </div>
    </div>
  );
}