import { Suspense } from "react";
import InfaqContent from "./InfaqContent";

export default function InfaqPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Memuat halaman infaq...</p>}>
      <InfaqContent />
    </Suspense>
  );
}