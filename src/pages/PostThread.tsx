import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  createdAt?: any;
};

type Comment = {
  id: string;
  uid: string;
  author: string;
  text: string;
  createdAt?: any;
};

export default function PostThread() {
  const { user } = useAuth();
  const { postId } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!postId) return;

    (async () => {
      const snap = await getDoc(doc(db, "posts", postId));
      if (!snap.exists()) {
        toast("Post not found");
        nav("/community");
        return;
      }
      setPost((snap.data() as Post) || null);
    })();
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
      },
      (err) => toast(err?.message || "Couldn't load comments")
    );

    return () => unsub();
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
      author: user.displayName || user.email || "User",
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

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav("/community")}
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
        </button>
        <span className="text-xs px-3 py-1 rounded-full border border-border/40 bg-secondary/20">{post.subject}</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h2 className="text-xl font-bold">{post.title}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          by {post.author} {post.createdAt ? `• ${prettyTime(post.createdAt)}` : ""}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
      </motion.div>

      <div className="glass-card p-5 rounded-3xl">
        <h3 className="font-semibold mb-4">Thread</h3>

        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet. Start the thread.</p>
          ) : (
            comments.map((c) => {
              const mine = c.uid === user?.uid;
              return (
                <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl border ${mine ? "bg-primary/10 border-primary/20" : "bg-secondary/15 border-border/40"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold truncate">{mine ? "You" : c.author}</p>
                      <p className="text-[10px] text-muted-foreground">{c.createdAt ? prettyTime(c.createdAt) : ""}</p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.text}</p>
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
            className={`glow-button px-5 py-3 rounded-xl font-semibold ${!canSend ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Send className="w-4 h-4 inline mr-1" /> Send
          </button>
        </div>
      </div>
    </div>
  );
                      }
