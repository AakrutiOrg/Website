export default function AdminDashboardPage() {
  return (
    <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-2xl font-semibold text-warm-900">
        Welcome to the admin dashboard
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-warm-600">
        Admin authentication and route protection are now enforced server-side.
        Any future pages added under this protected admin route group will
        inherit the same admin-only access check automatically.
      </p>
    </section>
  );
}
