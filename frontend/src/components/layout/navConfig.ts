import {
  LayoutDashboard,
  CalendarCheck,
  KeyRound,
  Users,
  SearchCheck,
  Car,
  Layers,
  Wrench,
  ClipboardCheck,
  ShieldAlert,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  UserCog,
  Bell,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Role } from "../../types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: Role[];
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "Bookings", to: "/bookings", icon: CalendarCheck },
      { label: "Rentals", to: "/rentals", icon: KeyRound },
      { label: "Customers", to: "/customers", icon: Users },
      { label: "Availability", to: "/availability", icon: SearchCheck },
    ],
  },
  {
    label: "Fleet",
    items: [
      { label: "Vehicles", to: "/vehicles", icon: Car },
      { label: "Categories", to: "/categories", icon: Layers },
      { label: "Maintenance", to: "/maintenance", icon: Wrench },
      { label: "Inspections", to: "/inspections", icon: ClipboardCheck },
      { label: "Damage Reports", to: "/damages", icon: ShieldAlert },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", to: "/payments", icon: CreditCard },
      { label: "Transactions", to: "/transactions", icon: ArrowLeftRight },
      { label: "Expenses", to: "/expenses", icon: Receipt },
    ],
  },
  {
    label: "Reports",
    items: [{ label: "Analytics & Reports", to: "/reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", to: "/users", icon: UserCog, roles: ["ADMIN"] },
      { label: "Notifications", to: "/notifications", icon: Bell },
      { label: "Activity Log", to: "/activity", icon: History, roles: ["ADMIN", "MANAGER"] },
      { label: "Settings", to: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];
