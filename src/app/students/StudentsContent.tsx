"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Home, Plus, Download, Edit, Trash2 } from "lucide-react";

// Tipe data (NIS dihapus)
type Student = {
  id: string;
  name: string;
  gender: string;
  date_of_birth: string | null;
  class_id?: string | null;
};

type Class = {
  id: string;
  name: string;
};

// Komponen utama
export default function StudentsPage() {
  const searchParams = useSearchParams();
  const classIdFromUrl = searchParams.get("class_id") || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form state tanpa NIS
  const [form, setForm] = useState({
    name: "",
    gender: "Laki-laki",
    date_of_birth: "",
    class_id: classIdFromUrl,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Memuat data kelas & siswa
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, studentRes] = await Promise.all([
        fetch("/api/classes"),
        // API ini harus mengembalikan siswa yang sudah diurutkan berdasarkan nama
        fetch(`/api/students${classIdFromUrl ? `?class_id=${classIdFromUrl}` : ""}`),
      ]);

      if (!classRes.ok || !studentRes.ok) throw new Error("Gagal memuat data utama");

      const classesData = await classRes.json();
      setClasses(classesData);
      setStudents(await studentRes.json());
      
      if (classIdFromUrl) {
        const currentClass = classesData.find((c: Class) => c.id === classIdFromUrl);
        setClassName(currentClass ? currentClass.name : "");
      }

    } catch (error) {
      console.error(error);
      alert("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [classIdFromUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fungsi untuk mereset form
  const resetForm = useCallback(() => {
    setForm({ name: "", gender: "Laki-laki", date_of_birth: "", class_id: classIdFromUrl });
  }, [classIdFromUrl]);

  // Fungsi untuk download QR Code siswa (sekarang menggunakan ID unik siswa)
  const downloadQR = useCallback((student: Student) => {
    const qrClassName = className || classes.find((c) => c.id === student.class_id)?.name || "-";
    const temp = document.createElement("div");
    document.body.appendChild(temp);
    const root = createRoot(temp);
    // Payload QR Code menggunakan student_id (uuid) yang permanen
    root.render(<QRCodeCanvas value={JSON.stringify({ student_id: student.id, name: student.name, class: qrClassName })} size={220} includeMargin />);
    setTimeout(() => {
      const qrCanvas = temp.querySelector("canvas");
      if (!qrCanvas) { root.unmount(); document.body.removeChild(temp); return; }
      const finalCanvas = document.createElement("canvas");
      const padding = 20, textBlockH = 60; // Mengurangi tinggi text block karena satu baris teks dihapus
      finalCanvas.width = qrCanvas.width + padding * 2;
      finalCanvas.height = qrCanvas.height + padding + textBlockH;
      const ctx = finalCanvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      ctx.drawImage(qrCanvas, padding, padding);
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      let y = padding + qrCanvas.height + 25; // Sesuaikan posisi y awal
      ctx.font = "bold 18px Arial";
      ctx.fillText(student.name, finalCanvas.width / 2, y); y += 25;
      ctx.font = "16px Arial";
      // === PERUBAHAN UTAMA: Baris untuk "No. Urut" dihapus ===
      ctx.fillText(`Kelas: ${qrClassName}`, finalCanvas.width / 2, y);
      const link = document.createElement("a");
      link.href = finalCanvas.toDataURL("image/png");
      link.download = `QR_${student.name}.png`;
      link.click();
      root.unmount();
      document.body.removeChild(temp);
    }, 100);
  }, [className, classes]);

  // Fungsi untuk menangani penambahan siswa
  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, class_id: classIdFromUrl }),
      });
      if (!res.ok) throw new Error("Gagal menambah siswa");
      setShowAddModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  }, [form, classIdFromUrl, resetForm, loadData]);

  // Fungsi untuk menangani pengeditan siswa
  const handleEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const res = await fetch(`/api/students/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal mengedit siswa");
      setShowEditModal(false);
      await loadData();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  }, [editingId, form, loadData]);

  // Fungsi untuk menghapus siswa
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus siswa");
      await loadData();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  }, [loadData]);

  // Fungsi untuk membuka modal edit
  const openEditModal = useCallback((student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      gender: student.gender,
      date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
      class_id: student.class_id || classIdFromUrl,
    });
    setShowEditModal(true);
  }, [classIdFromUrl]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Daftar Siswa {className ? `Kelas ${className}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola data siswa per kelas atau secara keseluruhan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard-students" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
        </div>
        
        {classIdFromUrl && (
          <div className="mb-6">
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
            >
              <Plus size={18} />
              <span>Tambah Siswa</span>
            </button>
          </div>
        )}
        
        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data siswa...</p>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">No.</th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Gender</th>
                  <th className="p-4 font-semibold">Tanggal Lahir</th>
                  {!classIdFromUrl && <th className="p-4 font-semibold">Kelas</th>}
                  {classIdFromUrl && <th className="p-4 font-semibold text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={classIdFromUrl ? 5 : 5} className="text-center p-8">
                      <div className="text-center text-gray-500">
                        <h3 className="text-lg font-semibold">Belum Ada Data Siswa</h3>
                        {classIdFromUrl && <p className="mt-1">Silakan tambahkan siswa baru untuk kelas ini.</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((s, index) => {
                    const sequenceNumber = (index + 1).toString().padStart(3, '0');
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 border-b last:border-b-0">
                        <td className="p-4 whitespace-nowrap">{sequenceNumber}</td>
                        <td className="p-4 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                        <td className="p-4 whitespace-nowrap">{s.gender}</td>
                        <td className="p-4 whitespace-nowrap">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}</td>
                        {!classIdFromUrl && <td className="p-4 whitespace-nowrap">{classes.find((c) => c.id === s.class_id)?.name || "-"}</td>}
                        {classIdFromUrl && (
                          <td className="p-4 text-center space-x-2">
                            <button onClick={() => downloadQR(s)} title="Download QR" className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"><Download size={14} /></button>
                            <button onClick={() => openEditModal(s)} title="Edit" className="p-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(s.id)} title="Hapus" className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"><Trash2 size={14} /></button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <form onSubmit={showAddModal ? handleAdd : handleEdit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-4">
              <h2 className="text-2xl font-bold mb-4">{showAddModal ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}</h2>
              <input type="text" placeholder="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50" required />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tanggal Lahir</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50" />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Batal</button>
                <button type="submit" className={`px-6 py-2 text-white rounded-lg font-semibold ${showAddModal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>{showAddModal ? "Simpan" : "Update"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

