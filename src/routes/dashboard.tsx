import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClock,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  LifeBuoy,
  MessageSquare,
  Plane,
  Quote,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, Initials, PageHeader } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EodLogoutDialog } from "@/components/eod-logout-dialog";
import { useApp, dateKey, newId, isoNow } from "@/lib/store";
import { elapsed, fmtDateTime, fmtTime, hoursLabel, monthKey } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — SACE Portal" },
      {
        name: "description",
        content: "Your daily workforce overview: punch status, tasks, leave and team activity.",
      },
      { property: "og:title", content: "Overview — SACE Portal" },
      {
        property: "og:description",
        content: "Daily workforce overview for SACE Group employees and admins.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ),
});

function DashboardPage() {
  const { me } = useApp();
  const isAdmin = me && me.role !== "member";
  const [adminTab, setAdminTab] = React.useState<"team" | "my">("team");

  if (!me) return null;

  if (!isAdmin) {
    return <MemberDashboard />;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as "team" | "my")}>
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="team" className="gap-1.5">
              <Users className="h-4 w-4" /> Team Overview
            </TabsTrigger>
            <TabsTrigger value="my" className="gap-1.5">
              <UserCheck className="h-4 w-4" /> My Workspace
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {adminTab === "team" ? <AdminDashboard /> : <MemberDashboard />}
    </>
  );
}

function useClock() {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function VisionDialog() {
  const { me, saveUser } = useApp();
  const [value, setValue] = React.useState("");
  const [dismissed, setDismissed] = React.useState(false);
  const open = !!me && me.role === "member" && !me.dailyVision && !dismissed;

  const submit = async () => {
    const res = await saveUser({ userId: me!.id, dailyVision: value.trim() });
    if (!res.ok) {
      toast.error(res.error ?? "Could not save your daily vision");
      return;
    }
    toast.success("Daily vision saved");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setDismissed(true);
      }}
    >
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Set your Daily Vision</DialogTitle>
          <DialogDescription>
            Before you start, write a short motivational line. It will appear on your dashboard
            every day and can be edited later from Settings.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Design with purpose. Lead with kindness."
          rows={3}
          aria-label="Daily vision"
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Skip for now
          </Button>
          <Button disabled={value.trim().length < 5} onClick={submit}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberDashboard() {
  const { state, me, update, notify } = useApp();
  const now = useClock();
  const today = new Date();
  const todayKey = dateKey(today);
  const mk = monthKey(today);
  const [eodOpen, setEodOpen] = React.useState(false);

  const record = state.attendance.find((a) => a.userId === me!.id && a.date === todayKey);
  const punchedIn = !!record?.punchIn && !record?.punchOut;

  // Real-time live hours count until logged out
  const liveHoursCount =
    punchedIn && record?.punchIn
      ? Math.max(0, (now - new Date(record.punchIn).getTime()) / 3600000)
      : (record?.hours ?? 0);

  const monthRecords = state.attendance.filter((a) => a.userId === me!.id && a.date.startsWith(mk));
  const monthHours = monthRecords.reduce((s, r) => {
    if (r.date === todayKey && punchedIn) {
      return s + liveHoursCount;
    }
    return s + (r.hours || 0);
  }, 0);

  const myTasks = state.tasks.filter((t) => t.assigneeId === me!.id);
  const activeTasks = myTasks.filter((t) => !["approved", "completed"].includes(t.status));
  const doneThisMonth = myTasks.filter(
    (t) => ["approved", "completed"].includes(t.status) && t.dueDate.startsWith(mk),
  ).length;
  const pendingLeaves = state.leaves.filter((l) => l.userId === me!.id && l.status === "pending");
  const myTickets = state.tickets.filter((t) => t.createdById === me!.id);
  const myConversations = state.conversations.filter((c) => c.participantIds.includes(me!.id));
  const recentMessages = state.messages
    .filter((m) => myConversations.some((c) => c.id === m.conversationId))
    .slice(-3)
    .reverse();

  // working days elapsed this month
  let workingDays = 0;
  for (let d = 1; d <= today.getDate(); d++) {
    const dd = new Date(today.getFullYear(), today.getMonth(), d);
    if (dd.getDay() !== 0 && dd.getDay() !== 6) workingDays++;
  }
  const attendancePct = workingDays ? Math.round((monthRecords.length / workingDays) * 100) : 0;

  const proofToday = myTasks.some((t) =>
    t.proofs.some((p) => p.submittedAt.slice(0, 10) === todayKey),
  );

  const punchIn = () => {
    if (record?.punchIn) return;
    update((d) => {
      d.attendance.push({
        id: newId(),
        userId: me!.id,
        date: todayKey,
        punchIn: isoNow(),
        punchOut: null,
        hours: 0,
      });
    });
    toast.success("Punched in. Timer started.");
  };

  const handlePunchOutClick = () => {
    if (!proofToday) {
      toast.error("You must submit proof for at least one completed task before punching out.", {
        action: { label: "Go to tasks", onClick: () => (window.location.href = "/tasks") },
      });
      return;
    }
    setEodOpen(true);
  };

  return (
    <>
      <VisionDialog />
      <PageHeader
        title={`Good ${today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"}, ${me!.fullName.split(" ")[0]}`}
        description={today.toLocaleDateString([], {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        actions={
          <span className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold tabular-nums shadow-xs">
            {new Date(now).toLocaleTimeString()}
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl border-none bg-brand-purple text-primary-foreground lg:col-span-2">
          <CardContent className="flex gap-4 p-6">
            <Quote className="h-6 w-6 shrink-0 opacity-70" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Daily Vision
              </p>
              <p className="mt-2 text-xl font-semibold leading-snug">{me!.dailyVision ?? "—"}</p>
              <Link to="/settings" className="mt-3 inline-block text-xs underline opacity-80">
                Edit vision
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Work status</p>
              <StatusPill
                value={punchedIn ? "present" : record?.punchOut ? "completed" : "week_off"}
                label={punchedIn ? "Working" : record?.punchOut ? "Day complete" : "Not punched in"}
              />
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">
              {record?.punchIn && !record.punchOut
                ? elapsed(record.punchIn, now)
                : record?.punchOut
                  ? hoursLabel(record.hours)
                  : "00:00:00"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              In {fmtTime(record?.punchIn)} · Out {fmtTime(record?.punchOut)}
            </p>
            <div className="mt-4">
              {!record?.punchIn ? (
                <Button className="w-full shadow-xs" onClick={punchIn}>
                  Punch in
                </Button>
              ) : record.punchOut ? (
                <Button className="w-full" variant="outline" disabled>
                  Completed for today
                </Button>
              ) : (
                <Button className="w-full" variant="destructive" onClick={handlePunchOutClick}>
                  Punch out & Submit EOD
                </Button>
              )}
              {!proofToday && punchedIn ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Submit at least one task proof today to enable punch out.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hours today"
          value={
            punchedIn && record?.punchIn
              ? elapsed(record.punchIn, now)
              : record?.punchOut
                ? hoursLabel(record.hours)
                : "0h 0m"
          }
          hint={
            punchedIn
              ? "Live timer active until punch out"
              : record?.punchOut
                ? `Logged out at ${fmtTime(record.punchOut)}`
                : "Not punched in"
          }
          icon={Clock}
          accent={punchedIn ? "teal" : undefined}
        />
        <StatCard
          label="Hours this month"
          value={hoursLabel(monthHours)}
          icon={AlarmClock}
          accent="purple"
        />
        <StatCard
          label="Attendance"
          value={`${attendancePct}%`}
          hint={`${monthRecords.length}/${workingDays} working days`}
          icon={CalendarCheck}
          accent="teal"
        />
        <StatCard
          label="Tasks done this month"
          value={doneThisMonth}
          icon={CheckCircle2}
          accent="success"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Active tasks</CardTitle>
            <Link to="/tasks" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTasks.length === 0 ? (
              <EmptyState title="No active tasks" hint="New assignments appear here instantly." />
            ) : (
              activeTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Due {t.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill value={t.priority} />
                    <StatusPill value={t.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/tasks">
                  <ClipboardList /> Tasks
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/leave">
                  <Plane /> Leave
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/tickets">
                  <LifeBuoy /> Ticket
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/messages">
                  <MessageSquare /> Message
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Pending & recent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending leave requests</span>
                <span className="font-semibold">{pendingLeaves.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open tickets</span>
                <span className="font-semibold">
                  {myTickets.filter((t) => t.status !== "closed").length}
                </span>
              </div>
              {recentMessages.map((m) => (
                <p key={m.id} className="truncate text-xs text-muted-foreground">
                  {state.users.find((u) => u.id === m.senderId)?.fullName}: {m.body}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Leaderboard</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              {state.awards.slice(0, 3).map((a) => {
                const u = state.users.find((x) => x.id === a.userId);
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <Initials name={u?.fullName ?? "?"} color={u?.avatarColor} size={30} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u?.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.type}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <EodLogoutDialog open={eodOpen} onOpenChange={setEodOpen} mode="logout" onDone={() => {}} />
    </>
  );
}

function AdminDashboard() {
  const { state, me, visibleUsers } = useApp();
  const today = new Date();
  const todayKey = dateKey(today);
  const team = visibleUsers().filter((u) => u.id !== me!.id);
  const teamIds = team.map((u) => u.id);

  const punchedInToday = state.attendance.filter(
    (a) => a.date === todayKey && teamIds.includes(a.userId),
  ).length;
  const onLeave = state.leaves.filter(
    (l) =>
      l.status === "approved" &&
      teamIds.includes(l.userId) &&
      todayKey >= l.startDate &&
      todayKey <= l.endDate,
  ).length;
  const weekOff = today.getDay() === 0 || today.getDay() === 6 ? team.length : 0;
  const absent = Math.max(0, team.length - punchedInToday - onLeave - weekOff);

  const teamTasks = state.tasks.filter((t) => teamIds.includes(t.assigneeId));
  const overdue = teamTasks.filter(
    (t) => t.dueDate < todayKey && !["approved", "completed"].includes(t.status),
  );
  const awaitingReview = teamTasks.filter((t) => t.status === "submitted");
  const pendingLeaves = state.leaves.filter(
    (l) => l.status === "pending" && teamIds.includes(l.userId),
  );

  const ticketCount = (s: string) => state.tickets.filter((t) => t.status === s).length;

  return (
    <>
      <PageHeader
        title="Team overview"
        description={`${team.length} people reporting into you · ${today.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <>
            <Button asChild size="sm">
              <Link to="/team">Create account</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/eod">EOD reports</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/reports">Generate report</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Punched in today"
          value={punchedInToday}
          icon={UserCheck}
          accent="success"
        />
        <StatCard label="On approved leave" value={onLeave} icon={Plane} accent="purple" />
        <StatCard label="Absent" value={absent} icon={Users} />
        <StatCard label="Week off" value={weekOff} icon={CalendarCheck} accent="teal" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Task pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Assigned", n: teamTasks.filter((t) => t.status === "assigned").length },
              {
                label: "In progress",
                n: teamTasks.filter((t) => t.status === "in_progress").length,
              },
              { label: "Awaiting proof review", n: awaitingReview.length },
              {
                label: "Completed / approved",
                n: teamTasks.filter((t) => ["approved", "completed"].includes(t.status)).length,
              },
              { label: "Overdue", n: overdue.length },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.n}</span>
                </div>
                <Progress value={teamTasks.length ? (row.n / teamTasks.length) * 100 : 0} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Pending leave</CardTitle>
            <Link to="/leave" className="text-sm font-medium text-primary hover:underline">
              Review
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <EmptyState title="Nothing to approve" />
            ) : (
              pendingLeaves.map((l) => {
                const u = state.users.find((x) => x.id === l.userId);
                return (
                  <div key={l.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{u?.fullName}</p>
                      <StatusPill
                        value={l.type === "casual" ? "casual_leave" : "sick_leave"}
                        label={l.type === "casual" ? "Casual" : "Sick"}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {l.startDate} → {l.endDate}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Ticket metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {["created", "open", "in_progress", "completed", "closed"].map((s) => (
              <div key={s} className="rounded-xl border border-border p-3">
                <p className="text-xs capitalize text-muted-foreground">{s.replace("_", " ")}</p>
                <p className="text-xl font-bold">{ticketCount(s)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.audit.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              state.audit.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {fmtDateTime(a.at)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
