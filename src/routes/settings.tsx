import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { AppShell, Initials, PageHeader, roleLabel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SACE Portal" },
      {
        name: "description",
        content: "Update your SACE Portal profile, photo, daily vision and password.",
      },
      { property: "og:title", content: "Settings — SACE Portal" },
      { property: "og:description", content: "Personal profile and portal preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

/** Downscale a picked image to a small square data URL so it can be stored on the profile. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image");
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  return canvas.toDataURL("image/jpeg", 0.82);
}

function SettingsPage() {
  const { me, saveUser, log } = useApp();
  const [fullName, setFullName] = React.useState(me!.fullName);
  const [email, setEmail] = React.useState(me!.email);
  const [designation, setDesignation] = React.useState(me!.designation);
  const [vision, setVision] = React.useState(me!.dailyVision ?? "");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const avatarUrl = await toAvatarDataUrl(file);
      const res = await saveUser({ userId: me!.id, avatarUrl });
      if (!res.ok) throw new Error(res.error ?? "Could not save the photo");
      log("avatar_updated", "Updated profile photo");
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Your profile and portal preferences." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Initials
                name={me!.fullName}
                color={me!.avatarColor}
                size={48}
                src={me!.avatarUrl ?? null}
              />
              <div>
                <p className="font-semibold">{me!.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {roleLabel(me!.role)} · @{me!.username}
                </p>
              </div>
              <div className="ml-auto">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void pickAvatar(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="mr-1 h-4 w-4" /> Change photo
                </Button>
              </div>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const res = await saveUser({
                  userId: me!.id,
                  fullName: fullName.trim(),
                  email: email.trim(),
                  designation: designation.trim(),
                  dailyVision: vision.trim() || null,
                });
                setBusy(false);
                if (!res.ok) {
                  toast.error(res.error ?? "Could not save your profile");
                  return;
                }
                log("profile_updated", "Updated own profile");
                toast.success("Profile saved");
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision">Daily vision</Label>
                <Textarea
                  id="vision"
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={busy}>
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-5">
              <p className="font-semibold">Change password</p>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (password.length < 6) {
                    toast.error("Use at least 6 characters");
                    return;
                  }
                  setBusy(true);
                  const res = await saveUser({ userId: me!.id, password });
                  setBusy(false);
                  if (!res.ok) {
                    toast.error(res.error ?? "Could not update the password");
                    return;
                  }
                  setPassword("");
                  log("password_changed", "Changed own password");
                  toast.success("Password updated");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="pwd">New password</Label>
                  <Input
                    id="pwd"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={busy}>
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
