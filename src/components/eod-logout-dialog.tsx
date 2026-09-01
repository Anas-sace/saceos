import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp, dateKey, newId, isoNow } from "@/lib/store";

export function EodLogoutDialog({
  open,
  onOpenChange,
  onDone,
  mode = "logout",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  /** "logout" submits then signs out, "write" just saves the report. */
  mode?: "logout" | "write";
}) {
  const { state, me, update, log } = useApp();
  const todayKey = dateKey(new Date());
  const [date, setDate] = React.useState(todayKey);
  const [worked, setWorked] = React.useState("");
  const [completed, setCompleted] = React.useState("");
  const [blockers, setBlockers] = React.useState("");
  const [hours, setHours] = React.useState("");

  const isWrite = mode === "write";
  const optional = mode === "logout" && me?.role === "super_admin";

  const record = state.attendance.find((a) => a.userId === me?.id && a.date === date);
  const existing = state.eodReports.find((r) => r.userId === me?.id && r.date === date);

  React.useEffect(() => {
    if (!open) return;
    setDate(todayKey);
  }, [open, todayKey]);

  React.useEffect(() => {
    if (!open) return;
    setWorked(existing?.worked ?? "");
    setCompleted(existing?.completed ?? "");
    setBlockers(existing?.blockers ?? "");
    const liveHoursStr =
      record?.punchIn && !record?.punchOut
        ? String(
            Math.round(((Date.now() - new Date(record.punchIn).getTime()) / 3600000) * 10) / 10,
          )
        : record?.hours
          ? String(record.hours)
          : "";
    setHours(existing?.hours ? String(existing.hours) : liveHoursStr);
  }, [open, date, existing, record]);

  const submit = () => {
    const liveHoursFallback =
      record?.punchIn && !record?.punchOut
        ? Math.round(((Date.now() - new Date(record.punchIn).getTime()) / 3600000) * 10) / 10
        : record?.hours || 0;
    const parsedHours = Number(hours) || liveHoursFallback || 0;
    const todaysTasks = state.tasks.filter(
      (t) => t.assigneeId === me!.id && ["completed", "approved"].includes(t.status),
    );
    update((d) => {
      if (!isWrite && date === todayKey) {
        const att = d.attendance.find((a) => a.userId === me!.id && a.date === todayKey);
        if (att && att.punchIn && !att.punchOut) {
          att.punchOut = isoNow();
          att.hours = parsedHours;
          att.status = "present";
        }
      }
      const prev = d.eodReports.find((r) => r.userId === me!.id && r.date === date);
      if (prev) {
        prev.worked = worked.trim();
        prev.completed = completed.trim();
        prev.blockers = blockers.trim();
        prev.hours = parsedHours;
        prev.submittedAt = isoNow();
      } else {
        d.eodReports.unshift({
          id: newId(),
          userId: me!.id,
          date,
          worked: worked.trim(),
          completed: completed.trim(),
          blockers: blockers.trim(),
          hours: parsedHours,
          taskIds: todaysTasks.map((t) => t.id),
          submittedAt: isoNow(),
        });
      }
    });
    log("EOD report submitted", `${date} · ${parsedHours}h`);
    toast.success(isWrite ? "EOD report saved" : "EOD report submitted. See you tomorrow!");
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isWrite ? "Write an EOD report" : "Submit your EOD report"}</DialogTitle>
          <DialogDescription>
            {isWrite
              ? "Record what you worked on. Your report is visible to you, your Admin and the Super Admin."
              : optional
                ? "Optional for Super Admins — you can log out straight away or leave a report for the record."
                : "Before signing out, tell us what you worked on today. Your report is visible to you, your Admin and the Super Admin."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isWrite && (
            <div className="space-y-2">
              <Label htmlFor="eod-date">Report date</Label>
              <Input
                id="eod-date"
                type="date"
                value={date}
                max={todayKey}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="eod-worked">What did you work on?</Label>
            <Textarea
              id="eod-worked"
              rows={3}
              value={worked}
              onChange={(e) => setWorked(e.target.value)}
              placeholder="Calls, follow-ups, designs, documents…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eod-completed">What did you complete?</Label>
            <Textarea
              id="eod-completed"
              rows={3}
              value={completed}
              onChange={(e) => setCompleted(e.target.value)}
              placeholder="Tasks finished today"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eod-blockers">Any blockers? (optional)</Label>
            <Textarea
              id="eod-blockers"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Anything holding you back"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eod-hours">Hours worked</Label>
            <Input
              id="eod-hours"
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {isWrite ? "Cancel" : "Keep working"}
            </Button>
            {optional && (
              <Button
                variant="outline"
                onClick={() => {
                  if (record?.punchIn && !record.punchOut) {
                    update((d) => {
                      const att = d.attendance.find(
                        (a) => a.userId === me!.id && a.date === todayKey,
                      );
                      if (att && att.punchIn && !att.punchOut) {
                        att.punchOut = isoNow();
                        att.hours =
                          Math.round(
                            ((Date.now() - new Date(att.punchIn).getTime()) / 3600000) * 100,
                          ) / 100;
                        att.status = "present";
                      }
                    });
                  }
                  onOpenChange(false);
                  onDone();
                }}
              >
                Skip &amp; log out
              </Button>
            )}
            <Button
              disabled={
                optional
                  ? worked.trim().length < 3
                  : worked.trim().length < 3 || completed.trim().length < 3
              }
              onClick={submit}
            >
              {isWrite ? "Save report" : "Submit & log out"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
