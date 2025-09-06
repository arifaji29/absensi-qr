"use client";

import { useEffect, useState } from "react";

// Tipe data untuk satu pengajar
type Teacher = {
  id: string;
  no_induk: string;
  name: string;
  email: string;
};

// Tipe data untuk form, ID bersifat opsional
type TeacherFormData = {
  id?: string;
  no_induk: string;
  name: string;
  email: string;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk mengontrol modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State untuk data di dalam form
  const [formData, setFormData] = useState<TeacherFormData>({
    no_induk: "",
    name: "",
    email: "",
  });

  async function fetchTeachers() {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Gagal mengambil data");
      setTeachers(await res.json());
    } catch (error) {
      alert("Gagal memuat data pengajar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = isEditMode ? `/api/teachers/${formData.id}` : "/api/teachers";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(isEditMode ? "Gagal mengedit pengajar" : "Gagal menambah pengajar");
      
      setIsModalOpen(false);
      await fetchTeachers(); // Muat ulang data
    } catch (error) {
      // --- PERBAIKAN ERROR DI SINI ---
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Terjadi kesalahan yang tidak diketahui.");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus pengajar ini?")) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus pengajar");
      await fetchTeachers();
    } catch (error) {
      // --- PERBAIKAN ERROR DI SINI ---
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Terjadi kesalahan yang tidak diketahui.");
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pengajar</h1>
        <button
          onClick={openModalForAdd}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Tambah Pengajar
        </button>
      </div>

      {/* Modal untuk Tambah/Edit Pengajar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? "Edit Data Pengajar" : "Tambah Pengajar Baru"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nomor Induk"
                value={formData.no_induk}
                onChange={(e) => setFormData({ ...formData, no_induk: e.target.value })}
                className="border p-3 w-full rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border p-3 w-full rounded-lg"
                required
              />
              <input
                type="email"
                placeholder="Alamat Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border p-3 w-full rounded-lg"
              />
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">{isEditMode ? "Update" : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel daftar pengajar */}
      {loading ? (<p>Memuat data...</p>) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Nomor Induk</th>
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 border-b">
                  <td className="p-4">{teacher.no_induk}</td>
                  <td className="p-4 font-medium">{teacher.name}</td>
                  <td className="p-4">{teacher.email || "-"}</td>
                  <td className="p-4 text-center space-x-2">
                    <button onClick={() => openModalForEdit(teacher)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(teacher.id)} className="px-3 py-1 bg-red-600 text-white rounded">Hapus</button>
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

