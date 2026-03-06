import { Routes, Route, Navigate } from "react-router-dom";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";
import FocusTechniques from "./FocusTechniques";
import FocusMusic from "./FocusMusic";

export default function Focus() {
  return (
    <Routes>
      <Route index element={<Navigate to="pomodoro" replace />} />
      <Route path="pomodoro" element={<Pomodoro />} />
      <Route path="stopwatch" element={<Stopwatch />} />
      <Route path="techniques" element={<FocusTechniques />} />
      <Route path="music" element={<FocusMusic />} />
      <Route path="*" element={<Navigate to="pomodoro" replace />} />
    </Routes>
  );
}
