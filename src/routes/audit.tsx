import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, EmptyState, NoAccess, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { fmtDateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs — SACE Portal" },
      {
        name: "description",
        content: "Full activity trail of admin and member actions in the SACE Portal.",
      },
      { property: "og:title", content: "Audit Logs — SACE Portal" },
      {
        property: "og:description",
        content: "Traceability for every account, task and approval action.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <AuditPage />
    </AppShell>
  ),
});

function AuditPage() {
  const { state, me } = useApp();
  const [q, setQ] = React.useState("");
  if (me!.role !== "super_admin") return <NoAccess />;

  const logs = state.audit.filter((l) => {
    const actor = state.users.find((u) => u.id === l.actorId)?.fullName ?? "";
    const hay = `${actor} ${l.action} ${l.detail}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Every meaningful action, with who did it and when."
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by person, action or detail…"
        className="mb-4 max-w-md"
        aria-label="Search audit logs"
      />
      {logs.length === 0 ? (
        <EmptyState title="No activity found" hint="Try a different search term." />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Who</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {fmtDateTime(l.at)}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {state.users.find((u) => u.id === l.actorId)?.fullName ?? "Unknown"}
                    </td>
                    <td className="px-5 py-3">{titleCase(l.action)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{l.detail}</td>
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
