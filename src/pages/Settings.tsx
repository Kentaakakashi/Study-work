import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { THEMES } from "@/theme/themes";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ProfileDoc = {
  displayName?: string;
  bio?: string;
  status?: string;
  cosmetics?: {
    decoration?: string;
    effect?: string;
    nameplate?: string;
    ring?: string;
    bannerUrl?: string;
  };
};

const COSMETICS = {
  decoration: [
    { id: "none", label: "None" },
    { id: "baker-bear", label: "Baker Bear" },
    { id: "sparkle", label: "Sparkle" },
    { id: "hearts", label: "Hearts" },
  ],
  effect: [
    { id: "none", label: "None" },
    { id: "aura", label: "Aura" },
    { id: "bubbles", label: "Bubbles" },
    { id: "butterfly-haven", label: "Butterfly Haven" },
  ],
  nameplate: [
    { id: "none", label: "None" },
    { id: "soft", label: "Soft" },
    { id: "neon", label: "Neon" },
    { id: "magic-hearts-blue", label: "Magic Hearts (Blue)" },
  ],
  ring: [
    { id: "none", label: "None" },
    { id: "soft", label: "Soft" },
    { id: "glow", label: "Glow" },
    { id: "pixel", label: "Pixel" },
  ],
} as const;

const LABELS = {
  decoration: Object.fromEntries(COSMETICS.decoration.map((o) => [o.id, o.label])),
  effect: Object.fromEntries(COSMETICS.effect.map((o) => [o.id, o.label])),
  nameplate: Object.fromEntries(COSMETICS.nameplate.map((o) => [o.id, o.label])),
  ring: Object.fromEntries(COSMETICS.ring.map((o) => [o.id, o.label])),
} as const;

function safeBg(url: string) {
  const u = (url || "").trim();
  // Avoid weirdness like `javascript:`. Keep it simple.
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return "";
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function Settings() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { themeId, setThemeId } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");

  const [decoration, setDecoration] = useState<string>("none");
  const [effect, setEffect] = useState<string>("none");
  const [nameplate, setNameplate] = useState<string>("none");
  const [ring, setRing] = useState<string>("none");
  const [bannerUrl, setBannerUrl] = useState<string>("");

  const themeOptions = useMemo(
    () => THEMES.map((t) => ({ id: t.id, name: t.name })),
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const data = (snap.exists() ? snap.data() : {}) as ProfileDoc;

        if (cancelled) return;

        setDisplayName(data.displayName ?? (user.displayName || ""));
        setBio(data.bio ?? "");
        setStatus(data.status ?? "");

        setDecoration(data.cosmetics?.decoration ?? "none");
        setEffect(data.cosmetics?.effect ?? "none");
        setNameplate(data.cosmetics?.nameplate ?? "none");
        setRing(data.cosmetics?.ring ?? "none");
        setBannerUrl(data.cosmetics?.bannerUrl ?? "");
      } catch (e) {
        console.error(e);
        toast.error("Couldn’t load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.displayName]);

  async function onSave() {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const next: ProfileDoc = {
        displayName: displayName.trim().slice(0, 32),
        bio: bio.trim().slice(0, 160),
        status: status.trim().slice(0, 48),
        cosmetics: {
          decoration,
          effect,
          nameplate,
          ring,
          bannerUrl: bannerUrl.trim().slice(0, 500),
        },
      };
      await setDoc(doc(db, "profiles", user.uid), next, { merge: true });
      toast.success("Saved.");
    } catch (e) {
      console.error(e);
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    try {
      await logout();
      nav("/login");
    } catch (e) {
      console.error(e);
      toast.error("Logout failed.");
    }
  }

  const activeTheme = useMemo(
    () => THEMES.find((t) => t.id === themeId) ?? THEMES[0],
    [themeId]
  );

  return (
    <div className="min-h-[calc(100dvh-72px)] px-4 pb-10 pt-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Everything back to normal. But prettier.
            </p>
          </div>
          <Button onClick={onSave} disabled={saving || loading || !user}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Profile</h2>
                <p className="text-xs text-muted-foreground">
                  Display name, bio, and status.
                </p>
              </div>
              <Button
                variant="ghost"
                className="-mr-2"
                onClick={() => nav(-1)}
              >
                Back
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  maxLength={32}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  maxLength={160}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Say something. Or don’t."
                  className="min-h-[90px]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={status}
                  maxLength={48}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Studying… procrastinating…"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Your actual themes. Not that “Kenta OS / Lemon OS” nonsense.
            </p>

            <Separator className="my-4" />

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Theme</Label>
                <Select
                  value={themeId}
                  onValueChange={(v) => {
                    setThemeId(v);
                    toast.success(
                      `Applied: ${THEMES.find((t) => t.id === v)?.name ?? v}`
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Preview</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 ring-1 ring-white/10" />
                      <div>
                        <div className="text-sm font-semibold">
                          {activeTheme.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current theme
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <div className="h-10 rounded-xl bg-secondary/40 ring-1 ring-white/10" />
                      <div className="h-10 rounded-xl bg-secondary/30 ring-1 ring-white/10" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-secondary/30 p-4">
                    <div className="text-xs text-muted-foreground">
                      Quick swap
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {THEMES.slice(0, 4).map((t) => (
                        <Button
                          key={t.id}
                          size="sm"
                          variant={t.id === themeId ? "default" : "secondary"}
                          onClick={() => setThemeId(t.id)}
                          className={cn("rounded-xl", t.id === themeId && "shadow")}
                        >
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold">✨ Profile Cosmetics</h2>
            <p className="text-xs text-muted-foreground">
              Decorations, effects, nameplates. Make your profile actually fun to look at.
            </p>

            <Separator className="my-4" />

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Decoration</Label>
                  <Select value={decoration} onValueChange={setDecoration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {COSMETICS.decoration.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Effect</Label>
                  <Select value={effect} onValueChange={setEffect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {COSMETICS.effect.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Nameplate</Label>
                  <Select value={nameplate} onValueChange={setNameplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {COSMETICS.nameplate.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Ring</Label>
                  <Select value={ring} onValueChange={setRing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {COSMETICS.ring.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Live preview */}
              <div className="grid gap-2">
                <Label>Live preview</Label>
                <div
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-secondary/30"
                  style={{
                    backgroundImage: safeBg(bannerUrl)
                      ? `url(${safeBg(bannerUrl)})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Dark overlay so any banner stays readable */}
                  <div className="absolute inset-0 bg-black/45" />

                  {/* Effect layer */}
                  {effect !== "none" && (
                    <div className="absolute inset-0">
                      {effect === "aura" && (
                        <div className="absolute -inset-10 rounded-[40px] bg-primary/15 blur-2xl animate-pulse" />
                      )}

                      {effect === "bubbles" && (
                        <>
                          {[
                            { top: "15%", left: "10%", s: "h-3 w-3" },
                            { top: "55%", left: "18%", s: "h-5 w-5" },
                            { top: "25%", left: "70%", s: "h-4 w-4" },
                            { top: "62%", left: "78%", s: "h-6 w-6" },
                            { top: "40%", left: "45%", s: "h-3.5 w-3.5" },
                          ].map((b, i) => (
                            <span
                              key={i}
                              className={`absolute ${b.s} rounded-full bg-white/10 ring-1 ring-white/15 blur-[0.2px] animate-bounce`}
                              style={{
                                top: b.top,
                                left: b.left,
                                animationDelay: `${i * 120}ms`,
                              }}
                            />
                          ))}
                        </>
                      )}

                      {effect === "butterfly-haven" && (
                        <>
                          <span className="absolute left-4 top-4 text-white/70 text-sm animate-pulse">
                            🦋
                          </span>
                          <span
                            className="absolute right-6 bottom-4 text-white/60 text-xs animate-pulse"
                            style={{ animationDelay: "250ms" }}
                          >
                            🦋
                          </span>
                          <span
                            className="absolute left-1/2 top-8 -translate-x-1/2 text-white/50 text-xs animate-pulse"
                            style={{ animationDelay: "500ms" }}
                          >
                            🦋
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar + ring */}
                      <div
                        className={cn(
                          "relative h-14 w-14 rounded-2xl bg-primary/20 ring-1 ring-white/10 flex items-center justify-center",
                          ring === "glow" &&
                            "shadow-[0_0_18px_rgba(120,200,255,0.55)]",
                          ring === "pixel" && "border border-white/25"
                        )}
                      >
                        {ring === "soft" && (
                          <div className="absolute -inset-1 rounded-[18px] bg-white/10 blur-sm" />
                        )}
                        <span className="relative text-lg font-bold">
                          {(displayName || user?.email || "U")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>

                      {/* Nameplate + status */}
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-sm font-semibold ring-1 ring-white/10",
                            nameplate === "none" && "bg-white/10",
                            nameplate === "soft" && "bg-white/10",
                            nameplate === "neon" &&
                              "bg-cyan-500/15 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]",
                            nameplate === "magic-hearts-blue" &&
                              "bg-blue-500/15 text-blue-200 shadow-[0_0_14px_rgba(59,130,246,0.18)]"
                          )}
                        >
                          <span className="truncate">
                            {displayName || "Preview User"}
                          </span>
                          {decoration !== "none" && (
                            <span className="text-xs text-white/75">
                              •{" "}
                              {LABELS.decoration[
                                decoration as keyof typeof LABELS.decoration
                              ] || decoration}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 truncate text-xs text-white/70">
                          {status || "Focused. Unbothered. Studying."}
                        </div>
                      </div>
                    </div>

                    {/* Bottom tags */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {effect !== "none" && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/75 ring-1 ring-white/10">
                          Effect:{" "}
                          {LABELS.effect[effect as keyof typeof LABELS.effect] ||
                            effect}
                        </span>
                      )}
                      {ring !== "none" && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/75 ring-1 ring-white/10">
                          Ring:{" "}
                          {LABELS.ring[ring as keyof typeof LABELS.ring] || ring}
                        </span>
                      )}
                      {nameplate !== "none" && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/75 ring-1 ring-white/10">
                          Nameplate:{" "}
                          {LABELS.nameplate[
                            nameplate as keyof typeof LABELS.nameplate
                          ] || nameplate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  This is a preview. Hit <span className="font-semibold">Save</span>{" "}
                  when it looks good.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="banner">Banner image URL</Label>
                <Input
                  id="banner"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Used on your profile header.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold">Account</h2>
            <p className="text-xs text-muted-foreground">
              The boring but necessary buttons.
            </p>
            <Separator className="my-4" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                Signed in as{" "}
                <span className="font-semibold">{user?.email ?? ""}</span>
              </div>
              <Button variant="destructive" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
