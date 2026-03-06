export type BadgeId =
  | "first_session"
  | "hour_club"
  | "five_hours"
  | "ten_hours"
  | "twenty_five_hours"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "weekly_120"
  | "weekly_300"
  | "level_5"
  | "level_10";

export type BadgeIconKey =
  | "sparkles"
  | "timer"
  | "trophy"
  | "medal"
  | "flame"
  | "zap"
  | "crown"
  | "target";

export type Badge = {
  id: BadgeId;
  title: string;
  desc: string;
  icon: BadgeIconKey;
};

export const BADGES: Badge[] = [
  { id: "first_session", title: "First Session", desc: "Tracked your first study minutes.", icon: "sparkles" },
  { id: "hour_club", title: "Hour Club", desc: "Studied 60+ total minutes.", icon: "timer" },
  { id: "five_hours", title: "5 Hours", desc: "Studied 300+ total minutes.", icon: "trophy" },
  { id: "ten_hours", title: "10 Hours", desc: "Studied 600+ total minutes.", icon: "medal" },
  { id: "twenty_five_hours", title: "25 Hours", desc: "Studied 1500+ total minutes.", icon: "medal" },

  { id: "streak_3", title: "Streak x3", desc: "3-day streak.", icon: "flame" },
  { id: "streak_7", title: "Streak x7", desc: "7-day streak.", icon: "flame" },
  { id: "streak_14", title: "Streak x14", desc: "14-day streak.", icon: "flame" },
  { id: "streak_30", title: "Streak x30", desc: "30-day streak.", icon: "flame" },

  { id: "weekly_120", title: "Weekly Warrior", desc: "120+ minutes in a week.", icon: "target" },
  { id: "weekly_300", title: "Weekly Beast", desc: "300+ minutes in a week.", icon: "target" },

  { id: "level_5", title: "Level 5", desc: "Reached level 5.", icon: "zap" },
  { id: "level_10", title: "Level 10", desc: "Reached level 10.", icon: "crown" },
];

export type StatsLike = {
  totalMinutes?: number;
  weeklyMinutes?: number;
  streak?: number;
  level?: number;
  xp?: number;
  badges?: string[];
};

export function computeNewBadges(stats: StatsLike): BadgeId[] {
  const total = stats.totalMinutes || 0;
  const weekly = stats.weeklyMinutes || 0;
  const streak = stats.streak || 0;

  // Some parts store `level`, other parts only store `xp`.
  const level =
    stats.level ?? (typeof stats.xp === "number" ? Math.floor(stats.xp / 250) + 1 : 1);

  const owned = new Set((stats.badges || []) as BadgeId[]);
  const out: BadgeId[] = [];

  const give = (id: BadgeId) => {
    if (!owned.has(id)) out.push(id);
  };

  if (total >= 1) give("first_session");
  if (total >= 60) give("hour_club");
  if (total >= 300) give("five_hours");
  if (total >= 600) give("ten_hours");
  if (total >= 1500) give("twenty_five_hours");

  if (streak >= 3) give("streak_3");
  if (streak >= 7) give("streak_7");
  if (streak >= 14) give("streak_14");
  if (streak >= 30) give("streak_30");

  if (weekly >= 120) give("weekly_120");
  if (weekly >= 300) give("weekly_300");

  if (level >= 5) give("level_5");
  if (level >= 10) give("level_10");

  return out;
}
