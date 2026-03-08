import {
  LayoutDashboard,
  Users, 
  BarChart3,
  Activity, 
  Shield,
  Settings, 
  Bell, 
  HelpCircle, 
} from "lucide-react";

export const EMPLOYER_PRIMARY_NAV = [
  { 
    id: "overview", 
    label: "Workforce Overview", 
    icon: LayoutDashboard, 
    href: "/dashboard/employer" 
  },
  { 
    id: "employees", 
    label: "Employee Roster", 
    icon: Users, 
    href: "/dashboard/employer/employees" 
  },
  { 
    id: "reports", 
    label: "Reports & Analytics", 
    icon: BarChart3, 
    href: "/dashboard/employer/reports" 
  },
  { 
    id: "programs", 
    label: "Health Programs", 
    icon: Activity, 
    href: "/dashboard/employer/programs" 
  },
  { 
    id: "compliance", 
    label: "Compliance", 
    icon: Shield, 
    href: "/dashboard/employer/compliance" 
  },
];

export const EMPLOYER_SECONDARY_NAV = [
  { 
    id: "notifications", 
    label: "Notifications", 
    icon: Bell, 
    href: "/dashboard/employer/notifications" 
  },
  { 
    id: "help", 
    label: "Help & Support", 
    icon: HelpCircle, 
    href: "/dashboard/employer/help" 
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings, 
    href: "/dashboard/employer/settings" 
  },
];