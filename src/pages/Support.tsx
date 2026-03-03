import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { subscribeMyTickets, type SupportTicket } from "@/lib/support";

export default function Support() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (!user) return;

    return subscribeMyTickets(
      user.uid,
      setTickets,
      (err) => {
        console.error("Support tickets query failed:", err);
        toast(err?.message || "Couldn’t load your tickets (permission/index issue)");
      }
    );
  }, [user?.uid]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Support</h1>
        </div>

        <Link to="/support/new" className="glow-button px-4 py-2 rounded-2xl font-semibold">
          <Plus className="w-4 h-4 inline mr-1" />
          New Ticket
        </Link>
      </div>

      <div className="glass-card p-5 rounded-3xl">
        <p className="text-sm text-muted-foreground">
          {profile?.displayName ? `Hey ${profile.displayName},` : "Hey,"} submit a ticket if something’s broken or you want a feature.
          Try giving actual details. The universe is allergic to “it doesn’t work”.
        </p>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="glass-card p-6 rounded-3xl text-center">
            <Ticket className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-semibold">No tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create one if something’s scuffed.</p>
          </div>
        ) : (
          tickets.map((t) => (
            <Link
              key={t.id}
              to={`/support/${t.id}`}
              className="block glass-card p-5 rounded-3xl hover:bg-secondary/10 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.category.toUpperCase()} • {t.status.replace("_", " ").toUpperCase()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">#{t.id.slice(0, 6)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
