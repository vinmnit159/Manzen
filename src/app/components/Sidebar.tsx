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
  ChevronDown,
  ChevronRight,
  UserCog,
  X,
  ClipboardCheck,
  KeyRound,
  Bell,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/components/ui/utils";
import { authService } from "@/services/api/auth";
import { useSidebar } from "@/app/components/Layout";

type AppRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SECURITY_OWNER' | 'AUDITOR' | 'CONTRIBUTOR' | 'VIEWER';

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  roles?: AppRole[];
  children?: {
    title: string;
    href: string;
    roles?: AppRole[];
  }[];
}

const ADMIN_ROLES: AppRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'];

const navigation: NavItem[] = [
  { title: "Home",    href: "/",        icon: Home },
  { title: "My Work", href: "/my-work", icon: Briefcase },
  {
    title: "Tests",
    icon: FileCheck,
    children: [
      { title: "Tests", href: "/tests" },
    ],
  },
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
      { title: "Risk Engine",    href: "/risk/engine", roles: [...ADMIN_ROLES] },
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
      { title: "People",          href: "/personnel/people" },
      { title: "Computers",       href: "/personnel/computers" },
      { title: "Account Mapping", href: "/personnel/access" },
      { title: "Settings",        href: "/personnel/settings", roles: [...ADMIN_ROLES] },
    ],
  },
  {
    title: "Access",
    icon: KeyRound,
    children: [
      { title: "Users",           href: "/settings/access/users",    roles: [...ADMIN_ROLES] },
      { title: "Roles",           href: "/settings/access/roles",    roles: [...ADMIN_ROLES] },
      { title: "Access Requests", href: "/settings/access/requests" },
    ],
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Integrations",
    icon: Settings,
    children: [
      { title: "Connected Apps", href: "/integrations" },
      { title: "Partner API",    href: "/integrations/partner-api", roles: ['SUPER_ADMIN'] },
    ],
  },
  { title: "My Security Tasks", href: "/my-security-tasks", icon: CheckSquare },
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

// ── Flyout panel for collapsed sidebar ────────────────────────────────────────

interface FlyoutProps {
  item: NavItem;
  visibleChildren: { title: string; href: string }[];
  isActive: (href: string) => boolean;
  closeSidebar: () => void;
}

function CollapsedFlyoutItem({ item, visibleChildren, isActive, closeSidebar }: FlyoutProps) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = item.icon;
  const parentActive = visibleChildren.some((c) => isActive(c.href));

  const showFlyout = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTop(rect.top);
    }
    setOpen(true);
  };

  const hideFlyout = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 100);
  };

  const cancelHide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={showFlyout}
      onMouseLeave={hideFlyout}
    >
      {/* Icon-only trigger */}
      <div
        className={cn(
          "w-full flex items-center justify-center px-3 py-2 rounded-md text-sm transition-colors cursor-default select-none",
          parentActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-200"
        )}
        title={item.title}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
      </div>

      {/* Flyout panel — rendered in a fixed portal so it escapes sidebar overflow */}
      {open && (
        <div
          className="fixed z-[200] ml-1 min-w-[200px] rounded-md border border-slate-700 bg-slate-900 shadow-xl py-1"
          style={{ top, left: "5rem" /* sidebar collapsed width = 80px = 5rem */ }}
          onMouseEnter={cancelHide}
          onMouseLeave={hideFlyout}
        >
          {/* Section header */}
          <p className="px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase border-b border-slate-700 mb-1">
            {item.title}
          </p>
          {visibleChildren.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              onClick={() => { setOpen(false); closeSidebar(); }}
              className={cn(
                "block px-3 py-2 text-sm transition-colors",
                isActive(child.href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-slate-800"
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

// ── Main Sidebar ───────────────────────────────────────────────────────────────

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const location = useLocation();
  const { close: closeSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isCompact = collapsed && isDesktop;

  const user = authService.getCachedUser();
  const userRole = (user?.role ?? '') as AppRole;
  const displayName = user?.name || user?.email || "User";
  const initials = getInitials(user?.name, user?.email);
  const roleLabel = formatRole(user?.role);

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
    <aside className={cn("h-full bg-slate-900 text-white flex flex-col w-64 lg:transition-[width] lg:duration-200", collapsed ? "lg:w-20" : "lg:w-64")}>
      {/* Brand */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link
          to="/"
          onClick={closeSidebar}
          className={cn("flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", collapsed && "lg:justify-center lg:w-full")}
          aria-label="Go to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-400">
            <path d="M15 50 Q50 8 85 50" />
            <path d="M85 50 Q50 92 15 50" />
            <line x1="26" y1="24" x2="20" y2="18" />
            <line x1="74" y1="24" x2="80" y2="18" />
            <line x1="26" y1="76" x2="20" y2="82" />
            <line x1="74" y1="76" x2="80" y2="82" />
            <path d="M25 50 Q50 18 75 50 Q50 82 25 50 Z" />
            <circle cx="50" cy="50" r="16" />
            <path d="M50 34 Q66 34 66 50 Q66 62 56 67" />
            <circle cx="50" cy="50" r="6.5" />
            <path d="M38 60 Q50 70 62 60" />
          </svg>
          <span className={cn("text-xl font-semibold", collapsed && "lg:hidden")}>CloudAnzen</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible p-3 space-y-1">
        {navigation.map((item) => {
          if (!canSee(item.roles)) return null;

          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.title);

          const visibleChildren = hasChildren
            ? item.children!.filter(c => canSee(c.roles))
            : [];

          const parentActive = visibleChildren.length > 0 && isParentActive(visibleChildren);

          if (hasChildren && visibleChildren.length === 0) return null;

          // ── Collapsed + has children → hover flyout ──────────────────────
          if (hasChildren && isCompact) {
            return (
              <CollapsedFlyoutItem
                key={item.title}
                item={item}
                visibleChildren={visibleChildren}
                isActive={isActive}
                closeSidebar={closeSidebar}
              />
            );
          }

          // ── Expanded + has children → inline accordion ───────────────────
          if (hasChildren) {
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    parentActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-800 text-slate-200",
                    collapsed && "lg:justify-center"
                  )}
                  title={item.title}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className={cn("flex-1 text-left", collapsed && "lg:hidden")}>{item.title}</span>
                  {isExpanded ? (
                    <ChevronDown className={cn("w-4 h-4", collapsed && "lg:hidden")} />
                  ) : (
                    <ChevronRight className={cn("w-4 h-4", collapsed && "lg:hidden")} />
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

          // ── Leaf item (no children) ───────────────────────────────────────
          return (
            <Link
              key={item.title}
              to={item.href!}
              onClick={closeSidebar}
              title={item.title}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                collapsed && "lg:justify-center",
                isActive(item.href!)
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          to="/settings/profile"
          onClick={closeSidebar}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            collapsed && "lg:justify-center",
            location.pathname.startsWith("/settings")
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-800"
          )}
          title="Settings"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className={cn("flex-1 min-w-0", collapsed && "lg:hidden")}>
            <p className="text-sm font-medium truncate">{displayName}</p>
            {roleLabel && (
              <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
            )}
          </div>
          <UserCog className={cn("w-4 h-4 text-slate-400 flex-shrink-0", collapsed && "lg:hidden")} />
        </Link>
      </div>
    </aside>
  );
}
