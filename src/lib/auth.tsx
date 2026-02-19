import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  getIdToken,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  idToken: string | null;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Mirror identity info into both profiles + stats so leaderboard can show real names.
async function upsertProfileAndStats(u: User) {
  const profileRef = doc(db, "profiles", u.uid);
  const statsRef = doc(db, "stats", u.uid);

  const displayName = u.displayName || "User";
  const photoURL = u.photoURL || "";

  // profiles/{uid}
  await setDoc(
    profileRef,
    {
      uid: u.uid,
      email: u.email || "",
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // stats/{uid} (leaderboard reads this, so it needs displayName/photoURL/username)
  // username is typically set later by your username-claim flow -> keep null until then
  await setDoc(
    statsRef,
    {
      uid: u.uid,
      displayName,
      photoURL,
      username: null,

      // initialize counters if missing
      xp: 0,
      totalMinutes: 0,
      todayMinutes: 0,
      weeklyMinutes: 0,
      streak: 0,
      lastStudyDay: null,

      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function setPresence(uid: string, online: boolean, status: string = "online") {
  await setDoc(
    doc(db, "presence", uid),
    {
      online,
      status,
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (!u) {
        setIdToken(null);
        return;
      }

      try {
        // Ensure docs exist + leaderboard fields are available
        await upsertProfileAndStats(u);

        // Token (don’t force refresh every time)
        const tok = await getIdToken(u);
        setIdToken(tok);

        // Online presence
        await setPresence(u.uid, true, document.hidden ? "idle" : "online");
      } catch {
        // ignore (don’t break UI if firestore fails)
      }
    });

    const onVis = async () => {
      const u = auth.currentUser;
      if (!u) return;
      try {
        await setPresence(u.uid, true, document.hidden ? "idle" : "online");
      } catch {}
    };

    document.addEventListener("visibilitychange", onVis);

    const onUnload = () => {
      const u = auth.currentUser;
      if (!u) return;
      // best-effort (can't await)
      setPresence(u.uid, false, "idle").catch(() => {});
    };

    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onUnload);
      unsub();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      idToken,

      signUpEmail: async (email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await upsertProfileAndStats(cred.user);
        setIdToken(await getIdToken(cred.user));
        await setPresence(cred.user.uid, true, "online").catch(() => {});
      },

      signInEmail: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await upsertProfileAndStats(cred.user);
        setIdToken(await getIdToken(cred.user));
        await setPresence(cred.user.uid, true, "online").catch(() => {});
      },

      signInGoogle: async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await upsertProfileAndStats(cred.user);
        setIdToken(await getIdToken(cred.user));
        await setPresence(cred.user.uid, true, "online").catch(() => {});
      },

      logout: async () => {
        const u = auth.currentUser;
        if (u) await setPresence(u.uid, false, "idle").catch(() => {});
        await signOut(auth);
        setIdToken(null);
      },
    }),
    [user, loading, idToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
