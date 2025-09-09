"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

type Teacher = { id: string; name: string; };
type ClassWithTeachers = { id: string; name: string; teachers: Teacher[]; };

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithTeachers | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([fetch("/api/classes"), fetch("/api/teachers")]);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAddModal() {
    setNewClassName("");
    setSelectedTeacherIds([]);
    setShowAddModal(true);
  }

  function openEditModal(cls: ClassWithTeachers) {
    setEditingClass(cls);
    setSelectedTeacherIds(cls.teachers.map(t => t.id));
    setShowEditModal(true);
  }

  // --- FUNGSI DIPERBARUI DENGAN PENANGANAN ERROR YANG BENAR ---
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newClassName, teacherIds: selectedTeacherIds }), });
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

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClass) return;
    try {
      const res = await fetch(`/api/classes/${editingClass.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingClass.name, teacherIds: selectedTeacherIds }), });
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

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus kelas ini?")) return;
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

  function handleTeacherSelection(teacherId: string) {
    setSelectedTeacherIds(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
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
    <div className="p-6">
      <h1 className="text-3xl font-bold">Manajemen Kelas</h1>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
          {/* Grup tombol navigasi */}
          <div className="flex flex-wrap gap-3">
            {/* Tombol Back */}
            <Link href="/">
              <button className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto justify-center">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
            </Link>

            {/* Tombol Home */}
            <Link href="/">
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto justify-center">
                <Home size={18} />
                <span>Home</span>
              </button>
            </Link>
          </div>

          {/* Tombol Tambah */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold w-full sm:w-auto justify-center"
          >
            + Tambah Kelas Baru
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Formulir Kelas Baru</h2>
            <form onSubmit={handleAdd} className="space-y-6">
              <input type="text" placeholder="Nama Kelas (Contoh: 1A)" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="border p-3 w-full rounded-lg" required />
              <div>
                <label className="block font-semibold mb-2">Pilih Pengajar (Maksimal 3):</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg max-h-60 overflow-y-auto">
                  {allTeachers.map(teacher => (
                    <label key={teacher.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                      <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => handleTeacherSelection(teacher.id)} disabled={!selectedTeacherIds.includes(teacher.id) && selectedTeacherIds.length >= 3} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span>{teacher.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Edit Kelas</h2>
            <form onSubmit={handleEdit} className="space-y-6">
              <input type="text" placeholder="Nama Kelas" value={editingClass.name} onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })} className="border p-3 w-full rounded-lg" required />
              <div>
                <label className="block font-semibold mb-2">Pilih Pengajar (Maksimal 3):</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg max-h-60 overflow-y-auto">
                  {allTeachers.map(teacher => (
                    <label key={teacher.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                      <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => handleTeacherSelection(teacher.id)} disabled={!selectedTeacherIds.includes(teacher.id) && selectedTeacherIds.length >= 3} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span>{teacher.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-yellow-500 text-white rounded-lg">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (<p>Memuat data...</p>) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr><th className="p-4 text-left">Kelas</th><th className="p-4 text-left">Pengajar</th><th className="p-4 text-center">Aksi</th></tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50 border-b">
                  <td className="p-4 font-medium">{cls.name}</td>
                  <td className="p-4">{cls.teachers.length > 0 ? cls.teachers.map(t => t.name).join(', ') : "-"}</td>
                  <td className="p-4 text-center space-x-2">
                    <Link href={`/students?class_id=${cls.id}`}><button className="px-3 py-1 bg-blue-600 text-white rounded">Daftar Siswa</button></Link>
                    <Link href={`/attendance?class_id=${cls.id}`}><button className="px-3 py-1 bg-green-500 text-white rounded">Presensi</button></Link>
                    <button onClick={() => openEditModal(cls)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(cls.id)} className="px-3 py-1 bg-red-600 text-white rounded">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

