import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

type StockItem = {
  id: string;           // product_market_data_id
  quantity: number;
};

export async function decrementStockForItems(
  supabase: SupabaseAdminClient,
  items: StockItem[],
  marketId: string,
  orderDbId: string,
  orderRef: string,
): Promise<void> {
  // Aggregate quantities by product_market_data id
  const productQuantities = new Map<string, number>();
  for (const item of items) {
    if (item.id) {
      productQuantities.set(item.id, (productQuantities.get(item.id) ?? 0) + item.quantity);
    }
  }

  const pmdIds = [...productQuantities.keys()];
  if (pmdIds.length === 0) return;

  const { data: marketDataRows, error } = await supabase
    .from("product_market_data")
    .select("id, product_id, stock_quantity")
    .eq("market_id", marketId)
    .in("id", pmdIds);

  if (error || !marketDataRows?.length) return;

  const inventoryEvents: {
    source: string;
    product_id: string;
    product_market_data_id: string;
    market_id: string;
    quantity_delta: number;
    change_type: string;
    raw_payload: object;
    processed_at: string;
  }[] = [];

  for (const row of marketDataRows) {
    const qty = productQuantities.get(row.id);
    if (!qty) continue;

    const newStock = Math.max(0, row.stock_quantity - qty);

    await supabase
      .from("product_market_data")
      .update({ stock_quantity: newStock })
      .eq("id", row.id);

    inventoryEvents.push({
      source: "order",
      product_id: row.product_id,
      product_market_data_id: row.id,
      market_id: marketId,
      quantity_delta: -qty,
      change_type: "order_placed",
      raw_payload: { order_db_id: orderDbId, order_ref: orderRef },
      processed_at: new Date().toISOString(),
    });
  }

  if (inventoryEvents.length > 0) {
    await supabase.from("inventory_events").insert(inventoryEvents);
  }
}
