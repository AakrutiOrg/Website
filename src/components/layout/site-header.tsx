"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Collections", href: "/" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

function BagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" x2="21" y1="6" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Green accent bar */}
      <div className="h-1 bg-gradient-to-r from-warm-900 via-brass-400 to-warm-900" />

      <nav
        className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12"
        aria-label="Main navigation"
      >
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Aakruti"
              width={160}
              height={64}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium tracking-wide text-warm-700 transition-colors hover:text-brass-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right — cart + mobile toggle */}
          <div className="flex items-center gap-4">
            <button
              aria-label="View cart"
              className="hidden text-warm-600 transition-colors hover:text-brass-600 md:block"
            >
              <BagIcon />
            </button>

            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="text-warm-700 transition-colors hover:text-brass-600 md:hidden"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="border-t border-warm-200 bg-white px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-5" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium tracking-wide text-warm-700 transition-colors hover:text-brass-600"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-warm-200" />
            <button
              aria-label="View cart"
              className="flex items-center gap-2 text-sm font-medium text-warm-600 transition-colors hover:text-brass-600"
            >
              <BagIcon />
              <span>Cart</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
