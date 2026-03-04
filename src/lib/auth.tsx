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
import { isOwnerUid, roleForUid, type UserRole } from "@/lib/roles";
import { sendWelcomeEmailOnce } from "@/lib/welcomeEmail";

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

  // ✅ NEW
  role?: UserRole; // "owner" | "member"
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
 * ✅ Also: assigns owner role if uid is in OWNER_UIDS.
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

  // If user is an owner, we enforce role=owner (never downgrade).
  const ownerPatch = isOwnerUid(u.uid) ? { role: "owner" as const } : {};

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        ...base,
        createdAt: serverTimestamp(),
        onboardingComplete: false,
        role: roleForUid(u.uid), // "owner" if in list else "member"
      },
      { merge: true }
    );
  } else {
    // Existing user: DO NOT wipe username/onboardingComplete/role
    // Only set role if they're in owner list (upgrade-only behavior).
    await setDoc(ref, { ...base, ...ownerPatch }, { merge: true });
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
 * - if profile has username and stats doesn't, we mirror it once.
 * ✅ Also mirrors role to stats (for Owner badge on leaderboard).
 */
async function ensureStats(u: User, profile: ProfileDoc | null) {
  const ref = doc(db, "stats", u.uid);
  const snap = await getDoc(ref);

  const displayName = profile?.displayName || u.displayName || "User";
  const photoURL = (profile?.pfp || profile?.photoURL || u.photoURL || "") as string;
  const username = profile?.username || null;

  const role: UserRole = (profile?.role as UserRole) || roleForUid(u.uid);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        uid: u.uid,
        displayName,
        photoURL,
        username,
        role, // ✅ NEW

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

  const existing = snap.data() as any;

  const patch: any = {
    displayName,
    photoURL,
    updatedAt: serverTimestamp(),
  };

  if ((!existing?.username || existing?.username === null) && username) {
    patch.username = username;
  }

  // Only upgrade role to owner, never downgrade.
  if (role === "owner" && existing?.role !== "owner") {
    patch.role = "owner";
  } else if (!existing?.role) {
    patch.role = role; // set default once if missing
  }

  await setDoc(ref, patch, { merge: true });
}

async function setPresence(uid: string, online: boolean, status: "online" | "idle") {
  await setDoc(
    doc(db, "presence", uid),
    { uid, online, status, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (!u) {
        setProfile(null);
        setProfileLoading(false);
        setIdToken(null);
        return;
      }

      setProfileLoading(true);
      try {
        await upsertProfile(u);
        const p = await fetchProfile(u.uid);
        setProfile(p);
        await ensureStats(u, p);
        setIdToken(await getIdToken(u));
        await setPresence(u.uid, true, "online").catch(() => {});
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const needsOnboarding = useMemo(() => {
    if (!user) return false;
    if (profileLoading) return false;
    return profile ? !profile.onboardingComplete : true;
  }, [user, profile, profileLoading]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      profile,
      profileLoading,
      needsOnboarding,

      idToken,

      signUpEmail: async (email: string, password: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await upsertProfile(cred.user);
        const p = await fetchProfile(cred.user.uid);
        setProfile(p);
        await ensureStats(cred.user, p);
        setIdToken(await getIdToken(cred.user));
      },

      signInEmail: async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
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

        // ✅ Google users: welcome email right away (sent once)
        await sendWelcomeEmailOnce();

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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
