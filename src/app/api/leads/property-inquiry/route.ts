import { NextResponse } from 'next/server';
import { createContact, addNote, createProject, isClozeConfigured } from '@/lib/cloze';

interface PropertyInquiryData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  propertyAddress: string;
  propertyMlsId?: string;
  propertyPrice?: number;
  inquiryType?: 'schedule_showing' | 'request_info' | 'make_offer' | 'general';
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PropertyInquiryData;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.propertyAddress) {
      return NextResponse.json(
        { error: 'First name, last name, email, and property address are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if Cloze is configured
    if (!isClozeConfigured()) {
      console.warn('Cloze CRM is not configured. Property inquiry will not be synced.');
      return NextResponse.json({
        success: true,
        message: 'Inquiry received (CRM not configured)',
        clozeSync: false,
      });
    }

    const fullName = `${body.firstName} ${body.lastName}`.trim();
    const inquiryTypeLabels: Record<string, string> = {
      schedule_showing: 'Schedule Showing',
      request_info: 'Request Information',
      make_offer: 'Make Offer',
      general: 'General Inquiry',
    };

    // Create or update the contact
    await createContact({
      name: fullName,
      emails: [{ value: body.email, work: false }],
      phones: body.phone ? [{ value: body.phone, work: false }] : undefined,
      stage: 'lead',
      about: 'Property inquiry from website',
    });

    // Build note content
    const noteLines = [
      `**Property Inquiry**`,
      ``,
      `Property: ${body.propertyAddress}`,
    ];

    if (body.propertyMlsId) {
      noteLines.push(`MLS#: ${body.propertyMlsId}`);
    }

    if (body.propertyPrice) {
      noteLines.push(`List Price: $${body.propertyPrice.toLocaleString()}`);
    }

    if (body.inquiryType) {
      noteLines.push(`Inquiry Type: ${inquiryTypeLabels[body.inquiryType] || body.inquiryType}`);
    }

    if (body.message) {
      noteLines.push(``, `Message: ${body.message}`);
    }

    // Add note with property details
    await addNote({
      email: body.email,
      content: noteLines.join('\n'),
      subject: `Property Inquiry: ${body.propertyAddress}`,
    });

    // Create a project/deal for the property interest
    const projectResult = await createProject({
      name: `${body.propertyAddress} - ${fullName}`,
      segment: 'buyer',
      stage: 'lead',
      value: body.propertyPrice,
      email: body.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Property inquiry submitted successfully',
      clozeSync: true,
      projectId: projectResult.id,
    });
  } catch (error) {
    console.error('Error creating property inquiry:', error);

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
