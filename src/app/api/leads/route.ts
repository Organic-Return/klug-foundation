import { NextResponse } from 'next/server';
import { createLeadFromForm, isClozeConfigured } from '@/lib/cloze';

interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  propertyInterest?: string;
  source?: string;
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
      console.warn('Cloze CRM is not configured. Lead will not be synced.');
      // Still return success - you might want to store leads locally or use another CRM
      return NextResponse.json({
        success: true,
        message: 'Lead received (CRM not configured)',
        clozeSync: false,
      });
    }

    // Send lead to Cloze
    const result = await createLeadFromForm({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      message: body.message,
      propertyInterest: body.propertyInterest,
      source: body.source || 'Website',
    });

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      clozeSync: true,
      clozeId: result.id,
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
