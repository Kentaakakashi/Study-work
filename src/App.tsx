import "./App.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import EmailVerificationGate from "@/components/EmailVerificationGate";
import BootGate from "@/components/BootGate";

// Layout
import AppLayout from "@/components/layout/AppLayout";
import OwnerRoute from "@/components/OwnerRoute";

// Pages (public + onboarding)
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";


// Pages (main)
import Home from "@/pages/Home";
import Planner from "@/pages/Planner";
import Community from "@/pages/Community";
import PostThread from "@/pages/PostThread";
import Friends from "@/pages/Friends";
import Stats from "@/pages/Stats";
import Leaderboard from "@/pages/Leaderboard";
import Badges from "@/pages/Badges";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";

import Focus from "@/pages/Focus";
import AI from "@/pages/AI";

// Support
import Support from "@/pages/Support";
import SupportNew from "@/pages/SupportNew";
import SupportTicketPage from "@/pages/SupportTicketPage";

// Admin
import Admin from "@/pages/Admin";
import AdminTickets from "@/pages/AdminTickets";
import AdminTicket from "@/pages/AdminTicket";
import AdminUserRemoval from "@/pages/AdminUserRemoval";
import AdminAmbientScenes from "@/pages/AdminAmbientScenes";

import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import SiteClosed from "@/pages/SiteClosed";
const SITE_CLOSED = true;

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
      <EmailVerificationGate />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Landing />
            </PublicOnly>
          }
        />

        <Route path="/u/:username" element={<Profile />} />

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <BootGate>
                <AppLayout />
              </BootGate>
            </RequireAuth>
          }
        >
          <Route
            path="/home"
            element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <Home />}
          />
          <Route path="/planner" element={<Planner />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:postId" element={<PostThread />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/focus/*" element={<Focus />} />
          <Route path="/ai" element={<AI />} />

          <Route path="/support" element={<Support />} />
          <Route path="/support/new" element={<SupportNew />} />
          <Route path="/support/:ticketId" element={<SupportTicketPage />} />

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
          <Route
            path="/admin/user-removal"
            element={
              <OwnerRoute>
                <AdminUserRemoval />
              </OwnerRoute>
            }
          />
          <Route
            path="/admin/ambient-scenes"
            element={
              <OwnerRoute>
                <AdminAmbientScenes />
              </OwnerRoute>
            }
          />
        </Route>

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

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}


          
