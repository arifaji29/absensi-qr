"use client";

import { useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";


export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ==========================================================
      // PERUBAHAN UTAMA: Gunakan fetch API untuk kontrol penuh
      // ==========================================================
      const response = await fetch(
        // Pastikan URL env Anda sudah benar
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/register-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Gunakan Anon Key untuk otorisasi
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email, name, password }),
        }
      );

      // Ambil data JSON dari respons
      const responseData = await response.json();

      // Jika respons GAGAL (status bukan 2xx), lempar error dengan pesan dari body
      if (!response.ok) {
        // 'responseData.error' adalah pesan yang kita kirim dari Edge Function
        throw new Error(responseData.error || 'Terjadi kesalahan tidak diketahui.');
      }

      // Jika respons SUKSES
      alert("Pendaftaran berhasil! Anda sekarang dapat login.");
      router.push("/login");

    } catch (err: any) {
      // Tangkap dan tampilkan error di UI
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 space-y-4">
        <h1 className="text-xl font-bold text-green-700 text-center">
          Buat Akun Baru
        </h1>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password (min 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
          <div className="text-center text-sm text-gray-600 pt-2">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-green-600 hover:underline">
              Login di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}