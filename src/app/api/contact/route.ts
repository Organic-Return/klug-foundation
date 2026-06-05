import { NextResponse } from 'next/server';
import { createLeadFromForm, isClozeConfigured } from '@/lib/cloze';
import { createLead, determineLeadRouting, updateLeadClozeId } from '@/lib/leads';
import { sendLeadNotificationEmail, isSendGridConfigured } from '@/lib/sendgrid';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message?: string;
  // UTM + source tracking
  sourceUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  landingPage?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ContactFormData;

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Split name into first/last
    const nameParts = body.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Route to fallback email (general contact, not a property inquiry)
    const routing = await determineLeadRouting();

    // Store lead in Supabase
    const lead = await createLead(
      {
        firstName,
        lastName,
        email: body.email,
        phone: body.phone,
        message: body.message,
        leadType: 'contact',
        source: 'Website Contact Form',
        sourceUrl: body.sourceUrl,
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmContent: body.utmContent,
        utmTerm: body.utmTerm,
        gclid: body.gclid,
        fbclid: body.fbclid,
        msclkid: body.msclkid,
        landingPage: body.landingPage,
      },
      routing
    );

    // Send email notification
    if (isSendGridConfigured() && routing.agentEmail) {
      try {
        await sendLeadNotificationEmail(routing.agentEmail, {
          firstName,
          lastName,
          email: body.email,
          phone: body.phone,
          message: body.message,
          leadType: 'contact',
          sourceUrl: body.sourceUrl,
          utmSource: body.utmSource,
          utmMedium: body.utmMedium,
          utmCampaign: body.utmCampaign,
        });
      } catch (emailError) {
        console.error('Error sending contact notification email:', emailError);
      }
    }

    // Sync to Cloze CRM (existing behavior)
    let clozeId: string | undefined;
    if (isClozeConfigured()) {
      try {
        const clozeResult = await createLeadFromForm({
          firstName,
          lastName,
          email: body.email,
          phone: body.phone,
          message: body.message,
          propertyInterest: body.interest,
          source: 'Website Contact Form',
        });
        clozeId = clozeResult.id;

        if (lead && clozeId) {
          await updateLeadClozeId(lead.id, clozeId);
        }
      } catch (clozeError) {
        console.error('Error syncing to Cloze:', clozeError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      leadId: lead?.id,
      clozeSync: !!clozeId,
      clozeId,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
