"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Home, Plus } from "lucide-react";
import Link from "next/link";

// Tipe data untuk pengajar dan kelas
type Teacher = { 
  id: string; 
  name: string; 
};

type ClassWithTeachers = { 
  id: string; 
  name: string; 
  teachers: Teacher[]; 
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithTeachers | null>(null);

  // Fungsi untuk mengambil data kelas dan pengajar
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/teachers"),
      ]);
      if (!classRes.ok || !teacherRes.ok) throw new Error("Gagal memuat data");
      setClasses(await classRes.json());
      setAllTeachers(await teacherRes.json());
    } catch (error: unknown) {
      console.error(error);
      alert("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fungsi untuk membuka modal tambah
  function openAddModal() {
    setNewClassName("");
    setSelectedTeacherIds([]);
    setShowAddModal(true);
  }

  // Fungsi untuk membuka modal edit
  function openEditModal(cls: ClassWithTeachers) {
    setEditingClass(cls);
    setSelectedTeacherIds(cls.teachers.map((t) => t.id));
    setShowEditModal(true);
  }

  // Fungsi untuk menangani penambahan kelas baru
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName, teacherIds: selectedTeacherIds }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menambah kelas");
      }
      setShowAddModal(false);
      await fetchData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menambah kelas.");
    }
  }

  // Fungsi untuk menangani pengeditan kelas
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClass) return;
    try {
      const res = await fetch(`/api/classes/${editingClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingClass.name, teacherIds: selectedTeacherIds }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal mengedit kelas");
      }
      setShowEditModal(false);
      await fetchData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat mengedit kelas.");
    }
  }

  // Fungsi untuk menghapus kelas
  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus kelas ini? Menghapus kelas juga akan menghapus data siswa dan presensi terkait.")) return;
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menghapus kelas");
      }
      await fetchData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus kelas.");
    }
  }

  // Fungsi untuk menangani pemilihan guru
  function handleTeacherSelection(teacherId: string) {
    setSelectedTeacherIds((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter((id) => id !== teacherId);
      } else {
        if (prev.length >= 3) {
          alert("Maksimal 3 pengajar per kelas.");
          return prev;
        }
        return [...prev, teacherId];
      }
    });
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Manajemen Kelas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Atur daftar kelas dan alokasi pengajar yang bertanggung jawab.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <button className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </Link>
            <Link href="/">
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                <Home size={16} />
                <span>Home</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Tombol Aksi Utama */}
        <div className="mb-6">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
            >
              <Plus size={18} />
              <span>Tambah Kelas Baru</span>
            </button>
        </div>

        {/* Modal Tambah Kelas */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6">Formulir Kelas Baru</h2>
              <form onSubmit={handleAdd} className="space-y-6">
                <input type="text" placeholder="Nama Kelas (Contoh: 1A)" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="border p-3 w-full rounded-lg" required />
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Pilih Pengajar (Maksimal 3):</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg max-h-60 overflow-y-auto bg-gray-50">
                    {allTeachers.map((teacher) => (
                      <label key={teacher.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
                        <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => handleTeacherSelection(teacher.id)} disabled={!selectedTeacherIds.includes(teacher.id) && selectedTeacherIds.length >= 3} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-gray-800">{teacher.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Batal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Kelas */}
        {showEditModal && editingClass && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6">Edit Kelas: {editingClass.name}</h2>
              <form onSubmit={handleEdit} className="space-y-6">
                <input type="text" placeholder="Nama Kelas" value={editingClass.name} onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })} className="border p-3 w-full rounded-lg" required />
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Pilih Pengajar (Maksimal 3):</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg max-h-60 overflow-y-auto bg-gray-50">
                    {allTeachers.map((teacher) => (
                      <label key={teacher.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
                        <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => handleTeacherSelection(teacher.id)} disabled={!selectedTeacherIds.includes(teacher.id) && selectedTeacherIds.length >= 3} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-gray-800">{teacher.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Batal</button>
                  <button type="submit" className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabel Data Kelas */}
        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data...</p>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Nama Kelas</th>
                  <th className="p-4 font-semibold">Pengajar Bertugas</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 border-b last:border-b-0">
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{cls.name}</td>
                    <td className="p-4 text-gray-700">{cls.teachers.length > 0 ? cls.teachers.map((t) => t.name).join(", ") : <span className="text-gray-400">Belum ada</span>}</td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => openEditModal(cls)} className="px-3 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Edit</button>
                      <button onClick={() => handleDelete(cls.id)} className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700">Hapus</button>
                    </td>
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