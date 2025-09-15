"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // State untuk pesan sukses
  const router = useRouter();

  // Gunakan client yang konsisten dengan halaman login
  const supabase = createClientComponentClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // (Opsional) Arahkan pengguna ke halaman ini setelah klik link verifikasi
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      // Tampilkan pesan sukses, jangan langsung redirect
      setSuccessMessage("Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.");
      setEmail(""); // Kosongkan form
      setPassword("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 space-y-4">
        <h1 className="text-xl font-bold text-green-700 text-center">
          Buat Akun Baru
        </h1>

        {/* Jika pendaftaran sukses, tampilkan pesan ini */}
        {successMessage ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            <p className="font-bold">Pendaftaran Berhasil!</p>
            <p className="text-sm">{successMessage}</p>
            <Link href="/login" className="font-bold hover:underline mt-2 inline-block">
              Kembali ke Login
            </Link>
          </div>
        ) : (
          /* Jika belum, tampilkan form pendaftaran */
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Daftar
            </button>
            <div className="text-center text-sm text-gray-600 pt-2">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-semibold text-green-600 hover:underline">
                Login di sini
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}