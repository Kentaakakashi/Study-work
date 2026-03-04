import { Routes, Route, Navigate } from "react-router-dom";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";

export default function Focus() {
  return (
    <Routes>
      {/* /focus -> /focus/pomodoro */}
      <Route index element={<Navigate to="pomodoro" replace />} />

      {/* /focus/pomodoro */}
      <Route path="pomodoro" element={<Pomodoro />} />

      {/* /focus/stopwatch */}
      <Route path="stopwatch" element={<Stopwatch />} />

      {/* anything else under /focus -> go pomodoro */}
      <Route path="*" element={<Navigate to="pomodoro" replace />} />
    </Routes>
  );
}
