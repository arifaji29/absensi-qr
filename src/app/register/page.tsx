"use client";

import { useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/register-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email, name, password }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Terjadi kesalahan tidak diketahui.');
      }

      // Gunakan custom alert atau modal di production
      alert("Pendaftaran berhasil! Silakan login dengan akun Anda.");
      router.push("/login");

    } catch (err: unknown) {
      if (err instanceof Error) {
        // Pesan error yang lebih ramah pengguna
        if (err.message.includes("User already registered")) {
            setError("Email ini sudah terdaftar. Silakan gunakan email lain atau login.");
        } else {
            setError(err.message);
        }
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4">
      
      {/* Logo Lingkaran */}
      <div className="mb-4">
          <div className="relative w-17 h-17 rounded-full overflow-hidden flex items-center justify-center shadow-md">
            <div className="w-[70px] h-[70px] rounded-full overflow-hidden flex items-center justify-center">
              <Image
                src="/logoTPQ.png"
                alt="Logo"
                width={70}
                height={70}
                className="rounded-full object-cover"
              />
            </div>
          </div>
      </div>

      {/* Blok Header */}
      <div className="text-center mb-5">
        <h1 className="text-3xl md:text-4xl font-bold text-green-800">
          SIABSOR
        </h1>
        <h2 className="text-md sm:text-lg font-semibold text-green-800 mt-1">
          Sistem Absensi dan Monitoring Siswa
        </h2>
        <p className="mt-2 text-xl sm:text-2xl font-semibold text-green-600">
          TPQ MIFTAKHUL HUDA WERDI
        </p>
      </div>

      {/* Formulir Registrasi */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-green-700 text-center">
          Buat Akun Baru
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center font-semibold bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
            disabled={loading}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded pr-10 focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
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
