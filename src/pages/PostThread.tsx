import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

type Post = {
  title: string;
  body: string;
  subject: string;
  author: string;
  uid: string;
  username?: string;
  createdAt?: any;
};

type Comment = {
  id: string;
  uid: string;
  author: string;
  username?: string;
  text: string;
  createdAt?: any;
};

type ProfileDoc = {
  displayName?: string;
  username?: string;
};

function subjectPillClass(subject: string) {
  const base =
    "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border";

  const map: Record<string, string> = {
    General: "bg-secondary/25 border-border/40 text-foreground/85",
    Mathematics: "bg-emerald-500/10 border-emerald-500/25 text-emerald-200",
    Physics: "bg-sky-500/10 border-sky-500/25 text-sky-200",
    Chemistry: "bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-200",
    Biology: "bg-lime-500/10 border-lime-500/25 text-lime-200",
    "Computer Science": "bg-cyan-500/10 border-cyan-500/25 text-cyan-200",
    English: "bg-amber-500/10 border-amber-500/25 text-amber-200",
    History: "bg-orange-500/10 border-orange-500/25 text-orange-200",
  };

  return `${base} ${map[subject] || map.General}`;
}

export default function PostThread() {
  const { user, profile } = useAuth();
  const { postId } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState<Record<string, ProfileDoc>>({});

  const loadProfile = async (uid: string) => {
    if (!uid) return;
    if (profiles[uid]) return;
    try {
      const snap = await getDoc(doc(db, "profiles", uid));
      setProfiles((prev) => ({ ...prev, [uid]: (snap.data() as ProfileDoc) || {} }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!postId) return;

    (async () => {
      const snap = await getDoc(doc(db, "posts", postId));
      if (!snap.exists()) {
        toast("Post not found");
        nav("/community");
        return;
      }
      const data = (snap.data() as Post) || null;
      setPost(data);
      if (data?.uid) loadProfile(data.uid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, nav]);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
      limit(80)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const out: Comment[] = [];
        snap.forEach((d) => out.push({ id: d.id, ...(d.data() as any) }));
        setComments(out);
        out.forEach((c) => c.uid && loadProfile(c.uid));
      },
      (err) => toast(err?.message || "Couldn't load comments")
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const prettyTime = (p: any) => {
    const dt = p?.toDate ? p.toDate() : null;
    return dt ? dt.toLocaleString() : "";
  };

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const send = async () => {
    if (!user) return toast("Login required");
    if (!postId) return;
    if (!text.trim()) return;

    const payload = {
      uid: user.uid,
      author: profile?.displayName || user.displayName || user.email || "User",
      username: profile?.username || null,
      text: text.trim(),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "posts", postId, "comments"), payload);
      setText("");
    } catch (e: any) {
      toast(e?.message || "Send failed");
    }
  };

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 rounded-3xl">Loading…</div>
      </div>
    );
  }

  const postProf = profiles[post.uid] || {};
  const postUname = post.username || postProf.username || "";
  const postAuthorName = postProf.displayName || post.author || "User";

  const postAuthorLine = postUname ? (
    <Link to={`/u/${postUname}`} className="hover:underline">
      {postAuthorName}
    </Link>
  ) : (
    <span>{postAuthorName}</span>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav("/community")}
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
        </button>

        <span className={subjectPillClass(post.subject)}>{post.subject}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <h2 className="text-xl font-bold">{post.title}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          by {postAuthorLine}{" "}
          {post.createdAt ? `• ${prettyTime(post.createdAt)}` : ""}{" "}
          {postUname ? `• @${postUname}` : ""}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
      </motion.div>

      <div className="glass-card p-5 rounded-3xl">
        <h3 className="font-semibold mb-4">Thread</h3>

        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the thread.
            </p>
          ) : (
            comments.map((c) => {
              const mine = c.uid === user?.uid;
              const prof = profiles[c.uid] || {};
              const uname = c.username || prof.username || "";
              const name = mine ? "You" : prof.displayName || c.author || "User";

              const nameNode =
                !mine && uname ? (
                  <Link to={`/u/${uname}`} className="hover:underline">
                    {name}
                  </Link>
                ) : (
                  <span>{name}</span>
                );

              return (
                <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl border ${
                      mine
                        ? "bg-primary/10 border-primary/20"
                        : "bg-secondary/15 border-border/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold truncate">{nameNode}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.createdAt ? prettyTime(c.createdAt) : ""}
                      </p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.text}</p>
                    {!mine && uname && (
                      <p className="text-[10px] text-muted-foreground mt-1">@{uname}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reply…"
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={send}
            disabled={!canSend}
            className={`glow-button px-5 py-3 rounded-xl font-semibold ${
              !canSend ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Send className="w-4 h-4 inline mr-1" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
