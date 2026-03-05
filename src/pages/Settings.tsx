import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Palette, Shield, LogOut, Check, Zap, Type, SquareDashedMousePointer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { THEMES, normalizeThemeId, type ThemeId } from "@/theme/themes";
import { useTheme } from "@/theme/ThemeProvider";

function normUsername(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_\.]/g, "");
}

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, setThemeId } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [pfpUrl, setPfpUrl] = useState("");
  const [hideOnline, setHideOnline] = useState(false);
  const [hideStats, setHideStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [origUsername, setOrigUsername] = useState("");

  const currentThemeId = theme.id;

  const themes = useMemo(() => THEMES, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "profiles", user.uid));
      const p = (snap.data() as any) || {};
      setDisplayName(p.displayName || user.displayName || "User");
      setUsername(p.username || "");
      setOrigUsername(p.username || "");
      setPfpUrl(p.pfp || p.photoURL || user.photoURL || "");
      setHideOnline(!!p.hideOnline);
      setHideStats(!!p.hideStats);

      // If profile has a saved theme, sync it locally (with back-compat).
      if (p.theme && typeof p.theme === "string") {
        const normalized = normalizeThemeId(p.theme);
        if (normalized && normalized !== currentThemeId) setThemeId(normalized as ThemeId);
      }
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const save = async () => {
    if (!user) return toast("Login required");
    const uname = normUsername(username);
    if (uname.length < 3) return toast("Username needs 3+ chars");

    setSaving(true);
    try {
      // claim username
      const uref = doc(db, "usernames", uname);
      const taken = await getDoc(uref);
      if (taken.exists() && (taken.data() as any)?.uid !== user.uid) {
        return toast("That username is taken");
      }
      await setDoc(uref, { uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });

      // if username changed and old mapping belongs to user, delete old doc (nice cleanup)
      if (origUsername && origUsername !== uname) {
        const oldRef = doc(db, "usernames", origUsername);
        const oldSnap = await getDoc(oldRef);
        if (oldSnap.exists() && (oldSnap.data() as any)?.uid === user.uid) {
          await deleteDoc(oldRef).catch(() => {});
        }
        setOrigUsername(uname);
      }

      await setDoc(
        doc(db, "profiles", user.uid),
        {
          displayName: displayName.trim() || "User",
          username: uname,
          pfp: pfpUrl.trim(),
          hideOnline,
          hideStats,
          theme: currentThemeId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast("Saved ✅");
    } catch (e: any) {
      toast(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Profile</h3>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <img
            src={
              pfpUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || displayName || "user")}`
            }
            alt=""
            className="w-16 h-16 rounded-full ring-2 ring-primary/20 object-cover"
          />
          <div className="flex-1">
            <p className="font-semibold">{displayName || "User"}</p>
            <p className="text-sm text-muted-foreground">@{username || "set-username"}</p>
          </div>
          <button onClick={save} disabled={saving} className="glow-button px-4 py-2 font-semibold disabled:opacity-50">
            <Check className="w-4 h-4 inline mr-1" /> Save
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(normUsername(e.target.value))}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Profile picture URL</label>
            <input
              value={pfpUrl}
              onChange={(e) => setPfpUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Themes</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {themes.map((t) => {
            const selected = currentThemeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`p-4 border transition text-left group ${
                  selected ? "border-primary/40 bg-primary/10" : "border-border/50 bg-secondary/15 hover:bg-secondary/25"
                }`}
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <div
                  className="h-12 mb-3 relative overflow-hidden"
                  style={{
                    borderRadius: "calc(var(--radius-card) - 6px)",
                    backgroundImage: t.background.gradient,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url('${t.background.patternUrl}')`,
                      opacity: t.background.patternOpacity,
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: t.background.noiseUrl ? `url('${t.background.noiseUrl}')` : "none",
                      opacity: t.background.noiseOpacity,
                      mixBlendMode: "overlay",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  {selected ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/30 text-muted-foreground border border-border/40 opacity-0 group-hover:opacity-100 transition">
                      Preview
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 border border-border/40">
                    <SquareDashedMousePointer className="w-3 h-3" /> {t.density}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 border border-border/40">
                    <Zap className="w-3 h-3" /> {t.motionPreset}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 border border-border/40">
                    <Type className="w-3 h-3" /> font
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Themes now change spacing, motion, icon style, and UI shape. Profiles will get their own customization later.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Privacy</h3>
        </div>

        <div className="space-y-4">
          <label
            className="flex items-center justify-between gap-4 p-4 bg-secondary/20 border border-border/50"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <div>
              <p className="font-medium">Hide online status</p>
              <p className="text-xs text-muted-foreground">Shows you as offline to friends</p>
            </div>
            <input type="checkbox" checked={hideOnline} onChange={(e) => setHideOnline(e.target.checked)} />
          </label>

          <label
            className="flex items-center justify-between gap-4 p-4 bg-secondary/20 border border-border/50"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <div>
              <p className="font-medium">Hide stats</p>
              <p className="text-xs text-muted-foreground">Friends won't see your streak / minutes</p>
            </div>
            <input type="checkbox" checked={hideStats} onChange={(e) => setHideStats(e.target.checked)} />
          </label>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <button
          onClick={() => logout().then(() => toast("Logged out")).catch(() => toast("Logout failed"))}
          className="w-full px-4 py-3 bg-secondary/20 border border-border/50 hover:bg-secondary/30 transition font-semibold"
          style={{ borderRadius: "var(--radius-button)" }}
        >
          <LogOut className="w-4 h-4 inline mr-1" /> Logout
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;
