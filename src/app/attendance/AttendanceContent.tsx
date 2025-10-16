"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
// Perbaikan: Menghapus useSearchParams yang menyebabkan error
// import { useSearchParams } from "next/navigation";
import { ArrowLeft, Home, RotateCcw, Check, Loader2, X } from "lucide-react";

// Tipe Data
type Attendance = {
  student_id: string;
  name: string;
  status: string;
  time: string | null;
};

// Tipe Notifikasi
type Notification = {
  message: string;
  isError?: boolean;
};

// Fungsi helper
const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' });

export default function AttendanceContent() {
  // Perbaikan: Mengambil class_id dari URL menggunakan state dan useEffect
  const [classId, setClassId] = useState("");
  
  useEffect(() => {
    // Kode ini hanya berjalan di sisi client, aman untuk mengakses window
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('class_id') || '';
    setClassId(idFromUrl);
  }, []); // Array kosong berarti hanya berjalan sekali saat komponen dimuat

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [className, setClassName] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/success-sound.mp3");
      if (audioRef.current) audioRef.current.volume = 0.5;
    }
  }, []);

  const fetchData = useCallback(async (date: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const [studentRes, classRes] = await Promise.all([
        fetch(`/api/attendance?class_id=${classId}&date=${date}`),
        fetch(`/api/classes/${classId}/details`),
      ]);

      if (!studentRes.ok || !classRes.ok) {
        throw new Error("Gagal memuat data awal.");
      }

      const studentData = await studentRes.json();
      const classData = await classRes.json();

      const formattedStudentData = studentData.map((student: any) => ({
        ...student,
        time: student.time || student.checked_in_at || null,
      }));

      setAttendance(Array.isArray(formattedStudentData) ? formattedStudentData : []);
      setClassName(classData.name || "");

    } catch (err) {
      console.error("Gagal memuat data:", err);
      alert("Gagal memuat data absensi.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchData(selectedDate);
    }
  }, [fetchData, selectedDate, classId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleStatusChange = async (student_id: string, new_status: string) => {
    const oldAttendance = [...attendance];
    
    setAttendance(prev => 
      prev.map(student => 
        student.student_id === student_id 
          ? { ...student, status: new_status, time: new_status === 'Hadir' ? new Date().toISOString() : null } 
          : student
      )
    );
    setUpdatingStudentId(student_id);

    try {
      const res = await fetch('/api/attendance/single-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id,
          class_id: classId,
          date: selectedDate,
          status: new_status,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan perubahan ke server.");
      }

      if (new_status === 'Hadir') {
        audioRef.current?.play().catch(console.error);
      }
      
      await fetchData(selectedDate);
      setNotification({ message: "Status berhasil diperbarui!" });

    } catch (error) {
      console.error("Gagal menyimpan status:", error);
      setNotification({ message: "Gagal menyimpan, mengembalikan data.", isError: true });
      setAttendance(oldAttendance);
    } finally {
      setUpdatingStudentId(null);
    }
  };

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

  const statusOptions = ["Belum Hadir", "Hadir", "Sakit", "Izin", "Alpha"];

  return (
    <Fragment>
      {notification && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] ${notification.isError ? 'bg-red-500' : 'bg-green-500'} text-white p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down`}>
          {notification.isError ? <X size={24}/> : <Check size={24}/>}
          <p className="font-bold">{notification.message}</p>
        </div>
      )}

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
              <a href="/dashboard-attendance" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                <ArrowLeft size={16} /><span>Back</span>
              </a>
              <a href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                <Home size={16} /><span>Home</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="w-full sm:w-auto">
              <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
              <input type="date" id="attendance-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={getTodayString()} className="p-2 border rounded-md bg-white w-full" disabled={loading} />
            </div>
            <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm">
              <RotateCcw size={16} /><span>Reset Absensi Hari Ini</span>
            </button>
          </div>

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
                      <td className="p-3 whitespace-nowrap text-center">{(index + 1).toString().padStart(2, '0')}</td>
                      <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{a.name}</td>
                      <td className="p-3">
                        <div className="relative">
                          <select
                            value={a.status}
                            onChange={(e) => handleStatusChange(a.student_id, e.target.value)}
                            className="w-full p-2 border rounded-md bg-white appearance-none disabled:bg-gray-200/50 disabled:cursor-not-allowed"
                            disabled={loading || updatingStudentId === a.student_id}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {updatingStudentId === a.student_id && (
                            <Loader2 size={16} className="animate-spin text-gray-500 absolute right-2 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-600 text-center">
                        {a.time ? new Date(a.time).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: "Asia/Jakarta" }) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}

