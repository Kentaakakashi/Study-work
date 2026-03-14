import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, BookOpen, Users, Brain, Timer, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Galaxy from "@/components/backgrounds/Galaxy";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { user, signInEmail, signUpEmail, signInGoogle } = useAuth();

  useEffect(() => {
    // If already logged in, route them.
    const go = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const uname = snap.exists() ? (snap.data() as any).username : "";
        navigate(uname ? "/home" : "/onboarding", { replace: true });
      } catch {
        navigate("/home", { replace: true });
      }
    };
    go();
  }, [user, navigate]);

  const routeAfterAuth = async (uid: string) => {
    const snap = await getDoc(doc(db, "profiles", uid));
    const uname = snap.exists() ? (snap.data() as any).username : "";
    navigate(uname ? "/home" : "/onboarding");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!email || !password) return toast("Enter email + password.");
      if (isLogin) {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
      const uid = (window as any).__firebaseUser?.uid || "";
      // we can't rely on window; just wait a tick for auth state
      setTimeout(async () => {
        const { auth } = await import("@/lib/firebase");
        const u = auth.currentUser;
        if (u) await routeAfterAuth(u.uid);
        else navigate("/home");
      }, 100);
    } catch (err: any) {
      toast(err?.message || "Auth failed");
    }
  };

  const handleGoogle = async () => {
    try {
      await signInGoogle();
      setTimeout(async () => {
        const { auth } = await import("@/lib/firebase");
        const u = auth.currentUser;
        if (u) await routeAfterAuth(u.uid);
        else navigate("/home");
      }, 100);
    } catch (err: any) {
      toast(err?.message || "Google sign-in failed");
    }
  };

  const features = [
    { icon: Timer, label: "Pomodoro & Focus", desc: "Track study sessions with smart timers" },
    { icon: Users, label: "Community", desc: "Ask doubts & learn with peers" },
    { icon: Brain, label: "AI Tutor", desc: "Get instant help from AI" },
    { icon: BookOpen, label: "Study Stats", desc: "Heatmap & analytics" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={0.6}
          glowIntensity={0.18}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.15}
          rotationSpeed={0.4}
          repulsionStrength={5}
          autoCenterRepulsion={0}
          starSpeed={0.25}
          speed={0.5}
          className="pointer-events-auto"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-button p-0">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gradient">Study Zone</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 border border-border/50"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Your all-in-one study universe</span>
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Study smarter with{" "}
                  <span className="text-gradient">flow</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Timers, stats, community, friends, and an AI tutor. Wrapped in a single place.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass-card p-5 rounded-2xl"
                  >
                    <f.icon className="w-6 h-6 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{f.label}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="glass-card p-8 md:p-10 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create account"}</h2>
                <button
                  onClick={() => setIsLogin((v) => !v)}
                  className="text-sm text-primary hover:underline"
                  type="button"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <button type="submit" className="w-full glow-button py-3 rounded-xl font-semibold">
                  {isLogin ? "Log in" : "Sign up"}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm font-semibold hover:bg-secondary/40 transition"
                >
                  Continue with Google
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  By continuing you agree to keep things chill and study hard 😤
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
