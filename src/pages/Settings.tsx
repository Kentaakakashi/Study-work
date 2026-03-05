import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { Paintbrush, Save, Sparkles, Image, Type, Zap } from "lucide-react";

type ProfileDoc = {
  displayName?: string;
  username?: string;
  pfp?: string;
  photoURL?: string;
  bio?: string;
  role?: "owner" | "member";

  status?: string;
  bannerUrl?: string;
  decoration?: "none" | "spark" | "coffee" | "stars" | "leaf" | "heart";
  ring?: "none" | "aura" | "neon" | "royal" | "focus";
  nameplate?: "none" | "neon" | "blueprint" | "soft";
  effect?: "none" | "aurora" | "sparkles" | "scanlines" | "bubbles";

  createdAt?: any;
};

const DECORATIONS: ProfileDoc["decoration"][] = ["none", "spark", "coffee", "stars", "leaf", "heart"];
const RINGS: ProfileDoc["ring"][] = ["none", "aura", "neon", "royal", "focus"];
const NAMEPLATES: ProfileDoc["nameplate"][] = ["none", "soft", "neon", "blueprint"];
const EFFECTS: ProfileDoc["effect"][] = ["none", "aurora", "sparkles", "scanlines", "bubbles"];

export default function Settings() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // editable fields
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [decoration, setDecoration] = useState<ProfileDoc["decoration"]>("none");
  const [ring, setRing] = useState<ProfileDoc["ring"]>("aura");
  const [nameplate, setNameplate] = useState<ProfileDoc["nameplate"]>("soft");
  const [effect, setEffect] = useState<ProfileDoc["effect"]>("none");

  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      setLoading(true);

      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const p = (snap.data() as ProfileDoc) || {};

        setBio(p.bio || "");
        setStatus(p.status || "");
        setBannerUrl(p.bannerUrl || "");

        setDecoration(p.decoration || "none");
        setRing(p.ring || "aura");
        setNameplate(p.nameplate || "soft");
        setEffect(p.effect || "none");

        // If createdAt doesn't exist, we can set it later on save (merge won't overwrite existing)
      } catch (e: any) {
        console.error(e);
        toast(e?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const canSave = useMemo(() => !!user?.uid && !loading && !saving, [user?.uid, loading, saving]);

  const save = async () => {
    if (!user?.uid) return toast("Login required");
    setSaving(true);

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          bio: bio.trim(),
          status: status.trim(),
          bannerUrl: bannerUrl.trim(),
          decoration,
          ring,
          nameplate,
          effect,

          // safe: only sets if missing, because merge true won't delete anything
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast("Profile cosmetics saved ✅");
    } catch (e: any) {
      console.error(e);
      toast(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user?.uid) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-sm text-muted-foreground">Login to edit your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <div className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Settings</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Make your profile feel less like a blank passport photo.
        </p>
      </motion.div>

      {/* Profile cosmetics */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Profile Cosmetics
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              These show on your profile page. Later we can turn them into coin unlocks.
            </p>
          </div>

          <button
            disabled={!canSave}
            onClick={save}
            className={`px-4 py-2 rounded-xl border text-sm transition ${
              canSave
                ? "bg-primary/15 border-primary/30 text-primary hover:bg-primary/20"
                : "bg-secondary/15 border-border/40 text-muted-foreground opacity-60 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* Bio */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell people what you’re grinding for…"
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Status</label>
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Studying, don’t disturb 😤"
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Banner URL */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-2">
                <Image className="w-4 h-4" /> Banner URL (optional)
              </label>
              <input
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://... (leave empty for auto banner)"
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-[11px] text-muted-foreground">
                If empty, your profile auto-generates a banner based on your username.
              </p>
            </div>

            {/* Pickers */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Decoration
                </label>
                <select
                  value={decoration || "none"}
                  onChange={(e) => setDecoration(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {DECORATIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Ring
                </label>
                <select
                  value={ring || "aura"}
                  onChange={(e) => setRing(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {RINGS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Type className="w-4 h-4" /> Nameplate
                </label>
                <select
                  value={nameplate || "soft"}
                  onChange={(e) => setNameplate(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {NAMEPLATES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Effect
                </label>
                <select
                  value={effect || "none"}
                  onChange={(e) => setEffect(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {EFFECTS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40 text-xs text-muted-foreground">
              Next step (when you’re ready): make cosmetics **unlockable** with coins and show a “Store” inventory like Discord.
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
