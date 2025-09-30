import { Suspense } from "react";
import InfaqMonitoringContent from "./InfaqMonitoringContent";

export default function InfaqMonitoringPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Memuat halaman monitoring infaq...</p>}>
      <InfaqMonitoringContent />
    </Suspense>
  );
}