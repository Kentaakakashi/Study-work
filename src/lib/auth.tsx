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

async function upsertProfile(u: User) {
  await setDoc(
    doc(db, "profiles", u.uid),
    {
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "User",
      photoURL: u.photoURL || "",
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
      if (u) {
        try {
          await upsertProfile(u);
          const tok = await getIdToken(u, true);
          setIdToken(tok);
          await setPresence(u.uid, true, "online");
        } catch {
          // ignore
        }
      } else {
        setIdToken(null);
      }
    });

    const vis = async () => {
      const u = auth.currentUser;
      if (!u) return;
      try {
        await setPresence(u.uid, true, document.hidden ? "idle" : "online");
      } catch {}
    };

    document.addEventListener("visibilitychange", vis);
    window.addEventListener("beforeunload", () => {
      const u = auth.currentUser;
      if (!u) return;
      // best-effort (can't await)
      setPresence(u.uid, false, "idle").catch(() => {});
    });

    return () => {
      document.removeEventListener("visibilitychange", vis);
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
        await upsertProfile(cred.user);
        setIdToken(await getIdToken(cred.user, true));
      },
      signInEmail: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await upsertProfile(cred.user);
        setIdToken(await getIdToken(cred.user, true));
      },
      signInGoogle: async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await upsertProfile(cred.user);
        setIdToken(await getIdToken(cred.user, true));
      },
      logout: async () => {
        const u = auth.currentUser;
        if (u) await setPresence(u.uid, false, "idle").catch(() => {});
        await signOut(auth);
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
