import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import BackgroundBlobs from "@/components/layout/BackgroundBlobs";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Pomodoro from "./pages/Pomodoro";
import Stopwatch from "./pages/Stopwatch";
import Planner from "./pages/Planner";
import Community from "./pages/Community";
import Friends from "./pages/Friends";
import Stats from "./pages/Stats";
import AITutor from "./pages/AITutor";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PostThread from "./pages/PostThread";
import Notifications from "./pages/Notifications";
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <>
              <BackgroundBlobs />
              <Landing />
            </>
          }
        />
        <Route
          path="/onboarding"
          element={
            <>
              <BackgroundBlobs />
              <Onboarding />
            </>
          }
        />

        {/* App shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/focus/pomodoro" element={<Pomodoro />} />
          <Route path="/focus/stopwatch" element={<Stopwatch />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:postId" element={<PostThread />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai" element={<AITutor />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
