import {
  Navigation,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  CornerUpLeft,
  CornerUpRight,
  Merge,
  RotateCw,
  Flag,
} from "lucide-react";

export function maneuverIcon(type, modifier) {
  const left = modifier?.includes("left");
  const right = modifier?.includes("right");
  switch (type) {
    case "arrive":
      return Flag;
    case "depart":
      return Navigation;
    case "turn":
    case "end of road":
    case "new name":
      if (left) return CornerUpLeft;
      if (right) return CornerUpRight;
      return ArrowUp;
    case "continue":
      return ArrowUp;
    case "merge":
      return Merge;
    case "roundabout":
    case "rotary":
      return RotateCw;
    case "on_ramp":
    case "off_ramp":
    case "fork":
      if (left) return ArrowLeft;
      if (right) return ArrowRight;
      return ArrowUp;
    default:
      return Navigation;
  }
}

export const fmtDistance = (m) => {
  if (m == null) return "";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1609.34).toFixed(1)} mi`;
};

export const fmtDuration = (s) => {
  if (s == null) return "";
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
};