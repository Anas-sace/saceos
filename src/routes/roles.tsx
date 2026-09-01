import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Initials, NoAccess, PageHeader, roleLabel } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, type Perm } from "@/lib/store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — SACE Portal" },
      {
        name: "description",
        content: "Create team accounts and control exactly what Admins can see in SACE Portal.",
      },
      { property: "og:title", content: "Roles & Permissions — SACE Portal" },
      {
        property: "og:description",
        content: "Super Admin control centre for accounts and admin visibility.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <RolesPage />
    </AppShell>
  ),
});

const ROLES: Role[] = ["super_admin", "admin", "member"];

const ADMIN_CONTROLS: { perm: Perm; label: string; description: string }[] = [
  {
    perm: "manage_users",
    label: "Create & manage team accounts",
    description: "Add, edit and deactivate team member accounts",
  },
  {
    perm: "approve_leave",
    label: "Approve leave requests",
    description: "Approve or reject leave with a comment",
  },
  {
    perm: "view_all_eod",
    label: "View team EOD reports",
    description: "Daily, weekly, monthly and quarterly reports + PDF export",
  },
  {
    perm: "view_reports",
    label: "View progress reports",
    description: "Team-wide performance analytics",
  },
  {
    perm: "view_all_tickets",
    label: "View all support tickets",
    description: "Full helpdesk queue access",
  },
  {
    perm: "upload_leads",
    label: "Upload lead datasets",
    description: "Publish and lock lead data",
  },
  {
    perm: "manage_recognition",
    label: "Give recognition & awards",
    description: "Feature members on the leaderboard",
  },
  { perm: "system_settings", label: "Portal settings", description: "Portal-wide configuration" },
];

const MATRIX: { label: string; description: string; allowed: Role[] }[] = [
  {
    label: "Create team accounts with email & password",
    description: "Super Admin sets the role for every account",
    allowed: ["super_admin"],
  },
  {
    label: "Manage admins & role changes",
    description: "Promote or demote admins",
    allowed: ["super_admin"],
  },
  {
    label: "Decide what Admins can see",
    description: "Toggle admin capabilities on and off",
    allowed: ["super_admin"],
  },
  {
    label: "Set own tasks",
    description: "Everyone plans their own today / weekly / monthly / quarterly tasks",
    allowed: ["super_admin", "admin", "member"],
  },
  {
    label: "Submit EOD report at log out",
    description: "What was worked on, completed and blockers",
    allowed: ["super_admin", "admin", "member"],
  },
  { label: "View audit logs", description: "Full activity trail", allowed: ["super_admin"] },
  {
    label: "Punch in / out & submit proof",
    description: "Daily attendance and work proof",
    allowed: ["super_admin", "admin", "member"],
  },
  {
    label: "Ask Addy assistant",
    description: "In-portal help on how everything works",
    allowed: ["super_admin", "admin", "member"],
  },
  {
    label: "Apply for leave",
    description: "Casual and sick leave requests",
    allowed: ["super_admin", "admin", "member"],
  },
  {
    label: "Messages & tickets",
    description: "Chat and raise support requests",
    allowed: ["super_admin", "admin", "member"],
  },
];

function RolesPage() {
  const { me } = useApp();
  if (me!.role !== "super_admin") return <NoAccess />;
  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Create every team account and decide exactly what Admins can see."
      />
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Team accounts</TabsTrigger>
          <TabsTrigger value="admin">Admin visibility</TabsTrigger>
          <TabsTrigger value="matrix">Capability matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="space-y-6">
          <CreateAccount />
          <AccountList />
        </TabsContent>
        <TabsContent value="admin">
          <AdminVisibility />
        </TabsContent>
        <TabsContent value="matrix">
          <CapabilityMatrix />
        </TabsContent>
      </Tabs>
    </>
  );
}

function CreateAccount() {
  const { state, createAccount, log } = useApp();
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    password: "",
    designation: "",
    department: "",
    role: "member" as Role,
    reportingAdminId: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const admins = state.users.filter((u) => u.role !== "member");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      toast.error("An account with that email already exists");
      return;
    }
    if (form.password.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const res = await createAccount({
      fullName: form.fullName.trim(),
      email,
      password: form.password,
      designation: form.designation.trim() || roleLabel(form.role),
      department: form.department.trim() || "General",
      role: form.role,
      reportingAdminId: form.role === "member" ? form.reportingAdminId || null : null,
      avatarColor: form.role === "member" ? "var(--brand-gold)" : "var(--brand-purple)",
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not create the account");
      return;
    }
    log("account_created", `${form.fullName.trim()} (${roleLabel(form.role)})`);
    toast.success(`${form.fullName.trim()} can now sign in with ${email}`);
    setForm({ ...form, fullName: "", email: "", password: "", designation: "", department: "" });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-primary" /> Create an account
        </CardTitle>
        <CardDescription>
          Set the email, password and role. Share the credentials with the person — they sign in on
          the portal login screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["fullName", "Full name", "text"],
                ["email", "Email", "email"],
                ["password", "Password", "text"],
                ["designation", "Designation", "text"],
                ["department", "Department", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`acc-${key}`}>{label}</Label>
                <Input
                  id={`acc-${key}`}
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  required={key === "fullName" || key === "email" || key === "password"}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.role === "member" && admins.length > 0 && (
            <div className="space-y-2 sm:max-w-xs">
              <Label>Reporting admin</Label>
              <Select
                value={form.reportingAdminId}
                onValueChange={(v) => set("reportingAdminId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AccountList() {
  const { state, me, saveUser, log } = useApp();
  const apply = async (
    input: Parameters<typeof saveUser>[0],
    success: string,
    logLine: [string, string],
  ) => {
    const res = await saveUser(input);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save the account");
      return;
    }
    log(logLine[0], logLine[1]);
    toast.success(success);
  };
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">All accounts ({state.users.length})</CardTitle>
        <CardDescription>Change a role, reset a password or deactivate an account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.users.map((u) => (
          <div
            key={u.id}
            className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <Initials name={u.fullName} color={u.avatarColor} />
              <div>
                <p className="font-medium">
                  {u.fullName}
                  {u.id === me!.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!u.active && <Badge variant="secondary">Inactive</Badge>}
              <Select
                value={u.role}
                onValueChange={(v) =>
                  void apply(
                    { userId: u.id, role: v as Role },
                    `${u.fullName} is now ${roleLabel(v as Role)}`,
                    ["role_change", `${u.fullName} → ${v}`],
                  )
                }
                disabled={u.id === me!.id}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Team Member</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = window.prompt(`New password for ${u.fullName}`);
                  if (!next || next.trim().length < 6) {
                    if (next !== null) toast.error("Password must be at least 6 characters");
                    return;
                  }
                  void apply({ userId: u.id, password: next.trim() }, "Password updated", [
                    "password_reset",
                    u.fullName,
                  ]);
                }}
              >
                Reset password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={u.id === me!.id}
                onClick={() =>
                  void apply(
                    { userId: u.id, active: !u.active },
                    `${u.fullName} ${u.active ? "deactivated" : "activated"}`,
                    ["account_status", `${u.fullName} → ${u.active ? "inactive" : "active"}`],
                  )
                }
              >
                {u.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdminVisibility() {
  const { adminPerms, setAdminPerms, log } = useApp();
  const toggle = (perm: Perm, on: boolean) => {
    const next = on ? [...adminPerms, perm] : adminPerms.filter((p) => p !== perm);
    setAdminPerms(next);
    log("admin_permission", `${perm} → ${on ? "allowed" : "hidden"}`);
  };
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" /> What Admins can see
        </CardTitle>
        <CardDescription>
          These switches apply to every Admin instantly. Hidden areas disappear from their
          navigation and pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ADMIN_CONTROLS.map((c) => (
          <div
            key={c.perm}
            className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.description}</p>
            </div>
            <Switch
              checked={adminPerms.includes(c.perm)}
              onCheckedChange={(on) => toggle(c.perm, on)}
              aria-label={c.label}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Managing admins, role changes and audit logs stay Super Admin only.
        </p>
      </CardContent>
    </Card>
  );
}

function CapabilityMatrix() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Capability</th>
              {ROLES.map((r) => (
                <th key={r} className="px-5 py-3 text-center">
                  {roleLabel(r)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="px-5 py-3">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.description}</p>
                </td>
                {ROLES.map((r) => (
                  <td key={r} className="px-5 py-3 text-center">
                    {row.allowed.includes(r) ? (
                      <Check className="mx-auto h-4 w-4 text-success" aria-label="Allowed" />
                    ) : (
                      <Minus
                        className="mx-auto h-4 w-4 text-muted-foreground"
                        aria-label="Not allowed"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
