import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileSpreadsheet, Lock, LockOpen, Plus } from "lucide-react";
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
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — SACE Portal" },
      {
        name: "description",
        content: "Shared lead datasets with visibility and edit-lock controls.",
      },
      { property: "og:title", content: "Leads — SACE Portal" },
      {
        property: "og:description",
        content: "Upload lead datasets and control who can see or edit them.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <LeadsPage />
    </AppShell>
  ),
});

function LeadsPage() {
  const { state, me, can, update, log, notify } = useApp();
  const canUpload = can("upload_leads");
  const visible = canUpload ? state.leads : state.leads.filter((l) => l.visibility === "public");

  return (
    <>
      <PageHeader
        title="Leads"
        description={
          canUpload
            ? "Upload datasets and control visibility and edit access."
            : "Datasets published to the team by your admins."
        }
        actions={canUpload ? <UploadDialog /> : null}
      />

      {visible.length === 0 ? (
        <EmptyState
          title="No lead data available"
          hint="Public datasets published by admins will show here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((l) => {
            const uploader = state.users.find((u) => u.id === l.uploadedById);
            return (
              <Card key={l.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                        <FileSpreadsheet className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{l.name}</p>
                        <p className="text-sm text-muted-foreground">{l.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill value={l.visibility} />
                      <StatusPill
                        value={l.locked ? "closed" : "approved"}
                        label={l.locked ? "Locked" : "Editable"}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {l.source} · {l.records} records · uploaded by {uploader?.fullName} on{" "}
                    {fmtDate(l.uploadedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {l.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  {canUpload ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = l.visibility === "public" ? "private" : "public";
                          update((d) => {
                            const x = d.leads.find((y) => y.id === l.id);
                            if (x) x.visibility = next;
                          });
                          log("Lead dataset visibility changed", `${l.name} → ${next}`);
                          if (next === "public")
                            state.users
                              .filter((u) => u.role === "member")
                              .forEach((u) =>
                                notify(u.id, "New lead data published", l.name, "/leads"),
                              );
                          toast.success(`Dataset set to ${next}`);
                        }}
                      >
                        Make {l.visibility === "public" ? "private" : "public"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          update((d) => {
                            const x = d.leads.find((y) => y.id === l.id);
                            if (x) x.locked = !x.locked;
                          });
                          log(l.locked ? "Lead dataset unlocked" : "Lead dataset locked", l.name);
                          toast.success(l.locked ? "Dataset unlocked for edits" : "Dataset locked");
                        }}
                      >
                        {l.locked ? <LockOpen /> : <Lock />} {l.locked ? "Unlock" : "Lock"}
                      </Button>
                    </div>
                  ) : l.locked ? (
                    <p className="mt-4 text-xs text-muted-foreground">
                      View only — this dataset is locked.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {!canUpload && (
        <p className="mt-6 text-xs text-muted-foreground">
          Private datasets are hidden from team members by design.
        </p>
      )}
    </>
  );
}

function UploadDialog() {
  const { me, update, log } = useApp();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    source: "",
    visibility: "private",
    locked: "locked",
    records: "0",
    tags: "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Upload dataset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Upload lead dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ld-name">Dataset name</Label>
            <Input
              id="ld-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ld-desc">Description</Label>
            <Textarea
              id="ld-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ld-file">File (CSV, XLSX, XLS, PDF, DOCX, image, TXT)</Label>
            <Input
              id="ld-file"
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.docx,.txt,image/*"
              onChange={(e) => setForm({ ...form, source: e.target.files?.[0]?.name ?? "" })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ld-link">Or external link</Label>
            <Input
              id="ld-link"
              placeholder="https://"
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={form.visibility}
                onValueChange={(v) => setForm({ ...form, visibility: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (admins only)</SelectItem>
                  <SelectItem value="public">Public (all team members)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Edit setting</Label>
              <Select value={form.locked} onValueChange={(v) => setForm({ ...form, locked: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locked">Locked (view only)</SelectItem>
                  <SelectItem value="open">Open for edits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-records">Number of records</Label>
              <Input
                id="ld-records"
                type="number"
                min="0"
                value={form.records}
                onChange={(e) => setForm({ ...form, records: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-tags">Tags (comma separated)</Label>
              <Input
                id="ld-tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!form.name.trim() || !form.source.trim()}
            onClick={() => {
              update((d) => {
                d.leads.unshift({
                  id: newId(),
                  name: form.name,
                  description: form.description,
                  source: form.source,
                  uploadedById: me!.id,
                  uploadedAt: isoNow(),
                  visibility: form.visibility as "public" | "private",
                  locked: form.locked === "locked",
                  records: Number(form.records) || 0,
                  tags: form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              });
              log("Lead dataset uploaded", `${form.name} (${form.visibility})`);
              toast.success("Dataset uploaded");
              setOpen(false);
            }}
          >
            Upload dataset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
