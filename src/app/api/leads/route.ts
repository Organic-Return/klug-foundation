import { NextResponse } from 'next/server';
import { createLeadFromForm, isClozeConfigured } from '@/lib/cloze';
import { createLead, determineLeadRouting, updateLeadClozeId, type LeadInput } from '@/lib/leads';
import { sendLeadNotificationEmail, isSendGridConfigured } from '@/lib/sendgrid';

interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  propertyInterest?: string;
  source?: string;
  // Lead management fields
  leadType?: string;
  inquiryType?: string;
  propertyAddress?: string;
  propertyMlsId?: string;
  propertyPrice?: number;
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
    const body = await request.json() as LeadFormData;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
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

    const leadType = (body.leadType || 'general') as LeadInput['leadType'];

    // Determine agent routing for property inquiries
    const routing = await determineLeadRouting(body.propertyMlsId);

    // Store lead in Supabase
    const leadInput: LeadInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      message: body.message,
      leadType,
      inquiryType: body.inquiryType,
      propertyAddress: body.propertyAddress,
      propertyMlsId: body.propertyMlsId,
      propertyPrice: body.propertyPrice,
      source: body.source || 'website',
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
    };

    const lead = await createLead(leadInput, routing);

    // Send email notification via SendGrid
    if (isSendGridConfigured() && routing.agentEmail) {
      try {
        await sendLeadNotificationEmail(routing.agentEmail, {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          message: body.message,
          leadType,
          inquiryType: body.inquiryType,
          propertyAddress: body.propertyAddress,
          propertyMlsId: body.propertyMlsId,
          propertyPrice: body.propertyPrice,
          sourceUrl: body.sourceUrl,
          utmSource: body.utmSource,
          utmMedium: body.utmMedium,
          utmCampaign: body.utmCampaign,
        });
      } catch (emailError) {
        console.error('Error sending lead notification email:', emailError);
      }
    }

    // Sync to Cloze CRM (existing behavior)
    let clozeId: string | undefined;
    if (isClozeConfigured()) {
      try {
        const clozeResult = await createLeadFromForm({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          message: body.message,
          propertyInterest: body.propertyInterest || body.propertyAddress,
          source: body.source || 'Website',
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
      message: 'Lead created successfully',
      leadId: lead?.id,
      clozeSync: !!clozeId,
      clozeId,
    });
  } catch (error) {
    console.error('Error creating lead:', error);

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
