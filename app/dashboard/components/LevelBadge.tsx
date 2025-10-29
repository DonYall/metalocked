import { Badge } from "@/components/ui/badge";
import { Medal, Trophy, Gem, Crown } from "lucide-react";

type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "mythic";

function tierForLevel(level: number): Tier {
  if (level >= 30) return "mythic";
  if (level >= 20) return "diamond";
  if (level >= 15) return "platinum";
  if (level >= 10) return "gold";
  if (level >= 5) return "silver";
  return "bronze";
}

function tierMeta(tier: Tier) {
  switch (tier) {
    case "bronze":
      return { label: "Bronze", Icon: Medal, className: "bg-amber-900/40 text-amber-200 border-amber-800" };
    case "silver":
      return { label: "Silver", Icon: Medal, className: "bg-zinc-800 text-zinc-200 border-zinc-700" };
    case "gold":
      return { label: "Gold", Icon: Trophy, className: "bg-yellow-900/40 text-yellow-200 border-yellow-700" };
    case "platinum":
      return { label: "Platinum", Icon: Gem, className: "bg-cyan-900/40 text-cyan-200 border-cyan-700" };
    case "diamond":
      return { label: "Diamond", Icon: Gem, className: "bg-indigo-900/40 text-indigo-200 border-indigo-700" };
    case "mythic":
      return { label: "Mythic", Icon: Crown, className: "bg-violet-900/40 text-violet-200 border-violet-700" };
  }
}

export default function LevelBadge({ level, showLabel = true }: { level: number; showLabel?: boolean }) {
  const tier = tierForLevel(level);
  const { label, Icon, className } = tierMeta(tier);

  return (
    <Badge variant="outline" className={`gap-1.5 pl-1.5 pr-2 ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {showLabel ? (
        <span className="text-xs">
          {label} · L{level}
        </span>
      ) : (
        <span className="text-xs">L{level}</span>
      )}
    </Badge>
  );
}

export function LevelIcon({ level, size = 24 }: { level: number; size?: number }) {
  const tier = tierForLevel(level);
  const { Icon, className } = tierMeta(tier);
  return <Icon className={`h-${size} w-${size} ${className} p-1 rounded-full`} aria-hidden />;
}
