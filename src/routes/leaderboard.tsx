import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import { AppShell, EmptyState, Initials, PageHeader } from "@/components/app-shell";
import { StatCard } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useApp, newId } from "@/lib/store";
import { monthKey } from "@/lib/format";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — SACE Portal" },
      {
        name: "description",
        content: "Recognition wall and performance leaderboard for the SACE team.",
      },
      { property: "og:title", content: "Leaderboard — SACE Portal" },
      { property: "og:description", content: "Celebrate top performers, awards and consistency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <LeaderboardPage />
    </AppShell>
  ),
});

const AWARD_TYPES = [
  "Employee of the Month",
  "Star Employee",
  "Most Improved",
  "Team Player",
  "Best Attendance",
  "Highest Task Completion",
  "Client Champion",
  "Innovation Award",
];

function LeaderboardPage() {
  const { state, can } = useApp();

  const rows = state.users
    .filter((u) => u.active)
    .map((u) => {
      const tasks = state.tasks.filter((t) => t.assigneeId === u.id);
      const done = tasks.filter((t) => t.status === "completed" || t.status === "approved").length;
      const present = state.attendance.filter((a) => a.userId === u.id).length;
      const awards = state.awards.filter((a) => a.userId === u.id).length;
      const score = done * 10 + present * 3 + awards * 15;
      return { user: u, done, tasks: tasks.length, present, awards, score };
    })
    .sort((a, b) => b.score - a.score);

  const featured = state.awards.filter((a) => a.featured);

  return (
    <>
      <PageHeader
        title="Leaderboard & Recognition"
        description="Consistency, delivery and impact — celebrated every month."
        actions={can("manage_recognition") ? <NominateDialog /> : null}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Top performer" value={rows[0]?.user.fullName ?? "—"} icon={Crown} />
        <StatCard label="Awards given" value={state.awards.length} icon={Trophy} accent="purple" />
        <StatCard label="Featured this month" value={featured.length} icon={Award} accent="teal" />
      </div>

      {featured.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {featured.map((a) => {
            const u = state.users.find((x) => x.id === a.userId);
            return (
              <Card key={a.id} className="rounded-2xl border-primary/30 bg-primary/5">
                <CardContent className="flex gap-4 p-5">
                  <Initials name={u?.fullName ?? "?"} color={u?.avatarColor} size={48} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {a.type}
                    </p>
                    <p className="font-semibold">{u?.fullName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.reason}</p>
                    {a.quote ? <p className="mt-2 text-sm italic">“{a.quote}”</p> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No team data yet" />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Tasks done</th>
                  <th className="px-5 py-3">Days present</th>
                  <th className="px-5 py-3">Awards</th>
                  <th className="px-5 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.user.id} className="border-t border-border">
                    <td className="px-5 py-3 font-semibold">
                      {i < 3 ? <Medal className="h-4 w-4 text-primary" /> : i + 1}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Initials name={r.user.fullName} color={r.user.avatarColor} size={30} />
                        <span>
                          <span className="block font-medium">{r.user.fullName}</span>
                          <span className="block text-xs text-muted-foreground">
                            {r.user.designation}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.done}/{r.tasks}
                    </td>
                    <td className="px-5 py-3">{r.present}</td>
                    <td className="px-5 py-3">{r.awards}</td>
                    <td className="px-5 py-3 font-semibold text-primary">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function NominateDialog() {
  const { state, me, update, notify, log, visibleUsers } = useApp();
  const [open, setOpen] = React.useState(false);
  const people = visibleUsers().filter((u) => u.active);
  const [userId, setUserId] = React.useState(people[0]?.id ?? "");
  const [type, setType] = React.useState(AWARD_TYPES[0]!);
  const [reason, setReason] = React.useState("");
  const [quote, setQuote] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Trophy className="mr-1 h-4 w-4" /> Give recognition
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recognise a team member</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!userId) return;
            update((d) => {
              d.awards.unshift({
                id: newId(),
                userId,
                type,
                period: monthKey(new Date()),
                reason: reason.trim(),
                nominatedById: me!.id,
                quote: quote.trim() || undefined,
                featured: true,
              });
            });
            const name = state.users.find((u) => u.id === userId)?.fullName ?? "Team member";
            notify(
              userId,
              `You received: ${type}`,
              reason.trim() || "Congratulations!",
              "/leaderboard",
            );
            log("recognition", `${type} → ${name}`);
            toast.success(`${name} recognised`);
            setReason("");
            setQuote("");
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label>Team member</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {people.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Award</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AWARD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote">Quote (optional)</Label>
            <Input id="quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">
            Publish recognition
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
