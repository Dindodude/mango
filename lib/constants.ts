export const ETRANSFER_EMAIL = "idreesrah0@gmail.com";
export const PICKUP_ADDRESS = "3352 Vernon Powell Drive";
export const CONTACT_PHONE_DISPLAY = "905-580-9902";
export const CONTACT_PHONE_E164 = "+19055809902";
export const CONTACT_PHONE_DIGITS = "19055809902";

export const paymentStatuses = [
  "Awaiting Payment",
  "Payment Claimed by Customer",
  "Payment Verified",
  "Payment Issue",
  "Refunded"
] as const;

export const orderStatuses = [
  "Submitted",
  "Confirmed",
  "Ready for Pickup",
  "Completed",
  "Cancelled"
] as const;

export const batchStatuses = ["Draft", "Active", "Closed", "Completed"] as const;

export const productCategories = ["Pakistani Mango", "Indian Mango", "Fruit", "Other"] as const;
