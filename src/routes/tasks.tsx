import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  Filter,
  MessageSquare,
  Plus,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { AppShell, EmptyState, Initials, PageHeader } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, dateKey, newId, isoNow } from "@/lib/store";
import { fmtDateTime, titleCase } from "@/lib/format";
import { CADENCES, cadenceDueDate, cadenceLabel } from "@/lib/cadence";
import type { Priority, ProofType, Task, TaskCadence, TaskStatus, User } from "@/lib/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks Hub — SACE Portal" },
      {
        name: "description",
        content: "Team and individual task management, planning, proof of work, and review.",
      },
      { property: "og:title", content: "Tasks Hub — SACE Portal" },
      {
        property: "og:description",
        content: "Self-managed and team task planning with proof of completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <TasksPage />
    </AppShell>
  ),
});

function TasksPage() {
  const { state, me, visibleUsers } = useApp();
  const isAdmin = me!.role !== "member";
  const [activeTab, setActiveTab] = React.useState<"team" | "my">(isAdmin ? "team" : "my");

  // Filters
  const [memberFilter, setMemberFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [cadenceFilter, setCadenceFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("");
  const [query, setQuery] = React.useState<string>("");

  const todayKey = dateKey(new Date());
  const teamMembers = visibleUsers();
  const teamMemberIds = teamMembers.map((u) => u.id);

  // Scope determination
  const rawTasks =
    activeTab === "team"
      ? state.tasks.filter((t) => teamMemberIds.includes(t.assigneeId))
      : state.tasks.filter((t) => t.assigneeId === me!.id);

  const filteredTasks = rawTasks.filter((t) => {
    if (activeTab === "team" && memberFilter !== "all" && t.assigneeId !== memberFilter) {
      return false;
    }
    if (statusFilter === "overdue") {
      if (!(t.dueDate < todayKey && !["approved", "completed"].includes(t.status))) return false;
    } else if (statusFilter !== "all" && t.status !== statusFilter) {
      return false;
    }
    if (cadenceFilter !== "all" && t.cadence !== cadenceFilter) {
      return false;
    }
    if (dateFilter && t.dueDate !== dateFilter) {
      return false;
    }
    if (query) {
      const q = query.toLowerCase();
      const assignee = state.users.find((u) => u.id === t.assigneeId);
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchAssignee = assignee?.fullName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  // Metrics for team
  const totalCount = rawTasks.length;
  const inProgressCount = rawTasks.filter((t) => t.status === "in_progress").length;
  const submittedCount = rawTasks.filter((t) => t.status === "submitted").length;
  const completedCount = rawTasks.filter((t) =>
    ["approved", "completed"].includes(t.status),
  ).length;
  const overdueCount = rawTasks.filter(
    (t) => t.dueDate < todayKey && !["approved", "completed"].includes(t.status),
  ).length;

  return (
    <>
      <PageHeader
        title={isAdmin ? "Tasks & Deliverables" : "My Tasks"}
        description={
          isAdmin
            ? "Track team deliverables, filter by member or due date calendar, review completion proofs and assign work."
            : "You set your own work. Choose whether it's a today, weekly, monthly or quarterly task."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NewTaskDialog
              defaultAssigneeId={me!.id}
              teamMembers={teamMembers}
              canAssignOthers={isAdmin}
            />
          </div>
        }
      />

      {isAdmin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "team" | "my");
              if (v === "my") setMemberFilter("all");
            }}
          >
            <TabsList className="grid grid-cols-2 w-64">
              <TabsTrigger value="team" className="gap-1.5">
                <Users className="h-4 w-4" /> Team Tasks
              </TabsTrigger>
              <TabsTrigger value="my" className="gap-1.5">
                <UserCheck className="h-4 w-4" /> My Tasks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Tasks" value={totalCount} icon={CalendarCheck} />
        <StatCard label="In Progress" value={inProgressCount} icon={Clock} accent="teal" />
        <StatCard
          label="Needs Review"
          value={submittedCount}
          icon={FileCheck2}
          accent="purple"
          hint="Proofs awaiting review"
        />
        <StatCard
          label="Approved / Done"
          value={completedCount}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          hint={overdueCount > 0 ? "Requires attention" : "On schedule"}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 text-xs"
            placeholder={activeTab === "team" ? "Search title or assignee…" : "Search tasks…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        {activeTab === "team" && (
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-48 text-xs">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              {teamMembers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName} {u.id === me!.id ? "(You)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {[
              "all",
              "assigned",
              "in_progress",
              "submitted",
              "approved",
              "completed",
              "overdue",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all"
                  ? "All statuses"
                  : s === "submitted"
                    ? "Submitted (Review)"
                    : titleCase(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cadenceFilter} onValueChange={setCadenceFilter}>
          <SelectTrigger className="w-36 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CADENCES.map((c) => (
              <SelectItem key={c} value={c}>
                {cadenceLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-36 text-xs"
            placeholder="Due date filter"
            title="Filter by target due date"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter("")}
              className="h-9 px-2 text-xs text-muted-foreground"
            >
              Clear date
            </Button>
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks match the criteria"
          hint="Try adjusting the search or filters, or click '+ New task' to create a task."
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const overdue =
              task.dueDate < todayKey && !["approved", "completed"].includes(task.status);
            const assignee = state.users.find((u) => u.id === task.assigneeId);
            const isAssignedToMe = task.assigneeId === me!.id;

            return (
              <Card key={task.id} className="rounded-2xl transition-shadow hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {cadenceLabel(task.cadence)} task
                        </span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">
                          Target date: <strong className="text-foreground">{task.dueDate}</strong>
                        </span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">
                          Proof: <strong>{titleCase(task.requiredProof)}</strong>
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                      )}

                      {activeTab === "team" && assignee && (
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <Initials
                            name={assignee.fullName}
                            color={assignee.avatarColor}
                            src={assignee.avatarUrl}
                            size={22}
                          />
                          <span className="font-medium text-foreground">{assignee.fullName}</span>
                          <span className="text-muted-foreground">({assignee.designation})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill value={task.priority} />
                      <StatusPill value={overdue ? "overdue" : task.status} />
                    </div>
                  </div>

                  {/* Submitted Proofs */}
                  {task.proofs.length > 0 && (
                    <div className="mt-4 space-y-2 rounded-xl bg-muted/60 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Submitted Completion Proof
                      </p>
                      {task.proofs.map((p) => (
                        <div key={p.id} className="text-sm">
                          <span className="font-medium">{titleCase(p.type)} proof:</span>{" "}
                          {p.type === "link" ? (
                            <a
                              href={p.value}
                              className="text-primary underline inline-flex items-center gap-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {p.value} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-foreground font-mono text-xs bg-background/80 px-2 py-0.5 rounded border border-border">
                              {p.value}
                            </span>
                          )}
                          {p.note && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Note: {p.note} · {fmtDateTime(p.submittedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Task Actions */}
                  <TaskActions task={task} isAdmin={isAdmin} isAssignedToMe={isAssignedToMe} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function TaskActions({
  task,
  isAdmin,
  isAssignedToMe,
}: {
  task: Task;
  isAdmin: boolean;
  isAssignedToMe: boolean;
}) {
  const { update, log, me, notify } = useApp();
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewNote, setReviewNote] = React.useState("");

  const setStatus = (status: TaskStatus, msg: string) => {
    update((d) => {
      const t = d.tasks.find((x) => x.id === task.id);
      if (t) t.status = status;
    });
    log("Task updated", `${task.title} → ${titleCase(status)}`);
    toast.success(msg);
  };

  const handleApprove = () => {
    update((d) => {
      const t = d.tasks.find((x) => x.id === task.id);
      if (t) {
        t.status = "approved";
        if (reviewNote.trim()) {
          t.comments.push({
            id: newId(),
            authorId: me!.id,
            body: `Approved: ${reviewNote.trim()}`,
            at: isoNow(),
          });
        }
      }
    });
    notify(
      task.assigneeId,
      "Task Approved",
      `Your task "${task.title}" has been approved.`,
      "/tasks",
    );
    log("Task approved", task.title);
    toast.success("Task approved.");
    setReviewOpen(false);
  };

  const handleRequestRevision = () => {
    if (!reviewNote.trim()) {
      toast.error("Please add feedback explaining the required revisions.");
      return;
    }
    update((d) => {
      const t = d.tasks.find((x) => x.id === task.id);
      if (t) {
        t.status = "revision_requested";
        t.comments.push({
          id: newId(),
          authorId: me!.id,
          body: `Revision requested: ${reviewNote.trim()}`,
          at: isoNow(),
        });
      }
    });
    notify(
      task.assigneeId,
      "Revision Requested",
      `Your admin requested revisions on "${task.title}": ${reviewNote.trim()}`,
      "/tasks",
    );
    log("Task revision requested", task.title);
    toast.success("Revision requested.");
    setReviewOpen(false);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {/* Member actions */}
      {isAssignedToMe && task.status === "assigned" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus("in_progress", "Task started")}
        >
          Start task
        </Button>
      )}

      {isAssignedToMe && !["approved", "completed"].includes(task.status) && (
        <SubmitProofDialog task={task} />
      )}

      {isAssignedToMe && task.status !== "completed" && task.status !== "approved" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setStatus("completed", "Task marked complete")}
        >
          Mark complete
        </Button>
      )}

      {/* Admin review actions for submitted tasks */}
      {isAdmin && task.status === "submitted" && (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shadow-sm">
              <FileCheck2 className="h-4 w-4" /> Review proof
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Review Task Proof</DialogTitle>
              <DialogDescription>
                Review submitted proof for &quot;{task.title}&quot; and approve or request revision.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-3 text-xs space-y-2">
                <p className="font-semibold text-foreground">Submitted proofs:</p>
                {task.proofs.map((p) => (
                  <div key={p.id}>
                    <span className="font-medium">{titleCase(p.type)}:</span> {p.value}
                    {p.note && <p className="text-muted-foreground mt-0.5">Note: {p.note}</p>}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-note">
                  Review feedback (optional for approval, required for revision)
                </Label>
                <Textarea
                  id="review-note"
                  placeholder="Feedback or instructions…"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={handleRequestRevision}>
                  Request revision
                </Button>
                <Button onClick={handleApprove}>Approve task</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isAdmin && task.status !== "approved" && task.status !== "completed" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus("approved", "Task approved by admin")}
        >
          Quick approve
        </Button>
      )}
    </div>
  );
}

function SubmitProofDialog({ task }: { task: Task }) {
  const { update, log, me, state, notify } = useApp();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"image" | "file" | "link" | "text">("text");
  const [value, setValue] = React.useState("");
  const [note, setNote] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Submit proof</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Submit completion proof</DialogTitle>
          <DialogDescription>
            Provide verifiable proof (link, document, screenshot or detail) that you finished &quot;
            {task.title}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Proof type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text note</SelectItem>
                <SelectItem value="link">Link / URL</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "file" || type === "image" ? (
            <div className="space-y-2">
              <Label htmlFor="proof-file">Upload {type}</Label>
              <Input
                id="proof-file"
                type="file"
                accept={type === "image" ? "image/*" : undefined}
                onChange={(e) => setValue(e.target.files?.[0]?.name ?? "")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="proof-value">{type === "link" ? "URL" : "Completion note"}</Label>
              <Input
                id="proof-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "link" ? "https://" : "What did you complete?"}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="proof-note">Comment (optional)</Label>
            <Textarea
              id="proof-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            className="w-full"
            disabled={!value.trim()}
            onClick={() => {
              update((d) => {
                const t = d.tasks.find((x) => x.id === task.id);
                if (!t) return;
                t.proofs.push({ id: newId(), type, value, note, submittedAt: isoNow() });
                t.status = "submitted";
              });
              const adminUser = state.users.find(
                (u) => u.role === "admin" || u.role === "super_admin",
              );
              if (adminUser) {
                notify(
                  adminUser.id,
                  "Proof Submitted",
                  `${me?.fullName} submitted proof for "${task.title}".`,
                  "/tasks",
                );
              }
              log("Task proof submitted", task.title);
              toast.success("Proof submitted successfully.");
              setOpen(false);
              setValue("");
              setNote("");
            }}
          >
            Submit proof
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewTaskDialog({
  defaultAssigneeId,
  teamMembers,
  canAssignOthers,
}: {
  defaultAssigneeId: string;
  teamMembers: User[];
  canAssignOthers: boolean;
}) {
  const { me, update, log, notify } = useApp();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    assigneeId: defaultAssigneeId,
    cadence: "today" as TaskCadence,
    priority: "medium" as Priority,
    dueDate: cadenceDueDate("today"),
    requiredProof: "any" as ProofType,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {canAssignOthers ? "Create / Assign Task" : "Set a task for yourself"}
          </DialogTitle>
          <DialogDescription>
            {canAssignOthers
              ? "Assign a deliverable to yourself or a team member with defined target date and proof requirement."
              : "Define your deliverable for today, this week, month or quarter."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {canAssignOthers && (
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId}
                onValueChange={(v) => setForm({ ...form, assigneeId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} {u.id === me!.id ? "(You)" : `(${u.designation})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={form.title}
              placeholder="e.g. Complete client onboarding call"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea
              id="t-desc"
              rows={3}
              placeholder="Context, deliverables, and requirements…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Task type</Label>
              <Select
                value={form.cadence}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    cadence: v as TaskCadence,
                    dueDate: cadenceDueDate(v as TaskCadence),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {cadenceLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {titleCase(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-due">Target date</Label>
              <Input
                id="t-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Proof of completion</Label>
              <Select
                value={form.requiredProof}
                onValueChange={(v) => setForm({ ...form, requiredProof: v as ProofType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["any", "image", "file", "link"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {titleCase(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!form.title.trim()}
            onClick={() => {
              update((d) => {
                d.tasks.unshift({
                  id: newId(),
                  title: form.title,
                  description: form.description,
                  assigneeId: form.assigneeId,
                  assignedById: me!.id,
                  priority: form.priority,
                  status: "assigned",
                  cadence: form.cadence,
                  startDate: dateKey(new Date()),
                  dueDate: form.dueDate,
                  requiredProof: form.requiredProof,
                  proofs: [],
                  comments: [],
                });
              });
              if (form.assigneeId !== me!.id) {
                notify(
                  form.assigneeId,
                  "New Task Assigned",
                  `${me?.fullName} assigned you: "${form.title}"`,
                  "/tasks",
                );
              }
              log("Task created", form.title);
              toast.success("Task added to plan");
              setOpen(false);
              setForm({ ...form, title: "", description: "" });
            }}
          >
            Save task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
