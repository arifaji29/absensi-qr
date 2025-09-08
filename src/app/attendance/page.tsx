"use client";

import { Suspense } from "react";
import AttendanceContent from "./AttendanceContent";

export default function AttendancePage() {
  return (
    <Suspense fallback={<p>Memuat halaman absensi...</p>}>
      <AttendanceContent />
    </Suspense>
  );
}
