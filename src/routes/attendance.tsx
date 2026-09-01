import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  Plane,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { AppShell, EmptyState, Initials, PageHeader } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, dateKey, newId, isoNow } from "@/lib/store";
import { fmtTime, hoursLabel, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, Task, TaskProof, User } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — SACE Portal" },
      {
        name: "description",
        content: "Attendance calendar with punch times, working hours, leave and week offs.",
      },
      { property: "og:title", content: "Attendance — SACE Portal" },
      {
        property: "og:description",
        content: "Attendance calendar with punch times, working hours and leave.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AttendancePage />
    </AppShell>
  ),
});

const DOT: Record<AttendanceStatus, string> = {
  present: "bg-success/12 border-success/30",
  casual_leave: "bg-brand-purple/12 border-brand-purple/30",
  sick_leave: "bg-info/12 border-info/30",
  absent: "bg-destructive/10 border-destructive/25",
  week_off: "bg-muted border-border",
};

function AttendancePage() {
  const { state, me, visibleUsers, attendanceStatus, update, notify } = useApp();
  const isAdmin = me!.role !== "member";
  const [activeTab, setActiveTab] = React.useState<"daily" | "calendar">(
    isAdmin ? "daily" : "calendar",
  );
  const [selectedUserId, setSelectedUserId] = React.useState<string>(me!.id);
  const [dailyDate, setDailyDate] = React.useState(() => dateKey(new Date()));
  const [cursor, setCursor] = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [dailySearch, setDailySearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [deptFilter, setDeptFilter] = React.useState("all");

  const todayKey = dateKey(new Date());
  const myRecordToday = state.attendance.find((a) => a.userId === me!.id && a.date === todayKey);
  const isPunchedIn = !!myRecordToday?.punchIn && !myRecordToday?.punchOut;

  // Punch actions for active user
  const punchIn = () => {
    if (myRecordToday?.punchIn) return;
    update((d) => {
      const existing = d.attendance.find((a) => a.userId === me!.id && a.date === todayKey);
      if (existing) {
        existing.punchIn = isoNow();
        existing.punchOut = null;
        existing.status = "present";
      } else {
        d.attendance.push({
          id: newId(),
          userId: me!.id,
          date: todayKey,
          punchIn: isoNow(),
          punchOut: null,
          hours: 0,
          status: "present",
        });
      }
    });
    toast.success("Punched in. Your daily attendance is now active.");
  };

  const punchOut = () => {
    update((d) => {
      const r = d.attendance.find((a) => a.userId === me!.id && a.date === todayKey);
      if (r && r.punchIn) {
        r.punchOut = isoNow();
        r.hours = Math.round(((Date.now() - new Date(r.punchIn).getTime()) / 3600000) * 100) / 100;
      }
    });
    notify(me!.id, "Day completed", "Your working hours have been logged.", "/attendance");
    toast.success("Punched out. Attendance record updated.");
  };

  // Team scope
  const teamMembers = visibleUsers();
  const departments = Array.from(new Set(teamMembers.map((u) => u.department).filter(Boolean)));

  // Selected daily date calculations
  const parsedDaily = new Date(`${dailyDate}T00:00:00`);
  const isDailyToday = dailyDate === todayKey;
  const isDailyWeekend = parsedDaily.getDay() === 0 || parsedDaily.getDay() === 6;

  const roster = teamMembers.map((u) => {
    const rec = state.attendance.find((a) => a.userId === u.id && a.date === dailyDate);
    const status = attendanceStatus(u.id, parsedDaily);
    const proofsCount = state.tasks.filter(
      (t) =>
        t.assigneeId === u.id && t.proofs.some((p) => p.submittedAt.slice(0, 10) === dailyDate),
    ).length;
    const leave = state.leaves.find(
      (l) =>
        l.userId === u.id &&
        l.status === "approved" &&
        dailyDate >= l.startDate &&
        dailyDate <= l.endDate,
    );
    const isCurrentlyWorking = !!rec?.punchIn && !rec?.punchOut;

    return {
      user: u,
      record: rec,
      status,
      leave,
      proofsCount,
      isCurrentlyWorking,
    };
  });

  const filteredRoster = roster.filter((item) => {
    if (
      dailySearch &&
      !item.user.fullName.toLowerCase().includes(dailySearch.toLowerCase()) &&
      !item.user.designation.toLowerCase().includes(dailySearch.toLowerCase()) &&
      !item.user.email.toLowerCase().includes(dailySearch.toLowerCase())
    ) {
      return false;
    }
    if (deptFilter !== "all" && item.user.department !== deptFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "working" && !item.isCurrentlyWorking) return false;
      if (statusFilter === "completed" && (!item.record?.punchOut || item.isCurrentlyWorking))
        return false;
      if (
        statusFilter === "leave" &&
        item.status !== "casual_leave" &&
        item.status !== "sick_leave"
      )
        return false;
      if (statusFilter === "absent" && item.status !== "absent") return false;
      if (statusFilter === "present" && item.status !== "present") return false;
    }
    return true;
  });

  const totalMembers = teamMembers.length;
  const workingNow = roster.filter((r) => r.isCurrentlyWorking).length;
  const completedToday = roster.filter((r) => r.record?.punchOut && !r.isCurrentlyWorking).length;
  const onLeaveCount = roster.filter(
    (r) => r.status === "casual_leave" || r.status === "sick_leave",
  ).length;
  const absentCount = roster.filter((r) => r.status === "absent").length;

  // Calendar Target User
  const target = state.users.find((u) => u.id === selectedUserId) ?? me!;
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay();

  const recordFor = (d: Date) =>
    state.attendance.find((a) => a.userId === target.id && a.date === dateKey(d));

  const monthRecords = state.attendance.filter(
    (a) =>
      a.userId === target.id && a.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  );
  const totalHours = monthRecords.reduce((s, r) => s + r.hours, 0);

  let workingDays = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
  }
  let absents = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    if (attendanceStatus(target.id, new Date(year, month, i)) === "absent") absents++;
  }

  const selectedRecord = selectedDay ? recordFor(selectedDay) : null;
  const selectedTasks = selectedDay
    ? state.tasks.filter(
        (t) =>
          t.assigneeId === target.id &&
          t.proofs.some((p) => p.submittedAt.slice(0, 10) === dateKey(selectedDay)),
      )
    : [];
  const selectedLeave = selectedDay
    ? state.leaves.find(
        (l) =>
          l.userId === target.id &&
          l.status === "approved" &&
          dateKey(selectedDay) >= l.startDate &&
          dateKey(selectedDay) <= l.endDate,
      )
    : null;

  return (
    <>
      <PageHeader
        title="Attendance Hub"
        description={
          isAdmin
            ? "Monitor real-time daily team attendance, punch times, working hours, and individual employee records."
            : "Track your daily punch status, working hours, leave calendar, and submitted task proofs."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!myRecordToday?.punchIn ? (
              <Button size="sm" onClick={punchIn} className="gap-2 shadow-sm">
                <Clock className="h-4 w-4" /> Punch in today
              </Button>
            ) : isPunchedIn ? (
              <Button size="sm" variant="destructive" onClick={punchOut} className="gap-2">
                <Clock className="h-4 w-4" /> Punch out
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarCheck className="h-3.5 w-3.5 text-success" /> Today complete (
                {hoursLabel(myRecordToday.hours)})
              </span>
            )}
          </div>
        }
      />

      {isAdmin ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "daily" | "calendar")}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <TabsList className="grid grid-cols-2 w-72">
              <TabsTrigger value="daily" className="gap-1.5">
                <UserCheck className="h-4 w-4" /> Daily Roster
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarDays className="h-4 w-4" /> Monthly View
              </TabsTrigger>
            </TabsList>

            {activeTab === "daily" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous day"
                  onClick={() => {
                    const prev = new Date(parsedDaily);
                    prev.setDate(prev.getDate() - 1);
                    setDailyDate(dateKey(prev));
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => e.target.value && setDailyDate(e.target.value)}
                  className="w-40 text-xs font-medium"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next day"
                  onClick={() => {
                    const next = new Date(parsedDaily);
                    next.setDate(next.getDate() + 1);
                    setDailyDate(dateKey(next));
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {dailyDate !== todayKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDailyDate(todayKey)}
                    className="text-xs"
                  >
                    Today
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="daily" className="space-y-6 m-0">
            {/* Daily Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Total Team"
                value={totalMembers}
                icon={Users}
                hint={`${parsedDaily.toLocaleDateString([], { month: "short", day: "numeric", weekday: "short" })}`}
              />
              <StatCard
                label="Working Now"
                value={workingNow}
                icon={UserCheck}
                accent="teal"
                hint={isDailyToday ? "Active punch-in" : "Punched in on date"}
              />
              <StatCard
                label="Completed Day"
                value={completedToday}
                icon={CalendarCheck}
                accent="success"
              />
              <StatCard
                label="On Leave"
                value={onLeaveCount}
                icon={Plane}
                accent="purple"
                hint="Approved leave"
              />
              <StatCard
                label={isDailyWeekend ? "Week Off" : "Absent / Not in"}
                value={isDailyWeekend ? totalMembers : absentCount}
                icon={Clock}
                accent={isDailyWeekend ? "teal" : undefined}
              />
            </div>

            {/* Daily Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative min-w-[200px] max-w-xs flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employee or role…"
                    value={dailySearch}
                    onChange={(e) => setDailySearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-40 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="working">Currently Working</SelectItem>
                    <SelectItem value="completed">Completed Day</SelectItem>
                    <SelectItem value="present">Present (Any)</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {filteredRoster.length} of {totalMembers} members
              </p>
            </div>

            {/* Daily Roster Table */}
            <Card className="rounded-2xl overflow-hidden border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold">Employee</th>
                        <th className="px-4 py-3.5 font-semibold">Department</th>
                        <th className="px-4 py-3.5 font-semibold">Punch In</th>
                        <th className="px-4 py-3.5 font-semibold">Punch Out</th>
                        <th className="px-4 py-3.5 font-semibold">Hours</th>
                        <th className="px-4 py-3.5 font-semibold">Status</th>
                        <th className="px-4 py-3.5 font-semibold">Proofs</th>
                        <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-muted-foreground">
                            No team members match the search and filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRoster.map(
                          ({ user, record, status, leave, proofsCount, isCurrentlyWorking }) => (
                            <tr key={user.id} className="transition-colors hover:bg-muted/40 group">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <Initials
                                    name={user.fullName}
                                    color={user.avatarColor}
                                    src={user.avatarUrl}
                                    size={36}
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">
                                      {user.fullName}
                                      {user.id === me!.id && (
                                        <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                                          (You)
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {user.designation}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-xs font-medium text-muted-foreground">
                                {user.department || "General"}
                              </td>
                              <td className="px-4 py-4 text-xs tabular-nums">
                                {record?.punchIn ? (
                                  <span className="font-semibold text-foreground">
                                    {fmtTime(record.punchIn)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-xs tabular-nums">
                                {record?.punchOut ? (
                                  <span className="font-semibold text-foreground">
                                    {fmtTime(record.punchOut)}
                                  </span>
                                ) : isCurrentlyWorking ? (
                                  <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-xs tabular-nums font-medium">
                                {record?.hours
                                  ? hoursLabel(record.hours)
                                  : record?.punchIn
                                    ? "In progress"
                                    : "0h"}
                              </td>
                              <td className="px-4 py-4">
                                {isCurrentlyWorking ? (
                                  <StatusPill value="present" label="Working" />
                                ) : record?.punchOut ? (
                                  <StatusPill value="completed" label="Day Complete" />
                                ) : leave ? (
                                  <StatusPill
                                    value={leave.type === "casual" ? "casual_leave" : "sick_leave"}
                                    label={`${titleCase(leave.type)} Leave`}
                                  />
                                ) : (
                                  <StatusPill value={status} />
                                )}
                              </td>
                              <td className="px-4 py-4 text-xs">
                                {proofsCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                                    <FileCheck2 className="h-3 w-3" />
                                    {proofsCount} {proofsCount === 1 ? "proof" : "proofs"}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">0</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setActiveTab("calendar");
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Calendar
                                </Button>
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6 m-0">
            {/* Calendar View Component */}
            <AttendanceCalendarView
              target={target}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              visibleUsers={teamMembers}
              cursor={cursor}
              setCursor={setCursor}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              canSeeOthers={isAdmin}
              year={year}
              month={month}
              first={first}
              daysInMonth={daysInMonth}
              lead={lead}
              monthRecords={monthRecords}
              totalHours={totalHours}
              workingDays={workingDays}
              absents={absents}
              recordFor={recordFor}
              attendanceStatus={attendanceStatus}
              state={state}
              selectedRecord={selectedRecord}
              selectedTasks={selectedTasks}
              selectedLeave={selectedLeave}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <AttendanceCalendarView
          target={target}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          visibleUsers={teamMembers}
          cursor={cursor}
          setCursor={setCursor}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          canSeeOthers={false}
          year={year}
          month={month}
          first={first}
          daysInMonth={daysInMonth}
          lead={lead}
          monthRecords={monthRecords}
          totalHours={totalHours}
          workingDays={workingDays}
          absents={absents}
          recordFor={recordFor}
          attendanceStatus={attendanceStatus}
          state={state}
          selectedRecord={selectedRecord}
          selectedTasks={selectedTasks}
          selectedLeave={selectedLeave}
        />
      )}
    </>
  );
}

interface CalendarViewProps {
  target: User;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  visibleUsers: User[];
  cursor: Date;
  setCursor: (d: Date) => void;
  selectedDay: Date | null;
  setSelectedDay: (d: Date | null) => void;
  canSeeOthers: boolean;
  year: number;
  month: number;
  first: Date;
  daysInMonth: number;
  lead: number;
  monthRecords: { hours: number }[];
  totalHours: number;
  workingDays: number;
  absents: number;
  recordFor: (
    d: Date,
  ) => { punchIn: string | null; punchOut: string | null; hours: number } | undefined;
  attendanceStatus: (id: string, d: Date) => AttendanceStatus;
  state: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  selectedRecord:
    { punchIn: string | null; punchOut: string | null; hours: number } | null | undefined;
  selectedTasks: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  selectedLeave: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function AttendanceCalendarView(props: CalendarViewProps) {
  const {
    target,
    selectedUserId,
    setSelectedUserId,
    visibleUsers,
    cursor,
    setCursor,
    selectedDay,
    setSelectedDay,
    canSeeOthers,
    year,
    month,
    first,
    daysInMonth,
    lead,
    monthRecords,
    totalHours,
    workingDays,
    absents,
    recordFor,
    attendanceStatus,
    state,
    selectedRecord,
    selectedTasks,
    selectedLeave,
  } = props;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {canSeeOthers && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Viewing:
            </span>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} ({u.department || "General"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present days" value={monthRecords.length} />
        <StatCard label="Total hours" value={hoursLabel(totalHours)} accent="purple" />
        <StatCard
          label="Attendance rate"
          value={`${workingDays ? Math.round((monthRecords.length / workingDays) * 100) : 0}%`}
          accent="teal"
        />
        <StatCard label="Absent days" value={absents} accent="success" />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            {first.toLocaleDateString([], { month: "long", year: "numeric" })} — {target.fullName}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground sm:gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: lead }).map((_, i) => (
              <div key={`lead-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = new Date(year, month, i + 1);
              const status = attendanceStatus(target.id, d);
              const rec = recordFor(d);
              const isToday = dateKey(d) === dateKey(new Date());
              const proofCount = state.tasks.filter(
                (t: Task) =>
                  t.assigneeId === target.id &&
                  t.proofs.some((p: TaskProof) => p.submittedAt.slice(0, 10) === dateKey(d)),
              ).length;
              return (
                <button
                  key={dateKey(d)}
                  onClick={() => setSelectedDay(d)}
                  className={cn(
                    "min-h-16 rounded-xl border p-1.5 text-left transition-colors hover:brightness-95 sm:min-h-24 sm:p-2",
                    DOT[status],
                    isToday && "ring-2 ring-primary",
                  )}
                >
                  <span className="text-xs font-semibold">{i + 1}</span>
                  <span className="mt-1 block text-[10px] leading-tight text-muted-foreground sm:text-xs">
                    {status === "present"
                      ? `${fmtTime(rec?.punchIn)}–${fmtTime(rec?.punchOut)}`
                      : status === "week_off"
                        ? "Week off"
                        : titleCase(status)}
                  </span>
                  {status === "present" && (
                    <span className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                      {hoursLabel(rec?.hours ?? 0)} · {proofCount} proof
                      {proofCount === 1 ? "" : "s"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(
              ["present", "casual_leave", "sick_leave", "absent", "week_off"] as AttendanceStatus[]
            ).map((s) => (
              <StatusPill key={s} value={s} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          {selectedDay ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusPill value={attendanceStatus(target.id, selectedDay)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Punch in</span>
                <span>{fmtTime(selectedRecord?.punchIn)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Punch out</span>
                <span>{fmtTime(selectedRecord?.punchOut)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total hours</span>
                <span>{hoursLabel(selectedRecord?.hours ?? 0)}</span>
              </div>
              {selectedLeave ? (
                <p className="rounded-xl bg-muted p-3 text-xs">
                  {titleCase(selectedLeave.type)} leave approved · {selectedLeave.reason}
                </p>
              ) : null}
              <div>
                <p className="mb-1 text-muted-foreground">Submitted tasks</p>
                {selectedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No proof submitted on this date.</p>
                ) : (
                  selectedTasks.map((t: Task) => (
                    <div key={t.id} className="rounded-lg border border-border p-2 text-xs mb-2">
                      <p className="font-medium">{t.title}</p>
                      {t.proofs.map((p: TaskProof) => (
                        <p key={p.id} className="text-muted-foreground">
                          {titleCase(p.type)}: {p.value}
                        </p>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
