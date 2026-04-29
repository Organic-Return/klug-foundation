import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendWelcomeEmail, isSendGridConfigured } from '@/lib/sendgrid';

// Custom signup endpoint that bypasses Supabase's default email
// service entirely. We create the user via the admin API
// (email_confirm: true so they can sign in immediately) and send a
// welcome email through SendGrid which doesn't have the 4-per-hour
// rate limit Supabase imposes on the free tier.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const name = body?.name ? String(body.name).trim() : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication is not configured on the server.' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { name } : undefined,
    });

    if (error) {
      // Surface the Supabase error message but normalize the status.
      const status = /already (registered|exists)|duplicate/i.test(error.message)
        ? 409
        : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    // Fire-and-forget the welcome email so a SendGrid hiccup doesn't
    // block the signup response.
    if (isSendGridConfigured()) {
      const origin = request.headers.get('origin') || undefined;
      sendWelcomeEmail(email, {
        name,
        siteName: 'Klug Properties',
        siteUrl: origin,
      }).catch((err) => {
        console.error('sendWelcomeEmail failed:', err);
      });
    }

    return NextResponse.json({ ok: true, userId: data.user?.id });
  } catch (err) {
    console.error('signup route error:', err);
    return NextResponse.json(
      { error: 'Unexpected error creating account.' },
      { status: 500 }
    );
  }
}
