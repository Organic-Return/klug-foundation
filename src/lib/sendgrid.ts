import sgMail from '@sendgrid/mail';
import { formatPhone } from './phoneUtils';

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
              <a href="tel:${data.phone}" style="color:#002349;">${formatPhone(data.phone)}</a>
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
 * Send a welcome email to a newly registered user. Replaces Supabase's
 * default confirmation email which is rate-limited and frequently
 * marked as spam.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  options: {
    name?: string;
    siteName?: string;
    siteUrl?: string;
  } = {}
): Promise<void> {
  if (!isSendGridConfigured()) {
    console.warn('SendGrid not configured — skipping welcome email to', toEmail);
    return;
  }

  // Tenant-neutral fallbacks: read from env so a second deploy of this
  // codebase (e.g. SKK Foundation) doesn't accidentally email links
  // pointing at klugproperties.com when no explicit siteUrl is passed in.
  const siteName = options.siteName || process.env.NEXT_PUBLIC_SITE_NAME || 'Our Site';
  const siteUrl = options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || '';
  const greetingName = options.name?.trim() || 'there';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#002349;padding:32px 24px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0;font-weight:400;letter-spacing:0.04em;">Welcome to ${siteName}</h1>
      </div>
      <div style="padding:32px 24px;color:#1a1a1a;">
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${greetingName},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
          Thank you for creating an account with ${siteName}. You now have access to our exclusive
          off-market listings and member-only collection of luxury properties across Aspen,
          Snowmass Village, and the Roaring Fork Valley.
        </p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
          You can sign in any time to browse, save properties, and receive updates from our team.
        </p>
        <p style="margin:32px 0;text-align:center;">
          <a href="${siteUrl}/off-market"
             style="display:inline-block;background:#002349;color:#fff;text-decoration:none;padding:14px 32px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">
            View Off-Market Listings
          </a>
        </p>
        <p style="font-size:14px;line-height:1.6;color:#6a6a6a;margin:24px 0 0;">
          If you have any questions or want a personal introduction to a property, just reply to
          this email — a member of our team will be in touch.
        </p>
      </div>
      <div style="padding:20px 24px;border-top:1px solid #eee;text-align:center;color:#888;font-size:12px;">
        <p style="margin:0 0 4px;">${siteName}</p>
        <p style="margin:0;">
          <a href="${siteUrl}" style="color:#888;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    </div>
  `;

  await sgMail.send({
    to: toEmail,
    from: { email: fromEmail, name: siteName },
    subject: `Welcome to ${siteName}`,
    html,
  });
}

/**
 * Send the email-verification link to a newly-signed-up user.
 * The link comes from supabase.auth.admin.generateLink({ type: 'signup' })
 * — clicking it confirms the user's email and signs them in.
 */
export async function sendVerificationEmail(
  toEmail: string,
  verificationUrl: string,
  options: {
    name?: string;
    siteName?: string;
  } = {}
): Promise<void> {
  if (!isSendGridConfigured()) {
    console.warn('SendGrid not configured — skipping verification email to', toEmail);
    return;
  }

  const siteName = options.siteName || process.env.NEXT_PUBLIC_SITE_NAME || 'Our Site';
  const greetingName = options.name?.trim() || 'there';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#002349;padding:32px 24px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0;font-weight:400;letter-spacing:0.04em;">Verify your email</h1>
      </div>
      <div style="padding:32px 24px;color:#1a1a1a;">
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${greetingName},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
          Thank you for creating an account with ${siteName}. Please confirm your email
          address to finish setting up your account and unlock access to our off-market
          listings and saved-properties feature.
        </p>
        <p style="margin:32px 0;text-align:center;">
          <a href="${verificationUrl}"
             style="display:inline-block;background:#002349;color:#fff;text-decoration:none;padding:14px 32px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">
            Verify Email Address
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#6a6a6a;margin:24px 0 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="color:#002349;word-break:break-all;">${verificationUrl}</span>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#6a6a6a;margin:24px 0 0;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
      <div style="padding:20px 24px;border-top:1px solid #eee;text-align:center;color:#888;font-size:12px;">
        <p style="margin:0 0 4px;">${siteName}</p>
      </div>
    </div>
  `;

  await sgMail.send({
    to: toEmail,
    from: { email: fromEmail, name: siteName },
    subject: `Verify your email for ${siteName}`,
    html,
  });
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
