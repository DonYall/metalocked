import { Badge } from "@/components/ui/badge";
import { AwardIcon, CheckCircle2, Crown, Flame, Heart, Medal, Star, Trophy, Zap } from "lucide-react";

type Tier =
  | "unreliable"
  | "inconsistent"
  | "unsteady"
  | "average"
  | "reliable"
  | "consistent"
  | "disciplined"
  | "trusted"
  | "exemplary"
  | "legendary";

function tierForRep(reputation: number): Tier {
  if (reputation >= 98) return "legendary";
  if (reputation >= 92) return "exemplary";
  if (reputation >= 85) return "trusted";
  if (reputation >= 75) return "disciplined";
  if (reputation >= 60) return "consistent";
  if (reputation >= 45) return "reliable";
  if (reputation >= 30) return "average";
  if (reputation >= 20) return "unsteady";
  if (reputation >= 10) return "inconsistent";
  return "unreliable";
}

function tierMeta(tier: Tier) {
  switch (tier) {
    case "legendary":
      return { label: "Legendary", Icon: Crown, className: "text-yellow-600" };
    case "exemplary":
      return { label: "Exemplary", Icon: Trophy, className: "text-purple-600" };
    case "trusted":
      return { label: "Trusted", Icon: Medal, className: "text-blue-600" };
    case "disciplined":
      return { label: "Disciplined", Icon: Star, className: "text-green-600" };
    case "consistent":
      return { label: "Consistent", Icon: CheckCircle2, className: "text-teal-600" };
    case "reliable":
      return { label: "Reliable", Icon: AwardIcon, className: "text-cyan-600" };
    case "average":
      return { label: "Average", Icon: Flame, className: "text-orange-600" };
    case "unsteady":
      return { label: "Unsteady", Icon: Heart, className: "text-pink-600" };
    case "inconsistent":
      return { label: "Inconsistent", Icon: Zap, className: "text-red-600" };
    case "unreliable":
      return { label: "Unreliable", Icon: AwardIcon, className: "text-gray-600" };
  }
}

export default function ReputationBadge({ reputation, showLabel = true }: { reputation: number; showLabel?: boolean }) {
  const tier = tierForRep(reputation);
  const { label, Icon, className } = tierMeta(tier);

  return (
    <Badge variant="outline" className={`gap-1.5 pl-1.5 pr-2 ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {showLabel && <span className="text-xs">{label}</span>}
    </Badge>
  );
}

export function ReputationIcon({ reputation, size = 24 }: { reputation: number; size?: number }) {
  const tier = tierForRep(reputation);
  const { Icon, className } = tierMeta(tier);
  return <Icon className={`h-${size} w-${size} ${className} p-1 rounded-full`} aria-hidden />;
}

export function tierName(reputation: number): string {
  const tier = tierForRep(reputation);
  const { label } = tierMeta(tier);
  return label;
}
