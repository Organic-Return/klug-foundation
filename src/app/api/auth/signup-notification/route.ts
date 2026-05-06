import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLead, determineLeadRouting } from '@/lib/leads';
import { sendLeadNotificationEmail, isSendGridConfigured } from '@/lib/sendgrid';

// Fired from /auth/callback after a brand-new user finishes verifying
// their email (or signs in via OAuth for the first time). Idempotent:
// a duplicate POST for the same user is a no-op.
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = auth.slice(7);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    const admin = createClient(url, serviceKey);
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Idempotency: bail if we've already created an account_signup lead
    // for this email — the user has just clicked the verification link
    // a second time, or hit /auth/callback after a normal OAuth login.
    const { data: existing } = await admin
      .from('leads')
      .select('id')
      .eq('email', user.email)
      .eq('lead_type', 'account_signup')
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const meta = (user.user_metadata || {}) as { name?: string; full_name?: string };
    const fullName = meta.full_name || meta.name || '';
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(' ');

    const provider = (user.app_metadata as { provider?: string } | undefined)?.provider || 'email';

    const routing = await determineLeadRouting();

    const lead = await createLead(
      {
        firstName: firstName || 'New',
        lastName: lastName || 'Member',
        email: user.email,
        leadType: 'account_signup',
        source: `Account Signup (${provider})`,
        message: `New account created via ${provider}.`,
      },
      routing
    );

    if (isSendGridConfigured() && routing.agentEmail) {
      try {
        await sendLeadNotificationEmail(routing.agentEmail, {
          firstName: firstName || 'New',
          lastName: lastName || 'Member',
          email: user.email,
          leadType: 'account_signup',
          message: `A new visitor created an account on the site via ${provider}.`,
        });
      } catch (err) {
        console.error('signup notification email failed:', err);
      }
    }

    return NextResponse.json({ ok: true, leadId: lead?.id });
  } catch (err) {
    console.error('signup-notification error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
