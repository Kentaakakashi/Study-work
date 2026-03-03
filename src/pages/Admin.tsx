import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Ticket } from "lucide-react";

export default function Admin() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Admin</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/tickets" className="glass-card p-6 rounded-3xl hover:bg-secondary/10 transition block">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <p className="font-semibold">Ticket System</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            View, reply, and resolve support tickets our from members 🤭😘
          </p>
        </Link>

        <div className="glass-card p-6 rounded-3xl opacity-70">
          <p className="font-semibold">More tools soon</p>
          <p className="text-sm text-muted-foreground mt-2">
            Bans, moderation... etc blah blah yk
          </p>
        </div>
      </motion.div>
    </div>
  );
}
