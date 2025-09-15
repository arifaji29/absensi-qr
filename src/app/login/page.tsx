"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from 'next/link'; // 1. Import Link dari Next.js

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-green-700 text-center">Login</h1>
        
        {/* 2. Logika cerdas untuk menampilkan pesan error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center text-sm">
            {/* Cek apakah error karena kredensial tidak valid */}
            {error.toLowerCase().includes("invalid login credentials") ? (
              <span>
                Email atau password salah.
                <br />
                Belum punya akun?{' '}
                <Link href="/register" className="font-bold hover:underline">
                  Daftar di sini.
                </Link>
              </span>
            ) : (
              // Tampilkan pesan error umum jika bukan karena kredensial
              <span>{error}</span>
            )}
          </div>
        )}

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Login
        </button>

        {/* 3. Link pendaftaran permanen untuk UX yang lebih baik */}
        <div className="text-center text-sm text-gray-600 pt-2">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-green-600 hover:underline">
              Daftar sekarang
            </Link>
        </div>
      </form>
    </div>
  );
}