"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import Link from "next/link";
import { ArrowLeft, Home, QrCode, RotateCcw, Edit, Check, Loader2 } from "lucide-react";

// Tipe Data
type Attendance = { 
  student_id: string; 
  name: string; 
  status: string; 
  checked_in_at: string | null; 
};

// Fungsi helper
const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta'});

export default function AttendanceContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  // State Management
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [className, setClassName] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'qr' | 'manual'>('qr');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio("/success-sound.mp3");
    if (audioRef.current) audioRef.current.volume = 0.5;
  }, []);

  const fetchData = useCallback(async (date: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const [studentRes, validationRes, classRes] = await Promise.all([
        fetch(`/api/attendance?class_id=${classId}&date=${date}`),
        fetch(`/api/attendance/status?class_id=${classId}&date=${date}`),
        fetch(`/api/classes/${classId}/details`),
      ]);
      const studentData = await studentRes.json();
      const validationData = await validationRes.json();
      const classData = await classRes.json();

      setAttendance(Array.isArray(studentData) ? studentData : []);
      setClassName(classData.name || "");
      setEditMode(!validationData.isValidated);

    } catch (err) {
      console.error("Gagal memuat data:", err);
      alert("Gagal memuat data absensi.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if(classId) {
      fetchData(selectedDate);
    }
  }, [fetchData, selectedDate, classId]);

  const handleStatusChange = useCallback((student_id: string, new_status: string) => {
    setAttendance((prev) => 
      prev.map((s) => 
        s.student_id === student_id 
          ? { ...s, status: new_status, checked_in_at: new_status === 'Hadir' && !s.checked_in_at ? new Date().toISOString() : s.checked_in_at } 
          : s
      )
    );
    
    if (new_status === "Hadir" && audioRef.current) {
        audioRef.current.play().catch(console.error);
    }
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const saveAttendanceRes = await fetch('/api/attendance/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, date: selectedDate, attendanceData: attendance })
      });
      if (!saveAttendanceRes.ok) throw new Error("Gagal menyimpan data absensi.");

      const validateRes = await fetch('/api/attendance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, date: selectedDate })
      });
      if (!validateRes.ok) throw new Error("Gagal mengunci data absensi.");

      alert("Data absensi berhasil disimpan!");
      setEditMode(false);
      await fetchData(selectedDate);

    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = useCallback(async () => {
    if (!confirm(`Anda yakin ingin mereset seluruh absensi untuk kelas ${className} pada tanggal ${selectedDate}? Aksi ini akan menghapus semua data absensi dan membuka kembali form.`)) return;
    try {
      const res = await fetch(`/api/attendance/reset?class_id=${classId}&date=${selectedDate}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal mereset absensi");
      
      const data = await res.json();
      alert(data.message || "Absensi berhasil direset!");
      await fetchData(selectedDate);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mereset absensi.");
    }
  }, [classId, selectedDate, className, fetchData]);
  
  useEffect(() => {
    if (!isScannerOpen) return;
    const scanner = new Html5QrcodeScanner("qr-reader-container", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    const onScanSuccess = (decodedText: string) => {
      scanner.clear().catch(console.error);
      setIsScannerOpen(false);
      try {
        const qrData = JSON.parse(decodedText);
        handleStatusChange(qrData.student_id, "Hadir");
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : "QR Code tidak valid"}`);
      }
    };
    scanner.render(onScanSuccess, () => {});
    return () => { scanner.clear().catch(console.error) };
  }, [isScannerOpen, handleStatusChange]);

  const statusOptions = ["Belum Hadir", "Hadir", "Sakit", "Izin", "Alpha"];
  
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Absensi {className ? `Kelas ${className}` : "..."}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard-attendance" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={16} /><span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={16} /><span>Home</span>
            </Link>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
              <input type="date" id="attendance-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={getTodayString()} className="p-2 border rounded-md bg-white w-full" disabled={loading} />
            </div>
            {editMode && (
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode Absensi</label>
                <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                  <button onClick={() => setAttendanceMode('qr')} className={`w-1/2 text-center text-sm font-semibold py-1 px-3 rounded-md transition-colors ${attendanceMode === 'qr' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>QR Code</button>
                  <button onClick={() => setAttendanceMode('manual')} className={`w-1/2 text-center text-sm font-semibold py-1 px-3 rounded-md transition-colors ${attendanceMode === 'manual' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Manual</button>
                </div>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-auto flex flex-col gap-2">
            {editMode ? (
              <div className={`grid grid-cols-1 sm:grid-cols-${attendanceMode === 'qr' ? '3' : '2'} gap-2`}>
                {attendanceMode === 'qr' && (
                  <button onClick={() => setIsScannerOpen(true)} className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold text-sm shadow-sm">
                    <QrCode size={16} /><span>Scan QR</span>
                  </button>
                )}
                <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm">
                  <RotateCcw size={16} /><span>Reset</span>
                </button>
                <button onClick={handleSaveAll} className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm shadow-sm disabled:bg-green-400" disabled={isSaving}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{isSaving ? "Menyimpan..." : "Simpan & Kunci"}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm">
                  <RotateCcw size={16} /><span>Reset</span>
                </button>
                <button onClick={() => setEditMode(true)} className="flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-semibold text-sm shadow-sm">
                  <Edit size={16} /><span>Edit Absensi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {!editMode && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-r-lg flex items-center gap-4">
             <Check size={24} className="text-green-600"/>
             <div>
                <p className="font-bold">Absensi Sesi Ini Telah Disimpan</p>
                <p className="text-sm">Klik tombol 'Edit Absensi' untuk mengubah absensi.</p>
             </div>
          </div>
        )}

        {isScannerOpen && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Arahkan Kamera ke QR Code</h2>
              <div id="qr-reader-container" className="rounded-lg overflow-hidden border"></div>
              <button onClick={() => setIsScannerOpen(false)} className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold">Tutup</button>
            </div>
          </div>
        )}

        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data absensi...</p>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">No.</th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold w-48">Status</th>
                  <th className="p-4 font-semibold">Waktu Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, index) => (
                  <tr key={a.student_id} className={`border-b last:border-b-0 ${a.status === 'Hadir' ? 'bg-green-50' : a.status !== 'Belum Hadir' ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-3 whitespace-nowrap text-center">{(index + 1).toString().padStart(3, '0')}</td>
                    <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{a.name}</td>
                    <td className="p-3">
                      <select 
                        value={a.status} 
                        onChange={(e) => handleStatusChange(a.student_id, e.target.value)} 
                        className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200/50 disabled:cursor-not-allowed disabled:text-gray-500 appearance-none" 
                        disabled={!editMode}
                      >
                        {statusOptions.map((opt) => {
                          if (attendanceMode === 'qr' && opt === 'Hadir' && a.status !== 'Hadir') {
                            return null;
                          }
                          return <option key={opt} value={opt}>{opt}</option>;
                        })}
                      </select>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-600 text-center">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: "Asia/Jakarta" }) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}