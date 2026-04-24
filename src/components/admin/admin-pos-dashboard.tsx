"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, useTransition } from "react";

import { createPosSale, syncPosPaymentStatus } from "@/lib/actions/pos-actions";
import type { Order, PosCatalogItem, PosDiscountType, PosPaymentMethod } from "@/types";

type BasketLine = {
  productId: string;
  quantity: number;
};

type Props = {
  products: PosCatalogItem[];
  recentSales: Order[];
  sumUpConfigured: boolean;
};

type BasketProduct = PosCatalogItem & {
  quantity: number;
  lineTotal: number;
};

type PosTab = "catalogue" | "checkout" | "history";

function formatCurrency(value: number | null | undefined) {
  return typeof value === "number" ? `£${value.toFixed(2)}` : "—";
}

export function AdminPosDashboard({ products, recentSales, sumUpConfigured }: Props) {
  const router = useRouter();
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [query, setQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("sumup_solo");
  const [discountType, setDiscountType] = useState<PosDiscountType | "none">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isPending, startAction] = useTransition();
  const [activeTab, setActiveTab] = useState<PosTab>("catalogue");
  const [toastMessage, setToastMessage] = useState<{
    customerName?: string;
    customerEmail?: string;
    paymentMethod?: string;
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.product_id, product])), [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.category_name]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  const basketItems = useMemo(() => {
    return basket.reduce<BasketProduct[]>((items, line) => {
      const product = productMap.get(line.productId);
      if (!product) return items;

      items.push({
        ...product,
        quantity: line.quantity,
        lineTotal: (product.price ?? 0) * line.quantity,
      });

      return items;
    }, []);
  }, [basket, productMap]);

  const basketSubtotal = basketItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const basketQuantity = basketItems.reduce((sum, item) => sum + item.quantity, 0);

  const parsedDiscount = parseFloat(discountValue) || 0;
  const discountSaving = (() => {
    if (discountType === "none" || parsedDiscount <= 0) return 0;
    if (discountType === "percentage") return basketSubtotal * (parsedDiscount / 100);
    return Math.min(parsedDiscount, basketSubtotal);
  })();
  const basketTotal = Math.max(0, basketSubtotal - discountSaving);

  useEffect(() => {
    if (!pendingOrderId || pollCount >= 24) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await syncPosPaymentStatus(pendingOrderId);
      setPollCount((count) => count + 1);

      if (result.paymentStatus === "paid") {
        setFeedback({ type: "success", text: result.message });
        setToastMessage({
          customerName: result.customerName,
          customerEmail: result.customerEmail,
          paymentMethod: result.paymentMethod,
        });
        setPendingOrderId(null);
        startTransition(() => {
          router.refresh();
          setActiveTab("catalogue");
        });
        return;
      }

      if (result.paymentStatus === "failed") {
        setFeedback({ type: "error", text: result.message });
        setPendingOrderId(null);
        startTransition(() => router.refresh());
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [pendingOrderId, pollCount, router]);

  function addToBasket(productId: string) {
    const product = productMap.get(productId);
    if (!product || product.stock_quantity <= 0) {
      return;
    }

    setBasket((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(line.quantity + 1, product.stock_quantity) }
            : line,
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
  }

  function updateBasketQuantity(productId: string, nextQuantity: number) {
    const product = productMap.get(productId);
    if (!product) {
      return;
    }

    if (nextQuantity <= 0) {
      setBasket((current) => current.filter((line) => line.productId !== productId));
      return;
    }

    setBasket((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(nextQuantity, product.stock_quantity) }
          : line,
      ),
    );
  }

  function clearCheckoutForm() {
    setBasket([]);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setPaymentMethod("sumup_solo");
    setDiscountType("none");
    setDiscountValue("");
  }

  function submitSale() {
    setFeedback(null);

    startAction(async () => {
      try {
        const result = await createPosSale({
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          items: basket.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          paymentMethod,
          discountType: discountType !== "none" && parsedDiscount > 0 ? discountType : null,
          discountAmount: discountType !== "none" && parsedDiscount > 0 ? parsedDiscount : null,
        });

        if (!result.ok) {
          setFeedback({ type: "error", text: result.message });
          if (result.paymentStatus === "failed") {
            startTransition(() => router.refresh());
          }
          return;
        }

        clearCheckoutForm();

        if (result.paymentStatus === "pending" && result.orderId) {
          setPendingOrderId(result.orderId);
          setPollCount(0);
          setFeedback({ type: "info", text: `${result.message} Reference: ${result.orderId}` });
          startTransition(() => router.refresh());
          return;
        }

        setPendingOrderId(null);
        setFeedback({ type: "success", text: `${result.message} Reference: ${result.orderId}` });
        if (result.paymentStatus === "paid") {
          setToastMessage({
            customerName: result.customerName,
            customerEmail: result.customerEmail,
            paymentMethod: result.paymentMethod,
          });
        }
        startTransition(() => {
          router.refresh();
          setActiveTab("catalogue");
        });
      } catch (error) {
        setFeedback({
          type: "error",
          text: error instanceof Error ? error.message : "The POS sale could not be completed.",
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Catalogue section                                                    */
  /* ------------------------------------------------------------------ */
  const catalogueSection = (
    <div className="rounded-2xl border border-warm-200 bg-white shadow-sm">
      <div className="border-b border-warm-100 px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">UK Market</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-warm-900 sm:text-3xl">POS Catalogue</h2>
            <p className="mt-1 hidden text-sm text-warm-500 sm:block">
              One-click add for in-store checkout.
            </p>
          </div>
          <label className="block">
            <span className="sr-only">Search products</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search items or category"
              className="w-full rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:bg-white focus:ring-2 focus:ring-brass-100 sm:w-64"
            />
          </label>
        </div>
      </div>

      <div className="overflow-y-auto p-3 sm:p-4 lg:max-h-[42rem]">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {visibleProducts.map((product) => {
            const lowStock = product.stock_quantity <= product.low_stock_threshold;
            const outOfStock = product.stock_quantity <= 0;

            return (
              <article
                key={product.product_id}
                className="flex gap-3 rounded-2xl border border-warm-100 bg-warm-50/70 p-3 sm:gap-4 sm:p-4"
              >
                {product.primary_image_url ? (
                  <Image
                    src={product.primary_image_url}
                    alt={product.name}
                    width={72}
                    height={72}
                    className="h-16 w-16 shrink-0 rounded-xl bg-white object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-white sm:h-20 sm:w-20" />
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-warm-900">{product.name}</p>
                      <p className="mt-0.5 truncate text-xs uppercase tracking-[0.2em] text-warm-500">{product.category_name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-semibold text-warm-900">{formatCurrency(product.price)}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${outOfStock ? "text-red-600" : lowStock ? "text-amber-600" : "text-brass-700"}`}>
                        Stock {product.stock_quantity}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <div className="text-xs text-warm-500">
                      {outOfStock ? "Unavailable" : lowStock ? "Low stock" : "Ready"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addToBasket(product.product_id);
                      }}
                      disabled={outOfStock}
                      className="rounded-xl bg-warm-900 px-3 py-2 text-sm font-semibold text-white transition active:scale-95 hover:bg-warm-800 disabled:cursor-not-allowed disabled:bg-warm-300 sm:px-4"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* Checkout section (basket + payment form)                             */
  /* ------------------------------------------------------------------ */
  const checkoutSection = (
    <div className="space-y-4 sm:space-y-6">
      {/* Basket */}
      <section className="rounded-2xl border border-warm-200 bg-white shadow-sm">
        <div className="border-b border-warm-100 px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">Checkout Basket</p>
          <h3 className="font-heading mt-2 text-2xl font-bold text-warm-900">
            {basketQuantity} item{basketQuantity === 1 ? "" : "s"}
          </h3>
        </div>

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
          {basketItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-warm-200 bg-warm-50 px-4 py-6 text-center text-sm text-warm-500">
              Tap an item in the catalogue to start the sale.
            </p>
          ) : (
            basketItems.map((item) => (
              <div key={item.product_id} className="rounded-2xl border border-warm-100 bg-warm-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-warm-900">{item.name}</p>
                    <p className="mt-1 text-sm text-warm-500">{formatCurrency(item.price)} each</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateBasketQuantity(item.product_id, 0)}
                    className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateBasketQuantity(item.product_id, item.quantity - 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-200 bg-white text-lg text-warm-700 transition active:scale-95 hover:border-brass-400 hover:text-brass-700"
                    >
                      −
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold text-warm-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateBasketQuantity(item.product_id, item.quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-200 bg-white text-lg text-warm-700 transition active:scale-95 hover:border-brass-400 hover:text-brass-700"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-warm-900">{formatCurrency(item.lineTotal)}</p>
                </div>
              </div>
            ))
          )}

          <div className="rounded-2xl bg-warm-900 px-5 py-4 text-white space-y-1">
            {discountSaving > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-warm-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(basketSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-amber-300">
                  <span>Discount</span>
                  <span>−{formatCurrency(discountSaving)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-sm text-warm-100">
              <span>Sale total</span>
              <span className="text-xl font-bold text-white">{formatCurrency(basketTotal)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Payment form */}
      <section className="rounded-2xl border border-warm-200 bg-white shadow-sm">
        <div className="border-b border-warm-100 px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">Payment</p>
          <h3 className="font-heading mt-2 text-2xl font-bold text-warm-900">Complete POS Sale</h3>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-warm-800">Customer Name</span>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              placeholder="Walk-in customer"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-warm-800">Customer Email</span>
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              placeholder="customer@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-warm-800">Customer Phone</span>
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              placeholder="+44..."
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-warm-800">Discount</span>
            <div className="flex gap-2">
              {(["none", "percentage", "absolute"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setDiscountType(type); if (type === "none") setDiscountValue(""); }}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:px-3 ${discountType === type ? "bg-brass-600 text-white" : "border border-warm-200 text-warm-700 hover:border-brass-400 hover:text-brass-700"}`}
                >
                  {type === "none" ? "None" : type === "percentage" ? "% Off" : "£ Off"}
                </button>
              ))}
            </div>
            {discountType !== "none" && (
              <input
                type="number"
                min="0"
                step={discountType === "percentage" ? "1" : "0.01"}
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g. 10 for 10%" : "e.g. 5.00"}
                className="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              />
            )}
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium text-warm-800">Payment Method</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border py-6 transition ${
                  paymentMethod === "cash"
                    ? "border-brass-500 bg-brass-50 ring-1 ring-brass-500"
                    : "border-warm-200 bg-white hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                <div className={paymentMethod === "cash" ? "text-brass-700" : "text-warm-500"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                </div>
                <p className="font-semibold text-warm-900">Cash</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("sumup_solo")}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border py-6 transition ${
                  paymentMethod === "sumup_solo"
                    ? "border-brass-500 bg-brass-50 ring-1 ring-brass-500"
                    : "border-warm-200 bg-white hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                <div className={paymentMethod === "sumup_solo" ? "text-brass-700" : "text-warm-500"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <p className="font-semibold text-warm-900">Card</p>
                {!sumUpConfigured && (
                  <span className="absolute right-3 top-3 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600">
                    No Config
                  </span>
                )}
              </button>
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "bg-brass-50 text-brass-800"
                  : feedback.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {feedback.text}
            </div>
          )}

          {pendingOrderId && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-700">
              Waiting for payment on the Solo terminal for <span className="font-semibold">{pendingOrderId}</span>.
              Checking status automatically every few seconds.
            </div>
          )}

          <button
            type="button"
            onClick={submitSale}
            disabled={isPending || basketItems.length === 0 || (paymentMethod === "sumup_solo" && !sumUpConfigured)}
            className="w-full rounded-xl bg-warm-900 px-5 py-4 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-warm-800 disabled:cursor-not-allowed disabled:bg-warm-300 sm:py-3"
          >
            {isPending ? "Processing Sale..." : paymentMethod === "cash" ? "Take Cash Payment" : "Send to SumUp Solo"}
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Mobile tab bar — Sale | History (hidden on lg+)                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="sticky top-0 z-10 -mx-4 flex border-b border-warm-200 bg-white px-4 shadow-sm sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveTab("catalogue")}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            activeTab === "catalogue"
              ? "border-b-2 border-warm-900 text-warm-900"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          Catalogue
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("checkout")}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            activeTab === "checkout"
              ? "border-b-2 border-warm-900 text-warm-900"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          Checkout
          {basketQuantity > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-600 px-1.5 text-xs font-bold text-white">
              {basketQuantity}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            activeTab === "history"
              ? "border-b-2 border-warm-900 text-warm-900"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          History
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Sale tab — catalogue + checkout (always visible on lg+)           */}
      {/* ---------------------------------------------------------------- */}
      <section className={activeTab !== "catalogue" ? "hidden" : ""}>
        {catalogueSection}
      </section>

      <section className={activeTab !== "checkout" ? "hidden" : ""}>
        {checkoutSection}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* History tab — recent sales (always visible on lg+)               */}
      {/* ---------------------------------------------------------------- */}
      <section className={`rounded-2xl border border-warm-200 bg-white shadow-sm ${activeTab !== "history" ? "hidden" : ""}`}>
        <div className="flex flex-col gap-3 border-b border-warm-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">History</p>
            <h3 className="font-heading mt-2 text-2xl font-bold text-warm-900">Recent POS Sales</h3>
          </div>
          <p className="text-sm text-warm-500">In-person orders saved under the shared order system.</p>
        </div>

        {recentSales.length === 0 ? (
          <div className="p-10 text-center text-sm text-warm-500">No POS sales yet.</div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-warm-100 sm:hidden">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-warm-900">{sale.order_id}</p>
                    <p className="mt-0.5 truncate font-medium text-warm-900">{sale.customer_name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${sale.payment_status === "paid" ? "text-brass-700" : sale.payment_status === "failed" ? "text-red-600" : "text-blue-600"}`}>
                        {sale.payment_status}
                      </span>
                      <span className="text-xs text-warm-400">·</span>
                      <span className="text-xs text-warm-500 capitalize">{sale.payment_method?.replaceAll("_", " ") ?? "—"}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-warm-900">{formatCurrency(sale.subtotal)}</p>
                    <p className="mt-0.5 text-xs text-warm-500">
                      {new Date(sale.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <Link
                    href={`/admin/orders/${sale.order_id}`}
                    className="ml-2 shrink-0 rounded-lg border border-warm-200 px-3 py-2 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>

            {/* Desktop/tablet table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-100 bg-warm-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Sale</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Items</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Payment</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Total</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-warm-50/50">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-warm-900">{sale.order_id}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-warm-900">{sale.customer_name}</p>
                        {sale.email && <p className="text-xs text-warm-500">{sale.email}</p>}
                      </td>
                      <td className="px-5 py-4 text-warm-700">{sale.total_items}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium capitalize text-warm-900">{sale.payment_method?.replaceAll("_", " ") ?? "—"}</p>
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sale.payment_status === "paid" ? "text-brass-700" : sale.payment_status === "failed" ? "text-red-600" : "text-blue-600"}`}>
                          {sale.payment_status}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-warm-900">{formatCurrency(sale.subtotal)}</td>
                      <td className="px-5 py-4 text-warm-600">
                        {new Date(sale.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/orders/${sale.order_id}`}
                          className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-2xl border border-brass-200 bg-brass-50 p-4 shadow-lg animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-brass-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-brass-900">Payment Successful ({toastMessage.paymentMethod || "Card"})</p>
              <p className="text-sm text-brass-800">
                {toastMessage.customerEmail
                  ? `Receipt sent to ${toastMessage.customerEmail} for ${toastMessage.customerName || "Customer"}.`
                  : `Order placed for ${toastMessage.customerName || "Customer"}.`}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-brass-500 hover:text-brass-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
