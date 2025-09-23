"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Plus, Pencil, Trash2 } from "lucide-react";

// PERUBAHAN: Tipe data 'no_induk' dihapus
type Teacher = {
  id: string;
  name: string;
  email: string;
};

// PERUBAHAN: Tipe data form 'no_induk' dihapus
type TeacherFormData = {
  id?: string;
  name: string;
  email: string;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // PERUBAHAN: State form disesuaikan
  const [formData, setFormData] = useState<TeacherFormData>({
    name: "",
    email: "",
  });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Gagal mengambil data");
      setTeachers(await res.json());
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data pengajar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // PERUBAHAN: Data pengajar diurutkan berdasarkan nama menggunakan useMemo
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers]);

  function openModalForAdd() {
    setIsEditMode(false);
    // PERUBAHAN: Inisialisasi form disesuaikan
    setFormData({ name: "", email: "" });
    setIsModalOpen(true);
  }

  function openModalForEdit(teacher: Teacher) {
    setIsEditMode(true);
    setFormData(teacher);
    setIsModalOpen(true);
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const url = isEditMode ? `/api/teachers/${formData.id}` : "/api/teachers";
      const method = isEditMode ? "PUT" : "POST";
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Terjadi kesalahan pada server");
        }
        setIsModalOpen(false);
        await fetchTeachers();
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : "Terjadi kesalahan");
      }
    },
    [isEditMode, formData, fetchTeachers]
  );

  const handleDelete = useCallback(
    async (id: string) => {
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
    },
    [fetchTeachers]
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">

        {/* Header (tidak ada perubahan) */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Manajemen Pengajar
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola data semua pengajar di TPQ Miftahul Huda.
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

        {/* Tombol Tambah (tidak ada perubahan) */}
        <div className="mb-6">
          <button
            onClick={openModalForAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
          >
            <Plus size={18} />
            <span>Tambah Pengajar</span>
          </button>
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">{isEditMode ? "Edit Data Pengajar" : "Tambah Pengajar Baru"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* PERUBAHAN: Input 'Nomor Induk' dihapus */}
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

        {/* Tabel Data */}
        {loading ? (<p className="text-center text-gray-500 py-8">Memuat data...</p>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  {/* PERUBAHAN: Header tabel diubah */}
                  <th className="p-4 font-semibold w-16">No.</th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* PERUBAHAN: Mapping menggunakan 'sortedTeachers' dan 'index' untuk nomor urut */}
                {sortedTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 border-b last:border-b-0">
                    <td className="p-4 whitespace-nowrap text-center">{index + 1}</td>
                    <td className="p-4 font-medium text-gray-800 whitespace-nowrap">{teacher.name}</td>
                    <td className="p-4 text-gray-600 whitespace-nowrap">{teacher.email || "-"}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModalForEdit(teacher)}
                          className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                          title="Edit Pengajar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title="Hapus Pengajar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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