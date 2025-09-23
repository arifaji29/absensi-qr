"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Unlock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // State untuk loading
  const router = useRouter();

  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ================================================
    // === VALIDASI EMAIL DITERAPKAN DI SINI ===
    // ================================================
    if (!email.includes("gurutpq") && !email.includes("admintpq")) {
      setError("Hanya guru yang diizinkan untuk login.");
      setLoading(false);
      return; // Hentikan eksekusi jika email tidak valid
    }
    // ================================================

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      router.refresh();
      router.push("/");
    }
    
    setLoading(false); // Set loading ke false setelah selesai
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4">
      {/* Logo */}
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

      {/* Header */}
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

      {/* Form Login */}
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-green-700 text-center">Login</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center text-sm">
            {error.toLowerCase().includes("invalid login credentials") ? (
              <span>
                Email atau password salah.
                <br />
                Belum punya akun?{" "}
                <Link href="/register" className="font-bold hover:underline">
                  Daftar di sini.
                </Link>
              </span>
            ) : (
              <span>{error}</span>
            )}
          </div>
        )}

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
            placeholder="Password"
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
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Memproses..." : "Login"}
        </button>

        <div className="text-center text-sm text-gray-600 pt-2">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-green-600 hover:underline"
          >
            Daftar sekarang
          </Link>
        </div>

        {/* Tombol akses tanpa login */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition-colors"
          >
            <Unlock size={18} />
            Akses Tanpa Login Wali Siswa
          </Link>
        </div>
      </form>
    </div>
  );
}