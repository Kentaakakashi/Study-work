import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const subjects = [
  "Mathematics","Physics","Chemistry","Biology","Computer Science",
  "History","English","Economics","Psychology","Art & Design",
  "Music","Languages","Philosophy","Engineering","Medicine",
];

function normUsername(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_\.]/g, "");
}

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pfpUrl, setPfpUrl] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const canNext = useMemo(() => {
    if (step === 0) return normUsername(username).length >= 3;
    if (step === 1) return (displayName || "").trim().length >= 2;
    return true;
  }, [step, username, displayName]);

  const handleFinish = async () => {
    if (!user) return;
    const uname = normUsername(username);
    if (uname.length < 3) return toast("Username needs 3+ chars");
    if (!displayName.trim()) return toast("Display name required");

    try {
      // check availability
      const uref = doc(db, "usernames", uname);
      const taken = await getDoc(uref);
      if (taken.exists() && (taken.data() as any)?.uid !== user.uid) {
        return toast("That username is taken");
      }

      await setDoc(uref, { uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });

     await setDoc(
  doc(db, "profiles", user.uid),
  {
    username: uname,
    displayName: displayName.trim(),
    pfp: pfpUrl.trim(),
    subjects: selectedSubjects,
    onboardingComplete: true, // ✅ ADD THIS
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);


      toast("Profile saved ✅");
      navigate("/home", { replace: true });
    } catch (e: any) {
      toast(e?.message || "Failed to save profile");
    }
  };

  const steps = [
    {
      title: "Choose your identity",
      subtitle: "Pick a unique username for the community",
      content: (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(normUsername(e.target.value))}
                placeholder="studyking"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Lowercase, numbers, _ and . only.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Set your vibe",
      subtitle: "How should people see you?",
      content: (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Display name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Kenta Kakashi"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Profile picture URL (optional)</label>
            <input
              value={pfpUrl}
              onChange={(e) => setPfpUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Pick your subjects",
      subtitle: "This helps customize your experience",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-auto pr-1">
            {subjects.map((s) => {
              const active = selectedSubjects.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`px-3 py-2 rounded-xl border text-sm transition flex items-center justify-between ${
                    active
                      ? "bg-primary/15 border-primary/40"
                      : "bg-secondary/20 border-border/40 hover:bg-secondary/30"
                  }`}
                >
                  <span className="truncate">{s}</span>
                  {active ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <span className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">You can change this later in Settings.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full glass-card p-8 md:p-10 rounded-3xl">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Quick setup</span>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{steps[step].title}</h1>
            <p className="text-muted-foreground">{steps[step].subtitle}</p>
          </div>

          {steps[step].content}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-10 rounded-full transition ${
                    i <= step ? "bg-primary/70" : "bg-border/40"
                  }`}
                />
              ))}
            </div>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="glow-button px-5 py-2.5 rounded-xl font-semibold disabled:opacity-50"
              >
                Next <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="glow-button px-5 py-2.5 rounded-xl font-semibold"
              >
                Finish <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
