import { saveCheckoutSettings } from "@/lib/actions/checkout-settings-actions";
import { getDefaultCheckoutSettings } from "@/lib/checkout";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCheckoutSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checkout_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  const settings = data ?? getDefaultCheckoutSettings();

  return (
    <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="border-b border-warm-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">
          Checkout
        </p>
        <h2 className="font-heading mt-2 text-3xl font-bold text-warm-900">
          Checkout Settings
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-warm-600">
          Configure who receives order emails and control the email templates sent through Resend.
          Available placeholders: <code>{"{{customer_name}}"}</code>, <code>{"{{customer_first_name}}"}</code>, <code>{"{{customer_last_name}}"}</code>, <code>{"{{customer_email}}"}</code>,
          <code>{"{{customer_phone}}"}</code>, <code>{"{{shipping_address}}"}</code>, <code>{"{{shipping_address_html}}"}</code>,
          <code>{"{{order_id}}"}</code>, <code>{"{{order_lines}}"}</code>, <code>{"{{order_items_html}}"}</code>, <code>{"{{logo_url}}"}</code>, and <code>{"{{total_items}}"}</code>.
        </p>
      </div>

      <form action={saveCheckoutSettings} className="mt-8 space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">Order Recipient Emails</span>
          <textarea
            name="order_notification_emails"
            defaultValue={settings.order_notification_emails.join("\n")}
            rows={4}
            placeholder={"orders@example.com\nowner@example.com"}
            className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
          <span className="text-xs text-warm-500">
            Add one email per line or separate them with commas.
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">Order Email Template</span>
          <textarea
            name="order_email_template"
            defaultValue={settings.order_email_template}
            rows={14}
            className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 font-mono text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
        </label>

        <div className="border-t border-warm-100 pt-6">
          <h3 className="font-heading text-2xl font-semibold text-warm-900">
            Customer Confirmation Email
          </h3>
          <p className="mt-2 text-sm leading-6 text-warm-600">
            This email is sent to the customer after their order enquiry is submitted.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">Customer Email Subject</span>
          <input
            name="customer_email_subject"
            defaultValue={settings.customer_email_subject}
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">Customer Email Template</span>
          <textarea
            name="customer_email_template"
            defaultValue={settings.customer_email_template}
            rows={18}
            className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 font-mono text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
        </label>

        <div className="border-t border-warm-100 pt-6">
          <h3 className="font-heading text-2xl font-semibold text-warm-900">
            Payment Details
          </h3>
          <p className="mt-2 text-sm leading-6 text-warm-600">
            These bank account details will be included in every invoice sent to customers.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">UK Bank Account Details</span>
          <textarea
            name="bank_account_details"
            defaultValue={settings.bank_account_details ?? ""}
            rows={6}
            placeholder={"Account Name: Aakruti Ltd\nSort Code: 00-00-00\nAccount Number: 12345678\nBank: Barclays"}
            className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 font-mono text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
          <span className="text-xs text-warm-500">
            Displayed verbatim in the invoice email sent to customers.
          </span>
        </label>

        <div className="border-t border-warm-100 pt-4">
          <button
            type="submit"
            className="rounded-xl bg-warm-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-warm-800"
          >
            Save Checkout Settings
          </button>
        </div>
      </form>
    </section>
  );
}
