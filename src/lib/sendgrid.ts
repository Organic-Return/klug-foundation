import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export function isSendGridConfigured(): boolean {
  return !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

export interface LeadEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  leadType: string;
  inquiryType?: string;
  propertyAddress?: string;
  propertyMlsId?: string;
  propertyPrice?: number;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function buildLeadEmailHtml(data: LeadEmailData): string {
  const propertySection = data.propertyAddress
    ? `
      <tr>
        <td style="padding:8px 12px;color:#666;font-size:14px;border-bottom:1px solid #eee;width:140px;">Property</td>
        <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #eee;">
          ${data.propertyAddress}
          ${data.propertyMlsId ? `<br><span style="color:#888;font-size:12px;">MLS# ${data.propertyMlsId}</span>` : ''}
          ${data.propertyPrice ? `<br><span style="color:#888;font-size:12px;">$${data.propertyPrice.toLocaleString()}</span>` : ''}
        </td>
      </tr>`
    : '';

  const utmSection = data.utmSource
    ? `
      <tr>
        <td style="padding:8px 12px;color:#666;font-size:14px;border-bottom:1px solid #eee;">Source</td>
        <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #eee;">
          ${data.utmSource}${data.utmMedium ? ` / ${data.utmMedium}` : ''}${data.utmCampaign ? ` (${data.utmCampaign})` : ''}
        </td>
      </tr>`
    : '';

  const typeLabel: Record<string, string> = {
    property_inquiry: 'Property Inquiry',
    schedule_tour: 'Tour Request',
    general: 'General Inquiry',
    contact: 'Contact Form',
  };

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#002349;padding:20px 24px;">
        <h1 style="color:#fff;font-size:18px;margin:0;font-weight:500;">New Lead: ${typeLabel[data.leadType] || data.leadType}</h1>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 12px;color:#666;font-size:14px;border-bottom:1px solid #eee;width:140px;">Name</td>
            <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #eee;font-weight:600;">${data.firstName} ${data.lastName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#666;font-size:14px;border-bottom:1px solid #eee;">Email</td>
            <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #eee;">
              <a href="mailto:${data.email}" style="color:#002349;">${data.email}</a>
            </td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding:8px 12px;color:#666;font-size:14px;border-bottom:1px solid #eee;">Phone</td>
            <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #eee;">
              <a href="tel:${data.phone}" style="color:#002349;">${data.phone}</a>
            </td>
          </tr>` : ''}
          ${data.inquiryType ? `
          <tr>
            <td style="padding:8px 12px;color:#666;font-size:14px;border-bottom:1px solid #eee;">Interest</td>
            <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #eee;">${data.inquiryType}</td>
          </tr>` : ''}
          ${propertySection}
          ${utmSection}
        </table>
        ${data.message ? `
        <div style="margin-top:20px;padding:16px;background:#f9fafb;border-left:3px solid #002349;">
          <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
          <p style="margin:0;font-size:14px;line-height:1.5;white-space:pre-wrap;">${data.message}</p>
        </div>` : ''}
        ${data.sourceUrl ? `
        <p style="margin-top:20px;font-size:12px;color:#999;">
          Submitted from: <a href="${data.sourceUrl}" style="color:#888;">${data.sourceUrl}</a>
        </p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Send lead notification email to the assigned agent.
 */
export async function sendLeadNotificationEmail(
  to: string,
  data: LeadEmailData
): Promise<void> {
  if (!isSendGridConfigured()) {
    console.warn('SendGrid not configured — skipping email to', to);
    return;
  }

  const typeLabel: Record<string, string> = {
    property_inquiry: 'Property Inquiry',
    schedule_tour: 'Tour Request',
    general: 'General Inquiry',
    contact: 'Contact Form',
  };

  const subject = data.propertyAddress
    ? `New ${typeLabel[data.leadType] || 'Lead'}: ${data.propertyAddress}`
    : `New ${typeLabel[data.leadType] || 'Lead'} from ${data.firstName} ${data.lastName}`;

  // Support comma-separated emails (e.g. "a@x.com,b@x.com")
  const recipients = to.includes(',')
    ? to.split(',').map((e) => e.trim()).filter(Boolean)
    : to;

  await sgMail.send({
    to: recipients,
    from: { email: fromEmail, name: 'Lead Notification' },
    subject,
    html: buildLeadEmailHtml(data),
  });
}
