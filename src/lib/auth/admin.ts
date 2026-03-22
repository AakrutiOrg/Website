import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "customer";

type AdminAuthState = {
  role: AppRole | null;
  userId: string | null;
};

export function normalizeAdminNextPath(value?: string | null) {
  if (!value || !value.startsWith("/admin")) {
    return "/admin";
  }

  return value;
}

export function getAdminLoginPath(nextPath = "/admin", reason?: "auth" | "forbidden") {
  const params = new URLSearchParams();
  const normalizedNextPath = normalizeAdminNextPath(nextPath);

  if (normalizedNextPath !== "/admin") {
    params.set("next", normalizedNextPath);
  }

  if (reason) {
    params.set("reason", reason);
  }

  const query = params.toString();

  return query ? `/admin/login?${query}` : "/admin/login";
}

export async function getAdminAuthState(): Promise<AdminAuthState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      role: null,
      userId: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: AppRole }>();

  if (profileError) {
    throw new Error("Unable to verify admin access.");
  }

  return {
    role: profile?.role ?? null,
    userId: user.id,
  };
}

export async function requireAdmin(nextPath = "/admin") {
  const authState = await getAdminAuthState();

  if (!authState.userId) {
    redirect(getAdminLoginPath(nextPath, "auth"));
  }

  if (authState.role !== "admin") {
    redirect(getAdminLoginPath(nextPath, "forbidden"));
  }

  return authState;
}
