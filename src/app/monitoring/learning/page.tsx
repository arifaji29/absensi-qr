import { Suspense } from "react";
import LearningMonitoringContent from "./LearningMonitoringContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Memuat halaman...</div>}>
      <LearningMonitoringContent />
    </Suspense>
  );
}
