import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, MailCheck, MailX, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

type Profile = { displayName?: string; username?: string; pfp?: string; photoURL?: string; email?: string };
type Presence = { online?: boolean; status?: string; lastSeen?: any };

function normUsername(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_\.]/g, "");
}
function requestId(fromUid: string, toUid: string) {
  return `${fromUid}_${toUid}`;
}
function dice(seed: string) {
  // simple fallback avatar
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || "user")}`;
}

const Friends = () => {
  const { user } = useAuth();
  const [qname, setQName] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [incoming, setIncoming] = useState<{ id: string; fromUid: string }[]>([]);
  const [outgoing, setOutgoing] = useState<{ id: string; toUid: string }[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [presence, setPresence] = useState<Record<string, Presence>>({});

  const loadProfile = async (uid: string) => {
    if (profiles[uid]) return profiles[uid];
    const snap = await getDoc(doc(db, "profiles", uid));
    const p = (snap.data() as Profile) || {};
    setProfiles((prev) => ({ ...prev, [uid]: p }));
    return p;
  };

  const watchPresence = (uid: string) => {
    return onSnapshot(doc(db, "presence", uid), (snap) => {
      setPresence((prev) => ({ ...prev, [uid]: (snap.data() as Presence) || {} }));
    });
  };

  useEffect(() => {
    if (!user) return;

    const unsubs: (() => void)[] = [];

    // friends list
    unsubs.push(
      onSnapshot(collection(db, "friends", user.uid, "list"), (snap) => {
        const uids: string[] = [];
        snap.forEach((d) => uids.push(d.id));
        setFriends(uids);
        // hydrate
        uids.slice(0, 30).forEach((uid) => loadProfile(uid));
      })
    );

    // incoming requests
    unsubs.push(
      onSnapshot(query(collection(db, "friendRequests"), where("toUid", "==", user.uid)), (snap) => {
        const reqs: { id: string; fromUid: string }[] = [];
        snap.forEach((d) => reqs.push({ id: d.id, fromUid: (d.data() as any).fromUid }));
        setIncoming(reqs);
        reqs.forEach((r) => loadProfile(r.fromUid));
      })
    );

    // outgoing requests
    unsubs.push(
      onSnapshot(query(collection(db, "friendRequests"), where("fromUid", "==", user.uid)), (snap) => {
        const reqs: { id: string; toUid: string }[] = [];
        snap.forEach((d) => reqs.push({ id: d.id, toUid: (d.data() as any).toUid }));
        setOutgoing(reqs);
        reqs.forEach((r) => loadProfile(r.toUid));
      })
    );

    // presence heartbeat (optional but nice)
    const ref = doc(db, "presence", user.uid);
    const write = async (online: boolean, status: string = "online") => {
      await setDoc(ref, { online, status, lastSeen: serverTimestamp() }, { merge: true });
    };
    write(true, "online").catch(() => {});
    const timer = setInterval(() => write(true, document.hidden ? "idle" : "online").catch(() => {}), 25000);
    const onVis = () => write(true, document.hidden ? "idle" : "online").catch(() => {});
    document.addEventListener("visibilitychange", onVis);

    return () => {
      unsubs.forEach((u) => u());
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      write(false, "idle").catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // watch presence for visible cards
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const all = new Set<string>([...friends, ...incoming.map((x) => x.fromUid), ...outgoing.map((x) => x.toUid)]);
    all.forEach((uid) => {
      if (uid && uid !== user?.uid) unsubs.push(watchPresence(uid));
    });
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends.join(","), incoming.map((x) => x.fromUid).join(","), outgoing.map((x) => x.toUid).join(",")]);

  const lookupUidByUsername = async (username: string) => {
    const u = normUsername(username);
    if (!u) return null;
    const snap = await getDoc(doc(db, "usernames", u));
    if (snap.exists()) return (snap.data() as any).uid as string;
    return null;
  };

  const sendRequest = async () => {
    if (!user) return toast("Login required");
    const target = await lookupUidByUsername(qname);
    if (!target) return toast("No user found for that username");
    if (target === user.uid) return toast("That's you 💀");

    // already friends?
    const fr = await getDoc(doc(db, "friends", user.uid, "list", target));
    if (fr.exists()) return toast("Already friends");

    const rid = requestId(user.uid, target);
    const existing = await getDoc(doc(db, "friendRequests", rid));
    if (existing.exists()) return toast("Request already sent");

    await setDoc(doc(db, "friendRequests", rid), { fromUid: user.uid, toUid: target, createdAt: serverTimestamp() });
    toast("Request sent ✅");
    setQName("");
  };

  const cancelRequest = async (rid: string) => {
    try {
      await deleteDoc(doc(db, "friendRequests", rid));
      toast("Cancelled");
    } catch (e: any) {
      toast(e?.message || "Cancel failed");
    }
  };

  const accept = async (fromUid: string) => {
    if (!user) return;
    const rid = requestId(fromUid, user.uid);
    try {
      await setDoc(doc(db, "friends", user.uid, "list", fromUid), { uid: fromUid, createdAt: serverTimestamp() });
      await setDoc(doc(db, "friends", fromUid, "list", user.uid), { uid: user.uid, createdAt: serverTimestamp() });
      await deleteDoc(doc(db, "friendRequests", rid));
      toast("Friend added ✅");
    } catch (e: any) {
      toast(e?.message || "Accept failed");
    }
  };

  const decline = async (fromUid: string) => {
    if (!user) return;
    const rid = requestId(fromUid, user.uid);
    try {
      await deleteDoc(doc(db, "friendRequests", rid));
      toast("Declined");
    } catch (e: any) {
      toast(e?.message || "Decline failed");
    }
  };

  const removeFriend = async (uid: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "friends", user.uid, "list", uid));
      await deleteDoc(doc(db, "friends", uid, "list", user.uid));
      toast("Removed");
    } catch (e: any) {
      toast(e?.message || "Remove failed");
    }
  };

  const card = (uid: string, right: React.ReactNode) => {
    const p = profiles[uid] || {};
    const pres = presence[uid] || {};
    const disp = p.displayName || "User";
    const uname = p.username ? `@${p.username}` : "@no-username";
    const pfp = p.pfp || p.photoURL || dice(p.username || disp || uid);
    const status = !pres.online ? "offline" : pres.status || "online";
    const dot =
      !pres.online ? "bg-secondary/40" : pres.status === "studying" ? "bg-emerald-400/80" : "bg-primary/80";
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/15 border border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <img src={pfp} className="w-10 h-10 rounded-xl object-cover" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{disp}</p>
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} title={status} />
              <span className="text-xs text-muted-foreground">{status}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{uname}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    );
  };

  const friendsCount = friends.length;

  const outOutgoing = useMemo(() => outgoing.slice(0, 20), [outgoing]);
  const outIncoming = useMemo(() => incoming.slice(0, 20), [incoming]);
  const outFriends = useMemo(() => friends.slice(0, 30), [friends]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Friends</h3>
            <span className="text-xs text-muted-foreground">({friendsCount})</span>
          </div>
          <button
            type="button"
            onClick={() => toast("Live updates are on — no refresh needed 😌")}
            className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Refresh
          </button>
        </div>

        <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
          <input
            value={qname}
            onChange={(e) => setQName(e.target.value)}
            placeholder="Search username (e.g. @kenta)"
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={sendRequest} className="glow-button px-5 py-3 rounded-xl font-semibold">
            <UserPlus className="w-4 h-4 inline mr-1" /> Add
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Search works by username only (fast + cheap).</p>
      </motion.div>

      {/* Incoming */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h3 className="font-semibold mb-4">Incoming requests</h3>
        <div className="space-y-2">
          {outIncoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incoming requests.</p>
          ) : (
            outIncoming.map((r) =>
              card(r.fromUid, (
                <>
                  <button onClick={() => accept(r.fromUid)} className="px-3 py-2 rounded-xl bg-primary/20 border border-primary/30 text-sm">
                    <MailCheck className="w-4 h-4 inline mr-1" /> Accept
                  </button>
                  <button onClick={() => decline(r.fromUid)} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm">
                    <MailX className="w-4 h-4 inline mr-1" /> Decline
                  </button>
                </>
              ))
            )
          )}
        </div>
      </motion.div>

      {/* Outgoing */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h3 className="font-semibold mb-4">Outgoing requests</h3>
        <div className="space-y-2">
          {outOutgoing.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outgoing requests.</p>
          ) : (
            outOutgoing.map((r) =>
              card(r.toUid, (
                <button onClick={() => cancelRequest(r.id)} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm">
                  <MailX className="w-4 h-4 inline mr-1" /> Cancel
                </button>
              ))
            )
          )}
        </div>
      </motion.div>

      {/* Friends list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h3 className="font-semibold mb-4">Your friends</h3>
        <div className="space-y-2">
          {outFriends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No friends yet. Add someone by username.</p>
          ) : (
            outFriends.map((uid) =>
              card(uid, (
                <button onClick={() => removeFriend(uid)} className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm">
                  <Trash2 className="w-4 h-4 inline mr-1" /> Remove
                </button>
              ))
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Friends;
