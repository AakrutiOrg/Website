import { cookies } from "next/headers";
import { getMarkets } from "@/services/markets/get-markets";
import type { Market } from "@/types/market";

export const MARKET_COOKIE_NAME = "aakruti_market";
export const DEFAULT_MARKET_CODE = "GB";

/**
 * Resolves the active market globally.
 * Checks for a strictly forced search param or header first, then cookie, passing back to IN fallback.
 * Currently accepts an optional overridden code to simplify searchParams integrations.
 */
export async function getCurrentMarket(forcedCode?: string | null): Promise<Market> {
  const markets = await getMarkets();
  const fallback = markets.find((m) => m.code === DEFAULT_MARKET_CODE) || markets[0];

  if (!markets.length) {
    throw new Error("No markets configured in system.");
  }

  // 1. Explicit argument precedence
  if (forcedCode) {
    const matched = markets.find((m) => m.code === forcedCode.toUpperCase() && m.is_active);
    if (matched) return matched;
  }

  // 2. Cookie fallback
  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(MARKET_COOKIE_NAME)?.value;

  if (cookieCode) {
    const matched = markets.find((m) => m.code === cookieCode.toUpperCase() && m.is_active);
    if (matched) return matched;
  }

  // 3. System fallback
  return fallback;
}
