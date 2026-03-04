import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * Sends a welcome email ONCE per user (tracked in profiles/{uid}.welcomeEmailSent).
 * Uses Netlify Function: /.netlify/functions/send-welcome (Resend API)
 */
async function callWelcome(to: string, name?: string) {
  await fetch("/.netlify/functions/send-welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, name }),
  });
}

export async function sendWelcomeEmailOnce() {
  const user = auth.currentUser;
  if (!user?.uid || !user.email) return;

  const profileRef = doc(db, "profiles", user.uid);
  const snap = await getDoc(profileRef);

  // Already sent → do nothing
  if (snap.exists() && snap.get("welcomeEmailSent") === true) return;

  const name =
    user.displayName ||
    (snap.exists() ? (snap.get("displayName") as string) : "") ||
    (snap.exists() ? (snap.get("username") as string) : "") ||
    "there";

  try {
    await callWelcome(user.email, name);
  } catch (e) {
    // Don’t block the app if email sending fails
    console.warn("Welcome email failed (non-blocking):", e);
    return;
  }

  // Mark as sent so we never spam the user
  await setDoc(
    profileRef,
    {
      welcomeEmailSent: true,
      welcomeEmailSentAt: serverTimestamp(),
    },
    { merge: true }
  );
}
