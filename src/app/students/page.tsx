// src/app/students/page.tsx
import { Suspense } from "react";
import StudentsContent from "./StudentsContent";

export default function StudentsPageWrapper() {
  return (
    <Suspense fallback={<p>Memuat daftar siswa...</p>}>
      <StudentsContent />
    </Suspense>
  );
}
