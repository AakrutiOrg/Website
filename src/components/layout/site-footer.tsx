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
      {/* Brand promise strip */}
      <div className="border-b border-warm-800 bg-warm-900/80">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 text-base text-brass-500">✦</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-200">
                  Artisan Crafted
                </p>
                <p className="mt-1 text-xs leading-5 text-warm-500">
                  Every piece shaped by skilled artisans carrying forward generations of tradition.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="mt-0.5 text-base text-brass-500">✦</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-200">
                  Timeless Materials
                </p>
                <p className="mt-1 text-xs leading-5 text-warm-500">
                  Pure brass and premium fabrics sourced across India for lasting beauty.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="mt-0.5 text-base text-brass-500">✦</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-200">
                  Shaping your Abode
                </p>
                <p className="mt-1 text-xs leading-5 text-warm-500">
                  Carefully packaged and shipped to bring Indian heritage to your home.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ornamental top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-brass-700 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/logo.png"
              alt={SITE_NAME}
              width={100}
              height={40}
              className="h-10 w-auto object-contain"
            />
            <p className="mt-4 max-w-xs text-xs leading-6 text-warm-500">
              Authentic handcrafted artifacts, created by skilled artisans who carry
              forward generations of Indian craft tradition.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-warm-200">
              Collections
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/#collections"
                  className="transition-colors hover:text-brass-300"
                >
                  All Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-warm-200">
              Info
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="#" className="transition-colors hover:text-brass-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-brass-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-warm-800 pt-7 text-center sm:flex-row sm:justify-between">
          <p className="text-[11px] text-warm-700">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-warm-700">
            <span className="text-brass-800">◆</span>
            <span>Crafted with tradition</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
