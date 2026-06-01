import {
  LayoutDashboard, Users, Filter, GitBranch, Megaphone, MessageCircle,
  BarChart3, Sparkles, Award, ShieldCheck, Network,
} from "lucide-react";

export type NavItem =
  | { section: string }
  | { href: string; label: string; icon: typeof LayoutDashboard };

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { section: "Customer" },
  { href: "/customers", label: "Customers (CDP)", icon: Users },
  { href: "/cross-sell", label: "Cross-brand & sell", icon: Network },
  { href: "/segments", label: "Segments", icon: Filter },
  { section: "Engage" },
  { href: "/journeys", label: "Journeys", icon: GitBranch },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { section: "Intelligence" },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai", label: "AI & Personalization", icon: Sparkles },
  { href: "/loyalty", label: "Loyalty", icon: Award },
  { section: "Govern" },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];
