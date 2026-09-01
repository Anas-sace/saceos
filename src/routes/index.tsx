import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/sace-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — SACE Portal" },
      {
        name: "description",
        content:
          "Sign in to SACE Portal to punch in, manage tasks, leave, leads and support tickets.",
      },
      { property: "og:title", content: "Sign in — SACE Portal" },
      {
        property: "og:description",
        content: "Secure sign in for SACE Group employees and administrators.",
      },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { login, me } = useApp();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (me) navigate({ to: "/dashboard", replace: true });
  }, [me, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(identifier, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Unable to sign in.");
      return;
    }
    setError(null);
    toast.success("Welcome back to SACE Portal");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="w-fit rounded-2xl bg-white px-5 py-4">
          <img
            src={logo.url}
            alt="South Australian College of English"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            One calm workspace for the whole workforce.
          </h2>
          <p className="mt-4 text-sidebar-foreground/70">
            Attendance and punch-in, assigned work with proof, leave approvals, shared leads,
            internal messaging, support tickets, progress reports and recognition.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">© SACE Group · Internal use only</p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <img
              src={logo.url}
              alt="South Australian College of English"
              className="h-9 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your SACE username or work email address.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or email</Label>
              <Input
                id="identifier"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or you@sacegroup.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Demo Quick Sign-In
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                id="demo-superadmin-btn"
                onClick={() => {
                  setIdentifier("superadmin");
                  setPassword("password");
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Super Admin
              </button>
              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => {
                  setIdentifier("admin");
                  setPassword("password");
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Admin (Marcus)
              </button>
              <button
                type="button"
                id="demo-member-btn"
                onClick={() => {
                  setIdentifier("anas");
                  setPassword("password");
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Team Member (Anas)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
