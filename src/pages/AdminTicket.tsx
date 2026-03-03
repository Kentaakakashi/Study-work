import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Shield, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  addTicketMessage,
  getTicket,
  subscribeTicketMessages,
  updateTicketStatus,
  type SupportTicket,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/support";

export default function AdminTicket() {
  const { ticketId } = useParams();
  const { user, profile } = useAuth();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [msgs, setMsgs] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");

  const ownerName = useMemo(() => {
    return profile?.displayName || profile?.username || user?.email || "Owner";
  }, [profile?.displayName, profile?.username, user?.email]);

  useEffect(() => {
    if (!ticketId) return;
    getTicket(ticketId).then(setTicket);
    return subscribeTicketMessages(ticketId, setMsgs);
  }, [ticketId]);

  const setStatus = async (s: TicketStatus) => {
    if (!ticketId) return;
    try {
      await updateTicketStatus(ticketId, s);
      toast("Status updated ✅");
    } catch {
      toast("Couldn’t update status");
    }
  };

  const send = async () => {
    if (!ticketId || !user) return;
    if (text.trim().length < 1) return;

    try {
      await addTicketMessage({
        ticketId,
        uid: user.uid,
        authorName: ownerName,
        body: text.trim(),
        isOwner: true,
      });
      setText("");
    } catch {
      toast("Couldn’t send message");
    }
  };

  if (!ticketId) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold truncate">{ticket?.subject ?? "Ticket"}</h1>
        </div>

        <Link
          to="/admin/tickets"
          className="px-4 py-2 rounded-2xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          Back
        </Link>
      </div>

      <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {ticket?.category?.toUpperCase()} • {ticket?.status?.replace("_", " ").toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            User: {ticket?.username || ticket?.displayName || ticket?.email || ticket?.uid}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatus("open")} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition">
            Open
          </button>
          <button onClick={() => setStatus("in_progress")} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition">
            In Progress
          </button>
          <button onClick={() => setStatus("resolved")} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition">
            Resolved
          </button>
          <button onClick={() => setStatus("closed")} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition">
            Closed
          </button>
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
            placeholder="Reply as owner…"
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
