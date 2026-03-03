import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  addTicketMessage,
  getTicket,
  subscribeTicketMessages,
  type SupportTicket,
  type TicketMessage,
} from "@/lib/support";

export default function SupportTicketPage() {
  const { ticketId } = useParams();
  const { user, profile } = useAuth();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [msgs, setMsgs] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");

  const displayName = useMemo(() => {
    return profile?.displayName || profile?.username || user?.email || "User";
  }, [profile?.displayName, profile?.username, user?.email]);

  useEffect(() => {
    if (!ticketId) return;
    getTicket(ticketId).then(setTicket);
    return subscribeTicketMessages(ticketId, setMsgs);
  }, [ticketId]);

  const send = async () => {
    if (!ticketId || !user) return;
    if (text.trim().length < 1) return;

    try {
      await addTicketMessage({
        ticketId,
        uid: user.uid,
        authorName: displayName,
        body: text.trim(),
        isOwner: false,
      });
      setText("");
    } catch {
      toast("Couldn’t send message");
    }
  };

  if (!ticketId) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <LifeBuoy className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold truncate">{ticket?.subject ?? "Ticket"}</h1>
        </div>
        <Link
          to="/support"
          className="px-4 py-2 rounded-2xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          Back
        </Link>
      </div>

      <div className="glass-card p-5 rounded-3xl flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {ticket?.category?.toUpperCase()} • {ticket?.status?.replace("_", " ").toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Ticket #{ticketId.slice(0, 8)}</p>
        </div>
      </div>

      <div className="glass-card p-5 rounded-3xl space-y-3">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={[
              "p-4 rounded-2xl border",
              m.isOwner ? "bg-primary/10 border-primary/25" : "bg-secondary/15 border-border/40",
            ].join(" ")}
          >
            <p className="text-sm font-semibold">
              {m.authorName || (m.isOwner ? "Owner" : "User")}
              {m.isOwner && <span className="ml-2 text-xs text-primary">Owner</span>}
            </p>
            <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reply…"
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={send} className="glow-button px-4 py-3 rounded-xl font-semibold">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
