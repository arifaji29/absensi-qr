"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import Link from "next/link";
import { ArrowLeft, Home, QrCode, RotateCcw, ShieldCheck, CheckCircle } from "lucide-react";

// Tipe data
type Attendance = {
  student_id: string;
  nis: string;
  name: string;
  status: string;
  checked_in_at: string | null;
};

type Teacher = {
  id: string;
  name: string;
};

// Fungsi helper
const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isValidated, setIsValidated] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
  const [selectedValidatorId, setSelectedValidatorId] = useState<string>("");
  const [validatorName, setValidatorName] = useState<string | null>(null);
  const [className, setClassName] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/success-sound.mp3");
    if (audioRef.current) audioRef.current.volume = 0.5;
  }, []);

  const fetchData = useCallback(async (date: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const [studentRes, validationRes, teachersRes, classRes] = await Promise.all([
        fetch(`/api/attendance?class_id=${classId}&date=${date}`),
        fetch(`/api/attendance/status?class_id=${classId}&date=${date}`),
        fetch(`/api/classes/${classId}/teachers`),
        fetch(`/api/classes/${classId}/details`),
      ]);
      const studentData = await studentRes.json();
      const validationData = await validationRes.json();
      const teachersData = await teachersRes.json();
      const classData = await classRes.json();

      setAttendance(Array.isArray(studentData) ? studentData : []);
      setIsValidated(validationData.isValidated || false);
      setValidatorName(validationData.validatorName || null);
      setClassTeachers(Array.isArray(teachersData) ? teachersData : []);
      setClassName(classData.name || "");
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData(selectedDate);
  }, [fetchData, selectedDate]);

  const handleStatusChange = useCallback(async (student_id: string, new_status: string) => {
    setAttendance((prev) => prev.map((s) => (s.student_id === student_id ? { ...s, status: new_status } : s)));
    try {
      const res = await fetch(`/api/attendance/check`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, student_id, status: new_status, date: selectedDate }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan ke server");
      await fetchData(selectedDate);
    } catch (err) {
      console.error("Gagal update status:", err);
      alert("Gagal menyimpan perubahan. Memuat ulang data.");
      fetchData(selectedDate);
    }
  }, [classId, selectedDate, fetchData]);

  const handleReset = useCallback(async () => {
    if (!confirm(`Anda yakin ingin mereset seluruh absensi untuk kelas ${className} pada tanggal ${selectedDate}?`)) return;
    try {
      const res = await fetch(`/api/attendance/reset?class_id=${classId}&date=${selectedDate}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal mereset absensi");
      alert("Absensi berhasil direset!");
      await fetchData(selectedDate);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mereset absensi.");
    }
  }, [classId, selectedDate, className, fetchData]);
  
  const handleOpenValidationModal = useCallback(() => {
    if (classTeachers.length === 0) {
      alert("Tidak dapat validasi. Tidak ada data pengajar yang ditugaskan untuk kelas ini.");
      return;
    }
    setSelectedValidatorId("");
    setIsValidationModalOpen(true);
  }, [classTeachers]);

  const handleConfirmValidation = useCallback(async () => {
    if (!selectedValidatorId) {
      alert("Anda harus memilih satu pengajar sebagai validator.");
      return;
    }
    try {
      const res = await fetch(`/api/attendance/validate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, date: selectedDate, validator_id: selectedValidatorId }),
      });
      if (!res.ok) throw new Error("Gagal memvalidasi");
      alert("Absensi berhasil divalidasi!");
      setIsValidationModalOpen(false);
      await fetchData(selectedDate);
    } catch (err) {
      alert("Terjadi kesalahan saat validasi.");
    }
  }, [classId, selectedDate, selectedValidatorId, fetchData]);

  useEffect(() => {
    if (!isScannerOpen) return;
    const scanner = new Html5QrcodeScanner("qr-reader-container", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    const onScanSuccess = async (decodedText: string) => {
      scanner.clear().catch(console.error);
      setIsScannerOpen(false);
      try {
        const qrData = JSON.parse(decodedText);
        const student = attendance.find((s) => s.nis === qrData.nis);
        if (!student) throw new Error("Siswa tidak ditemukan di kelas ini.");
        await handleStatusChange(student.student_id, "Hadir");
        if (audioRef.current) audioRef.current.play().catch(console.error);
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : "QR Code tidak valid"}`);
      }
    };
    scanner.render(onScanSuccess, () => {});
    return () => { scanner.clear().catch(console.error) };
  }, [isScannerOpen, attendance, handleStatusChange]);

  const statusOptions = ["Belum Hadir", "Hadir", "Sakit", "Izin", "Alpha"];
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta'});

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Absensi {className ? `Kelas ${className}` : "..."}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(selectedDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard-attendance" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
        </div>
        
        {/* === START PERBAIKAN === */}
        {/* Panel Kontrol yang Selalu Tampil */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          {/* Bagian Kiri: Pilih Tanggal (selalu ada) */}
          <div className="w-full md:w-auto">
            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
            <input 
              type="date" 
              id="attendance-date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              max={getTodayString()} 
              className="p-2 border rounded-md bg-white w-full" 
              disabled={loading} 
            />
          </div>

          {/* Bagian Kanan: Tombol Aksi (hanya jika belum divalidasi) */}
          {!isValidated && (
            <div className="w-full md:w-auto flex flex-col gap-2">
              <button onClick={() => setIsScannerOpen(true)} className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-400 font-semibold text-sm shadow-sm">
                <QrCode size={16} />
                <span>Scan QR</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm">
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
                <button onClick={handleOpenValidationModal} className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold text-sm shadow-sm">
                  <ShieldCheck size={16} />
                  <span>Validasi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tampilkan Pesan Validasi Jika Sudah Divalidasi */}
        {isValidated && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-r-lg flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-600"/>
            <div>
              <p className="font-bold">Absensi Sesi Ini Telah Divalidasi</p>
              <p className="text-sm">Data dikunci oleh <strong>{validatorName || "N/A"}</strong> dan tidak dapat diubah lagi.</p>
            </div>
          </div>
        )}
        {/* === END PERBAIKAN === */}

        {isValidationModalOpen && (
             <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
               <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                 <h2 className="text-2xl font-bold mb-2">Konfirmasi Validasi</h2>
                 <p className="text-gray-600 mb-6">Pilih pengajar yang bertanggung jawab untuk mengunci data absensi hari ini.</p>
                 <div className="space-y-3 max-h-60 overflow-y-auto border-t border-b py-4">
                   {classTeachers.map((teacher) => (
                     <label key={teacher.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 transition-colors">
                       <input type="radio" name="validator" value={teacher.id} checked={selectedValidatorId === teacher.id} onChange={(e) => setSelectedValidatorId(e.target.value)} className="h-5 w-5 text-blue-600 focus:ring-blue-500" />
                       <span className="ml-4 font-medium text-gray-800">{teacher.name}</span>
                     </label>
                   ))}
                 </div>
                 <div className="flex justify-end gap-4 pt-6">
                   <button type="button" onClick={() => setIsValidationModalOpen(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Batal</button>
                   <button onClick={handleConfirmValidation} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">Konfirmasi</button>
                 </div>
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
                  <th className="p-4 font-semibold">NIS</th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold w-48">Status</th>
                  <th className="p-4 font-semibold">Waktu Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.student_id} className={`border-b last:border-b-0 ${a.status === 'Hadir' ? 'bg-green-50' : a.status !== 'Belum Hadir' ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-3 whitespace-nowrap">{a.nis}</td>
                    <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{a.name}</td>
                    <td className="p-3">
                      <select value={a.status} onChange={(e) => handleStatusChange(a.student_id, e.target.value)} className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200/50 disabled:cursor-not-allowed disabled:text-gray-500 appearance-none" disabled={isValidated}>
                        {statusOptions.map((opt) => (opt === "Hadir" && a.status !== "Hadir" ? null : <option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-600">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"}</td>
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
