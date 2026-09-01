import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ADMIN_PERMS, DEFAULT_SEED_USERS, createSeedState, dateKey } from "./seed";
import {
  createAccount as createAccountFn,
  saveAccount as saveAccountFn,
  saveAdminPerms as saveAdminPermsFn,
  type CreateAccountInput,
  type SaveAccountInput,
} from "./accounts.functions";
import type {
  AppNotification,
  AppState,
  AttendanceRecord,
  AttendanceStatus,
  LeadDataset,
  LeaveRequest,
  Message,
  Perm,
  RecognitionAward,
  Role,
  Task,
  TaskProof,
  Ticket,
  User,
} from "./types";

/** Local slices (tasks, attendance, EOD, messages…) still live in the browser. */
const KEY = "sace-portal-state-v2";
const uid = () => Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString();

type Result = { ok: boolean; error?: string };

interface Ctx {
  state: AppState;
  me: User | null;
  /** false until the account list + session have loaded from the backend. */
  ready: boolean;
  login: (identifier: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  update: (fn: (draft: AppState) => void) => void;
  createAccount: (input: CreateAccountInput) => Promise<Result>;
  saveUser: (input: SaveAccountInput) => Promise<Result>;
  refreshAccounts: () => Promise<void>;
  can: (perm: Perm) => boolean;
  adminPerms: Perm[];
  setAdminPerms: (perms: Perm[]) => void;
  visibleUsers: () => User[];
  attendanceStatus: (userId: string, date: Date) => AttendanceStatus;
  notify: (userId: string, title: string, body: string, href?: string) => void;
  log: (action: string, detail: string) => void;
  reset: () => void;
}

export type { Perm };

const SUPER_ADMIN_PERMS: Perm[] = [
  "manage_users",
  "manage_admins",
  "approve_leave",
  "upload_leads",
  "view_all_tickets",
  "view_reports",
  "view_all_eod",
  "manage_recognition",
  "system_settings",
];

const AppCtx = React.createContext<Ctx | null>(null);

function errMessage(e: unknown, fallback: string) {
  const raw = e instanceof Error ? e.message : String(e ?? "");
  const cleaned = raw.replace(/^Error:\s*/i, "").trim();
  return cleaned || fallback;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => createSeedState());
  const [hydrated, setHydrated] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>(DEFAULT_SEED_USERS);
  const [adminPerms, setPerms] = React.useState<Perm[]>(DEFAULT_ADMIN_PERMS);
  const [sessionUserId, setSessionUserId] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  // ---- local slices -------------------------------------------------------
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        setState((prev) => ({
          ...prev,
          ...saved,
          users: saved.users && saved.users.length > 0 ? saved.users : prev.users,
          sessionUserId: saved.sessionUserId ?? prev.sessionUserId,
        }));
        if (saved.users && saved.users.length > 0) {
          setUsers(saved.users);
        }
        if (saved.sessionUserId) {
          setSessionUserId(saved.sessionUserId);
        }
        if (saved.adminPerms) {
          setPerms(saved.adminPerms);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, users, sessionUserId, adminPerms }));
    } catch {
      /* ignore */
    }
  }, [state, users, sessionUserId, adminPerms, hydrated]);

  // ---- accounts from the backend -----------------------------------------
  const refreshAccounts = React.useCallback(async () => {
    try {
      const [{ data: profiles }, { data: roles }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("app_settings").select("value").eq("key", "admin_perms").maybeSingle(),
      ]);

      if (profiles && profiles.length > 0) {
        const roleOf = new Map<string, Role>();
        for (const r of roles ?? []) roleOf.set(r.user_id, r.role as Role);
        setUsers(
          profiles.map((p) => ({
            id: p.id,
            fullName: p.full_name,
            username: p.username,
            email: p.email,
            password: "",
            designation: p.designation,
            department: p.department,
            role: roleOf.get(p.id) ?? "member",
            reportingAdminId: p.reporting_admin_id,
            active: p.active,
            dailyVision: p.daily_vision,
            avatarColor: p.avatar_color,
            avatarUrl: (p as { avatar_url?: string | null }).avatar_url ?? null,
            casualBalance: p.casual_balance,
            sickBalance: p.sick_balance,
          })),
        );
      }
      if (Array.isArray(settings?.value)) setPerms(settings.value as Perm[]);
    } catch {
      // Keep existing users on network/config fallback
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!alive) return;
        if (data?.user?.id) {
          setSessionUserId(data.user.id);
          await refreshAccounts();
        }
      } catch {
        /* ignore */
      } finally {
        if (alive) setReady(true);
      }
    })();

    try {
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        setSessionUserId(session?.user?.id ?? null);
        if (session?.user) void refreshAccounts();
      });
      return () => {
        alive = false;
        sub?.subscription?.unsubscribe?.();
      };
    } catch {
      return () => {
        alive = false;
      };
    }
  }, [refreshAccounts]);

  const update = React.useCallback((fn: (draft: AppState) => void) => {
    setState((prev) => {
      const draft = JSON.parse(JSON.stringify(prev)) as AppState;
      fn(draft);
      return draft;
    });
  }, []);

  const merged: AppState = { ...state, users, adminPerms, sessionUserId };
  const me = users.find((u) => u.id === sessionUserId) ?? null;

  const value: Ctx = {
    state: merged,
    adminPerms,
    me,
    ready,
    update,
    login: async (identifier, password) => {
      const raw = identifier.trim();
      if (!raw || !password)
        return { ok: false, error: "Enter your username or email and password." };
      let email = raw.toLowerCase();

      try {
        if (!email.includes("@")) {
          const { data } = await supabase.rpc("get_email_for_username", { _identifier: raw });
          if (data) email = data;
        }
        const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && signIn?.user) {
          await refreshAccounts();
          const { data: profile } = await supabase
            .from("profiles")
            .select("active")
            .eq("id", signIn.user.id)
            .maybeSingle();
          if (profile && profile.active === false) {
            await supabase.auth.signOut();
            return { ok: false, error: "This account is inactive. Contact your admin." };
          }
          setSessionUserId(signIn.user.id);
          return { ok: true };
        }
      } catch {
        /* fallback to local accounts */
      }

      // Offline / Seed account matching fallback
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === raw.toLowerCase() ||
          u.email.toLowerCase() === raw.toLowerCase() ||
          u.email.toLowerCase() === email.toLowerCase(),
      );

      if (found) {
        if (!found.active) {
          return { ok: false, error: "This account is inactive. Contact your admin." };
        }
        setSessionUserId(found.id);
        return { ok: true };
      }

      return { ok: false, error: "Invalid credentials. Please check and try again." };
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      setSessionUserId(null);
    },
    createAccount: async (input) => {
      try {
        await createAccountFn({ data: input });
        await refreshAccounts();
        return { ok: true };
      } catch {
        // Fallback create account in local state
        const id = `u-${uid()}`;
        const base = (input.email.split("@")[0] ?? "user").replace(/[^a-z0-9._-]/g, "") || "user";
        const newAcc: User = {
          id,
          fullName: input.fullName.trim(),
          username: base,
          email: input.email.trim().toLowerCase(),
          password: "",
          designation: input.designation.trim() || "Team Member",
          department: input.department.trim() || "General",
          role: input.role,
          reportingAdminId: input.reportingAdminId,
          active: true,
          dailyVision: null,
          avatarColor: input.avatarColor,
          avatarUrl: null,
          casualBalance: 12,
          sickBalance: 8,
        };
        setUsers((prev) => [...prev, newAcc]);
        return { ok: true };
      }
    },
    saveUser: async (input) => {
      try {
        await saveAccountFn({ data: input });
        await refreshAccounts();
        return { ok: true };
      } catch {
        // Fallback update in local state
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== input.userId) return u;
            return {
              ...u,
              fullName: input.fullName !== undefined ? input.fullName.trim() : u.fullName,
              email: input.email !== undefined ? input.email.trim().toLowerCase() : u.email,
              designation:
                input.designation !== undefined ? input.designation.trim() : u.designation,
              department: input.department !== undefined ? input.department.trim() : u.department,
              dailyVision: input.dailyVision !== undefined ? input.dailyVision : u.dailyVision,
              avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : u.avatarUrl,
              reportingAdminId:
                input.reportingAdminId !== undefined ? input.reportingAdminId : u.reportingAdminId,
              casualBalance:
                input.casualBalance !== undefined ? input.casualBalance : u.casualBalance,
              sickBalance: input.sickBalance !== undefined ? input.sickBalance : u.sickBalance,
              active: input.active !== undefined ? input.active : u.active,
              role: input.role !== undefined ? input.role : u.role,
            };
          }),
        );
        return { ok: true };
      }
    },
    refreshAccounts,
    can: (perm) => {
      if (!me) return false;
      if (me.role === "super_admin") return SUPER_ADMIN_PERMS.includes(perm);
      if (me.role === "admin") return adminPerms.includes(perm) && perm !== "manage_admins";
      return false;
    },
    setAdminPerms: (perms) => {
      setPerms(perms);
      void saveAdminPermsFn({ data: { perms } }).catch(() => refreshAccounts());
    },
    visibleUsers: () => {
      if (!me) return [];
      if (me.role === "super_admin") return users;
      if (me.role === "admin")
        return users.filter((u) => u.reportingAdminId === me.id || u.id === me.id);
      return [me];
    },
    attendanceStatus: (userId, date) => {
      const key = dateKey(date);
      const wd = date.getDay();
      if (wd === 0 || wd === 6) return "week_off";
      const rec = merged.attendance.find((a) => a.userId === userId && a.date === key);
      if (rec) return "present";
      const leave = merged.leaves.find(
        (l) =>
          l.userId === userId && l.status === "approved" && key >= l.startDate && key <= l.endDate,
      );
      if (leave) return leave.type === "casual" ? "casual_leave" : "sick_leave";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d0 = new Date(date);
      d0.setHours(0, 0, 0, 0);
      if (d0.getTime() > today.getTime()) return "week_off";
      return "absent";
    },
    notify: (userId, title, body, href) =>
      update((d) => {
        const n: AppNotification = {
          id: uid(),
          userId,
          title,
          body,
          at: nowIso(),
          read: false,
          href,
        };
        d.notifications.unshift(n);
      }),
    log: (action, detail) =>
      update((d) => {
        if (!sessionUserId) return;
        d.audit.unshift({ id: uid(), actorId: sessionUserId, action, detail, at: nowIso() });
      }),
    reset: () => {
      setState(createSeedState());
      setUsers(DEFAULT_SEED_USERS);
      setSessionUserId(null);
    },
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export const newId = uid;
export const isoNow = nowIso;
export { dateKey };
export type {
  AppState,
  AttendanceRecord,
  LeadDataset,
  LeaveRequest,
  Message,
  RecognitionAward,
  Task,
  TaskProof,
  Ticket,
  User,
};
