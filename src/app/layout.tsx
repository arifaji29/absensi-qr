import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Siabsor TPQ Miftakhul Huda",
  description: "Sistem Absensi dan Monitoring Siswa TPQ Miftakhul Huda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 🚀 Paksa browser hanya pakai light mode */}
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          backgroundColor: "#ffffff", // paksa background putih
          color: "#000000", // paksa teks hitam
        }}
      >
        {children}
      </body>
    </html>
  );
}
