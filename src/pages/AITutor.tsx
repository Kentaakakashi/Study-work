import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, BookOpen, HelpCircle, CheckSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const modes = [
  { icon: BookOpen, label: "Explain simply", mode: "explain", prompt: "Explain this simply: " },
  { icon: HelpCircle, label: "Practice questions", mode: "practice", prompt: "Give me practice questions about: " },
  { icon: CheckSquare, label: "Check my answer", mode: "check", prompt: "Check if my answer is correct: " },
  { icon: Calendar, label: "Study plan", mode: "plan", prompt: "Make a study plan for: " },
];

async function callGemini(token: string, payload: any) {
  const res = await fetch("/.netlify/functions/gemini-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `AI error (${res.status})`);
  return data;
}

const AITutor = () => {
  const { user, idToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: "Hey! 👋 I'm your AI study buddy. Pick a mode above or ask me anything. I'll teach step-by-step.",
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(modes[0]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const history = useMemo(
    () =>
      messages
        .filter((m) => m.id !== "1")
        .slice(-12)
        .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text })),
    [messages]
  );

  const send = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (!user) return toast("Login required");
    if (!idToken) return toast("Auth token missing — try reloading");

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: t };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const payload = {
        mode: mode.mode,
        level: "10",
        userText: t,
        history,
      };
      const data = await callGemini(idToken, payload);
      const assistantText = (data as any)?.text || (data as any)?.reply || JSON.stringify(data);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: assistantText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      toast(e?.message || "AI failed");
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "I couldn't reach the AI right now. If you're on Netlify, make sure GEMINI_API_KEY is set in env vars.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">AI Tutor</h3>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {modes.map((m) => (
              <button
                key={m.label}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded-xl text-sm border transition ${
                  mode.label === m.label ? "bg-primary/15 border-primary/35" : "bg-secondary/20 border-border/40 hover:bg-secondary/30"
                }`}
              >
                <m.icon className="w-4 h-4 inline mr-1" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}

              <div className={`max-w-[82%] p-4 rounded-2xl border ${m.role === "user" ? "bg-primary/15 border-primary/30" : "bg-secondary/15 border-border/40"}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
              </div>

              {m.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-secondary/25 border border-border/40 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="max-w-[82%] p-4 rounded-2xl border bg-secondary/15 border-border/40">
                <p className="text-sm text-muted-foreground">Thinking…</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode.prompt + "…"}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button type="submit" className="glow-button px-5 py-3 rounded-xl font-semibold">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AITutor;
