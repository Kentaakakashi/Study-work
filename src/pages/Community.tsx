import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, Send, Tag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

type Post = {
  id: string;
  title: string;
  body: string;
  subject: string;
  author: string;
  uid: string;
  createdAt?: any;
};

const subjects = ["General", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "History"];

const Community = () => {
  const { user } = useAuth();
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(30));
    const unsub = onSnapshot(q, (snap) => {
      const out: Post[] = [];
      snap.forEach((d) => out.push({ id: d.id, ...(d.data() as any) }));
      setPosts(out);
    });
    return () => unsub();
  }, []);

  const submit = async () => {
    if (!user) return toast("Login required");
    if (!title.trim() || !body.trim()) return toast("Title + body required");
    try {
      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        author: user.displayName || user.email || "User",
        subject,
        title: title.trim(),
        body: body.trim(),
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setBody("");
      toast("Posted ✅");
    } catch (e: any) {
      toast(e?.message || "Post failed");
    }
  };

  const prettyTime = (p: any) => {
    const dt = p?.toDate ? p.toDate() : null;
    return dt ? dt.toLocaleString() : "";
  };

  const empty = useMemo(() => posts.length === 0, [posts]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Create a post</h3>
        </div>

        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Explain Newton's 3rd law like I'm 5..."
                className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Subject</label>
              <div className="relative mt-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your question / tip / notes…"
              rows={5}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button onClick={submit} className="glow-button px-5 py-3 rounded-xl font-semibold">
            <Send className="w-4 h-4 inline mr-1" /> Post
          </button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {empty ? (
          <p className="text-sm text-muted-foreground">No posts yet. Be the first.</p>
        ) : (
          posts.map((p, i) => (
            <motion.button
              type="button"
              key={p.id}
              onClick={() => nav(`/community/${p.id}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.2, i * 0.03) }}
              className="w-full text-left glass-card-hover p-5 rounded-3xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-lg font-bold truncate">{p.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {p.author} {p.createdAt ? `• ${prettyTime(p.createdAt)}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full border border-border/40 bg-secondary/20 text-xs">
                    {p.subject}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-sm line-clamp-3">{p.body}</p>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;
