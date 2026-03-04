import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import EmailVerificationGate from "@/components/EmailVerificationGate";

// Pages
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Focus from "@/pages/Focus";
import AI from "@/pages/AI";
import SupportTicketPage from "@/pages/SupportTicketPage";
import Admin from "@/pages/Admin";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Firebase is figuring out who you are
  if (loading) return <div className="min-h-screen bg-background" />;

  // Not logged in → go login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <div className="min-h-screen bg-background" />;

  // Logged in users should NOT see login/signup pages
  if (user) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default function App() {
  const { user, loading, needsOnboarding } = useAuth();

  // Prevent weird flashes
  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <>
      {/* Blocks only email/password unverified users */}
      <EmailVerificationGate />

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />

        {/* If your app has a signup page separate, add it here too */}
        {/* <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} /> */}

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              {needsOnboarding ? <Navigate to="/onboarding" replace /> : <Home />}
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
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

        <Route
          path="/support"
          element={
            <RequireAuth>
              <SupportTicketPage />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <Admin />
            </RequireAuth>
          }
        />

        {/* Root route behavior */}
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

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to={user ? "/home" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}
