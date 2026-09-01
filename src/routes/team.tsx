import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import {
  AppShell,
  EmptyState,
  Initials,
  NoAccess,
  PageHeader,
  roleLabel,
} from "@/components/app-shell";
import { StatusPill } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & Accounts — SACE Portal" },
      {
        name: "description",
        content: "Create, edit and deactivate employee accounts and reporting lines.",
      },
      { property: "og:title", content: "Team & Accounts — SACE Portal" },
      {
        property: "og:description",
        content: "Manage employee accounts, roles and reporting structure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <TeamPage />
    </AppShell>
  ),
});

function TeamPage() {
  const { state, me, can, saveUser, log, visibleUsers } = useApp();
  if (!can("manage_users")) return <NoAccess />;
  const people = visibleUsers();
  const canManageAdmins = can("manage_admins");

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
    <>
      <PageHeader
        title="Team & Accounts"
        description="Accounts are created by the Super Admin — there is no public sign-up."
        actions={
          canManageAdmins ? (
            <Button asChild>
              <Link to="/roles">
                <UserPlus className="mr-1 h-4 w-4" /> New account
              </Link>
            </Button>
          ) : undefined
        }
      />
      {people.length === 0 ? (
        <EmptyState title="No accounts yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {people.map((u) => {
            const manager = state.users.find((x) => x.id === u.reportingAdminId);
            const editable = canManageAdmins || u.role === "member";
            return (
              <Card key={u.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <Initials
                        name={u.fullName}
                        color={u.avatarColor}
                        size={44}
                        src={u.avatarUrl ?? null}
                      />
                      <div>
                        <p className="font-semibold">{u.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {u.designation} · {u.department}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          @{u.username} · {u.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reports to {manager?.fullName ?? "—"} · CL {u.casualBalance} · SL{" "}
                          {u.sickBalance}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill
                        value={u.active ? "approved" : "closed"}
                        label={u.active ? "Active" : "Inactive"}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {roleLabel(u.role)}
                      </span>
                    </div>
                  </div>

                  {editable && u.id !== me!.id && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                      <span className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={u.active}
                          onCheckedChange={(v) =>
                            void apply(
                              { userId: u.id, active: v },
                              `${u.fullName} ${v ? "activated" : "deactivated"}`,
                              [
                                "account_status",
                                `${u.fullName} ${v ? "activated" : "deactivated"}`,
                              ],
                            )
                          }
                          aria-label="Account active"
                        />
                        Active
                      </span>
                      {canManageAdmins && (
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            void apply({ userId: u.id, role: v as Role }, "Role updated", [
                              "role_change",
                              `${u.fullName} → ${v}`,
                            ])
                          }
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Team Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
