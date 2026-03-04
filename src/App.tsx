import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import EmailVerificationGate from "@/components/EmailVerificationGate";

// ✅ Your actual pages that exist
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Planner from "@/pages/Planner";
import Community from "@/pages/Community";
import Friends from "@/pages/Friends";
import Stats from "@/pages/Stats";
import Leaderboard from "@/pages/Leaderboard";
import Badges from "@/pages/Badges";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";

import Focus from "@/pages/Focus";
import AI from "@/pages/AI";

// Support pages
import Support from "@/pages/Support";
import SupportNew from "@/pages/SupportNew";
import SupportTicketPage from "@/pages/SupportTicketPage";

// Admin pages
import Admin from "@/pages/Admin";
import AdminTickets from "@/pages/AdminTickets";
import AdminTicket from "@/pages/AdminTicket";

import NotFound from "@/pages/NotFound";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-background" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <div className="min-h-screen bg-background" />;

  if (user) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default function App() {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <>
      {/* ✅ Blocks only email/password unverified users */}
      <EmailVerificationGate />

      <Routes>
        {/* ✅ Public */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Landing />
            </PublicOnly>
          }
        />

        {/* ✅ Onboarding */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        {/* ✅ Main protected routes (matches your sidebar) */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              {needsOnboarding ? <Navigate to="/onboarding" replace /> : <Home />}
            </RequireAuth>
          }
        />

        <Route
          path="/planner"
          element={
            <RequireAuth>
              <Planner />
            </RequireAuth>
          }
        />

        <Route
          path="/community"
          element={
            <RequireAuth>
              <Community />
            </RequireAuth>
          }
        />

        <Route
          path="/friends"
          element={
            <RequireAuth>
              <Friends />
            </RequireAuth>
          }
        />

        <Route
          path="/stats"
          element={
            <RequireAuth>
              <Stats />
            </RequireAuth>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <Leaderboard />
            </RequireAuth>
          }
        />

        <Route
          path="/badges"
          element={
            <RequireAuth>
              <Badges />
            </RequireAuth>
          }
        />

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />

        <Route
          path="/focus/*"
          element={
            <RequireAuth>
              <Focus />
            </RequireAuth>
          }
        />

        <Route
          path="/ai"
          element={
            <RequireAuth>
              <AI />
            </RequireAuth>
          }
        />

        {/* ✅ Support */}
        <Route
          path="/support"
          element={
            <RequireAuth>
              <Support />
            </RequireAuth>
          }
        />
        <Route
          path="/support/new"
          element={
            <RequireAuth>
              <SupportNew />
            </RequireAuth>
          }
        />
        <Route
          path="/support/:ticketId"
          element={
            <RequireAuth>
              <SupportTicketPage />
            </RequireAuth>
          }
        />

        {/* ✅ Admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Admin />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <RequireAuth>
              <AdminTickets />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/tickets/:ticketId"
          element={
            <RequireAuth>
              <AdminTicket />
            </RequireAuth>
          }
        />

        {/* ✅ Root behavior */}
        <Route
          path="/"
          element={
            user ? (
              needsOnboarding ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <Navigate to="/home" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ✅ Not found */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}
