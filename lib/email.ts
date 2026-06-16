import { Resend } from "resend";
import { ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";
import { money } from "@/lib/utils";

type EmailLine = {
  product_name_snapshot: string;
  quantity: number;
  line_total: number;
};

type OrderEmailInput = {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  items: EmailLine[];
};

type EmailResult = { sent: boolean; error: string | null; id?: string | null };

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function fromAddress() {
  return process.env.EMAIL_FROM || "Mango Preorders <onboarding@resend.dev>";
}

function senderError() {
  const from = fromAddress();
  if (from.includes("yourdomain.com")) {
    return "EMAIL_FROM is still using the placeholder yourdomain.com. Set it to a verified Resend sender, for example Mango Preorders <orders@oakvillemango.com>.";
  }
  if (!from.includes("@")) {
    return "EMAIL_FROM must include an email address, for example Mango Preorders <orders@oakvillemango.com>.";
  }
  return null;
}

function resendErrorText(error: unknown) {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    return String(record.message ?? record.error ?? record.name ?? JSON.stringify(record));
  }
  return "Email could not be sent.";
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function itemList(items: EmailLine[]) {
  return items
    .map((item) => `<li>${escapeHtml(item.product_name_snapshot)} x ${escapeHtml(item.quantity)} - ${escapeHtml(money(item.line_total))}</li>`)
    .join("");
}

function plainItems(items: EmailLine[]) {
  return items.map((item) => `${item.product_name_snapshot} x ${item.quantity} - ${money(item.line_total)}`).join("\n");
}

export async function sendCustomerSignupCodeEmail(input: { customerEmail: string; code: string }): Promise<EmailResult> {
  const resend = resendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY is missing." };
  const invalidSender = senderError();
  if (invalidSender) return { sent: false, error: invalidSender };

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937">
      <h1 style="color:#183416">Your Mango Preorders code</h1>
      <p>Use this code to create your account:</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:4px;color:#183416">${escapeHtml(input.code)}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
  const text = `Your Mango Preorders code is ${input.code}. This code expires in 10 minutes.`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: input.customerEmail,
      subject: "Your Mango Preorders code",
      html,
      text
    });

    if (error) return { sent: false, error: resendErrorText(error) };
    return { sent: true, error: null, id: data?.id ?? null };
  } catch (error) {
    return { sent: false, error: resendErrorText(error) };
  }
}

async function sendCustomerEmail(input: OrderEmailInput & { subject: string; htmlIntro: string; textIntro: string }): Promise<EmailResult> {
  if (!input.customerEmail) return { sent: false, error: "Customer email is missing." };

  const resend = resendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY is missing." };
  const invalidSender = senderError();
  if (invalidSender) return { sent: false, error: invalidSender };

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937">
      <h1 style="color:#183416">${escapeHtml(input.subject)}</h1>
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>${escapeHtml(input.htmlIntro)}</p>
      <p><strong>Order ID:</strong> ${escapeHtml(input.orderNumber)}</p>
      <ul>${itemList(input.items)}</ul>
      <p><strong>Total:</strong> ${escapeHtml(money(input.totalAmount))}</p>
      <p><strong>E-transfer:</strong> ${escapeHtml(ETRANSFER_EMAIL)}</p>
      <p><strong>Pickup:</strong> ${escapeHtml(PICKUP_ADDRESS)}</p>
    </div>
  `;

  const text = [
    `Hi ${input.customerName},`,
    input.textIntro,
    `Order ID: ${input.orderNumber}`,
    plainItems(input.items),
    `Total: ${money(input.totalAmount)}`,
    `E-transfer: ${ETRANSFER_EMAIL}`,
    `Pickup: ${PICKUP_ADDRESS}`
  ].join("\n\n");

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: input.customerEmail,
      subject: input.subject,
      html,
      text
    });

    if (error) return { sent: false, error: resendErrorText(error) };
    return { sent: true, error: null, id: data?.id ?? null };
  } catch (error) {
    return { sent: false, error: resendErrorText(error) };
  }
}

export function sendOrderReceivedEmail(input: OrderEmailInput) {
  return sendCustomerEmail({
    ...input,
    subject: `Order received: ${input.orderNumber}`,
    htmlIntro: "Thank you for your preorder. We will check your payment and confirm soon.",
    textIntro: "Thank you for your preorder. We will check your payment and confirm soon."
  });
}

export function sendPaymentVerifiedEmail(input: OrderEmailInput) {
  return sendCustomerEmail({
    ...input,
    subject: `Payment verified: ${input.orderNumber}`,
    htmlIntro: "Your payment is verified and your preorder is confirmed.",
    textIntro: "Your payment is verified and your preorder is confirmed."
  });
}

export async function sendAdminTestEmail(input: { to: string }): Promise<EmailResult> {
  const resend = resendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY is missing in Vercel." };
  const invalidSender = senderError();
  if (invalidSender) return { sent: false, error: invalidSender };

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: "Mango Preorders email test",
      html: "<p>Email sending is working for Mango Preorders.</p>",
      text: "Email sending is working for Mango Preorders."
    });
    if (error) return { sent: false, error: resendErrorText(error) };
    return { sent: true, error: null, id: data?.id ?? null };
  } catch (error) {
    return { sent: false, error: resendErrorText(error) };
  }
}

export function emailConfigStatus() {
  return {
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
    from: fromAddress(),
    senderError: senderError()
  };
}
