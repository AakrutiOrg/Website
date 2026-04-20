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
SUPABASE_SERVICE_ROLE_KEY=      # server-only, admin operations
RESEND_API_KEY=                  # email notifications on checkout
RESEND_FROM_EMAIL=               # sender address for Resend emails
SUMUP_API_KEY=                   # SumUp personal access token (developer.sumup.com)
SUMUP_MERCHANT_CODE=             # SumUp merchant code
SUMUP_SOLO_READER_ID=            # SumUp Solo terminal reader ID
```

`getOptionalSumUpEnv()` (`src/lib/env.ts`) returns `null` if any SumUp var is missing — the POS page degrades gracefully, disabling the card option while keeping cash sales available.

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

`checkout_settings` row (`id = "default"`) fields: `order_notification_emails`, `order_email_template`, `customer_email_subject`, `customer_email_template`, `bank_account_details` (used in invoices).

### Order lifecycle

`OrderStatus`: `pending` → `confirmed` → `contacted` → `fulfilled` | `cancelled` | `closed`

`DeliveryType`: `"tracked"` | `"home_delivery"`

Sending an invoice auto-transitions `pending`/`confirmed` → `contacted`.

**Order ID duality:** `Order.id` is the UUID used for DB joins and server actions. `Order.order_id` is the human-readable reference (e.g. `AKR-001`) used in URLs, emails, and UI.

### Admin order actions

`src/lib/actions/order-actions.ts` — server actions for post-order operations: `fulfillOrder`, `cancelOrder`, `sendInvoice`, `generateInvoiceHtml` (also contains the fulfillment and cancellation email builders).

`app/admin/(protected)/actions.ts` — additional admin-scoped server actions (separate from `src/lib/actions/`).

### Email flows (all via Resend)

1. **Order notification** — to store owners on checkout (plain-text template from `checkout_settings`)
2. **Customer confirmation** — to buyer on checkout (HTML template from `checkout_settings`)
3. **Fulfillment** — to buyer when `fulfillOrder` is called
4. **Cancellation** — to buyer when `cancelOrder` is called
5. **Invoice** — to buyer when `sendInvoice` is called; includes pricing, discount, and bank transfer details

All HTML emails embed the logo as a CID inline attachment read from `public/logo.png`. Email failures in fulfillment and cancellation are swallowed so they don't block the DB update.

### POS system

`app/admin/(protected)/pos/` — in-person Point of Sale for UK market.

- Product catalogue is queried directly from `product_catalog_market_view` filtered to `market_code = 'UK'`.
- Sales use `src/lib/actions/pos-actions.ts` server actions: `createPosSale` and `syncPosPaymentStatus`.
- POS orders are stored in the same `orders` table with `sale_channel = 'pos'`.
- **Cash payments** — order created immediately with `payment_status = 'paid'`, `status = 'closed'`.
- **SumUp Solo payments** — order created with `payment_status = 'pending'`; `createSumUpReaderCheckout` sends payment to the terminal via `/v0.1/merchants/{code}/readers/{id}/checkout`; the dashboard polls `syncPosPaymentStatus` every 5 s until `SUCCESSFUL` or `FAILED`.
- Receipt email sent via Resend if the customer provides an email address.
- Discounts (percentage or fixed £) are supported; stored on the order as `discount_type` / `discount_amount`.
- POS orders appear in the Orders admin list with an amber **POS** badge; use the **Source** filter (Online / POS) to narrow the view.

`Order.sale_channel`: `'online'` | `'pos'`
`Order.payment_method`: `'cash'` | `'sumup_solo'` | `'bank_transfer'`
`Order.payment_status`: `'pending'` | `'paid'` | `'failed'`

POS order ID format: `AKR-POS-YYYYMMDD-XXXX`

### Additional API routes

- `POST /api/address/autocomplete`, `GET /api/address/get` — address lookup used by the checkout form.
- `GET /api/admin/orders/[id]/invoice` — renders invoice HTML for admin preview.
- `POST /api/pos/checkout` — lightweight POS checkout (cash or card; created in addition to the server-action path).
- `POST /api/pos/sumup/initiate`, `GET /api/pos/sumup/status` — SumUp terminal helpers.

### Admin authentication

`src/lib/auth/admin.ts` exports `requireAdmin()` — call it at the top of admin Server Components to enforce that the Supabase session user has `role = "admin"` in the `profiles` table. Redirects to `/admin/login` on failure. Admin Server Actions live in `src/lib/actions/`.

### Client-side providers

`app/providers.tsx` wraps the app in `GlobalLoadingProvider` (navigation/form loading state) and `CartProvider`. Both are client components.

### Path aliases

`@/` maps to `src/` (configured in `tsconfig.json`). App-level imports from `app/` use relative paths.
