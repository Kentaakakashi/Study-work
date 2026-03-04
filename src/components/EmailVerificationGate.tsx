import { useEffect, useMemo, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { sendWelcomeEmailOnce } from "@/lib/welcomeEmail";

const CONTINUE_URL = "https://study-zen.netlify.app/home";
const AUTO_SEND_KEY = "studyzen_verification_autosent_v1";

function friendlyAuthError(e: any) {
  const code = e?.code || "";
  if (code === "auth/unauthorized-continue-uri") {
    return `Firebase blocked the link. Add "study-zen.netlify.app" to Firebase Auth → Settings → Authorized domains.`;
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Wait a bit, then try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network issue. Try again on stable internet (Wi-Fi if possible).";
  }
  return e?.message || "Couldn’t send verification email";
}

export default function EmailVerificationGate() {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  const providerIds = useMemo(() => {
    return (user?.providerData || [])
      .map((p) => p.providerId)
      .filter(Boolean);
  }, [user]);

  const isPasswordUser = useMemo(() => providerIds.includes("password"), [providerIds]);
  const isGoogleUser = useMemo(() => providerIds.includes("google.com"), [providerIds]);

  // Block ONLY email/password users who aren't verified (ignore google sign-in)
  const needsVerification = useMemo(() => {
    if (!user) return false;
    return isPasswordUser && !isGoogleUser && !user.emailVerified;
  }, [user, isPasswordUser, isGoogleUser]);

  // Send welcome email once after verification (or for Google users)
  useEffect(() => {
    const run = async () => {
      if (!user) return;

      if (isGoogleUser) {
        await sendWelcomeEmailOnce();
        return;
      }

      if (!needsVerification && user.emailVerified) {
        await sendWelcomeEmailOnce();
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.emailVerified, needsVerification, isGoogleUser]);

  const doSendVerification = async () => {
    if (!user) return;
    setSending(true);
    try {
      await sendEmailVerification(user, {
        url: CONTINUE_URL,
        handleCodeInApp: false,
      });
      toast("Verification email sent ✅ Check inbox + spam.");
    } catch (e: any) {
      console.error(e);
      toast(friendlyAuthError(e));
    } finally {
      setSending(false);
    }
  };

  // ✅ Auto-send once per session when the gate first appears
  useEffect(() => {
    if (!needsVerification || !user) return;

    const already = sessionStorage.getItem(AUTO_SEND_KEY);
    if (already === "1") return;

    sessionStorage.setItem(AUTO_SEND_KEY, "1");
    doSendVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsVerification, user?.uid]);

  const iVerified = async () => {
    if (!user) return;
    setChecking(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        toast("Verified ✅ Welcome in.");
        await sendWelcomeEmailOnce();
      } else {
        toast("Still not verified. Click the link in the email first.");
      }
    } catch (e: any) {
      console.error(e);
      toast(e?.message || "Couldn’t refresh verification status");
    } finally {
      setChecking(false);
    }
  };

  if (!needsVerification) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border/40 bg-background/90 shadow-2xl p-6">
        <h2 className="text-xl font-bold">Verify your email</h2>

        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          You’re logged in, but you can’t use Study Zen until you verify your email.
          We sent a verification link to{" "}
          <span className="font-semibold">{user?.email}</span>.
          Check spam too. Email providers love drama.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={doSendVerification}
            disabled={sending}
            className="w-full glow-button py-3 rounded-2xl font-semibold disabled:opacity-60"
          >
            {sending ? "Sending..." : "Resend verification email"}
          </button>

          <button
            onClick={iVerified}
            disabled={checking}
            className="w-full bg-secondary/40 hover:bg-secondary/55 transition py-3 rounded-2xl font-semibold disabled:opacity-60"
          >
            {checking ? "Checking..." : "I verified, continue"}
          </button>

          <button
            onClick={logout}
            className="w-full bg-destructive/20 hover:bg-destructive/30 transition py-3 rounded-2xl font-semibold text-destructive"
          >
            Logout
          </button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          If email still doesn’t arrive: Firebase Auth → Settings → Authorized domains → add{" "}
          <span className="font-semibold">study-zen.netlify.app</span>.
        </div>
      </div>
    </div>
  );
}
