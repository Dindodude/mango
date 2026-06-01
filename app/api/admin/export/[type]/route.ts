import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { csvEscape } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { type: string } }) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*,batches(batch_name),order_items(product_name_snapshot,quantity,line_total,line_profit)")
    .order("created_at", { ascending: false });

  const rows = (orders ?? []).filter((order) => {
    if (params.type === "unpaid") return order.payment_status !== "Payment Verified";
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
        order.order_items?.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`).join("; "),
        order.total_amount,
        order.total_cost,
        order.total_profit,
        order.payment_status,
        order.order_status,
        order.created_at
      ].map(csvEscape).join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${params.type}-report.csv"`
    }
  });
}
