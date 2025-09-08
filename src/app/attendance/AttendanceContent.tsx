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
type Teacher = { id: string; name: string };

const getTodayString = () =>
  new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function AttendanceContent() {
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
  const [selectedValidatorId, setSelectedValidatorId] = useState("");
  const [validatorName, setValidatorName] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(
    async (date: string) => {
      if (!classId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const [studentRes, validationRes, teachersRes, classRes] =
          await Promise.all([
            fetch(`/api/attendance?class_id=${classId}&date=${date}`),
            fetch(`/api/attendance/status?class_id=${classId}&date=${date}`),
            fetch(`/api/classes/${classId}/teachers`),
            fetch(`/api/classes/${classId}/details`),
          ]);

        if (!studentRes.ok) throw new Error("Gagal memuat daftar siswa");
        if (!validationRes.ok) throw new Error("Gagal memuat status validasi");
        if (!teachersRes.ok) throw new Error("Gagal memuat pengajar");
        if (!classRes.ok) throw new Error("Gagal memuat detail kelas");

        const studentData = await studentRes.json();
        const validationData = await validationRes.json();
        const teachersData = await teachersRes.json();
        const classData = await classRes.json();

        setAttendance(Array.isArray(studentData) ? studentData : []);
        setIsValidated(validationData.isValidated || false);
        setValidatorName(validationData.validatorName || null);
        setClassTeachers(Array.isArray(teachersData) ? teachersData : []);
        setClassName(classData?.name || "");
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setErrorMsg(err instanceof Error ? err.message : "Kesalahan tak dikenal");
      } finally {
        setLoading(false);
      }
    },
    [classId]
  );

  useEffect(() => {
    if (classId) {
      fetchData(selectedDate);
    }
  }, [fetchData, selectedDate, classId]);

  const handleStatusChange = useCallback(
    async (student_id: string, new_status: string) => {
      setAttendance(prev =>
        prev.map(s =>
          s.student_id === student_id ? { ...s, status: new_status } : s
        )
      );
      try {
        const res = await fetch(`/api/attendance/check`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_id: classId,
            student_id,
            status: new_status,
            date: selectedDate,
          }),
        });
        if (!res.ok) throw new Error("Gagal menyimpan perubahan ke server");
        fetchData(selectedDate);
      } catch (err) {
        console.error("Gagal update status:", err);
        setErrorMsg(
          err instanceof Error ? err.message : "Gagal menyimpan perubahan"
        );
      }
    },
    [classId, selectedDate, fetchData]
  );

  const handleReset = useCallback(async () => {
    if (!confirm(`Reset absensi kelas ${className} pada ${selectedDate}?`)) return;
    try {
      const res = await fetch(
        `/api/attendance/reset?class_id=${classId}&date=${selectedDate}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Gagal mereset absensi");
      fetchData(selectedDate);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal reset absensi");
    }
  }, [classId, selectedDate, className, fetchData]);

  const handleConfirmValidation = useCallback(async () => {
    if (!selectedValidatorId) {
      alert("Pilih satu pengajar sebagai validator.");
      return;
    }
    try {
      const res = await fetch(`/api/attendance/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classId,
          date: selectedDate,
          validator_id: selectedValidatorId,
        }),
      });
      if (!res.ok) throw new Error("Gagal memvalidasi");
      setIsValidationModalOpen(false);
      fetchData(selectedDate);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memvalidasi");
    }
  }, [classId, selectedDate, selectedValidatorId, fetchData]);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const onScanSuccess = async (decodedText: string) => {
        await scanner.clear().catch(console.error);
        setIsScannerOpen(false);
        try {
          const qrData = JSON.parse(decodedText);
          const student = attendance.find(s => s.nis === qrData.nis);
          if (!student) throw new Error("Siswa tidak ditemukan.");
          await handleStatusChange(student.student_id, "Hadir");
          alert(`Siswa ${qrData.name || ""} berhasil diabsen!`);
        } catch (err) {
          alert(
            `Error: ${err instanceof Error ? err.message : "Kesalahan tidak diketahui"}`
          );
        }
      };

      scanner.render(onScanSuccess, () => {});
      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [isScannerOpen, attendance, handleStatusChange]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Absensi {className ? `Kelas ${className}` : "Kelas..."}
      </h1>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md">
          {errorMsg}
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-1"
        />
        <button
          onClick={() => fetchData(selectedDate)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Refresh
        </button>
        <button
          onClick={() => setIsScannerOpen(true)}
          className="bg-green-500 text-white px-4 py-1 rounded"
        >
          Scan QR
        </button>
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-1 rounded"
        >
          Reset Absensi
        </button>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">NIS</th>
              <th className="border px-2 py-1">Nama</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map(student => (
              <tr key={student.student_id}>
                <td className="border px-2 py-1">{student.nis}</td>
                <td className="border px-2 py-1">{student.name}</td>
                <td className="border px-2 py-1">{student.status || "Belum Hadir"}</td>
                <td className="border px-2 py-1">
                  <select
                    value={student.status || ""}
                    onChange={e => handleStatusChange(student.student_id, e.target.value)}
                    className="border rounded px-2"
                  >
                    <option value="">Pilih</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
