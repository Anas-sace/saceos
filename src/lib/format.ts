export const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso ? `${fmtDate(iso)} · ${fmtTime(iso)}` : "—";

export const hoursLabel = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const elapsed = (fromIso: string, toMs: number) => {
  const ms = Math.max(0, toMs - new Date(fromIso).getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
