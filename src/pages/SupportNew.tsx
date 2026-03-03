import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { createTicket, type TicketCategory } from "@/lib/support";

export default function SupportNew() {
  const { user, profile } = useAuth();
  const nav = useNavigate();

  const [category, setCategory] = useState<TicketCategory>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (subject.trim().length < 4) return toast("Subject is too short");
    if (message.trim().length < 10) return toast("Message is too short");

    setLoading(true);
    try {
      const id = await createTicket({
        uid: user.uid,
        username: profile?.username,
        displayName: profile?.displayName,
        email: user.email ?? "",
        role: (profile?.role as any) || "member",
        category,
        subject: subject.trim(),
        firstMessage: message.trim(),
      });

      toast("Ticket created ✅");
      nav(`/support/${id}`);
    } catch {
      toast("Couldn’t create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <LifeBuoy className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">New Support Ticket</h1>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="account">Account</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Subject</p>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Example: Focus page blank on mobile"
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Message</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What happened, what you expected, how to reproduce."
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="glow-button px-5 py-3 rounded-2xl font-semibold w-full disabled:opacity-60"
        >
          <Send className="w-4 h-4 inline mr-1" />
          {loading ? "Sending…" : "Submit Ticket"}
        </button>
      </div>
    </div>
  );
}
