# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

There is no test suite configured.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, admin operations
RESEND_API_KEY=               # email notifications on checkout
RESEND_FROM_EMAIL=            # sender address for Resend emails
```

## Architecture

**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth + Storage), Resend (email).

### Directory layout

- `app/` — Next.js pages and route handlers. Co-located `_components/` folders hold page-specific components.
- `app/admin/(protected)/` — Admin panel behind `requireAdmin()` guard; uses a route group layout.
- `src/components/` — Shared components (layout, admin forms, providers).
- `src/lib/` — Utilities, Supabase client factories, server actions, business logic.
- `src/services/` — Pure data-fetching functions (server-side, call Supabase directly).
- `src/types/` — TypeScript types shared across the app.

### Supabase client selection

Three clients exist for distinct contexts — always use the right one:

| File | When to use |
|---|---|
| `src/lib/supabase/browser.ts` | Client components (`"use client"`) |
| `src/lib/supabase/server.ts` | Server components, Route Handlers needing user auth |
| `src/lib/supabase/admin.ts` | Server-only operations that bypass RLS (uses service role key) |

`src/lib/supabase/index.ts` re-exports browser + server clients for convenience.

### Market-aware product catalog

Products are priced and stocked per market. The Supabase view `product_catalog_market_view` joins products with their market-specific pricing/stock. Services in `src/services/products/` query this view. The active market is resolved via `src/lib/market/resolve-market.ts`: explicit code arg → `aakruti_market` cookie → default (`UK`).

### Cart

Cart state lives in `localStorage` (key `aakruti-cart`) and is managed by `CartProvider` (`src/components/providers/cart-provider.tsx`). The `CartItem` type is defined in `src/lib/cart.ts`.

### Checkout flow

`POST /api/checkout` (`app/api/checkout/route.ts`) handles the full checkout:
1. Validates the request body.
2. Inserts an `orders` row and `order_items` rows via the admin Supabase client.
3. Reads `checkout_settings` (row `id = "default"`) for notification email list and templates.
4. Sends an order notification email to store owners and a confirmation email to the customer via Resend.

### Admin authentication

`src/lib/auth/admin.ts` exports `requireAdmin()` — call it at the top of admin Server Components to enforce that the Supabase session user has `role = "admin"` in the `profiles` table. Redirects to `/admin/login` on failure. Admin Server Actions live in `src/lib/actions/`.

### Client-side providers

`app/providers.tsx` wraps the app in `GlobalLoadingProvider` (navigation/form loading state) and `CartProvider`. Both are client components.

### Path aliases

`@/` maps to `src/` (configured in `tsconfig.json`). App-level imports from `app/` use relative paths.
