import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase"; // make sure you export functions instance

export async function callWelcomeEmail(payload: {
  uid: string;
  email: string;
  displayName: string;
  provider: string;
}) {
  try {
    const fn = httpsCallable(functions, "sendWelcomeEmailOnce");
    await fn(payload);
  } catch (e) {
    // don't block UI if email fails
    console.warn("Welcome email failed (non-blocking):", e);
  }
}
