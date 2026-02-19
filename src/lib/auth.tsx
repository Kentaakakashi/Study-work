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
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type ProfileDoc = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username?: string;              // <-- important
  onboardingComplete?: boolean;   // <-- important
  createdAt?: any;
  updatedAt?: any;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;

  // ✅ NEW
  profile: ProfileDoc | null;
  profileLoading: boolean;
  needsOnboarding: boolean;

  idToken: string | null;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function upsertProfile(u: User) {
  const ref = doc(db, "profiles", u.uid);
  const snap = await getDoc(ref);

  // Only set createdAt when doc doesn't exist
  const base: Partial<ProfileDoc> = {
    uid: u.uid,
    email: u.email || "",
    displayName: u.displayName || "User",
    photoURL: u.photoURL || "",
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        ...base,
        createdAt: serverTimestamp(),
        onboardingComplete: false, // <-- default for new user
      },
      { merge: true }
    );
  } else {
    // Existing user: DO NOT wipe username/onboardingComplete
    await setDoc(ref, base, { merge: true });
  }
}

async function fetchProfile(uid: string) {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? (snap.data() as ProfileDoc) : null;
}

async function setPresence(uid: string, online: boolean, status: string = "online") {
  await setDoc(
    doc(db, "presence", uid),
    { online, status, lastSeen: serverTimestamp() },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  // ✅ NEW
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (!u) {
        setIdToken(null);
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);

        // Ensure profile exists but DO NOT overwrite username/onboarding
        await upsertProfile(u);

        // Fetch profile so the app knows if onboarding is done
        const p = await fetchProfile(u.uid);
        setProfile(p);

        // token (don’t force refresh every time)
        const tok = await getIdToken(u);
        setIdToken(tok);

        await setPresence(u.uid, true, document.hidden ? "idle" : "online");
      } catch {
        // best effort
      } finally {
        setProfileLoading(false);
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
      setPresence(u.uid, false, "idle").catch(() => {});
    });

    return () => {
      document.removeEventListener("visibilitychange", vis);
      unsub();
    };
  }, []);

  const needsOnboarding =
    !!user &&
    !profileLoading &&
    (!profile?.onboardingComplete || !profile?.username);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      profile,
      profileLoading,
      needsOnboarding,
      idToken,

      signUpEmail: async (email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await upsertProfile(cred.user);
        setProfile(await fetchProfile(cred.user.uid));
        setIdToken(await getIdToken(cred.user));
      },

      signInEmail: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await upsertProfile(cred.user);
        setProfile(await fetchProfile(cred.user.uid));
        setIdToken(await getIdToken(cred.user));
      },

      signInGoogle: async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await upsertProfile(cred.user);
        setProfile(await fetchProfile(cred.user.uid));
        setIdToken(await getIdToken(cred.user));
      },

      logout: async () => {
        const u = auth.currentUser;
        if (u) await setPresence(u.uid, false, "idle").catch(() => {});
        await signOut(auth);
      },
    }),
    [user, loading, profile, profileLoading, needsOnboarding, idToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
