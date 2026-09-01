import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell, EmptyState, PageHeader } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, dateKey, newId, isoNow } from "@/lib/store";
import { fmtDate, titleCase } from "@/lib/format";
import type { LeaveType } from "@/lib/types";

export const Route = createFileRoute("/leave")({
  head: () => ({
    meta: [
      { title: "Leave Requests — SACE Portal" },
      {
        name: "description",
        content: "Apply for casual or sick leave and track approvals and balances.",
      },
      { property: "og:title", content: "Leave Requests — SACE Portal" },
      {
        property: "og:description",
        content: "Apply for leave and track approvals, balances and admin comments.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <LeavePage />
    </AppShell>
  ),
});

function LeavePage() {
  const { state, me, can, visibleUsers, update, saveUser, notify, log } = useApp();
  const isManager = can("approve_leave");
  const [activeTab, setActiveTab] = React.useState<"team" | "my">(isManager ? "team" : "my");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const teamScope = state.leaves.filter((l) => visibleUsers().some((u) => u.id === l.userId));
  const myScope = state.leaves.filter((l) => l.userId === me!.id);

  const scope = isManager && activeTab === "team" ? teamScope : myScope;
  const rows = scope.filter((l) => statusFilter === "all" || l.status === statusFilter);

  const decide = (id: string, status: "approved" | "rejected", comment: string) => {
    const leave = state.leaves.find((l) => l.id === id);
    if (!leave) return;
    update((d) => {
      const l = d.leaves.find((x) => x.id === id);
      if (!l) return;
      l.status = status;
      l.adminComment = comment || (status === "approved" ? "Approved." : "Rejected.");
    });
    if (status === "approved") {
      const u = state.users.find((x) => x.id === leave.userId);
      if (u) {
        const days =
          Math.round(
            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 86400000,
          ) + 1;
        const cost = leave.halfDay ? 0.5 : days;
        const patch =
          leave.type === "casual"
            ? { casualBalance: Math.max(0, Math.round(u.casualBalance - cost)) }
            : { sickBalance: Math.max(0, Math.round(u.sickBalance - cost)) };
        void saveUser({ userId: u.id, ...patch });
      }
    }
    notify(
      leave.userId,
      `Leave ${status}`,
      `${titleCase(leave.type)} leave ${leave.startDate}`,
      "/leave",
    );
    log(
      `Leave ${status}`,
      `${titleCase(leave.type)} leave for ${state.users.find((u) => u.id === leave.userId)?.fullName}`,
    );
    toast.success(`Leave ${status}`);
  };

  return (
    <>
      <PageHeader
        title="Leave requests"
        description={
          isManager
            ? "Review and approve team leave requests or apply for your own leave."
            : "Apply for leave and track your balances."
        }
        actions={<ApplyLeaveDialog />}
      />

      {isManager && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "team" | "my")}>
            <TabsList className="grid grid-cols-2 w-64">
              <TabsTrigger value="team">Team Requests</TabsTrigger>
              <TabsTrigger value="my">My Leaves</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {!isManager || activeTab === "my" ? (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard label="Casual leave left" value={me!.casualBalance} accent="purple" />
          <StatCard label="Sick leave left" value={me!.sickBalance} accent="teal" />
          <StatCard
            label="Pending requests"
            value={myScope.filter((l) => l.status === "pending").length}
          />
        </div>
      ) : (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending approval"
            value={teamScope.filter((l) => l.status === "pending").length}
            accent="purple"
          />
          <StatCard
            label="Approved requests"
            value={teamScope.filter((l) => l.status === "approved").length}
            accent="teal"
          />
          <StatCard label="Total team requests" value={teamScope.length} />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["all", "pending", "approved", "rejected"].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : titleCase(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          Showing {rows.length} request{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No leave requests"
          hint={
            isManager && activeTab === "team"
              ? "Requests from your team will appear here."
              : "Click '+ Apply for leave' to submit a request."
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((l) => {
            const u = state.users.find((x) => x.id === l.userId);
            return (
              <Card key={l.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {u?.fullName} · {titleCase(l.type)} leave
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {fmtDate(l.startDate)} → {fmtDate(l.endDate)}{" "}
                        {l.halfDay ? "· Half day" : ""}
                      </p>
                      <p className="mt-2 text-sm">{l.reason}</p>
                      {l.adminComment ? (
                        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs">
                          Admin: {l.adminComment}
                        </p>
                      ) : null}
                    </div>
                    <StatusPill value={l.status} />
                  </div>
                  {isManager && activeTab === "team" && l.status === "pending" ? (
                    <DecisionRow onDecide={(status, comment) => decide(l.id, status, comment)} />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function DecisionRow({ onDecide }: { onDecide: (s: "approved" | "rejected", c: string) => void }) {
  const [comment, setComment] = React.useState("");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Input
        className="max-w-sm"
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        aria-label="Admin comment"
      />
      <Button size="sm" onClick={() => onDecide("approved", comment)}>
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => onDecide("rejected", comment)}>
        Reject
      </Button>
    </div>
  );
}

function ApplyLeaveDialog() {
  const { me, update, notify } = useApp();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    type: "casual" as LeaveType,
    startDate: dateKey(new Date()),
    endDate: dateKey(new Date()),
    halfDay: false,
    reason: "",
    emergencyContact: "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Apply for leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Leave type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as LeaveType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual leave</SelectItem>
                <SelectItem value="sick">Sick leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="l-start">Start date</Label>
              <Input
                id="l-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-end">End date</Label>
              <Input
                id="l-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="l-half">Half day</Label>
            <Switch
              id="l-half"
              checked={form.halfDay}
              onCheckedChange={(v) => setForm({ ...form, halfDay: v })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-reason">Reason</Label>
            <Textarea
              id="l-reason"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          {form.type === "sick" ? (
            <div className="space-y-2">
              <Label htmlFor="l-doc">Supporting document (optional)</Label>
              <Input id="l-doc" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="l-contact">Emergency contact (optional)</Label>
            <Input
              id="l-contact"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
          </div>
          <Button
            className="w-full"
            disabled={!form.reason.trim() || form.endDate < form.startDate}
            onClick={() => {
              update((d) => {
                d.leaves.unshift({
                  id: newId(),
                  userId: me!.id,
                  type: form.type,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  halfDay: form.halfDay,
                  reason: form.reason,
                  status: "pending",
                  adminComment: "",
                  emergencyContact: form.emergencyContact,
                  createdAt: isoNow(),
                });
              });
              if (me!.reportingAdminId)
                notify(
                  me!.reportingAdminId,
                  "New leave request",
                  `${me!.fullName} requested ${form.type} leave`,
                  "/leave",
                );
              toast.success("Leave request submitted");
              setOpen(false);
            }}
          >
            Submit request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
