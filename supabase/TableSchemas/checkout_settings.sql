create table public.checkout_settings (
  id text not null default 'default'::text,
  order_notification_emails text[] not null default '{}'::text[],
  order_email_template text not null default 'New order enquiry from {{customer_name}}

Order ID: {{order_id}}
Email: {{customer_email}}
Phone: {{customer_phone}}
Shipping address:
{{shipping_address}}

Items:
{{order_lines}}

Total items: {{total_items}}'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  customer_email_subject text not null default 'Aakruti: Order Confirmation for your choosen Treasures'::text,
  customer_email_template text not null default '<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;background:#f5fbf5;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#145018;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5fbf5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #c8e6c8;">
            <tr>
              <td style="background:linear-gradient(135deg,#145018,#6da228);padding:28px 24px;text-align:center;">
                <img src="{{logo_url}}" alt="Aakruti" width="150" style="display:block;margin:0 auto 16px auto;width:150px;max-width:100%;height:auto;" />
                <p style="margin:0;font-size:14px;line-height:22px;color:#e8f5e8;">Order Reference</p>
                <p style="margin:8px 0 0 0;font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">{{order_id}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;">
                <p style="margin:0 0 16px 0;font-size:18px;line-height:28px;color:#145018;">Dear {{customer_name}},</p>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:28px;color:#2e7d32;">Thanks for choosing Treasures from Aakruti. Team Aakruti will get back to you on this soon. Have a Tresureful Day.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2f3c0;margin:0 0 24px 0;">
                  <tr>
                    <td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Customer</td>
                    <td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Shipping Address</td>
                  </tr>
                  <tr>
                    <td style="padding:16px;vertical-align:top;font-size:14px;line-height:24px;color:#145018;">
                      <strong>{{customer_name}}</strong><br />
                      {{customer_email}}<br />
                      {{customer_phone}}
                    </td>
                    <td style="padding:16px;vertical-align:top;font-size:14px;line-height:24px;color:#145018;">
                      {{shipping_address_html}}
                    </td>
                  </tr>
                </table>
                <h2 style="margin:0 0 14px 0;font-size:20px;line-height:28px;color:#145018;">Your Chosen Treasures</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;">
                  <tr>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Item</td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Details</td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Qty</td>
                  </tr>
                  {{order_items_html}}
                </table>
                <p style="margin:24px 0 0 0;font-size:14px;line-height:24px;color:#388e3c;">We have safely received your enquiry and our team will contact you shortly.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>'::text,
  bank_account_details text null,
  constraint checkout_settings_pkey primary key (id),
  constraint checkout_settings_singleton_check check ((id = 'default'::text))
) TABLESPACE pg_default;

create trigger trg_checkout_settings_updated_at BEFORE
update on checkout_settings for EACH row
execute FUNCTION set_updated_at ();