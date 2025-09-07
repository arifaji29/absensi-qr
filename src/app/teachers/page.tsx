"use client";

import { useEffect, useState, useCallback } from "react";

type Teacher = { id: string; no_induk: string; name: string; email: string; };
type TeacherFormData = { id?: string; no_induk: string; name: string; email: string; };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<TeacherFormData>({ no_induk: "", name: "", email: "" });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Gagal mengambil data");
      setTeachers(await res.json());
    } catch (error: unknown) {
      // PERBAIKAN: Gunakan variabel 'error'
      console.error(error);
      alert("Gagal memuat data pengajar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  function openModalForAdd() {
    setIsEditMode(false);
    setFormData({ no_induk: "", name: "", email: "" });
    setIsModalOpen(true);
  }

  function openModalForEdit(teacher: Teacher) {
    setIsEditMode(true);
    setFormData(teacher);
    setIsModalOpen(true);
  }
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditMode ? `/api/teachers/${formData.id}` : "/api/teachers";
    const method = isEditMode ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Terjadi kesalahan pada server");
      }
      setIsModalOpen(false);
      await fetchTeachers();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  }, [isEditMode, formData, fetchTeachers]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengajar ini?")) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menghapus pengajar");
      }
      await fetchTeachers();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  }, [fetchTeachers]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pengajar</h1>
        <button onClick={openModalForAdd} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold">
          + Tambah Pengajar
        </button>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? "Edit Data Pengajar" : "Tambah Pengajar Baru"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nomor Induk" value={formData.no_induk} onChange={(e) => setFormData({ ...formData, no_induk: e.target.value })} className="border p-3 w-full rounded-lg" required />
              <input type="text" placeholder="Nama Lengkap" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border p-3 w-full rounded-lg" required />
              <input type="email" placeholder="Alamat Email (Opsional)" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border p-3 w-full rounded-lg" />
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">{isEditMode ? "Update" : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? (<p>Memuat data...</p>) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr><th className="p-4 text-left">Nomor Induk</th><th className="p-4 text-left">Nama</th><th className="p-4 text-left">Email</th><th className="p-4 text-center">Aksi</th></tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 border-b last:border-b-0">
                  <td className="p-4">{teacher.no_induk}</td><td className="p-4 font-medium">{teacher.name}</td><td className="p-4 text-gray-600">{teacher.email || "-"}</td>
                  <td className="p-4 text-center space-x-2">
                    <button onClick={() => openModalForEdit(teacher)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                    <button onClick={() => handleDelete(teacher.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Hapus</button>
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

