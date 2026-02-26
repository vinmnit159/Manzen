import { Link, useLocation } from "react-router";
import { 
  Home, 
  Briefcase, 
  FileCheck, 
  BarChart3, 
  Shield, 
  Users, 
  TrendingUp, 
  Building2, 
  Lock, 
  Server,
  UserCheck,
  Settings,
  CheckSquare,
  FileWarning,
  ChevronDown,
  ChevronRight,
  UserCog,
  X,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/app/components/ui/utils";
import { authService } from "@/services/api/auth";
import { useSidebar } from "@/app/components/Layout";

type AppRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SECURITY_OWNER' | 'AUDITOR' | 'CONTRIBUTOR' | 'VIEWER';

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  /** If set, only these roles can see this nav item */
  roles?: AppRole[];
  children?: {
    title: string;
    href: string;
    roles?: AppRole[];
  }[];
}

// Roles that have full admin/operator access to all nav items
const ADMIN_ROLES: AppRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'];

const navigation: NavItem[] = [
  { title: "Home",    href: "/",        icon: Home },
  { title: "My Work", href: "/my-work", icon: Briefcase },
  { title: "Tests",   href: "/tests",   icon: FileCheck },
  { title: "Reports", href: "/reports", icon: BarChart3 },

  // Auditor-only shortcut
  {
    title: "My Audit",
    href:  "/auditor/dashboard",
    icon:  ClipboardCheck,
    roles: ['AUDITOR'],
  },

  {
    title: "Compliance",
    icon: Shield,
    children: [
      { title: "Frameworks", href: "/compliance/frameworks" },
      { title: "Controls",   href: "/compliance/controls" },
      { title: "Policies",   href: "/compliance/policies" },
      { title: "Documents",  href: "/compliance/documents" },
      { title: "Audits",    href: "/compliance/audits" },
      { title: "Findings",  href: "/compliance/findings" },
      { title: "Settings",  href: "/compliance/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  {
    title: "Customer Trust",
    icon: Users,
    children: [
      { title: "Trust Center",  href: "/customer-trust/trust-center" },
      { title: "Settings",      href: "/customer-trust/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  {
    title: "Risk",
    icon: TrendingUp,
    children: [
      { title: "Overview",       href: "/risk/overview" },
      { title: "Risks",          href: "/risk/risks" },
      { title: "Risk Library",   href: "/risk/library" },
      { title: "Action Tracker", href: "/risk/action-tracker" },
      { title: "Snapshot",       href: "/risk/snapshot" },
      { title: "Settings",       href: "/risk/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  { title: "Vendors", href: "/vendors", icon: Building2 },
  {
    title: "Privacy",
    icon: Lock,
    children: [
      { title: "Data Inventory", href: "/privacy/data-inventory" },
      { title: "Settings",       href: "/privacy/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  {
    title: "Assets",
    icon: Server,
    children: [
      { title: "Inventory",        href: "/assets/inventory" },
      { title: "Code changes",     href: "/assets/code-changes" },
      { title: "Vulnerabilities",  href: "/assets/vulnerabilities" },
      { title: "Security alerts",  href: "/assets/security-alerts" },
      { title: "Settings",         href: "/assets/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  {
    title: "Personnel",
    icon: UserCheck,
    children: [
      { title: "People",    href: "/personnel/people" },
      { title: "Computers", href: "/personnel/computers" },
      { title: "Access",    href: "/personnel/access" },
      { title: "Settings",  href: "/personnel/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  {
    title: "Integrations",
    icon: Settings,
    children: [
      { title: "All Integrations", href: "/integrations" },
      { title: "Slack",            href: "/integrations/slack", roles: [...ADMIN_ROLES] },
    ],
  },
  { title: "My Security Tasks",  href: "/my-security-tasks",  icon: CheckSquare },
  { title: "My Access Requests", href: "/my-access-requests", icon: FileWarning },
];

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function formatRole(role?: string): string {
  if (!role) return "";
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function Sidebar() {
  const location = useLocation();
  const { close: closeSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const user = authService.getCachedUser();
  const userRole = (user?.role ?? '') as AppRole;
  const displayName = user?.name || user?.email || "User";
  const initials = getInitials(user?.name, user?.email);
  const roleLabel = formatRole(user?.role);

  // Role visibility helper
  const canSee = (roles?: AppRole[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (children: { href: string }[]) =>
    children.some((child) => location.pathname === child.href);

  return (
    <aside className="w-64 h-full bg-slate-900 text-white flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-semibold">Manzen</span>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          // Hide items restricted to other roles
          if (!canSee(item.roles)) return null;

          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.title);

          // Filter children by role
          const visibleChildren = hasChildren
            ? item.children!.filter(c => canSee(c.roles))
            : [];

          const parentActive = visibleChildren.length > 0 && isParentActive(visibleChildren);

          // Skip parent groups where all children are hidden
          if (hasChildren && visibleChildren.length === 0) return null;

          if (hasChildren) {
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    parentActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-800 text-slate-200"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={closeSidebar}
                        className={cn(
                          "block px-3 py-1.5 rounded-md text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.title}
              to={item.href!}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.href!)
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          to="/account-settings"
          onClick={closeSidebar}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            isActive("/account-settings")
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-800"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            {roleLabel && (
              <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
            )}
          </div>
          <UserCog className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
