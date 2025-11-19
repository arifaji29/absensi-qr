"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Check, Loader2, Filter, Calendar, Wallet } from "lucide-react";

type Student = { id: string; name: string };
type InfaqData = { [studentId: string]: { amount: number; description?: string } };
type ClassItem = { id: string; name: string };

const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function InfaqContent() {
  const searchParams = useSearchParams();
  
  // 1. State Class ID & Daftar Kelas
  const [classId, setClassId] = useState(searchParams.get("class_id") || "");
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [infaqData, setInfaqData] = useState<InfaqData>({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [className, setClassName] = useState("...");
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // 2. Fetch Daftar Kelas (Untuk Dropdown)
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

  // 3. Fetch Data Infaq & Siswa
  const fetchData = useCallback(async (date: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      // Ambil siswa, data infaq, detail kelas, dan status validasi
      const [studentsRes, infaqRes, classDetailsRes, validationRes] = await Promise.all([
        fetch(`/api/students?class_id=${classId}`),
        fetch(`/api/infaq?class_id=${classId}&date=${date}`),
        fetch(`/api/classes/${classId}/details`),
        fetch(`/api/infaq/validate?class_id=${classId}&date=${date}`)
      ]);

      if (!studentsRes.ok || !infaqRes.ok || !classDetailsRes.ok || !validationRes.ok) throw new Error("Gagal memuat data");

      const studentsData = await studentsRes.json();
      const infaqData = await infaqRes.json();
      const classData = await classDetailsRes.json();
      const validationData = await validationRes.json();

      setStudents(studentsData || []);
      setInfaqData(infaqData || {});
      setClassName(classData.name || "...");
      
      // Atur mode edit berdasarkan status validasi dari database
      setEditMode(!validationData.isValidated);

    } catch (error) {
      console.error(error);
      // alert("Gagal memuat data infaq."); 
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // Trigger fetch saat filter berubah
  useEffect(() => {
    if (classId) {
        fetchData(selectedDate);
    } else {
        setLoading(false);
        setClassName("...");
    }
  }, [selectedDate, classId, fetchData]);

  // Handler Ganti Kelas
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    // Update URL browser tanpa reload
    const url = new URL(window.location.href);
    url.searchParams.set('class_id', newClassId);
    window.history.pushState({}, '', url);
  };

  const handleAmountChange = (studentId: string, amount: number) => {
    setInfaqData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], amount: amount || 0 },
    }));
  };

  const handleSaveInfaq = async () => {
    setIsSaving(true);
    try {
      const [saveScoresRes, validateRes] = await Promise.all([
        fetch('/api/infaq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId, date: selectedDate, infaqData }),
        }),
        fetch('/api/infaq/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId, date: selectedDate }),
        })
      ]);
      
      if (!saveScoresRes.ok || !validateRes.ok) {
        throw new Error("Gagal menyimpan atau mengunci data.");
      }

      alert("Data infaq berhasil disimpan dan dikunci!");
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Form Infaq {className !== "..." ? `Kelas ${className}` : ""}</h1>
          </div>
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
        
        {/* Filter Section (Kelas & Tanggal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            {/* Filter Kelas */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
                <div className="relative">
                    <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                        value={classId} 
                        onChange={(e) => handleClassChange(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 border rounded-md bg-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="" disabled>-- Pilih Kelas --</option>
                        {availableClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filter Tanggal */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Infaq</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="w-full pl-2 pr-10 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={!classId}
                    />
                    <Calendar size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* Konten Utama */}
        {!classId ? (
             <div className="text-center py-12 bg-white border border-dashed rounded-lg">
                <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-semibold text-gray-600">Silakan Pilih Kelas</h3>
                <p className="text-gray-500">Pilih kelas di atas untuk mulai mencatat infaq.</p>
             </div>
        ) : loading ? (
            <p className="text-center py-12 text-gray-500">Memuat data...</p>
        ) : (
          <>
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
                    {students.length > 0 ? (
                        students.map((student, index) => (
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
                                className="w-full p-2 border rounded-md text-right disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="text-center p-8 text-gray-500">Belum ada siswa di kelas ini.</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>

            {/* Tombol Aksi */}
            {students.length > 0 && (
                <div className="mt-6 flex justify-end">
                {editMode ? (
                    <button onClick={handleSaveInfaq} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg flex items-center gap-2 justify-center disabled:bg-green-400" disabled={isSaving}>
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    {isSaving ? 'Menyimpan...' : 'Simpan & Kunci'}
                    </button>
                ) : (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">Data Terkunci</span>
                        <button onClick={() => setEditMode(true)} className="px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow flex items-center gap-2 justify-center">
                        Edit Infaq
                        </button>
                    </div>
                )}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}