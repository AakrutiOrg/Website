"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="bg-warm-900 text-warm-400">
      {/* Ornamental top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-brass-700 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/logo.png"
              alt={SITE_NAME}
              width={110}
              height={44}
              className="h-11 w-auto object-contain"
            />
            <p className="mt-5 max-w-sm text-sm leading-7 text-warm-500">
              Authentic handcrafted artifacts, created by skilled artisans
              who carry forward generations of Indian craft tradition.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-warm-200">
              Collections
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/?view=collections"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="transition-colors hover:text-brass-300"
                >
                  All Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-warm-200">
              Info
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-brass-300"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-brass-300"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-warm-800 pt-8 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-warm-600">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-warm-700">
            <span className="text-brass-800">◆</span>
            <span>Crafted with tradition</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
