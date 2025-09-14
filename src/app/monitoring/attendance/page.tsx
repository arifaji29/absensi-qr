"use client";

import { Suspense } from "react";
import MonitoringAttendanceContent from "./MonitoringAttendanceContent"; // tanpa {}

export default function MonitoringAttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MonitoringAttendanceContent />
    </Suspense>
  );
}
