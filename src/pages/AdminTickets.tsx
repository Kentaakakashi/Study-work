import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Ticket } from "lucide-react";
import { subscribeAllTickets, type SupportTicket } from "@/lib/support";

export default function AdminTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    return subscribeAllTickets(setTickets);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Tickets</h1>
        </div>

        <Link
          to="/admin"
          className="px-4 py-2 rounded-2xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          Back
        </Link>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="glass-card p-6 rounded-3xl text-center">
            <Ticket className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-semibold">No tickets</p>
          </div>
        ) : (
          tickets.map((t) => (
            <Link
              key={t.id}
              to={`/admin/tickets/${t.id}`}
              className="block glass-card p-5 rounded-3xl hover:bg-secondary/10 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.category.toUpperCase()} • {t.status.replace("_", " ").toUpperCase()} •{" "}
                    {t.username || t.displayName || t.email || t.uid.slice(0, 6)}
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
