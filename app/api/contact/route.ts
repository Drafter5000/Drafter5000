import { type NextRequest, NextResponse } from 'next/server';
import { sendContactEmail, type ContactEmailData } from '@/lib/services/email';

const VALID_CATEGORIES = ['general', 'support', 'sales', 'partnership', 'other'] as const;
type ContactCategory = (typeof VALID_CATEGORIES)[number];

interface ContactRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  category?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, phone, subject, category, message } = body as ContactRequestBody;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Phone validation (optional but must be valid if provided)
    if (phone?.trim() && !/^[\d\s\-+()]{7,20}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (subject.trim().length < 5) {
      return NextResponse.json({ error: 'Subject must be at least 5 characters' }, { status: 400 });
    }

    // Category validation
    const validCategory = category && VALID_CATEGORIES.includes(category as ContactCategory);
    if (!validCategory) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      subject: subject.trim(),
      category: category as ContactCategory,
      message: message.trim(),
    });

    if (!result.success) {
      console.error('Contact email failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: unknown) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
