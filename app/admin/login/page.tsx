import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminAuthState, normalizeAdminNextPath } from "@/lib/auth/admin";

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    reason?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = normalizeAdminNextPath(params.next);
  const authState = await getAdminAuthState();

  if (authState.role === "admin") {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-warm-100 px-6 py-16">
      <div className="mx-auto max-w-md">
        <AdminLoginForm nextPath={nextPath} reason={params.reason} />
      </div>
    </main>
  );
}
