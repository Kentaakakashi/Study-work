import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Film, Image as ImageIcon, Layers3, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";

type SceneType = "static" | "video";

type AmbientSceneRecord = {
  id: string;
  name: string;
  type: SceneType;
  sourceUrl: string;
  previewUrl?: string;
  posterUrl?: string;
  accent?: string;
  background?: string;
  isVisible?: boolean;
  createdAt?: unknown;
};

type SignerResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: "image" | "video";
};

async function getOwnerToken() {
  const current = auth.currentUser;
  if (!current) throw new Error("You need to be logged in as the owner.");
  return current.getIdToken();
}

async function getAmbientSignature(resourceType: SceneType): Promise<SignerResponse> {
  const token = await getOwnerToken();

  const res = await fetch("/.netlify/functions/cloudinary-ambient-sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resourceType,
      folder: resourceType === "video" ? "studyzen-ambient/videos" : "studyzen-ambient/images",
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

async function uploadAmbientFile(file: File, resourceType: SceneType) {
  const signer = await getAmbientSignature(resourceType);
  const endpointType = signer.resourceType;
  const form = new FormData();

  form.append("file", file);
  form.append("api_key", signer.apiKey);
  form.append("timestamp", String(signer.timestamp));
  form.append("folder", signer.folder);
  form.append("signature", signer.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signer.cloudName}/${endpointType}/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
    previewUrl:
      resourceType === "video"
        ? `https://res.cloudinary.com/${signer.cloudName}/video/upload/so_0/${data.public_id}.jpg`
        : (data.secure_url as string),
  };
}

export default function AdminAmbientScenes() {
  const [scenes, setScenes] = useState<AmbientSceneRecord[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<SceneType>("video");
  const [accent, setAccent] = useState("rgba(255,255,255,0.14)");
  const [background, setBackground] = useState(
    "linear-gradient(180deg, rgba(10,10,14,0.72) 0%, rgba(6,8,12,0.88) 100%)"
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ambientScenes"), (snap) => {
      const next = snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<AmbientSceneRecord, "id">),
      }));

      next.sort((a, b) => a.name.localeCompare(b.name));
      setScenes(next);
    });

    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    return {
      total: scenes.length,
      staticCount: scenes.filter((item) => item.type === "static").length,
      videoCount: scenes.filter((item) => item.type === "video").length,
      visibleCount: scenes.filter((item) => item.isVisible !== false).length,
    };
  }, [scenes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Give the scene a name first.");
      return;
    }

    if (!file) {
      toast.error("Pick an image or video file first.");
      return;
    }

    try {
      setUploading(true);
      const uploaded = await uploadAmbientFile(file, type);

      await addDoc(collection(db, "ambientScenes"), {
        name: name.trim(),
        type,
        sourceUrl: uploaded.secureUrl,
        previewUrl: uploaded.previewUrl,
        posterUrl: type === "video" ? uploaded.previewUrl : uploaded.secureUrl,
        accent: accent.trim() || undefined,
        background: background.trim() || undefined,
        isVisible: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setFile(null);
      setAccent("rgba(255,255,255,0.14)");
      setBackground("linear-gradient(180deg, rgba(10,10,14,0.72) 0%, rgba(6,8,12,0.88) 100%)");
      const input = document.getElementById("ambient-scene-file") as HTMLInputElement | null;
      if (input) input.value = "";

      toast.success("Ambient scene uploaded.");
    } catch (error: any) {
      toast.error(error?.message || "Ambient upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleVisibility(scene: AmbientSceneRecord) {
    try {
      await updateDoc(doc(db, "ambientScenes", scene.id), {
        isVisible: scene.isVisible === false,
        updatedAt: serverTimestamp(),
      });
      toast.success(scene.isVisible === false ? "Scene is live again." : "Scene hidden from gallery.");
    } catch (error: any) {
      toast.error(error?.message || "Could not update scene visibility.");
    }
  }

  async function handleDelete(scene: AmbientSceneRecord) {
    const ok = window.confirm(
      `Delete "${scene.name}" from the ambient gallery list? This will not remove the raw Cloudinary asset itself.`
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "ambientScenes", scene.id));
      toast.success("Scene removed from the gallery list.");
    } catch (error: any) {
      toast.error(error?.message || "Could not delete scene.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Layers3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Ambient Scene Manager</h1>
      </div>

      <p className="text-muted-foreground">
        Upload static backgrounds and looping videos for the Focus gallery. Delete only removes the Firestore entry,
        not the original Cloudinary file, because storage platforms adore making cleanup a second chore.
      </p>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-3xl">
          <p className="text-sm text-muted-foreground">Total scenes</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="glass-card p-4 rounded-3xl">
          <p className="text-sm text-muted-foreground">Static</p>
          <p className="text-2xl font-bold mt-1">{stats.staticCount}</p>
        </div>
        <div className="glass-card p-4 rounded-3xl">
          <p className="text-sm text-muted-foreground">Videos</p>
          <p className="text-2xl font-bold mt-1">{stats.videoCount}</p>
        </div>
        <div className="glass-card p-4 rounded-3xl">
          <p className="text-sm text-muted-foreground">Visible</p>
          <p className="text-2xl font-bold mt-1">{stats.visibleCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <form onSubmit={handleCreate} className="glass-card p-5 rounded-3xl space-y-4">
          <div>
            <p className="font-semibold">Upload new ambient scene</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use images for static scenes and MP4 loops for video scenes.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Scene name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rainy balcony"
              className="w-full rounded-2xl bg-background/50 border border-border px-4 py-3 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Scene type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("static")}
                className={`rounded-2xl px-4 py-3 border transition ${
                  type === "static"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40"
                }`}
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  <ImageIcon className="w-4 h-4" />
                  Static image
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("video")}
                className={`rounded-2xl px-4 py-3 border transition ${
                  type === "video"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40"
                }`}
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  <Film className="w-4 h-4" />
                  Video loop
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Accent glow</label>
            <input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="rgba(140,220,255,0.18)"
              className="w-full rounded-2xl bg-background/50 border border-border px-4 py-3 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Fallback background</label>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              rows={3}
              className="w-full rounded-2xl bg-background/50 border border-border px-4 py-3 outline-none resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">File</label>
            <input
              id="ambient-scene-file"
              type="file"
              accept={type === "video" ? "video/*" : "image/*"}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-2xl bg-background/50 border border-border px-4 py-3 outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-primary/15 file:px-3 file:py-2"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-2xl px-4 py-3 bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload scene"}
          </button>
        </form>

        <div className="glass-card p-5 rounded-3xl space-y-4">
          <div>
            <p className="font-semibold">Existing uploaded scenes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Built-in gradients stay in code. This manager is for uploaded static and video backgrounds.
            </p>
          </div>

          <div className="grid gap-3">
            {scenes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No uploaded scenes yet.
              </div>
            ) : (
              scenes.map((scene) => (
                <div key={scene.id} className="rounded-3xl border border-border/60 bg-background/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{scene.name}</p>
                        <span className="text-[11px] uppercase tracking-wide rounded-full px-2 py-1 border border-border/70 text-muted-foreground">
                          {scene.type}
                        </span>
                        <span
                          className={`text-[11px] uppercase tracking-wide rounded-full px-2 py-1 border ${
                            scene.isVisible === false
                              ? "border-red-400/30 text-red-300"
                              : "border-emerald-400/30 text-emerald-300"
                          }`}
                        >
                          {scene.isVisible === false ? "Hidden" : "Visible"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 break-all">{scene.sourceUrl}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(scene)}
                        className="rounded-2xl border border-border px-3 py-2 text-sm hover:bg-secondary/20"
                      >
                        {scene.isVisible === false ? "Show" : "Hide"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(scene)}
                        className="rounded-2xl border border-red-400/30 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
