import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { LifeBuoy, Plus } from "lucide-react";
import { AppShell, EmptyState, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/portal-ui";
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
import { useApp, newId, isoNow } from "@/lib/store";
import { fmtDateTime, titleCase } from "@/lib/format";
import type { Priority, TicketCategory, TicketStatus } from "@/lib/types";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "Support Tickets — SACE Portal" },
      {
        name: "description",
        content: "Raise and track internal support tickets across HR, IT, payroll and platform.",
      },
      { property: "og:title", content: "Support Tickets — SACE Portal" },
      { property: "og:description", content: "Internal helpdesk for the SACE workforce portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <TicketsPage />
    </AppShell>
  ),
});

const CATEGORIES: TicketCategory[] = ["platform", "hr", "work", "it", "payroll", "other"];
const STATUSES: TicketStatus[] = [
  "created",
  "open",
  "in_progress",
  "waiting_employee",
  "completed",
  "closed",
];

function TicketsPage() {
  const { state, me, can, update, log, notify } = useApp();
  const isAgent = can("view_all_tickets");
  const [filter, setFilter] = React.useState<"all" | TicketStatus>("all");

  const tickets = state.tickets
    .filter((t) => (isAgent ? true : t.createdById === me!.id))
    .filter((t) => (filter === "all" ? true : t.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Support Tickets"
        description={
          isAgent ? "Every ticket raised by the team." : "Your requests and their progress."
        }
        actions={<NewTicket />}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(s as "all" | TicketStatus)}
          >
            {s === "all" ? "All" : titleCase(s)}
          </Button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState title="No tickets here" hint="Raise a ticket and our team will pick it up." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const owner = state.users.find((u) => u.id === t.ownerId);
            const author = state.users.find((u) => u.id === t.createdById);
            return (
              <Card key={t.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        <LifeBuoy className="h-4 w-4 text-primary" />
                        {t.code} · {t.subject}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {titleCase(t.category)} · raised by {author?.fullName} on{" "}
                        {fmtDateTime(t.createdAt)} ·{" "}
                        {owner ? `owned by ${owner.fullName}` : "unassigned"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill value={t.status} />
                      <StatusPill value={t.priority} />
                    </div>
                  </div>

                  {t.comments.filter((c) => isAgent || !c.internal).length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      {t.comments
                        .filter((c) => isAgent || !c.internal)
                        .map((c) => (
                          <p key={c.id} className="text-sm">
                            <span className="font-medium">
                              {state.users.find((u) => u.id === c.authorId)?.fullName}
                            </span>{" "}
                            <span className="text-xs text-muted-foreground">
                              {fmtDateTime(c.at)}
                            </span>
                            {c.internal ? (
                              <span className="ml-1 text-xs text-warning">(internal)</span>
                            ) : null}
                            <br />
                            <span className="text-muted-foreground">{c.body}</span>
                          </p>
                        ))}
                    </div>
                  )}

                  <ReplyBox ticketId={t.id} isAgent={isAgent} />

                  {isAgent && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Select
                        value={t.status}
                        onValueChange={(v) => {
                          update((d) => {
                            const target = d.tickets.find((x) => x.id === t.id);
                            if (!target) return;
                            target.status = v as TicketStatus;
                            target.ownerId = target.ownerId ?? me!.id;
                          });
                          log("ticket_status", `${t.code} → ${v}`);
                          notify(
                            t.createdById,
                            `Ticket ${t.code} updated`,
                            `Status is now ${titleCase(v)}.`,
                            "/tickets",
                          );
                        }}
                      >
                        <SelectTrigger className="w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {titleCase(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!t.ownerId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            update((d) => {
                              const target = d.tickets.find((x) => x.id === t.id);
                              if (target) target.ownerId = me!.id;
                            })
                          }
                        >
                          Assign to me
                        </Button>
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

function ReplyBox({ ticketId, isAgent }: { ticketId: string; isAgent: boolean }) {
  const { me, update } = useApp();
  const [body, setBody] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  return (
    <form
      className="mt-3 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        update((d) => {
          const t = d.tickets.find((x) => x.id === ticketId);
          t?.comments.push({
            id: newId(),
            authorId: me!.id,
            body: body.trim(),
            at: isoNow(),
            internal,
          });
        });
        setBody("");
        toast.success("Reply added");
      }}
    >
      <Input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a reply…"
        className="min-w-[200px] flex-1"
        aria-label="Reply"
      />
      {isAgent && (
        <Button
          type="button"
          variant={internal ? "default" : "outline"}
          size="sm"
          onClick={() => setInternal(!internal)}
        >
          Internal
        </Button>
      )}
      <Button type="submit" size="sm">
        Reply
      </Button>
    </form>
  );
}

function NewTicket() {
  const { me, update, log } = useApp();
  const [open, setOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<TicketCategory>("platform");
  const [priority, setPriority] = React.useState<Priority>("medium");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Raise ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a support ticket</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim()) return;
            update((d) => {
              const seq = d.ticketSeq + 1;
              d.ticketSeq = seq;
              d.tickets.unshift({
                id: newId(),
                code: `TKT-${String(seq).padStart(4, "0")}`,
                subject: subject.trim(),
                category,
                description: description.trim(),
                priority,
                status: "created",
                createdById: me!.id,
                ownerId: null,
                createdAt: isoNow(),
                comments: [],
              });
            });
            log("ticket_created", subject.trim());
            toast.success("Ticket raised");
            setSubject("");
            setDescription("");
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {titleCase(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {titleCase(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Submit ticket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
