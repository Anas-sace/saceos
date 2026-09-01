import * as React from "react";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

const TONES: Record<string, string> = {
  present: "bg-success/12 text-success border-success/25",
  approved: "bg-success/12 text-success border-success/25",
  completed: "bg-success/12 text-success border-success/25",
  casual_leave: "bg-brand-purple/12 text-brand-purple border-brand-purple/25",
  sick_leave: "bg-info/12 text-info border-info/25",
  absent: "bg-destructive/10 text-destructive border-destructive/25",
  week_off: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/25",
  assigned: "bg-info/12 text-info border-info/25",
  in_progress: "bg-warning/15 text-warning border-warning/30",
  submitted: "bg-brand-purple/12 text-brand-purple border-brand-purple/25",
  revision_requested: "bg-destructive/10 text-destructive border-destructive/25",
  overdue: "bg-destructive/10 text-destructive border-destructive/25",
  urgent: "bg-destructive/10 text-destructive border-destructive/25",
  high: "bg-primary/12 text-primary border-primary/25",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
  created: "bg-info/12 text-info border-info/25",
  open: "bg-info/12 text-info border-info/25",
  waiting_employee: "bg-warning/15 text-warning border-warning/30",
  closed: "bg-muted text-muted-foreground border-border",
  public: "bg-brand-gold/15 text-brand-gold border-brand-gold/30",
  private: "bg-brand-purple/12 text-brand-purple border-brand-purple/25",
};

export function StatusPill({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONES[value] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {label ?? titleCase(value)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "purple" | "teal" | "success";
}) {
  const bg = {
    primary: "bg-primary/10 text-primary",
    purple: "bg-brand-purple/10 text-brand-purple",
    teal: "bg-brand-gold/15 text-brand-gold",
    success: "bg-success/12 text-success",
  }[accent];
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        {Icon ? (
          <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", bg)}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
