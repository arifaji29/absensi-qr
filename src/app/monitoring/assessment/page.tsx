import { Suspense } from "react";
import AssessmentMonitoringContent from "./AssessmentMonitoringContent";

export default function MonitoringAssessmentPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Memuat data monitoring...</p>}>
      <AssessmentMonitoringContent />
    </Suspense>
  );
}
