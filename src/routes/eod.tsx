import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FilePenLine, Plus } from "lucide-react";
import { AppShell, EmptyState, Initials, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import {
  EOD_PERIODS,
  downloadEodPdf,
  eodPeriodLabel,
  filterEodByPeriod,
  periodRangeLabel,
  type EodPeriod,
} from "@/lib/eod";
import { EodLogoutDialog } from "@/components/eod-logout-dialog";

export const Route = createFileRoute("/eod")({
  head: () => ({
    meta: [
      { title: "EOD Reports — SACE Portal" },
      {
        name: "description",
        content:
          "Daily, weekly, monthly and quarterly end-of-day reports with PDF download for an individual or the whole team.",
      },
      { property: "og:title", content: "EOD Reports — SACE Portal" },
      {
        property: "og:description",
        content: "End-of-day work reports across the SACE team, downloadable as PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <EodPage />
    </AppShell>
  ),
});

function EodPage() {
  const { state, me, visibleUsers, can } = useApp();
  const isAdmin = can("view_all_eod");
  const [period, setPeriod] = React.useState<EodPeriod>("daily");
  const [personId, setPersonId] = React.useState<string>(isAdmin ? "all" : me!.id);
  const [writeDialogOpen, setWriteDialogOpen] = React.useState(false);

  const scopeUsers = isAdmin ? visibleUsers() : [me!];
  const scopeIds = scopeUsers.map((u) => u.id);

  const inScope = state.eodReports.filter(
    (r) => scopeIds.includes(r.userId) && (personId === "all" || r.userId === personId),
  );
  const reports = filterEodByPeriod(inScope, period);
  const range = periodRangeLabel(period);

  const personName =
    personId === "all"
      ? "All team members"
      : (scopeUsers.find((u) => u.id === personId)?.fullName ?? "");

  return (
    <>
      <PageHeader
        title="EOD Reports"
        description={
          isAdmin
            ? "End-of-day reports submitted at log out or entered manually. Review by period and download as PDF."
            : "Your end-of-day reports. Submit for today or previous dates, review history, and download as PDF."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setWriteDialogOpen(true)}
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Write report
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadEodPdf({
                  title: `${eodPeriodLabel(period)} EOD — ${personName}`,
                  subtitle: `${range} · ${reports.length} report${reports.length === 1 ? "" : "s"}`,
                  reports,
                  users: state.users,
                })
              }
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as EodPeriod)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EOD_PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {eodPeriodLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={personId} onValueChange={setPersonId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team members</SelectItem>
              {scopeUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="self-center text-sm text-muted-foreground">{range}</span>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No EOD reports in this period"
          hint="Click '+ Write report' to create a report for today or any previous date, or submit on log out."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const u = state.users.find((x) => x.id === r.userId);
            return (
              <Card key={r.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Initials name={u?.fullName ?? "?"} color={u?.avatarColor} size={32} />
                      <div>
                        <p className="font-semibold">{u?.fullName ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.date} · {r.hours}h · submitted {fmtDateTime(r.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadEodPdf({
                          title: `EOD ${r.date} — ${u?.fullName ?? "Report"}`,
                          subtitle: `Single day report`,
                          reports: [r],
                          users: state.users,
                        })
                      }
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Worked on
                      </dt>
                      <dd className="mt-1">{r.worked || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Completed
                      </dt>
                      <dd className="mt-1">{r.completed || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Blockers
                      </dt>
                      <dd className="mt-1">{r.blockers || "None"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EodLogoutDialog
        open={writeDialogOpen}
        onOpenChange={setWriteDialogOpen}
        mode="write"
        onDone={() => {
          // Stay on EOD page after saving
        }}
      />
    </>
  );
}
