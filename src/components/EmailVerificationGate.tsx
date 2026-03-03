import { useEffect, useMemo, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { callWelcomeEmail } from "@/lib/welcomeEmail";

export default function EmailVerificationGate() {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const needsVerification = useMemo(() => {
    if (!user) return false;

    const isPasswordProvider = user.providerData?.some(
      (p) => p.providerId === "password"
    );

    // Only block email/password users, never Google users
    return isPasswordProvider && !user.emailVerified;
  }, [user]);

  useEffect(() => {
    // If user is verified now, send welcome email once (safe/no duplicates)
    const run = async () => {
      if (!user) return;
      if (!needsVerification && user.emailVerified) {
        await callWelcomeEmail({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          provider: user.providerData?.[0]?.providerId || "unknown",
        });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsVerification, user?.uid, user?.emailVerified]);

  const resend = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user, {
        url: "https://study-zen.netlify.app/home",
        handleCodeInApp: false,
      });
      toast("Verification email sent ✅ Check your inbox/spam.");
    } catch (e: any) {
      console.error(e);
      toast(e?.message || "Couldn’t send verification email");
    }
  };

  const iVerified = async () => {
    if (!user) return;
    setChecking(true);
    try {
      await user.reload(); // refresh emailVerified from Firebase
      if (user.emailVerified) {
        toast("Verified ✅ Welcome in.");
        await callWelcomeEmail({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          provider: "password",
        });
      } else {
        toast("Still not verified. Check the email and click the link.");
      }
    } catch (e: any) {
      console.error(e);
      toast(e?.message || "Couldn’t refresh verification status");
    } finally {
      setChecking(false);
    }
  };

  if (!needsVerification) return null;

  // 🚫 Unclosable overlay
  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border/40 bg-background/90 shadow-2xl p-6">
        <h2 className="text-xl font-bold">Verify your email</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          You’re logged in, but you can’t use Study Zen until you verify your email.
          We sent a verification link to <span className="font-semibold">{user?.email}</span>.
          Check spam too. Email providers love drama.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={resend}
            className="w-full glow-button py-3 rounded-2xl font-semibold"
          >
            Resend verification email
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
      </div>
    </div>
  );
}
