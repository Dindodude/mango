import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { parseUuid } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { csvEscape } from "@/lib/utils";

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}

function itemBreakdown(orders: any[]) {
  const totals = new Map<string, number>();
  orders.forEach((order) => {
    order.order_items?.forEach((item: any) => {
      totals.set(item.product_name_snapshot, (totals.get(item.product_name_snapshot) ?? 0) + Number(item.quantity));
    });
  });
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, quantity]) => `${quantity} ${name}`)
    .join("; ");
}

function orderItems(order: any) {
  return order.order_items?.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`).join("; ") ?? "";
}

export async function GET(request: Request, context: { params: Promise<{ type: string }> }) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const params = await context.params;
  const exportType = params.type;

  if (!["all", "unpaid", "batch-paid"].includes(exportType)) {
    return new NextResponse("Unknown export type", { status: 404 });
  }

  if (exportType === "batch-paid") {
    const rawBatchId = new URL(request.url).searchParams.get("batchId");
    let batchId = "";
    try {
      batchId = rawBatchId ? parseUuid(rawBatchId, "batch ID") : "";
    } catch {
      return new NextResponse("Invalid batchId", { status: 400 });
    }
    if (!batchId) return new NextResponse("Missing batchId", { status: 400 });

    const { data: batch } = await supabase.from("batches").select("batch_code,batch_name").eq("id", batchId).maybeSingle();
    const { data: orders } = await supabase
      .from("orders")
      .select("*,order_items(product_name_snapshot,quantity,line_total,line_profit)")
      .eq("batch_id", batchId)
      .eq("payment_status", "Payment Verified")
      .neq("order_status", "Cancelled")
      .order("created_at", { ascending: false });

    const paidOrders = orders ?? [];
    const totalMoney = paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalProfit = paidOrders.reduce((sum, order) => sum + Number(order.total_profit), 0);
    const totalQuantity = paidOrders.reduce(
      (sum, order) => sum + (order.order_items ?? []).reduce((itemSum: number, item: any) => itemSum + Number(item.quantity), 0),
      0
    );
    const breakdown = itemBreakdown(paidOrders);

    let csv = "summary,value\n";
    csv += [
      ["batch", batch?.batch_name ?? ""],
      ["paid_orders", paidOrders.length],
      ["total_money", totalMoney],
      ["total_profit", totalProfit],
      ["total_quantity", totalQuantity],
      ["quantity_breakdown", `${totalQuantity} items${breakdown ? `; ${breakdown}` : ""}`],
      ["item_breakdown", breakdown]
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    csv += "\n\norder_number,customer_name,phone,items,total_amount,total_profit,payment_status,order_status,created_at\n";
    csv += paidOrders
      .map((order) =>
        [
          order.order_number,
          order.customer_name,
          order.phone,
          orderItems(order),
          order.total_amount,
          order.total_profit,
          order.payment_status,
          order.order_status,
          order.created_at
        ].map(csvEscape).join(",")
      )
      .join("\n");

    const fileCode = (batch?.batch_code ?? "batch").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    await logAdminAction({
      adminEmail: admin.email,
      action: "export.batch_paid",
      entityType: "batch",
      entityId: batchId,
      metadata: { paid_orders: paidOrders.length, total_money: totalMoney, total_profit: totalProfit }
    });
    return csvResponse(csv, `${fileCode}-paid-orders.csv`);
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*,batches(batch_name),order_items(product_name_snapshot,quantity,line_total,line_profit)")
    .neq("order_status", "Cancelled")
    .order("created_at", { ascending: false });

  const rows = (orders ?? []).filter((order) => {
    if (exportType === "unpaid") return order.payment_status !== "Payment Verified";
    return true;
  });

  let csv = "order_number,batch,customer_name,phone,items,total_amount,total_cost,total_profit,payment_status,order_status,created_at\n";
  csv += rows
    .map((order) =>
      [
        order.order_number,
        order.batches?.batch_name,
        order.customer_name,
        order.phone,
        orderItems(order),
        order.total_amount,
        order.total_cost,
        order.total_profit,
        order.payment_status,
        order.order_status,
        order.created_at
      ].map(csvEscape).join(",")
    )
    .join("\n");

  await logAdminAction({
    adminEmail: admin.email,
    action: `export.${exportType}`,
    entityType: "orders",
    metadata: { row_count: rows.length }
  });
  return csvResponse(csv, `${exportType}-report.csv`);
}
