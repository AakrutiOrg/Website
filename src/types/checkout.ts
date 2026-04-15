export type CheckoutSettings = {
  id: "default";
  order_notification_emails: string[];
  order_email_template: string;
  customer_email_subject: string;
  customer_email_template: string;
  bank_account_details: string;
  created_at: string;
  updated_at: string;
};

export type CheckoutCartItem = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  quantity: number;
  stockQuantity: number;
  size?: string | null;
  color?: string | null;
};

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: "United Kingdom";
};
