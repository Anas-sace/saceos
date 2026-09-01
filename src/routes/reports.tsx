import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, ClipboardCheck, Download, TrendingUp } from "lucide-react";
import { AppShell, NoAccess, Initials, PageHeader } from "@/components/app-shell";
import { StatCard } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { hoursLabel } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Progress Reports — SACE Portal" },
      {
        name: "description",
        content: "Attendance, task delivery and productivity reporting for the SACE team.",
      },
      { property: "og:title", content: "Progress Reports — SACE Portal" },
      {
        property: "og:description",
        content: "Weekly and monthly workforce performance reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <ReportsPage />
    </AppShell>
  ),
});

function ReportsPage() {
  const { state, can, visibleUsers } = useApp();
  const [range, setRange] = React.useState("30");
  if (!can("view_reports")) return <NoAccess />;

  const days = Number(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffMs = cutoff.getTime();

  const people = visibleUsers().filter((u) => u.active);
  const ids = new Set(people.map((u) => u.id));

  const attendance = state.attendance.filter(
    (a) => ids.has(a.userId) && new Date(a.date).getTime() >= cutoffMs,
  );
  const tasks = state.tasks.filter((t) => ids.has(t.assigneeId));
  const done = tasks.filter((t) => t.status === "completed" || t.status === "approved");
  const totalHours = attendance.reduce((sum, a) => sum + a.hours, 0);
  const leaves = state.leaves.filter((l) => ids.has(l.userId) && l.status === "approved");

  const rows = people.map((u) => {
    const uAtt = attendance.filter((a) => a.userId === u.id);
    const uTasks = tasks.filter((t) => t.assigneeId === u.id);
    const uDone = uTasks.filter((t) => t.status === "completed" || t.status === "approved").length;
    const rate = uTasks.length ? Math.round((uDone / uTasks.length) * 100) : 0;
    return {
      user: u,
      present: uAtt.length,
      hours: uAtt.reduce((s, a) => s + a.hours, 0),
      tasks: uTasks.length,
      done: uDone,
      rate,
    };
  });

  const exportCsv = () => {
    const header = "Member,Designation,Days present,Hours,Tasks,Completed,Completion %";
    const body = rows
      .map((r) =>
        [
          r.user.fullName,
          r.user.designation,
          r.present,
          r.hours.toFixed(1),
          r.tasks,
          r.done,
          r.rate,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sace-progress-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Progress Reports"
        description="Delivery, attendance and productivity across your team."
        actions={
          <div className="flex gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance entries"
          value={attendance.length}
          icon={CalendarCheck}
          accent="teal"
        />
        <StatCard label="Hours logged" value={hoursLabel(totalHours)} icon={TrendingUp} />
        <StatCard
          label="Task completion"
          value={`${tasks.length ? Math.round((done.length / tasks.length) * 100) : 0}%`}
          hint={`${done.length} of ${tasks.length} tasks`}
          icon={ClipboardCheck}
          accent="success"
        />
        <StatCard label="Approved leaves" value={leaves.length} accent="purple" />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-5">
          {rows.map((r) => (
            <div key={r.user.id} className="flex flex-wrap items-center gap-4">
              <Initials name={r.user.fullName} color={r.user.avatarColor} size={36} />
              <div className="min-w-[160px]">
                <p className="text-sm font-medium">{r.user.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.present} days · {hoursLabel(r.hours)}
                </p>
              </div>
              <div className="min-w-[180px] flex-1">
                <Progress value={r.rate} />
              </div>
              <p className="w-28 text-right text-sm font-semibold">
                {r.done}/{r.tasks} · {r.rate}%
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
