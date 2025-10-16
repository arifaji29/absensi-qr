"use client";

import { useEffect, useState, useCallback, Fragment, useRef } from "react";
// Menggunakan kembali tag <a> karena 'next/link' tidak dapat di-resolve di lingkungan ini
import { 
  ArrowLeft, 
  Home, 
  BarChart, 
  QrCode, 
  Check, 
  Loader2, 
  X 
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode"; // Impor tipe spesifik

// Tipe data
type Teacher = { id: string; name: string };
type ClassWithTeachers = { id: string; name: string; teachers: Teacher[] };
type Student = { student_id: string; class_id: string; name: string; };

// ===================================================================
// KOMPONEN MODAL (SEKARANG LEBIH SEDERHANA)
// ===================================================================
type ParallelScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scannedStudents: Student[]) => Promise<void>;
  studentsToScan: Student[]; // Daftar siswa yang BOLEH diabsen hari ini
  isSaving: boolean;
};

function ParallelScannerModal({ 
  isOpen, 
  onClose, 
  onSave, 
  studentsToScan, 
  isSaving 
}: ParallelScannerModalProps) {
  // State ini HANYA ada selama modal terbuka. Akan di-reset saat modal ditutup.
  const [scannedInThisSession, setScannedInThisSession] = useState<Student[]>([]);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/success-sound.mp3");
      if (audioRef.current) audioRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const onScanSuccess = useCallback((decodedText: string) => {
    let studentIdToFind: string | null = null;
    try {
      const qrData = JSON.parse(decodedText);
      studentIdToFind = (qrData && qrData.student_id) ? qrData.student_id : decodedText;
    } catch (_e) { // Perbaikan: Mengganti 'e' menjadi '_e' karena tidak digunakan
      studentIdToFind = decodedText;
    }

    if (!studentIdToFind) {
      setNotification({ message: "Format QR tidak dikenal", isError: true });
      return;
    }
    
    // 1. Cek apakah siswa ini ada di daftar yang boleh diabsen (dari API)
    const student = studentsToScan.find(s => s.student_id === studentIdToFind);

    if (student) {
      // 2. Cek apakah siswa ini sudah discan di sesi modal INI (mencegah scan ganda)
      if (scannedInThisSession.some(s => s.student_id === student.student_id)) {
        setNotification({ message: `${student.name} (Sudah discan)` });
        return;
      }

      audioRef.current?.play().catch(console.error);
      setNotification({ message: `${student.name} berhasil discan` });
      
      // Tambahkan ke daftar pindaian LOKAL di dalam modal
      setScannedInThisSession(prev => [...prev, student]);

    } else {
      setNotification({ message: "Siswa sudah diabsen" });
    }
  }, [studentsToScan, scannedInThisSession]);

  useEffect(() => {
    if (!isOpen) return;

    // Perbaikan: Memberikan tipe spesifik, bukan 'any'
    let scanner: Html5QrcodeScanner | null = null; 
    const isScanCooldown = { current: false };

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (!document.getElementById("parallel-qr-reader")) return;
      scanner = new Html5QrcodeScanner("parallel-qr-reader", { fps: 5, qrbox: { width: 250, height: 250 } }, false);
      
      const handleSuccess = (text: string) => {
        if (isScanCooldown.current) return;
        isScanCooldown.current = true;
        onScanSuccess(text);
        setTimeout(() => { isScanCooldown.current = false; }, 2000);
      };
      
      scanner.render(handleSuccess, () => {});
    }).catch(err => console.error("Gagal memuat html5-qrcode.", err));

    return () => {
        // Memastikan scanner ada sebelum memanggil method clear
      if (scanner && scanner.getState() !== 1) { 
        scanner.clear().catch(console.error);
      }
    };
  }, [isOpen, onScanSuccess]);

  // Reset state internal saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setScannedInThisSession([]);
      setNotification(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (scannedInThisSession.length > 0) {
      if (confirm(`Anda akan menyimpan absensi untuk ${scannedInThisSession.length} siswa. Lanjutkan?`)) {
        onSave(scannedInThisSession);
      }
    }
  };

  const handleClose = () => {
    if (scannedInThisSession.length > 0 && !isSaving) {
      if (confirm(`Anda memiliki ${scannedInThisSession.length} siswa yang terpindai tetapi belum disimpan. Apakah Anda yakin ingin menutup? Data pindaian sesi ini akan hilang.`)) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
      {notification && (
        <div className={`absolute top-5 left-1/2 -translate-x-1/2 z-[999] ${notification.isError ? 'bg-red-500' : 'bg-green-500'} text-white p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down`}>
          {notification.isError ? <X size={24} /> : <Check size={24} />}
          <p className="font-bold">{notification.message}</p>
        </div>
      )}
      <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Absen Paralel</h2>
        <div id="parallel-qr-reader" className="rounded-lg overflow-hidden border"></div>
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Terpindai Sesi Ini: <span className="font-bold">{scannedInThisSession.length}</span> / {studentsToScan.length} siswa</p>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={handleClose} className="w-full bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-semibold flex items-center justify-center gap-2" disabled={isSaving}>
            <X size={20} />
            <span>Tutup</span>
          </button>
          <button onClick={handleSave} className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed" disabled={isSaving || scannedInThisSession.length === 0}>
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
}


// ===================================================================
// KOMPONEN UTAMA DASHBOARD
// ===================================================================
export default function AttendanceDashboard() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParallelScannerOpen, setIsParallelScannerOpen] = useState(false);
  const [studentsToScan, setStudentsToScan] = useState<Student[]>([]);
  const [isPreparingScanner, setIsPreparingScanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(() => 
    new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Fungsi ini dipanggil SETIAP KALI tombol "Absen Paralel" ditekan
  const handleOpenParallelScanner = async () => {
    setIsPreparingScanner(true);
    try {
      // Selalu ambil daftar siswa TERBARU dari server yang belum diabsen
      const res = await fetch(`/api/students/all?date=${selectedDate}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memuat data siswa.");
      }
      const studentsData = await res.json();
      
      // Simpan daftar ini ke state untuk diberikan ke modal
      setStudentsToScan(studentsData);
      setIsParallelScannerOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsPreparingScanner(false);
    }
  };

  const handleSaveParallelAttendance = async (scannedStudents: Student[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/attendance/parallel-bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          attendanceData: scannedStudents.map(s => ({ student_id: s.student_id, class_id: s.class_id }))
        })
      });

      if (!res.ok) throw new Error("Gagal menyimpan data absensi.");
      alert("Absensi paralel berhasil disimpan!");
      handleCloseParallelScanner();

    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi tutup hanya mengubah status modal
  const handleCloseParallelScanner = () => {
    setIsParallelScannerOpen(false);
  };

  const fetchClassesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Gagal memuat data kelas");
      setClasses(await res.json());
    } catch { // Perbaikan: Menghapus 'err' yang tidak digunakan
      alert("Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassesData();
  }, [fetchClassesData]);

  return (
    <Fragment>
      <ParallelScannerModal 
        isOpen={isParallelScannerOpen}
        onClose={handleCloseParallelScanner}
        onSave={handleSaveParallelAttendance}
        studentsToScan={studentsToScan}
        isSaving={isSaving}
      />
      
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard Absensi</h1>
              <p className="text-sm text-gray-500 mt-1">Pilih kelas untuk memulai sesi absensi siswa.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Perbaikan: Mengembalikan ke tag <a> */}
              <a href="/" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                <ArrowLeft size={16} /><span>Back</span>
              </a>
              <a href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                <Home size={16} /><span>Home</span>
              </a>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <a href="/dashboard-monitoring" className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-semibold shadow-sm">
                <BarChart size={18} /><span>Lihat Dashboard Monitoring</span>
              </a>
              <button onClick={handleOpenParallelScanner} disabled={isPreparingScanner} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-sm disabled:bg-blue-400 disabled:cursor-wait">
                {isPreparingScanner ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                <span>{isPreparingScanner ? "Mempersiapkan..." : "Absen Paralel (QR)"}</span>
              </button>
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor="parallel-date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Absen</label>
              <input 
                type="date" 
                id="parallel-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border rounded-md bg-white w-full sm:w-auto"
                disabled={isPreparingScanner}
              />
            </div>
          </div>

          {loading ? (
             <p className="text-center text-gray-500 py-8">Memuat data kelas...</p>
          ) : (
            <div className="overflow-x-auto">
              {classes.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-left text-gray-600">
                    <tr><th className="p-4 font-semibold">Kelas</th><th className="p-4 font-semibold">Pengajar</th><th className="p-4 font-semibold text-center">Aksi</th></tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50 border-b last:border-b-0">
                        <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{cls.name}</td>
                        <td className="p-4 text-gray-700">{cls.teachers.length > 0 ? cls.teachers.map((t) => t.name).join(", ") : <span className="text-gray-400">Belum ada</span>}</td>
                        <td className="p-4 text-center">
                          <a href={`/attendance?class_id=${cls.id}`} className="inline-block px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-xs font-semibold shadow-sm">
                            Absen Manual
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700">Belum Ada Kelas</h3>
                  <p className="text-gray-500 mt-2">Silakan tambahkan data kelas terlebih dahulu di halaman Manajemen Kelas.</p>
                  <a href="/classes" className="mt-4 inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm">
                    Pergi ke Manajemen Kelas
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}

