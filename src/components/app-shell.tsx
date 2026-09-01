import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileBarChart,
  FileText,
  Fingerprint,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  MessageSquare,
  Plane,
  ScrollText,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useApp, type Perm, dateKey, newId, isoNow } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/sace-logo.png.asset.json";
import type { Role } from "@/lib/types";
import { EodLogoutDialog } from "@/components/eod-logout-dialog";
import { fmtTime } from "@/lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  perm?: Perm;
}

const NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "member"],
  },
  { to: "/tasks", label: "Tasks", icon: ClipboardList, roles: ["super_admin", "admin", "member"] },
  { to: "/eod", label: "EOD Reports", icon: FileText, roles: ["super_admin", "admin", "member"] },
  {
    to: "/attendance",
    label: "Attendance",
    icon: CalendarDays,
    roles: ["super_admin", "admin", "member"],
  },
  { to: "/leave", label: "Leave Requests", icon: Plane, roles: ["super_admin", "admin", "member"] },
  { to: "/leads", label: "Leads", icon: Fingerprint, roles: ["super_admin", "admin", "member"] },
  {
    to: "/messages",
    label: "Messages",
    icon: MessageSquare,
    roles: ["super_admin", "admin", "member"],
  },
  {
    to: "/tickets",
    label: "Support Tickets",
    icon: LifeBuoy,
    roles: ["super_admin", "admin", "member"],
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    roles: ["super_admin", "admin", "member"],
  },
  {
    to: "/team",
    label: "Team & Accounts",
    icon: Users,
    roles: ["super_admin", "admin"],
    perm: "manage_users",
  },
  {
    to: "/reports",
    label: "Progress Reports",
    icon: FileBarChart,
    roles: ["super_admin", "admin"],
    perm: "view_reports",
  },
  { to: "/audit", label: "Audit Logs", icon: ScrollText, roles: ["super_admin"] },
  { to: "/roles", label: "Roles & Permissions", icon: ShieldCheck, roles: ["super_admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "admin", "member"] },
];

export function roleLabel(role: Role) {
  return role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Team Member";
}

export function Initials({
  name,
  color,
  size = 36,
  src,
}: {
  name: string;
  color?: string | undefined;
  size?: number | undefined;
  src?: string | null | undefined;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-primary-foreground"
      style={{
        width: size,
        height: size,
        background: color ?? "var(--brand-purple)",
        fontSize: size / 2.8,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NoAccess() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-semibold text-foreground">You don't have access to this page</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask your Super Admin if you believe this is a mistake.
      </p>
    </div>
  );
}

function NotificationBell() {
  const { state, me, update } = useApp();
  const mine = state.notifications.filter((n) => n.userId === me?.id);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"
              aria-hidden
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <button
            className="text-xs font-medium text-primary hover:underline"
            onClick={() =>
              update((d) => {
                d.notifications.forEach((n) => {
                  if (n.userId === me?.id) n.read = true;
                });
              })
            }
          >
            Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mine.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          mine.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                to={n.href ?? "/dashboard"}
                className="flex flex-col items-start gap-0.5"
                onClick={() =>
                  update((d) => {
                    const t = d.notifications.find((x) => x.id === n.id);
                    if (t) t.read = true;
                  })
                }
              >
                <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderPunchStatus({ onOpenEod }: { onOpenEod: () => void }) {
  const { state, me, update, log } = useApp();
  const navigate = useNavigate();
  const todayKey = dateKey(new Date());
  const rec = state.attendance.find((a) => a.userId === me?.id && a.date === todayKey);

  const isPunchedIn = !!(rec?.punchIn && !rec?.punchOut);
  const isPunchedOut = !!(rec?.punchIn && rec?.punchOut);

  const handleQuickPunchIn = () => {
    const now = isoNow();
    update((d) => {
      let r = d.attendance.find((x) => x.userId === me?.id && x.date === todayKey);
      if (!r) {
        r = {
          id: newId(),
          userId: me!.id,
          date: todayKey,
          punchIn: now,
          punchOut: null,
          punchInProof: null,
          punchOutProof: null,
          status: "present",
        };
        d.attendance.push(r);
      } else {
        r.punchIn = now;
        r.status = "present";
      }
    });
    log("Punch In", "Quick punched in from header");
    toast.success("Punched in successfully. Have a great workday!");
  };

  if (isPunchedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/attendance"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>In at {fmtTime(rec!.punchIn!)}</span>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenEod}
          className="h-8 gap-1 text-xs border-border"
          title="Punch out and submit End-of-Day report"
        >
          <LogOut className="h-3.5 w-3.5" /> Punch out
        </Button>
      </div>
    );
  }

  if (isPunchedOut) {
    return (
      <Link
        to="/attendance"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Out at {fmtTime(rec!.punchOut!)}</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/attendance"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
      >
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span>Not punched in</span>
      </Link>
      <Button size="sm" onClick={handleQuickPunchIn} className="h-8 gap-1.5 text-xs shadow-xs">
        <LogIn className="h-3.5 w-3.5" /> Punch in
      </Button>
    </div>
  );
}

const SIDEBAR_KEY = "sace-sidebar-open";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, logout, can } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);
  const [deskOpen, setDeskOpen] = React.useState(true);
  const [eodOpen, setEodOpen] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem(SIDEBAR_KEY) === "closed") setDeskOpen(false);
  }, []);

  const toggleDesk = () => {
    setDeskOpen((v) => {
      localStorage.setItem(SIDEBAR_KEY, v ? "closed" : "open");
      return !v;
    });
  };

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (me === null) navigate({ to: "/", replace: true });
  }, [me, navigate]);

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  const items = NAV.filter((i) => i.roles.includes(me.role) && (!i.perm || can(i.perm)));

  const sidebar = (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <div className="rounded-xl bg-white px-3 py-2.5">
          <img
            src={logo.url}
            alt="South Australian College of English"
            className="h-8 w-full object-contain"
          />
        </div>
        <p className="mt-2 text-xs text-sidebar-foreground/60">Workforce operations portal</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setEodOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {deskOpen && <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full">
            {sidebar}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-12 top-3 text-background"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={toggleDesk}
            aria-label={deskOpen ? "Hide menu" : "Show menu"}
          >
            {deskOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{me.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roleLabel(me.role)} · {me.designation}
            </p>
          </div>
          <HeaderPunchStatus onOpenEod={() => setEodOpen(true)} />
          <NotificationBell />
          <Link to="/settings" aria-label="Profile settings">
            <Initials name={me.fullName} color={me.avatarColor} src={me.avatarUrl} />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <EodLogoutDialog
        open={eodOpen}
        onOpenChange={setEodOpen}
        onDone={() => {
          logout();
          navigate({ to: "/", replace: true });
        }}
      />
    </div>
  );
}
