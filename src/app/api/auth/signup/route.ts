import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendVerificationEmail, isSendGridConfigured } from '@/lib/sendgrid';

// Custom signup endpoint. We use the Supabase admin API to generate
// a sign-up link (which also creates the user as unconfirmed) and
// email it ourselves via SendGrid — bypassing Supabase's free-tier
// 4-emails-per-hour limit on its built-in mailer. The user must
// click the link in the email before they can log in.
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

    if (!isSendGridConfigured()) {
      return NextResponse.json(
        { error: 'Email delivery is not configured on the server. Please contact support.' },
        { status: 500 }
      );
    }

    const origin = request.headers.get('origin')
      || process.env.NEXT_PUBLIC_SITE_URL
      || `https://${request.headers.get('host')}`;

    // generateLink with type='signup' creates the user (unconfirmed) and
    // returns a verification URL the user must click to confirm.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: name ? { name } : undefined,
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      const status = /already (registered|exists)|duplicate/i.test(error.message)
        ? 409
        : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: 'Could not generate verification link. Please try again.' },
        { status: 500 }
      );
    }

    try {
      await sendVerificationEmail(email, actionLink, {
        name,
        siteName: 'Klug Properties',
      });
    } catch (err) {
      console.error('sendVerificationEmail failed:', err);
      return NextResponse.json(
        { error: 'Could not send verification email. Please try again or contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, requiresVerification: true });
  } catch (err) {
    console.error('signup route error:', err);
    return NextResponse.json(
      { error: 'Unexpected error creating account.' },
      { status: 500 }
    );
  }
}
