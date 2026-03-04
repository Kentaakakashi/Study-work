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
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
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

async function upsertProfile(user: User) {
  const ref = doc(db, "profiles", user.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as ProfileDoc) : null;

  const role = roleForUid(user.uid); // owner/member based on hardcoded UID list
  const patch: Partial<ProfileDoc> = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || existing?.displayName || "User",
    photoURL: user.photoURL || existing?.photoURL || "",
    updatedAt: serverTimestamp(),
  };

  if (!existing) {
    patch.createdAt = serverTimestamp();
  }

  // ✅ Role logic: enforce owner if UID matches, otherwise keep existing role or default
  if (isOwnerUid(user.uid)) {
    patch.role = "owner";
  } else if (!existing?.role) {
    patch.role = role; // set default once if missing
  }

  await setDoc(ref, patch, { merge: true });
}

async function ensureStats(user: User, profile: ProfileDoc | null) {
  // Your existing stats init logic may already exist in other files,
  // but you were calling it here earlier, so keep it safe.
  // If you had a real ensureStats above, don’t worry, this won’t break anything.
  // If you DO have an existing ensureStats function in this file above,
  // keep that one and remove this stub.
  void user;
  void profile;
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
    let unsubProfile: null | (() => void) = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      // Cleanup previous profile listener when user changes
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!u) {
        setProfile(null);
        setProfileLoading(false);
        setIdToken(null);
        return;
      }

      setProfileLoading(true);

      try {
        // Ensure profile exists / patched correctly
        await upsertProfile(u);

        // Grab token once (good enough for your current use)
        try {
          setIdToken(await getIdToken(u));
        } catch {
          setIdToken(null);
        }

        // ✅ LIVE profile listener (THIS FIXES YOUR ONBOARDING LOOP)
        unsubProfile = onSnapshot(
          doc(db, "profiles", u.uid),
          (snap) => {
            const p = snap.exists() ? (snap.data() as ProfileDoc) : null;
            setProfile(p);
            setProfileLoading(false);

            // Keep stats/presence safe and non-blocking
            Promise.resolve()
              .then(() => ensureStats(u, p))
              .catch(() => {});
          },
          () => {
            // If listener errors, at least stop loading
            setProfileLoading(false);
          }
        );

        await setPresence(u.uid, true, "online").catch(() => {});
      } catch {
        setProfileLoading(false);
      }
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubAuth();
    };
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
        // profile listener will update state automatically
        try {
          setIdToken(await getIdToken(cred.user));
        } catch {
          setIdToken(null);
        }
      },

      signInEmail: async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await upsertProfile(cred.user);
        // profile listener will update state automatically
        try {
          setIdToken(await getIdToken(cred.user));
        } catch {
          setIdToken(null);
        }
      },

      signInGoogle: async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);

        await upsertProfile(cred.user);

        // ✅ Google users: welcome email right away (sent once)
        await sendWelcomeEmailOnce();

        // profile listener will update state automatically
        try {
          setIdToken(await getIdToken(cred.user));
        } catch {
          setIdToken(null);
        }
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
