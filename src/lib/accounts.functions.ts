import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Role } from "./types";

type AuthedContext = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
};

async function isSuperAdmin(context: AuthedContext) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  return data === true;
}

export interface CreateAccountInput {
  fullName: string;
  email: string;
  password: string;
  designation: string;
  department: string;
  role: Role;
  reportingAdminId: string | null;
  avatarColor: string;
}

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateAccountInput) => data)
  .handler(async ({ data, context }) => {
    if (!(await isSuperAdmin(context as unknown as AuthedContext))) {
      throw new Error("Only a Super Admin can create accounts");
    }
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Enter a valid email address");
    if (data.password.trim().length < 6) throw new Error("Password must be at least 6 characters");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Unique username derived from the email local part.
    const base = (email.split("@")[0] ?? email).replace(/[^a-z0-9._-]/g, "") || "user";
    let username = base;
    for (let i = 1; i < 50; i += 1) {
      const { data: taken } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (!taken) break;
      username = `${base}${i}`;
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Could not create the sign-in account");
    }
    const id = created.data.user.id;

    const profile = await supabaseAdmin.from("profiles").insert({
      id,
      email,
      username,
      full_name: data.fullName.trim(),
      designation: data.designation.trim() || "Team Member",
      department: data.department.trim() || "General",
      reporting_admin_id: data.reportingAdminId,
      avatar_color: data.avatarColor,
      active: true,
    } as never);
    if (profile.error) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      throw new Error(profile.error.message);
    }

    const role = await supabaseAdmin.from("user_roles").insert({ user_id: id, role: data.role });
    if (role.error) throw new Error(role.error.message);

    return { id, username, email };
  });

export interface SaveAccountInput {
  userId: string;
  fullName?: string;
  email?: string;
  designation?: string;
  department?: string;
  dailyVision?: string | null;
  avatarUrl?: string | null;
  reportingAdminId?: string | null;
  casualBalance?: number;
  sickBalance?: number;
  active?: boolean;
  role?: Role;
  password?: string;
}

export const saveAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveAccountInput) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    const superAdmin = await isSuperAdmin(ctx);
    const isSelf = data.userId === ctx.userId;
    if (!superAdmin && !isSelf) throw new Error("You can only edit your own profile");
    if (!superAdmin && (data.role || data.active !== undefined)) {
      throw new Error("Only a Super Admin can change roles or account status");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = {};
    if (data.fullName !== undefined) patch["full_name"] = data.fullName.trim();
    if (data.email !== undefined) patch["email"] = data.email.trim().toLowerCase();
    if (data.designation !== undefined) patch["designation"] = data.designation.trim();
    if (data.department !== undefined) patch["department"] = data.department.trim();
    if (data.dailyVision !== undefined) patch["daily_vision"] = data.dailyVision;
    if (data.avatarUrl !== undefined) patch["avatar_url"] = data.avatarUrl;
    if (data.reportingAdminId !== undefined) patch["reporting_admin_id"] = data.reportingAdminId;
    if (data.casualBalance !== undefined) patch["casual_balance"] = data.casualBalance;
    if (data.sickBalance !== undefined) patch["sick_balance"] = data.sickBalance;
    if (data.active !== undefined) patch["active"] = data.active;

    if (Object.keys(patch).length > 0) {
      patch["updated_at"] = new Date().toISOString();
      const res = await supabaseAdmin
        .from("profiles")
        .update(patch as never)
        .eq("id", data.userId);
      if (res.error) throw new Error(res.error.message);
    }

    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      const res = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (res.error) throw new Error(res.error.message);
    }

    if (data.password) {
      if (data.password.trim().length < 6)
        throw new Error("Password must be at least 6 characters");
      const attrs: { password: string; email?: string } = { password: data.password };
      if (data.email !== undefined) attrs.email = data.email.trim().toLowerCase();
      const res = await supabaseAdmin.auth.admin.updateUserById(data.userId, attrs);
      if (res.error) throw new Error(res.error.message);
    } else if (data.email !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        email: data.email.trim().toLowerCase(),
        email_confirm: true,
      });
    }

    return { ok: true };
  });

export const saveAdminPerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { perms: string[] }) => data)
  .handler(async ({ data, context }) => {
    if (!(await isSuperAdmin(context as unknown as AuthedContext))) {
      throw new Error("Only a Super Admin can change admin visibility");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "admin_perms", value: data.perms }, { onConflict: "key" });
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });
