import type { TaskCadence } from "./types";

export const CADENCES: TaskCadence[] = ["today", "weekly", "monthly", "quarterly"];

export function cadenceLabel(cadence: TaskCadence): string {
  switch (cadence) {
    case "today":
      return "Today";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    default:
      return cadence;
  }
}

export function cadenceDueDate(cadence: TaskCadence): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");

  switch (cadence) {
    case "today":
      return `${y}-${m}-${d}`;
    case "weekly": {
      const next = new Date(today);
      next.setDate(today.getDate() + (7 - today.getDay()));
      const yy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, "0");
      const dd = String(next.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    }
    case "monthly": {
      const last = new Date(y, today.getMonth() + 1, 0);
      const mm = String(last.getMonth() + 1).padStart(2, "0");
      const dd = String(last.getDate()).padStart(2, "0");
      return `${last.getFullYear()}-${mm}-${dd}`;
    }
    case "quarterly": {
      const quarterEndMonth = Math.floor(today.getMonth() / 3) * 3 + 3;
      const last = new Date(y, quarterEndMonth, 0);
      const mm = String(last.getMonth() + 1).padStart(2, "0");
      const dd = String(last.getDate()).padStart(2, "0");
      return `${last.getFullYear()}-${mm}-${dd}`;
    }
    default:
      return `${y}-${m}-${d}`;
  }
}
