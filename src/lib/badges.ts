export type BadgeId =
  | "first_session"
  | "hour_club"
  | "ten_hours"
  | "streak_3"
  | "streak_7"
  | "level_5"
  | "level_10";

export type Badge = {
  id: BadgeId;
  title: string;
  desc: string;
  icon: string;
};

export const BADGES: Badge[] = [
  { id: "first_session", title: "First Session", desc: "Tracked your first study minutes.", icon: "✨" },
  { id: "hour_club", title: "Hour Club", desc: "Studied 60+ total minutes.", icon: "⏱️" },
  { id: "ten_hours", title: "10 Hours", desc: "Studied 600+ total minutes.", icon: "🏅" },
  { id: "streak_3", title: "Streak x3", desc: "3-day streak.", icon: "🔥" },
  { id: "streak_7", title: "Streak x7", desc: "7-day streak.", icon: "💥" },
  { id: "level_5", title: "Level 5", desc: "Reached level 5.", icon: "⚡" },
  { id: "level_10", title: "Level 10", desc: "Reached level 10.", icon: "👑" },
];

export type StatsLike = {
  totalMinutes?: number;
  streak?: number;
  level?: number;
  badges?: string[];
};

export function computeNewBadges(stats: StatsLike): BadgeId[] {
  const total = stats.totalMinutes || 0;
  const streak = stats.streak || 0;
  const level = stats.level || 0;
  const owned = new Set((stats.badges || []) as BadgeId[]);

  const out: BadgeId[] = [];

  const give = (id: BadgeId) => {
    if (!owned.has(id)) out.push(id);
  };

  if (total >= 1) give("first_session");
  if (total >= 60) give("hour_club");
  if (total >= 600) give("ten_hours");
  if (streak >= 3) give("streak_3");
  if (streak >= 7) give("streak_7");
  if (level >= 5) give("level_5");
  if (level >= 10) give("level_10");

  return out;
   }
