import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import OwnerRoute from "@/components/OwnerRoute";
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Home from "./pages/Home";
import Focus from "./pages/Focus";
import Planner from "./pages/Planner";
import Community from "./pages/Community";
import Friends from "./pages/Friends";
import Stats from "./pages/Stats";
import Leaderboard from "./pages/Leaderboard";
import Badges from "./pages/Badges";
import Notifications from "./pages/Notifications";
import AI from "./pages/AI";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import SupportNew from "./pages/SupportNew";
import SupportTicketPage from "./pages/SupportTicketPage";
import Admin from "./pages/Admin";
import AdminTickets from "./pages/AdminTickets";

// ✅ The verification gate
import EmailVerificationGate from "@/components/EmailVerificationGate";

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* 🚫 Blocks unverified email/password users */}
      <EmailVerificationGate />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/focus/*" element={<Focus />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/community/*" element={<Community />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/settings" element={<Settings />} />

          {/* Support */}
          <Route path="/support" element={<Support />} />
          <Route path="/support/new" element={<SupportNew />} />
          <Route path="/support/:ticketId" element={<SupportTicketPage />} />

          {/* Owner-only */}
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
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}
