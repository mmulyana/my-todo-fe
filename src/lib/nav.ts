import {
  CalendarClock,
  CalendarDays,
  Infinity as InfinityIcon,
  Star,
  Sun,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "today", name: "Today", icon: Sun },
  { id: "upcoming", name: "Upcoming", icon: CalendarClock },
  { id: "important", name: "Important", icon: Star },
  { id: "all", name: "All", icon: InfinityIcon },
  { id: "timer", name: "Timer", icon: Timer },
  { id: "calendar", name: "Calendar", icon: CalendarDays },
];
