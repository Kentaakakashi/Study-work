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
  username?: string;
  onboardingComplete?: boolean;
  createdAt?: any;
  updatedAt?: any;
  pfp?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;

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

/**
 * ✅ Ensures profiles/{uid} exists.
 * IMPORTANT: never overwrite username / onboardingComplete for existing users.
 */
async function upsertProfile(u: User) {
  const ref = doc(db, "profiles", u.uid);
  const snap = await getDoc(ref);

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
        onboardingComplete: false, // only for brand new users
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

/**
 * ✅ Ensures stats/{uid} exists for leaderboard.
 * IMPORTANT:
 * - never resets xp/minutes/streak
 * - never forces username:null every login
 * - if profile has username and stats doesn't, we mirror it once.
 */
async function ensureStats(u: User, profile: ProfileDoc | null) {
  const ref = doc(db, "stats", u.uid);
  const snap = await getDoc(ref);

  const displayName = profile?.displayName || u.displayName || "User";
  const photoURL = (profile?.pfp || profile?.photoURL || u.photoURL || "") as string;
  const username = profile?.username || null;

  if (!snap.exists()) {
    // Create ONCE
    await setDoc(
      ref,
      {
        uid: u.uid,
        displayName,
        photoURL,
        username, // may be null if onboarding not finished yet

        xp: 0,
        totalMinutes: 0,
        todayMinutes: 0,
        weeklyMinutes: 0,
        streak: 0,
        lastStudyDay: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  // Existing stats: update only safe display fields.
  const existing = snap.data() as any;

  const patch: any = {
    displayName,
    photoURL,
    updatedAt: serverTimestamp(),
  };

  // If stats.username missing but profile.username exists, mirror it once
  if ((!existing?.username || existing?.username === null) && username) {
    patch.username = username;
  }

  await setDoc(ref, patch, { merge: true });
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

        // 1) Ensure profile exists (safe)
        await upsertProfile(u);

        // 2) Fetch profile for onboarding logic
        const p = await fetchProfile(u.uid);
        setProfile(p);

        // 3) Ensure stats exists for leaderboard (safe, NO resets)
        await ensureStats(u, p);

        // 4) Token
        const tok = await getIdToken(u);
        setIdToken(tok);

        // 5) Presence
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

    const onUnload = () => {
      const u = auth.currentUser;
      if (!u) return;
      setPresence(u.uid, false, "idle").catch(() => {});
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("beforeunload", onUnload);
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
        const p = await fetchProfile(cred.user.uid);
        setProfile(p);
        await ensureStats(cred.user, p);
        setIdToken(await getIdToken(cred.user));
      },

      signInEmail: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await upsertProfile(cred.user);
        const p = await fetchProfile(cred.user.uid);
        setProfile(p);
        await ensureStats(cred.user, p);
        setIdToken(await getIdToken(cred.user));
      },

      signInGoogle: async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await upsertProfile(cred.user);
        const p = await fetchProfile(cred.user.uid);
        setProfile(p);
        await ensureStats(cred.user, p);
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
