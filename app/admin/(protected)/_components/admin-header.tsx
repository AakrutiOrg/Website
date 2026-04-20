"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAdmin } from "../actions";

export function AdminHeader() {
  const pathname = usePathname();
  const isPosMode = pathname.startsWith("/admin/pos");

  if (isPosMode) {
    return (
      <header className="flex items-center justify-between rounded-2xl border border-warm-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Image
            src="/logo.png"
            alt="Aakruti"
            width={120}
            height={48}
            className="h-9 w-auto object-contain sm:h-12"
            priority
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">
              Point of Sale
            </p>
            <h1 className="font-heading text-xl font-bold text-warm-900 sm:text-2xl">
              POS
            </h1>
          </div>
        </div>

        <Link
          href="/admin"
          className="rounded-xl bg-warm-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-warm-800 sm:px-4"
        >
          Exit POS
        </Link>
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="Aakruti"
          width={120}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">
            Admin
          </p>
          <h1 className="font-heading text-3xl font-bold text-warm-900">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href="/admin"
          className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
        >
          Overview
        </Link>

        <Link
          href="/admin/products"
          className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
        >
          Products
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
        >
          Categories
        </Link>

        <Link
          href="/admin/pos"
          className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
        >
          POS
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
        >
          Orders
        </Link>

        <Link
          href="/admin/checkout"
          className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
        >
          Checkout
        </Link>

        <form action={signOutAdmin}>
          <button
            type="submit"
            className="rounded-xl bg-warm-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-warm-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
