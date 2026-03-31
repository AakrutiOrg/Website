"use client";

import { CartProvider } from "@/components/providers/cart-provider";
import { GlobalLoadingProvider } from "@/components/providers/global-loading-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalLoadingProvider>
      <CartProvider>{children}</CartProvider>
    </GlobalLoadingProvider>
  );
}
