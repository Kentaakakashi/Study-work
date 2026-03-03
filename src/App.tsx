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

import Support from "./pages/Support";
import SupportNew from "./pages/SupportNew";
import SupportTicket from "./pages/SupportTicket";

import Admin from "./pages/Admin";
import AdminTickets from "./pages/AdminTickets";
import AdminTicket from "./pages/AdminTicket";

import ProtectedRoute from "@/components/ProtectedRoute";
import BootGate from "@/components/BootGate";
import OwnerRoute from "@/components/OwnerRoute";

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

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <BootGate>
                <AppLayout />
              </BootGate>
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

          {/* Support (for everyone logged in) */}
          <Route path="/support" element={<Support />} />
          <Route path="/support/new" element={<SupportNew />} />
          <Route path="/support/:ticketId" element={<SupportTicket />} />

          {/* Admin (owners only) */}
          <Route
            path="/admin"
            element={
              <OwnerRoute>
                <Admin />
              </OwnerRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <OwnerRoute>
                <AdminTickets />
              </OwnerRoute>
            }
          />
          <Route
            path="/admin/tickets/:ticketId"
            element={
              <OwnerRoute>
                <AdminTicket />
              </OwnerRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
