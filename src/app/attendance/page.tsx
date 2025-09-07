"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

type Attendance = {
  student_id: string;
  nis: string;
  name: string;
  status: string;
  checked_in_at: string | null;
};
type Teacher = { id: string; name: string; };

const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id") || "";

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isValidated, setIsValidated] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
  const [selectedValidatorId, setSelectedValidatorId] = useState<string>("");
  const [validatorName, setValidatorName] = useState<string | null>(null);
  const [className, setClassName] = useState("");

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
    } catch (err: unknown) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData(selectedDate);
  }, [fetchData, selectedDate]);

  const handleStatusChange = useCallback(async (student_id: string, new_status: string) => {
    try {
      setAttendance(prev => prev.map(s => s.student_id === student_id ? { ...s, status: new_status } : s));
      const res = await fetch(`/api/attendance/check`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ class_id: classId, student_id, status: new_status, date: selectedDate }), });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan ke server");
      await fetchData(selectedDate);
    } catch (err: unknown) {
      console.error("Gagal update status:", err);
      alert("Gagal menyimpan perubahan. Memuat ulang data.");
      fetchData(selectedDate);
    }
  }, [classId, selectedDate, fetchData]);

  const handleReset = useCallback(async () => {
    const confirmation = confirm(`Anda yakin ingin mereset seluruh absensi untuk kelas ${className} pada tanggal ${selectedDate}?`);
    if (!confirmation) return;
    try {
      const res = await fetch(`/api/attendance/reset?class_id=${classId}&date=${selectedDate}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal mereset absensi");
      alert("Absensi berhasil direset!");
      await fetchData(selectedDate);
    } catch (err: unknown) {
      console.error("Gagal reset:", err);
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
      const res = await fetch(`/api/attendance/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ class_id: classId, date: selectedDate, validator_id: selectedValidatorId }), });
      if (!res.ok) throw new Error("Gagal memvalidasi");
      alert("Absensi berhasil divalidasi!");
      setIsValidationModalOpen(false);
      await fetchData(selectedDate);
    } catch (err: unknown) {
      console.error("Gagal validasi:", err);
      alert("Terjadi kesalahan saat validasi.");
    }
  }, [classId, selectedDate, selectedValidatorId, fetchData]);

  useEffect(() => {
    if(isScannerOpen) {
      const scanner = new Html5QrcodeScanner("qr-reader-container", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      const onScanSuccess = async (decodedText: string) => {
        scanner.clear().catch(e=>console.error(e));
        setIsScannerOpen(false);
        try {
          const qrData = JSON.parse(decodedText);
          const student = attendance.find(s => s.nis === qrData.nis);
          if (!student) throw new Error("Siswa tidak ditemukan di kelas ini.");
          await handleStatusChange(student.student_id, 'Hadir');
          alert(`Siswa ${qrData.name || ""} berhasil diabsen!`);
        } catch (err: unknown) {
          alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      };
      scanner.render(onScanSuccess, () => {});
      return () => { scanner.clear().catch(e=>console.error(e)); };
    }
  }, [isScannerOpen, attendance, handleStatusChange]);

  const statusOptions = ["Belum Hadir", "Hadir", "Sakit", "Izin", "Alpha"];

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    alert("Semua perubahan disimpan secara otomatis setiap kali Anda mengubah status.");
    await new Promise(res => setTimeout(res, 500));
    setIsSaving(false);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Absensi {className ? `Kelas ${className}` : 'Kelas...'}</h1>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
          <input type="date" id="attendance-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={getTodayString()} className="p-2 border rounded-md" disabled={loading} />
        </div>
        {!isValidated && (
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="bg-gray-500 text-white px-5 py-2 rounded-md hover:bg-gray-600 font-semibold" disabled={loading}>Reset</button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-semibold" disabled={isSaving || loading}>
              {isSaving ? "Menyimpan..." : "Simpan Presensi"}
            </button>
            <button onClick={handleOpenValidationModal} className="bg-purple-600 text-white px-5 py-2 rounded-md hover:bg-purple-700 font-semibold" disabled={loading}>Validasi</button>
          </div>
        )}
      </div>
      {isValidated && ( <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md"><p className="font-bold">Absensi Tervalidasi</p><p>Presensi ini telah dikunci dan divalidasi oleh <strong>{validatorName || "N/A"}</strong>, dan tidak dapat diubah lagi.</p></div> )}
      {!isValidated && !loading && (<button onClick={() => setIsScannerOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded mb-4 hover:bg-green-700 font-semibold text-lg">Scan Presensi</button>)}
      {isValidationModalOpen && ( <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"><div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"><h2 className="text-2xl font-bold mb-4">Pilih Validator</h2><p className="text-gray-600 mb-6">Pilih pengajar yang bertanggung jawab.</p><div className="space-y-3 max-h-60 overflow-y-auto">{classTeachers.map(teacher => (<label key={teacher.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"><input type="radio" name="validator" value={teacher.id} checked={selectedValidatorId === teacher.id} onChange={(e) => setSelectedValidatorId(e.target.value)} className="h-5 w-5"/><span className="ml-4 font-medium">{teacher.name}</span></label>))}</div><div className="flex justify-end gap-4 pt-8"><button type="button" onClick={() => setIsValidationModalOpen(false)} className="px-6 py-2 bg-gray-300 rounded-lg">Batal</button><button onClick={handleConfirmValidation} className="px-6 py-2 bg-purple-600 text-white rounded-lg">Konfirmasi Validasi</button></div></div></div> )}
      {isScannerOpen && (<div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"><div className="bg-white rounded-lg p-4 w-full max-w-sm"><h2 className="text-xl font-bold text-center mb-4">Arahkan Kamera ke QR Code</h2><div id="qr-reader-container"></div><button onClick={() => setIsScannerOpen(false)} className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">Tutup</button></div></div>)}
      {loading ? (<p>Memuat data...</p>) : (
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr><th className="border p-2">NIS</th><th className="border p-2">Nama</th><th className="border p-2 w-48">Status</th><th className="border p-2">Waktu Kehadiran</th></tr>
          </thead>
          <tbody>
            {attendance.map((a) => (<tr key={a.student_id} className={a.status === 'Hadir' ? 'bg-green-100' : (a.status !== 'Belum Hadir' ? 'bg-yellow-100' : '')}>
                <td className="border p-2">{a.nis}</td><td className="border p-2">{a.name}</td>
                <td className="border p-2">
                  <select value={a.status} onChange={(e) => handleStatusChange(a.student_id, e.target.value)} className="w-full p-2 border rounded bg-white disabled:bg-gray-100 disabled:cursor-not-allowed" disabled={isValidated}>
                    {statusOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </td>
                <td className="border p-2">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"}</td>
              </tr>))}
          </tbody>
        </table>
      )}
    </div>
  );
}

