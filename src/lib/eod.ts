import jsPDF from "jspdf";
import type { EodReport, User } from "./types";

export type EodPeriod = "daily" | "weekly" | "monthly" | "quarterly";

export const EOD_PERIODS: EodPeriod[] = ["daily", "weekly", "monthly", "quarterly"];

export function eodPeriodLabel(p: EodPeriod): string {
  return p === "daily"
    ? "Daily"
    : p === "weekly"
      ? "Weekly"
      : p === "monthly"
        ? "Monthly"
        : "Quarterly";
}

function startOfPeriod(period: EodPeriod, ref = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  switch (period) {
    case "daily":
      return d;
    case "weekly": {
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1; // week starts Monday
      d.setDate(d.getDate() - diff);
      return d;
    }
    case "monthly":
      return new Date(ref.getFullYear(), ref.getMonth(), 1);
    case "quarterly":
      return new Date(ref.getFullYear(), Math.floor(ref.getMonth() / 3) * 3, 1);
  }
}

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function filterEodByPeriod(
  reports: EodReport[],
  period: EodPeriod,
  ref = new Date(),
): EodReport[] {
  const from = key(startOfPeriod(period, ref));
  const to = key(ref);
  return reports
    .filter((r) => r.date >= from && r.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function periodRangeLabel(period: EodPeriod, ref = new Date()): string {
  const from = startOfPeriod(period, ref);
  const fmt = (d: Date) =>
    d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  return period === "daily" ? fmt(ref) : `${fmt(from)} – ${fmt(ref)}`;
}

export function downloadEodPdf({
  title,
  subtitle,
  reports,
  users,
}: {
  title: string;
  subtitle: string;
  reports: EodReport[];
  users: User[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const line = (text: string, size = 10, style: "normal" | "bold" = "normal", gap = 15) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const chunks = doc.splitTextToSize(text, pageWidth - margin * 2) as string[];
    for (const chunk of chunks) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(chunk, margin, y);
      y += gap;
    }
  };

  line("SACE Portal — EOD Reports", 16, "bold", 22);
  line(title, 12, "bold", 18);
  line(subtitle, 9, "normal", 22);

  if (reports.length === 0) {
    line("No EOD reports found for this period.", 10);
  }

  for (const r of reports) {
    const user = users.find((u) => u.id === r.userId);
    y += 6;
    line(`${user?.fullName ?? "Unknown"} — ${r.date} · ${r.hours}h`, 11, "bold", 16);
    line(`Worked on: ${r.worked || "—"}`);
    line(`Completed: ${r.completed || "—"}`);
    line(`Blockers: ${r.blockers || "None"}`);
    doc.setDrawColor(220);
    if (y < pageHeight - margin) {
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  }

  doc.save(`${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}
