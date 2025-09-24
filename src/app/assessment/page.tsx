import { Suspense } from "react";
import AssessmentContent from "./AssessmentContent";

export default function AssessmentPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Memuat halaman...</p>}>
      <AssessmentContent />
    </Suspense>
  );
}
