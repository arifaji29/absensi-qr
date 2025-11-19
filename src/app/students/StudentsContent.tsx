"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Home, Plus, Download, Edit, Trash2, Filter } from "lucide-react";

// Tipe data
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
  
  // State untuk Filter Kelas (Diambil dari URL atau default kosong)
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("class_id") || "");

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    gender: "Laki-laki",
    date_of_birth: "",
    class_id: selectedClassId,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load Daftar Kelas (Hanya sekali saat mount)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
        }
      } catch (e) {
        console.error("Gagal memuat daftar kelas");
      }
    };
    fetchClasses();
  }, []);

  // Memuat data siswa berdasarkan selectedClassId
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch siswa berdasarkan filter
      const url = `/api/students${selectedClassId ? `?class_id=${selectedClassId}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Gagal memuat data siswa");

      const studentsData = await res.json();
      setStudents(studentsData);
      
      // Update nama kelas untuk judul
      if (selectedClassId && classes.length > 0) {
        const currentClass = classes.find((c) => c.id === selectedClassId);
        setClassName(currentClass ? currentClass.name : "");
      } else {
        setClassName("");
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, classes]);

  // Panggil loadStudents saat filter berubah atau kelas selesai dimuat
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Handler saat filter dropdown berubah
  const handleFilterChange = (newId: string) => {
    setSelectedClassId(newId);
    
    // Update URL browser tanpa reload
    const url = new URL(window.location.href);
    if (newId) {
        url.searchParams.set("class_id", newId);
    } else {
        url.searchParams.delete("class_id");
    }
    window.history.pushState({}, "", url);
  };

  // Fungsi untuk mereset form
  const resetForm = useCallback(() => {
    setForm({ name: "", gender: "Laki-laki", date_of_birth: "", class_id: selectedClassId });
  }, [selectedClassId]);

  // Fungsi Download QR
  const downloadQR = useCallback((student: Student) => {
    const qrClassName = className || classes.find((c) => c.id === student.class_id)?.name || "-";
    const temp = document.createElement("div");
    document.body.appendChild(temp);
    const root = createRoot(temp);
    
    root.render(<QRCodeCanvas value={JSON.stringify({ student_id: student.id, name: student.name, class: qrClassName })} size={220} includeMargin />);
    
    setTimeout(() => {
      const qrCanvas = temp.querySelector("canvas");
      if (!qrCanvas) { root.unmount(); document.body.removeChild(temp); return; }
      const finalCanvas = document.createElement("canvas");
      const padding = 20, textBlockH = 60; 
      finalCanvas.width = qrCanvas.width + padding * 2;
      finalCanvas.height = qrCanvas.height + padding + textBlockH;
      const ctx = finalCanvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      ctx.drawImage(qrCanvas, padding, padding);
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      let y = padding + qrCanvas.height + 25; 
      ctx.font = "bold 18px Arial";
      ctx.fillText(student.name, finalCanvas.width / 2, y); y += 25;
      ctx.font = "16px Arial";
      ctx.fillText(`Kelas: ${qrClassName}`, finalCanvas.width / 2, y);
      const link = document.createElement("a");
      link.href = finalCanvas.toDataURL("image/png");
      link.download = `QR_${student.name}.png`;
      link.click();
      root.unmount();
      document.body.removeChild(temp);
    }, 100);
  }, [className, classes]);

  // Handle Add
  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, class_id: selectedClassId }),
      });
      if (!res.ok) throw new Error("Gagal menambah siswa");
      setShowAddModal(false);
      resetForm();
      await loadStudents();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  }, [form, selectedClassId, resetForm, loadStudents]);

  // Handle Edit
  const handleEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const res = await fetch(`/api/students/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal mengedit siswa");
      setShowEditModal(false);
      await loadStudents();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  }, [editingId, form, loadStudents]);

  // Handle Delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus siswa");
      await loadStudents();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  }, [loadStudents]);

  const openEditModal = useCallback((student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      gender: student.gender,
      date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
      class_id: student.class_id || selectedClassId,
    });
    setShowEditModal(true);
  }, [selectedClassId]);

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
        
        {/* Filter & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
                <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <select 
                    value={selectedClassId} 
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-sm"
                >
                    <option value="">-- Tampilkan Semua Kelas --</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Tombol Tambah (Hanya muncul jika Kelas sudah dipilih) */}
          {selectedClassId && (
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm text-sm"
            >
              <Plus size={18} />
              <span>Tambah Siswa</span>
            </button>
          )}
        </div>
        
        {/* Tabel Siswa */}
        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data siswa...</p>) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">No.</th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Gender</th>
                  <th className="p-4 font-semibold">Tanggal Lahir</th>
                  {!selectedClassId && <th className="p-4 font-semibold">Kelas</th>}
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={selectedClassId ? 5 : 6} className="text-center p-12">
                      <div className="text-center text-gray-500">
                        <h3 className="text-lg font-semibold">Data Tidak Ditemukan</h3>
                        <p className="mt-1 text-sm">
                            {selectedClassId 
                                ? "Belum ada siswa di kelas ini. Silakan tambah baru." 
                                : "Belum ada data siswa. Pilih kelas untuk memulai."}
                        </p>
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
                        {!selectedClassId && <td className="p-4 whitespace-nowrap">{classes.find((c) => c.id === s.class_id)?.name || "-"}</td>}
                        <td className="p-4 text-center space-x-2">
                           <div className="flex justify-center gap-2">
                            <button onClick={() => downloadQR(s)} title="Download QR" className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"><Download size={16} /></button>
                            <button onClick={() => openEditModal(s)} title="Edit" className="p-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(s.id)} title="Hapus" className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"><Trash2 size={16} /></button>
                           </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form (Tambah / Edit) */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <form onSubmit={showAddModal ? handleAdd : handleEdit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">{showAddModal ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              {/* Jika sedang mode "Semua Kelas", beri opsi pindah kelas saat edit */}
              {!selectedClassId && showEditModal && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                    <select value={form.class_id || ""} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="border p-3 w-full rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Batal</button>
                <button type="submit" className={`px-5 py-2 text-white rounded-lg font-semibold transition-colors ${showAddModal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>{showAddModal ? "Simpan" : "Update"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}