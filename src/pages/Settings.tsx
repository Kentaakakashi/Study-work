import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Palette, Shield, LogOut, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const themes = [
  { key: "neon", label: "Neon", desc: "Cyan & electric", preview: "from-cyan-500 to-purple-500" },
  { key: "lofi", label: "Lofi", desc: "Warm & earthy", preview: "from-green-600 to-amber-600" },
  { key: "sakura", label: "Sakura", desc: "Soft pinks", preview: "from-pink-500 to-purple-400" },
];

function normUsername(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_\.]/g, "");
}

const Settings = () => {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [pfpUrl, setPfpUrl] = useState("");
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("theme") || "neon");
  const [hideOnline, setHideOnline] = useState(false);
  const [hideStats, setHideStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [origUsername, setOrigUsername] = useState("");

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
    })().catch(() => {});
  }, [user]);

  const applyTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  useEffect(() => {
    applyTheme(currentTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          theme: currentTheme,
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-2xl">
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
          <button onClick={save} disabled={saving} className="glow-button px-4 py-2 rounded-xl font-semibold disabled:opacity-50">
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Theme</h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => applyTheme(t.key)}
              className={`p-4 rounded-2xl border transition text-left ${
                currentTheme === t.key ? "border-primary/40 bg-primary/10" : "border-border/50 bg-secondary/20 hover:bg-secondary/30"
              }`}
            >
              <div className={`h-10 rounded-xl bg-gradient-to-r ${t.preview} mb-3`} />
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Privacy</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <div>
              <p className="font-medium">Hide online status</p>
              <p className="text-xs text-muted-foreground">Shows you as offline to friends</p>
            </div>
            <input type="checkbox" checked={hideOnline} onChange={(e) => setHideOnline(e.target.checked)} />
          </label>

          <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <div>
              <p className="font-medium">Hide stats</p>
              <p className="text-xs text-muted-foreground">Friends won't see your streak / minutes</p>
            </div>
            <input type="checkbox" checked={hideStats} onChange={(e) => setHideStats(e.target.checked)} />
          </label>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 rounded-2xl">
        <button
          onClick={() => logout().then(() => toast("Logged out")).catch(() => toast("Logout failed"))}
          className="w-full px-4 py-3 rounded-xl bg-secondary/20 border border-border/50 hover:bg-secondary/30 transition font-semibold"
        >
          <LogOut className="w-4 h-4 inline mr-1" /> Logout
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;
