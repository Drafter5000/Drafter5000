import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type ContactCategory = 'general' | 'support' | 'sales' | 'partnership' | 'other';

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category?: ContactCategory;
  message: string;
}

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  general: 'General Inquiry',
  support: 'Technical Support',
  sales: 'Sales Question',
  partnership: 'Partnership Opportunity',
  other: 'Other',
};

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a contact us email to the configured recipient
 */
export async function sendContactEmail(data: ContactEmailData): Promise<EmailResult> {
  const toEmail = process.env.CONTACT_EMAIL;

  if (!toEmail) {
    console.error('CONTACT_EMAIL environment variable is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Contact Form <onboarding@resend.dev>',
      to: toEmail,
      replyTo: data.email,
      subject: `[Contact Form] ${data.subject}`,
      html: buildContactEmailHtml(data),
      text: buildContactEmailText(data),
    });

    if (error) {
      console.error('Failed to send contact email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending contact email:', message);
    return { success: false, error: message };
  }
}

function buildContactEmailHtml(data: ContactEmailData): string {
  const categoryLabel = data.category ? CATEGORY_LABELS[data.category] : 'Not specified';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Contact Form Submission</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Contact Form Submission</h2>
        
        <div style="margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
          ${data.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
          <p style="margin: 8px 0;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #555;">Message:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.message)}</p>
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          This email was sent from the contact form on your website.
        </p>
      </body>
    </html>
  `;
}

function buildContactEmailText(data: ContactEmailData): string {
  const categoryLabel = data.category ? CATEGORY_LABELS[data.category] : 'Not specified';

  return `
New Contact Form Submission
============================

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}Category: ${categoryLabel}
Subject: ${data.subject}

Message:
${data.message}

---
This email was sent from the contact form on your website.
  `.trim();
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}
