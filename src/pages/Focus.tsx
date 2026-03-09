import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";
import FocusTechniques from "./FocusTechniques";
import FocusMusic from "./FocusMusic";
import FocusAmbientShell from "@/components/focus/FocusAmbientShell";

export default function Focus() {

  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      <FocusAmbientShell
        onOpenMusic={() => navigate("/focus/music")}
      >

        <Routes>
          <Route index element={<Navigate to="pomodoro" replace />} />

          <Route path="pomodoro" element={<Pomodoro />} />

          <Route path="stopwatch" element={<Stopwatch />} />

          <Route path="techniques" element={<FocusTechniques />} />

          <Route path="music" element={<FocusMusic />} />

          <Route path="*" element={<Navigate to="pomodoro" replace />} />
        </Routes>

      </FocusAmbientShell>

    </div>
  );
}
