export type Batch = {
  id: string;
  batch_code: string;
  batch_name: string;
  start_date: string;
  cutoff_date: string;
  expected_arrival_date: string;
  status: "Draft" | "Active" | "Closed" | "Completed";
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  selling_price: number;
  cost_price?: number;
  active: boolean;
  display_order: number;
  created_at: string;
};

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

export type OrderItem = {
  id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_selling_price_snapshot: number;
  unit_cost_price_snapshot?: number;
  line_total: number;
  line_cost?: number;
  line_profit?: number;
};

export type Order = {
  id: string;
  batch_id: string;
  customer_user_id?: string | null;
  customer_id?: string | null;
  order_sequence: number;
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
  phone: string;
  notes: string | null;
  subtotal_amount: number;
  total_amount: number;
  total_cost: number;
  total_profit: number;
  payment_status: string;
  order_status: string;
  payment_reference_notes: string | null;
  admin_notes: string | null;
  order_received_email_sent_at?: string | null;
  payment_verified_email_sent_at?: string | null;
  last_email_error?: string | null;
  created_at: string;
};
