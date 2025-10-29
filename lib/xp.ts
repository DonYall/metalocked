export type Frequency = "daily" | "weekly" | "none";

export function baseXpForFrequency(freq: Frequency): number {
  switch (freq) {
    case "daily":
      return 10;
    case "weekly":
      return 15;
    case "none":
      return 8;
  }
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export function streakBonusMultiplier(streakAfter: number): number {
  const steps = Math.max(0, Math.min(10, streakAfter - 1));
  return 1 + 0.02 * steps;
}

export function computeStreak(freq: Frequency, lastCompletedOnISO: string | null, completionAt: Date): { completedOn: string; streakAfter: number } {
  const local = new Date(completionAt); // assume server uses UTC; OK for MVP; later: per-user TZ
  const toDateIso = (d: Date) => d.toISOString().slice(0, 10);

  if (freq === "none") {
    return { completedOn: toDateIso(local), streakAfter: 1 };
  }

  const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const startOfISOWeek = (d: Date) => {
    const day = d.getUTCDay() || 7; // 1..7
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - day + 1);
    return startOfDay(monday);
  };

  if (freq === "daily") {
    const today = startOfDay(local);
    const completedOn = toDateIso(today);
    if (!lastCompletedOnISO) return { completedOn, streakAfter: 1 };
    const last = new Date(lastCompletedOnISO + "T00:00:00.000Z");
    const diffDays = Math.round((today.getTime() - last.getTime()) / (24 * 3600 * 1000));
    const streakAfter = diffDays === 1 ? 2 : diffDays === 0 ? 1 : 1;
    return { completedOn, streakAfter };
  }

  const thisWeek = startOfISOWeek(local);
  const completedOn = toDateIso(thisWeek);
  if (!lastCompletedOnISO) return { completedOn, streakAfter: 1 };
  const last = new Date(lastCompletedOnISO + "T00:00:00.000Z");
  const diffWeeks = Math.round((thisWeek.getTime() - last.getTime()) / (7 * 24 * 3600 * 1000));
  const streakAfter = diffWeeks === 1 ? 2 : diffWeeks === 0 ? 1 : 1;
  return { completedOn, streakAfter };
}

export function computeAwardedXp(freq: Frequency, streakAfter: number): number {
  const base = baseXpForFrequency(freq);
  const mult = streakBonusMultiplier(streakAfter);
  return Math.round(base * mult);
}
