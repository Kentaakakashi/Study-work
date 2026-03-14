import { motion } from "framer-motion";
import { ImagePlus, Shield, Ticket, UserX } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Admin</h1>
      </div>

      <p className="text-muted-foreground">
        Owner privilege 
      </p>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/tickets" className="glass-card p-6 rounded-3xl hover:bg-secondary/10 transition block">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <p className="font-semibold">Ticket system</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">View + reply to support tickets</p>
        </Link>

        <Link to="/admin/user-removal" className="glass-card p-6 rounded-3xl hover:bg-secondary/10 transition block">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-400" />
            <p className="font-semibold">User Removal</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Paste a UID and nuke their Study Zen existence. Won’t work on owners.
          </p>
        </Link>

        <Link to="/admin/ambient-scenes" className="glass-card p-6 rounded-3xl hover:bg-secondary/10 transition block">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-primary" />
            <p className="font-semibold">Ambient Scene Manager</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Upload static backgrounds and video loops for the Focus gallery.
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
