import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { Paintbrush, Save, Sparkles, Image } from "lucide-react";

type ProfileDoc = {
  displayName?: string;
  bio?: string;
  status?: string;
  bannerUrl?: string;

  decoration?: "none" | "spark" | "coffee" | "stars" | "leaf" | "heart";
  ring?: "none" | "aura" | "neon" | "royal" | "focus";
  nameplate?: "none" | "soft" | "neon" | "blueprint";
  effect?: "none" | "aurora" | "sparkles" | "scanlines" | "bubbles";
};

export default function Settings() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "kenta");

  const [decoration, setDecoration] = useState("none");
  const [ring, setRing] = useState("aura");
  const [nameplate, setNameplate] = useState("soft");
  const [effect, setEffect] = useState("none");

  useEffect(() => {
    if (!user?.uid) return;

    (async () => {
      const snap = await getDoc(doc(db, "profiles", user.uid));
      const p = (snap.data() as ProfileDoc) || {};

      setDisplayName(p.displayName || "");
      setBio(p.bio || "");
      setStatus(p.status || "");
      setBannerUrl(p.bannerUrl || "");

      setDecoration(p.decoration || "none");
      setRing(p.ring || "aura");
      setNameplate(p.nameplate || "soft");
      setEffect(p.effect || "none");

      setLoading(false);
    })();
  }, [user?.uid]);

  const canSave = useMemo(() => !loading && !saving, [loading, saving]);

  const save = async () => {
    if (!user?.uid) return;

    setSaving(true);

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          displayName,
          bio,
          status,
          bannerUrl,
          decoration,
          ring,
          nameplate,
          effect
        },
        { merge: true }
      );

      localStorage.setItem("theme", theme);
      document.documentElement.setAttribute("data-theme", theme);

      toast("Settings saved");
    } catch (e: any) {
      toast(e.message);
    }

    setSaving(false);
  };

  if (!user) {
    return (
      <div className="glass-card p-6 rounded-3xl">
        Login required
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <motion.div
        initial={{opacity:0,y:10}}
        animate={{opacity:1,y:0}}
        className="glass-card p-6 rounded-3xl"
      >
        <h2 className="font-bold text-lg">Profile</h2>

        <div className="space-y-3 mt-4">

          <input
            value={displayName}
            onChange={e=>setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full p-3 rounded-xl bg-secondary/30"
          />

          <textarea
            value={bio}
            onChange={e=>setBio(e.target.value)}
            placeholder="Bio"
            rows={3}
            className="w-full p-3 rounded-xl bg-secondary/30"
          />

          <input
            value={status}
            onChange={e=>setStatus(e.target.value)}
            placeholder="Status"
            className="w-full p-3 rounded-xl bg-secondary/30"
          />

        </div>
      </motion.div>

      <motion.div
        initial={{opacity:0,y:10}}
        animate={{opacity:1,y:0}}
        className="glass-card p-6 rounded-3xl"
      >
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Paintbrush size={16}/>
          Appearance
        </h2>

        <select
          value={theme}
          onChange={(e)=>setTheme(e.target.value)}
          className="mt-4 p-3 rounded-xl bg-secondary/30 w-full"
        >
          <option value="kenta">Kenta OS</option>
          <option value="lemon">Lemon OS</option>
        </select>
      </motion.div>

      <motion.div
        initial={{opacity:0,y:10}}
        animate={{opacity:1,y:0}}
        className="glass-card p-6 rounded-3xl"
      >
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Sparkles size={16}/>
          Profile Cosmetics
        </h2>

        <div className="grid grid-cols-2 gap-3 mt-4">

          <select value={decoration} onChange={e=>setDecoration(e.target.value)}>
            <option value="none">Decoration: none</option>
            <option value="spark">spark</option>
            <option value="coffee">coffee</option>
            <option value="stars">stars</option>
            <option value="leaf">leaf</option>
            <option value="heart">heart</option>
          </select>

          <select value={ring} onChange={e=>setRing(e.target.value)}>
            <option value="none">ring none</option>
            <option value="aura">aura</option>
            <option value="neon">neon</option>
            <option value="royal">royal</option>
            <option value="focus">focus</option>
          </select>

          <select value={nameplate} onChange={e=>setNameplate(e.target.value)}>
            <option value="soft">soft</option>
            <option value="neon">neon</option>
            <option value="blueprint">blueprint</option>
          </select>

          <select value={effect} onChange={e=>setEffect(e.target.value)}>
            <option value="none">none</option>
            <option value="aurora">aurora</option>
            <option value="sparkles">sparkles</option>
            <option value="scanlines">scanlines</option>
            <option value="bubbles">bubbles</option>
          </select>

        </div>

        <input
          value={bannerUrl}
          onChange={e=>setBannerUrl(e.target.value)}
          placeholder="Banner image URL"
          className="mt-4 p-3 rounded-xl bg-secondary/30 w-full"
        />

      </motion.div>

      <button
        disabled={!canSave}
        onClick={save}
        className="px-6 py-3 rounded-xl bg-primary text-white flex items-center gap-2"
      >
        <Save size={16}/>
        {saving ? "Saving..." : "Save Settings"}
      </button>

    </div>
  );
}
