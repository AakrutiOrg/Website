import { requireAdmin } from "@/lib/auth/admin";

import { AdminHeader } from "./_components/admin-header";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-warm-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <AdminHeader />
        {children}
      </div>
    </main>
  );
}
