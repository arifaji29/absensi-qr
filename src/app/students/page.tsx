"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createRoot } from "react-dom/client";

// Tipe data yang digunakan
type Student = { 
  id: string; 
  nis: string; 
  name: string; 
  gender: string; 
  date_of_birth: string | null; 
  class_id?: string | null; 
};
type Class = { 
  id: string; 
  name: string; 
};

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const classIdFromUrl = searchParams.get("class_id") || "";
  
  // --- STATE YANG HILANG DIKEMBALIKAN DI SINI ---
  const [selectedClassId, setSelectedClassId] = useState("");
  const activeClassId = classIdFromUrl || selectedClassId;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [className, setClassName] = useState("");
  
  const [form, setForm] = useState({
    nis: "",
    name: "",
    gender: "Laki-laki",
    date_of_birth: "",
    class_id: activeClassId,
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- FUNGSI LOAD DATA DIPERBARUI UNTUK MENGGUNAKAN activeClassId ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<Response>[] = [
        fetch("/api/classes"),
        fetch(`/api/students${activeClassId ? `?class_id=${activeClassId}` : ""}`),
      ];

      // Jika ada classId di URL, ambil juga detail nama kelasnya untuk judul
      if (classIdFromUrl) {
        promises.push(fetch(`/api/classes/${classIdFromUrl}/details`));
      }

      const responses = await Promise.all(promises);
      const [classRes, studentRes, classDetailRes] = responses;

      if (!classRes.ok || !studentRes.ok) throw new Error("Gagal memuat data utama");
      
      setClasses(await classRes.json());
      setStudents(await studentRes.json());
      
      if (classIdFromUrl && classDetailRes && classDetailRes.ok) {
        setClassName((await classDetailRes.json()).name);
      } else {
        setClassName(""); // Reset nama kelas jika tidak ada ID di URL
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [activeClassId, classIdFromUrl]); // Dependensi diperbarui

  useEffect(() => { 
    loadData(); 
  }, [loadData]);


function downloadQR(student: Student) {
  const qrClassName = className || classes.find((c) => c.id === student.class_id)?.name || "-";
  const temp = document.createElement("div");
  document.body.appendChild(temp);
  const root = createRoot(temp);
  root.render( <QRCodeCanvas value={JSON.stringify({ nis: student.nis, name: student.name, class: qrClassName })} size={220} includeMargin /> );
  setTimeout(() => {
    const qrCanvas = temp.querySelector("canvas");
    if (!qrCanvas) { root.unmount(); document.body.removeChild(temp); return; }
    const finalCanvas = document.createElement("canvas");
    const padding = 20, textBlockH = 80;
    finalCanvas.width = qrCanvas.width + padding * 2;
    finalCanvas.height = qrCanvas.height + padding + textBlockH;
    const ctx = finalCanvas.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(qrCanvas, padding, padding);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    let y = padding + qrCanvas.height + 15;
    ctx.font = "16px Arial";
    ctx.fillText(student.nis, finalCanvas.width / 2, y); y += 22;
    ctx.fillText(student.name, finalCanvas.width / 2, y); y += 22;
    ctx.fillText(qrClassName, finalCanvas.width / 2, y);
    const link = document.createElement("a");
    link.href = finalCanvas.toDataURL("image/png");
    link.download = `QR_${student.name}_${student.nis}.png`;
    link.click();
    root.unmount();
    document.body.removeChild(temp);
  }, 100);
}

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, class_id: activeClassId }), });
      if (!res.ok) throw new Error("Gagal menambah siswa");
      setShowAddModal(false);
      resetForm();
      await loadData();
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    try {
      const res = await fetch(`/api/students/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), });
      if (!res.ok) throw new Error("Gagal mengedit siswa");
      setShowEditModal(false);
      await loadData();
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus siswa");
      await loadData();
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message);
    }
  }

  function openEditModal(student: Student) {
    setEditingId(student.id);
    setForm({
      nis: student.nis,
      name: student.name,
      gender: student.gender,
      date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
      class_id: student.class_id || activeClassId,
    });
    setShowEditModal(true);
  }

  function resetForm() {
    setForm({ nis: "", name: "", gender: "Laki-laki", date_of_birth: "", class_id: activeClassId, });
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Daftar Siswa {className ? `Kelas ${className}` : ""}
      </h1>

      {!classIdFromUrl && (
        <div className="mb-6">
          <label className="mr-2 font-medium">Filter Kelas:</label>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="border p-2 rounded">
            <option value="">Semua Kelas</option>
            {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
          </select>
        </div>
      )}

      {classIdFromUrl && (
        <div className="flex gap-3 mb-6">
          <Link href="/classes">
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Kembali ke Kelas</button>
          </Link>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Tambah Siswa</button>
        </div>
      )}

      {loading ? (<p>Memuat data siswa...</p>) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">NIS</th>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Gender</th>
                <th className="p-3 text-left">Tanggal Lahir</th>
                <th className="p-3 text-left">Kelas</th>
                {classIdFromUrl && <th className="p-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={classIdFromUrl ? 6 : 5} className="text-center p-4">Belum ada data.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="border-b p-3">{s.nis}</td>
                    <td className="border-b p-3">{s.name}</td>
                    <td className="border-b p-3">{s.gender}</td>
                    <td className="border-b p-3">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="border-b p-3">{classes.find((c) => c.id === s.class_id)?.name || "-"}</td>
                    {classIdFromUrl && (
                      <td className="border-b p-3 text-center space-x-2">
                        <button onClick={() => downloadQR(s)} className="px-2 py-1 bg-green-600 text-white rounded">QR</button>
                        <button onClick={() => openEditModal(s)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="px-2 py-1 bg-red-600 text-white rounded">Hapus</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
              <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg space-y-3 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-2">Tambah Siswa</h2>
                  <input type="text" placeholder="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} className="border p-2 w-full rounded"/>
                  <input type="text" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 w-full rounded" required/>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border p-2 w-full rounded">
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                  </select>
                  <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="border p-2 w-full rounded"/>
                  <div className="flex justify-end pt-4 space-x-3">
                      <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Batal</button>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Simpan</button>
                  </div>
              </form>
          </div>
      )}

      {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
              <form onSubmit={handleEdit} className="bg-white p-6 rounded-lg space-y-3 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-2">Edit Siswa</h2>
                  <input type="text" placeholder="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} className="border p-2 w-full rounded"/>
                  <input type="text" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 w-full rounded" required/>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border p-2 w-full rounded">
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                  </select>
                  <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="border p-2 w-full rounded"/>
                  <div className="flex justify-end pt-4 space-x-3">
                      <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Batal</button>
                      <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded">Update</button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
}

