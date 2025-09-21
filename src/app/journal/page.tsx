"use client";

import { Suspense } from "react";
import JournalPageClient from "./JournalPageClient";

export default function JournalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat halaman jurnal...</div>}>
      <JournalPageClient />
    </Suspense>
  );
}
