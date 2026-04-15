"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import {
  DEFAULT_CHECKOUT_TEMPLATE,
  DEFAULT_CUSTOMER_CONFIRMATION_SUBJECT,
  DEFAULT_CUSTOMER_CONFIRMATION_TEMPLATE,
} from "@/lib/checkout";
import { createClient } from "@/lib/supabase/server";

export async function saveCheckoutSettings(formData: FormData) {
  await requireAdmin("/admin/checkout");

  const supabase = await createClient();
  const emailsInput = (formData.get("order_notification_emails") as string) || "";
  const templateInput = (formData.get("order_email_template") as string) || "";
  const customerSubjectInput = (formData.get("customer_email_subject") as string) || "";
  const customerTemplateInput = (formData.get("customer_email_template") as string) || "";
  const bankAccountDetailsInput = (formData.get("bank_account_details") as string) || "";

  const order_notification_emails = emailsInput
    .split(/[\n,]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const invalidEmail = order_notification_emails.find(
    (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  );

  if (invalidEmail) {
    throw new Error(`Invalid recipient email: ${invalidEmail}`);
  }

  const order_email_template = templateInput.trim() || DEFAULT_CHECKOUT_TEMPLATE;
  const customer_email_subject =
    customerSubjectInput.trim() || DEFAULT_CUSTOMER_CONFIRMATION_SUBJECT;
  const customer_email_template =
    customerTemplateInput.trim() || DEFAULT_CUSTOMER_CONFIRMATION_TEMPLATE;

  const { error } = await supabase.from("checkout_settings").upsert(
    {
      id: "default",
      order_notification_emails,
      order_email_template,
      customer_email_subject,
      customer_email_template,
      bank_account_details: bankAccountDetailsInput.trim(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Failed to save checkout settings: ${error.message}`);
  }

  revalidatePath("/admin/checkout");
}
