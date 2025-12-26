import { Metadata } from 'next';
import { ContactForm } from '@/components/contact';
import { MarketingHeader } from '@/components/marketing-header';
import { Footer } from '@/components/landing/footer';
import { ContactInfo } from '@/components/contact-info';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with our team. We're here to help with any questions or inquiries you may have.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-32 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              Have a question or want to learn more? We&apos;d love to hear from you. Fill out the
              form below and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                <p className="text-muted-foreground mb-8">
                  Reach out to us through any of the following channels or use the contact form.
                </p>
              </div>

              <ContactInfo />

              {/* FAQ Link */}
              <div className="pt-6 border-t">
                <h3 className="font-medium mb-2">Looking for quick answers?</h3>
                <p className="text-sm text-muted-foreground">
                  Check out our frequently asked questions for immediate help with common inquiries.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl font-semibold mb-2">Send us a Message</h2>
                <p className="text-muted-foreground mb-8">
                  Fill out the form below for communication with our team.
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
