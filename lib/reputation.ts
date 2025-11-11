export type Frequency = "daily" | "weekly" | "none";

export function baseRepForFrequency(freq: Frequency): number {
  switch (freq) {
    case "daily":
      return 2;
    case "weekly":
      return 5;
    case "none":
      return 2;
  }
}

export function streakBonus(streakAfter: number): number {
  if (streakAfter >= 30) return 10;
  if (streakAfter >= 14) return 7;
  if (streakAfter >= 7) return 5;
  if (streakAfter >= 3) return 3;
  return 0;
}

export function computeStreak(
  freq: Frequency,
  lastCompletedOnISO: string | null,
  completionAt: Date,
  timezone?: string,
): { completedOn: string; streakAfter: number } {
  const timezoneDate = (d: Date, tz?: string) => {
    if (!tz) return d;
    const localStr = d.toLocaleString("en-US", { timeZone: tz });
    return new Date(localStr);
  };

  const toDateIso = (d: Date) => d.toISOString().slice(0, 10);

  const startOfDay = (d: Date, tz?: string) => {
    const local = timezoneDate(d, tz);
    const start = new Date(local);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfISOWeek = (d: Date, tz?: string) => {
    const local = timezoneDate(d, tz);
    const day = local.getDay() || 7;
    const monday = new Date(local);
    monday.setDate(local.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const local = timezoneDate(completionAt, timezone);

  if (freq === "none") {
    const completedOn = toDateIso(startOfDay(local, timezone));
    return { completedOn, streakAfter: 1 };
  }

  if (freq === "daily") {
    const today = startOfDay(local, timezone);
    const completedOn = toDateIso(today);
    if (!lastCompletedOnISO) return { completedOn, streakAfter: 1 };

    const last = startOfDay(new Date(lastCompletedOnISO), timezone);
    const diffDays = Math.round((today.getTime() - last.getTime()) / (24 * 3600 * 1000));
    const streakAfter = diffDays === 1 ? 2 : diffDays === 0 ? 1 : 1;
    return { completedOn, streakAfter };
  }

  // weekly
  const thisWeek = startOfISOWeek(local, timezone);
  const completedOn = toDateIso(thisWeek);
  if (!lastCompletedOnISO) return { completedOn, streakAfter: 1 };

  const last = startOfISOWeek(new Date(lastCompletedOnISO), timezone);
  const diffWeeks = Math.round((thisWeek.getTime() - last.getTime()) / (7 * 24 * 3600 * 1000));
  const streakAfter = diffWeeks === 1 ? 2 : diffWeeks === 0 ? 1 : 1;
  return { completedOn, streakAfter };
}

export function computeAwardedRep(freq: Frequency, streakAfter: number): number {
  const base = baseRepForFrequency(freq);
  const bonus = streakBonus(streakAfter);
  return base + bonus;
}
