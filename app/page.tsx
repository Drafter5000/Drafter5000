'use client';

import { Win95Window, Win95Button, Win95Badge, Win95Progress } from '@/components/win95';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const stats = [
  { value: '50K+', label: 'Articles Generated', description: 'High-quality content created' },
  { value: '12K+', label: 'Happy Writers', description: 'Content creators worldwide' },
  { value: '99%', label: 'Satisfaction Rate', description: 'From our customers' },
  { value: '150+', label: 'Countries', description: 'Global reach' },
];

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Learning',
    description:
      'Our advanced AI analyzes your writing samples to capture your unique voice, tone, and style patterns.',
  },
  {
    icon: '✨',
    title: 'Smart Topic Generation',
    description:
      'Get intelligent topic suggestions based on your industry, audience, and content goals.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description:
      'Generate high-quality articles in seconds, not hours. Scale your content production effortlessly.',
  },
  {
    icon: '🎨',
    title: 'Style Customization',
    description:
      'Fine-tune the AI output with adjustable parameters for tone, formality, and creativity levels.',
  },
  {
    icon: '🌐',
    title: 'Multi-Language Support',
    description: 'Create content in 50+ languages while maintaining your authentic writing style.',
  },
  {
    icon: '🛡️',
    title: 'Plagiarism Free',
    description: 'Every article is 100% original and passes all plagiarism detection tools.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Train Your AI',
    description:
      'Paste your existing articles or writing samples. Our AI analyzes your unique voice, vocabulary, and style patterns.',
    highlight: 'Takes only 5 minutes',
  },
  {
    number: '02',
    title: 'Choose Topics',
    description:
      'Select from AI-suggested topics or add your own. Our system understands your niche and generates relevant ideas.',
    highlight: 'AI-powered suggestions',
  },
  {
    number: '03',
    title: 'Set Schedule',
    description:
      'Pick the days and frequency for article delivery. Daily, weekly, or custom schedules available.',
    highlight: 'Flexible delivery',
  },
  {
    number: '04',
    title: 'Receive Articles',
    description:
      'Get professionally written articles delivered to your inbox. Review, edit, and publish anywhere.',
    highlight: 'Ready to publish',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Content Marketing Manager',
    company: 'TechFlow',
    avatar: '/images/avatar-sarah.svg',
    content:
      "Drafter has completely transformed our content strategy. The AI captures our brand voice perfectly, and we've increased our output by 400% without sacrificing quality.",
  },
  {
    name: 'Marcus Johnson',
    role: 'Freelance Writer',
    company: 'Self-employed',
    avatar: '/images/avatar-marcus.svg',
    content:
      'As a freelancer, time is money. This tool helps me deliver more projects while maintaining the unique style my clients love.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Content',
    avatar: '/images/avatar-emily.svg',
    company: 'StartupHub',
    content:
      'The quality of articles is incredible. Our SEO rankings have improved significantly, and our audience engagement has never been higher.',
  },
];

const faqs = [
  {
    question: 'How does Drafter learn my writing style?',
    answer:
      'Simply paste 2-3 of your existing articles or writing samples. Our AI analyzes your vocabulary, sentence structure, tone, and unique patterns to create a personalized writing model.',
  },
  {
    question: 'Can I edit the generated articles?',
    answer:
      'Absolutely! All generated articles are delivered to your inbox where you can review, edit, and refine them before publishing.',
  },
  {
    question: 'Is the content plagiarism-free?',
    answer:
      'Yes, 100%. Every article is generated from scratch based on your style and topics. All content is completely original.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time with no questions asked. Your access will continue until the end of your billing period.',
  },
];

export default function Home() {
  const [visitorNumber, setVisitorNumber] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    setVisitorNumber(Math.floor(Math.random() * 9000) + 1000);
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4 pb-12">
      {/* Desktop Icons */}
      <div className="fixed top-4 left-4 flex flex-col gap-4 z-10">
        <Link href="/login" className="flex flex-col items-center gap-1 w-[70px] group">
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[24px]">🔐</div>
          <span className="text-[11px] text-center text-white bg-[var(--win95-title-bar)] px-1 group-hover:underline">
            Log In
          </span>
        </Link>
        <Link
          href="/articles/generate/step-1"
          className="flex flex-col items-center gap-1 w-[70px] group"
        >
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[24px]">✨</div>
          <span className="text-[11px] text-center text-white bg-[var(--win95-title-bar)] px-1 group-hover:underline">
            Get Started
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto pt-8 space-y-4">
        {/* Hero Window */}
        <Win95Window
          title="Welcome to Drafter - AI Writing Assistant"
          icon={<span>🏠</span>}
          showControls={true}
        >
          <div className="space-y-4">
            {/* Hero Banner */}
            <div className="win95-sunken p-4">
              <div className="grid md:grid-cols-2 gap-4 items-center">
                <div className="text-center md:text-left">
                  <Win95Badge variant="secondary" className="mb-2">
                    ✨ AI-Powered Writing Assistant
                  </Win95Badge>
                  <h1 className="text-[18px] font-bold text-[var(--win95-title-bar)] mb-2">
                    Articles that sound like YOU wrote them
                  </h1>
                  <p className="text-[11px] mb-4">
                    Train our AI on your writing style, pick your topics, and receive professionally
                    written articles delivered straight to your inbox.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Link href="/articles/generate/step-1">
                      <Win95Button size="lg">✨ Get Started Free →</Win95Button>
                    </Link>
                    <Link href="/pricing">
                      <Win95Button size="md">💰 View Pricing</Win95Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-[10px]">
                    <span>🛡️ No credit card required</span>
                    <span>⚡ Setup in 3 minutes</span>
                  </div>
                </div>
                <div className="win95-raised p-2 hidden md:block">
                  <div className="win95-sunken p-1">
                    <Image
                      src="/images/hero-demo.svg"
                      alt="Drafter AI Writing Demo"
                      width={400}
                      height={250}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-[9px] text-center mt-1 text-[var(--win95-button-shadow)]">
                    📷 AI-powered article generation in action
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Win95Window>

        {/* Demo Preview Window */}
        <Win95Window title="🖼️ See Drafter in Action" icon={<span>📺</span>}>
          <div className="p-2">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="win95-sunken p-2">
                <div className="win95-field p-1 mb-2">
                  <Image
                    src="/images/step1-style.svg"
                    alt="Step 1: Define your writing style"
                    width={280}
                    height={180}
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-[10px] font-bold text-center">📝 Define Your Style</p>
                <p className="text-[9px] text-center text-[var(--win95-button-shadow)]">
                  Paste your articles to train the AI
                </p>
              </div>
              <div className="win95-sunken p-2">
                <div className="win95-field p-1 mb-2">
                  <Image
                    src="/images/step2-topics.svg"
                    alt="Step 2: Choose your topics"
                    width={280}
                    height={180}
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-[10px] font-bold text-center">💡 Choose Topics</p>
                <p className="text-[9px] text-center text-[var(--win95-button-shadow)]">
                  Select what you want to write about
                </p>
              </div>
              <div className="win95-sunken p-2">
                <div className="win95-field p-1 mb-2">
                  <Image
                    src="/images/step3-delivery.svg"
                    alt="Step 3: Receive articles"
                    width={280}
                    height={180}
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-[10px] font-bold text-center">📬 Get Articles</p>
                <p className="text-[9px] text-center text-[var(--win95-button-shadow)]">
                  Receive content in your inbox
                </p>
              </div>
            </div>
          </div>
        </Win95Window>

        {/* Stats Window */}
        <Win95Window title="📊 Trusted by Thousands" icon={<span>📈</span>}>
          <div className="p-2">
            <p className="text-[11px] text-center mb-3">
              Join the growing community of content creators
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stats.map((stat, index) => (
                <div key={index} className="win95-sunken p-3 text-center">
                  <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">
                    {stat.value}
                  </div>
                  <div className="text-[11px] font-bold">{stat.label}</div>
                  <div className="text-[9px] text-[var(--win95-button-shadow)]">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Win95Window>

        {/* Features Window */}
        <Win95Window title="⭐ Powerful Features" icon={<span>💎</span>}>
          <div className="p-2">
            <div className="text-center mb-3">
              <p className="text-[12px] font-bold">Everything you need to create amazing content</p>
              <p className="text-[10px] text-[var(--win95-button-shadow)]">
                Our AI-powered platform combines cutting-edge technology with intuitive design
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="win95-raised p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[20px]">{feature.icon}</span>
                    <span className="text-[11px] font-bold">{feature.title}</span>
                  </div>
                  <p className="text-[10px] text-[var(--win95-button-shadow)]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Win95Window>

        {/* How It Works Window */}
        <Win95Window title="🔧 How It Works" icon={<span>📋</span>}>
          <div className="p-2">
            <div className="text-center mb-3">
              <Win95Badge>Simple Process</Win95Badge>
              <p className="text-[11px] mt-2">
                Get your personalized AI writer up and running in four simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              {steps.map((step, index) => (
                <div key={index} className="win95-sunken p-3 text-center">
                  <div className="win95-raised w-[40px] h-[40px] mx-auto mb-2 flex items-center justify-center">
                    <span className="text-[14px] font-bold text-[var(--win95-title-bar)]">
                      {step.number}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold mb-1">{step.title}</p>
                  <p className="text-[9px] text-[var(--win95-button-shadow)] mb-2">
                    {step.description}
                  </p>
                  <Win95Badge variant="outline" className="text-[8px]">
                    {step.highlight}
                  </Win95Badge>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <p className="text-[10px] text-[var(--win95-button-shadow)] mb-2">
                Ready to get started? It only takes 5 minutes.
              </p>
              <Link href="/articles/generate/step-1">
                <Win95Button>Start Free Trial →</Win95Button>
              </Link>
            </div>
          </div>
        </Win95Window>

        {/* Testimonials Window */}
        <Win95Window title="💬 Customer Stories" icon={<span>⭐</span>}>
          <div className="p-2">
            <div className="text-center mb-3">
              <p className="text-[12px] font-bold">Loved by content creators worldwide</p>
              <p className="text-[10px] text-[var(--win95-button-shadow)]">
                See what our customers have to say
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="win95-sunken p-3">
                  <div className="text-[18px] mb-2">💬</div>
                  <p className="text-[10px] italic mb-3">"{testimonial.content}"</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className="text-[10px]">
                        ⭐
                      </span>
                    ))}
                  </div>
                  <div className="win95-field p-2">
                    <div className="flex items-center gap-2">
                      <div className="win95-raised w-[32px] h-[32px] overflow-hidden rounded-full">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold">{testimonial.name}</p>
                        <p className="text-[9px] text-[var(--win95-button-shadow)]">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Win95Window>

        {/* Pricing Preview Window */}
        <Win95Window title="💰 Simple, Transparent Pricing" icon={<span>💳</span>}>
          <div className="p-2">
            <div className="text-center mb-3">
              <p className="text-[11px]">
                Choose the plan that fits your needs. All plans include a 14-day free trial.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="win95-raised p-3 text-center">
                <div className="text-[20px] mb-2">✨</div>
                <p className="text-[12px] font-bold">Free</p>
                <p className="text-[10px] text-[var(--win95-button-shadow)] mb-2">Get started</p>
                <p className="text-[18px] font-bold mb-3">$0</p>
                <div className="win95-sunken p-2 text-left text-[9px] space-y-1 mb-3">
                  <p>✓ 5 articles/month</p>
                  <p>✓ Basic style learning</p>
                  <p>✓ Email delivery</p>
                </div>
                <Link href="/articles/generate/step-1">
                  <Win95Button size="sm" className="w-full">
                    Get Started
                  </Win95Button>
                </Link>
              </div>
              <div className="win95-raised p-3 text-center border-2 border-[var(--win95-title-bar)]">
                <Win95Badge variant="secondary" className="mb-1">
                  Most Popular
                </Win95Badge>
                <div className="text-[20px] mb-2">⚡</div>
                <p className="text-[12px] font-bold">Pro</p>
                <p className="text-[10px] text-[var(--win95-button-shadow)] mb-2">
                  For professionals
                </p>
                <p className="text-[18px] font-bold mb-3">
                  $29<span className="text-[10px]">/mo</span>
                </p>
                <div className="win95-sunken p-2 text-left text-[9px] space-y-1 mb-3">
                  <p>✓ 50 articles/month</p>
                  <p>✓ Advanced style learning</p>
                  <p>✓ Priority support</p>
                  <p>✓ Multiple topics</p>
                </div>
                <Link href="/signup">
                  <Win95Button size="sm" className="w-full">
                    Start Free Trial
                  </Win95Button>
                </Link>
              </div>
              <div className="win95-raised p-3 text-center">
                <div className="text-[20px] mb-2">👑</div>
                <p className="text-[12px] font-bold">Enterprise</p>
                <p className="text-[10px] text-[var(--win95-button-shadow)] mb-2">For teams</p>
                <p className="text-[18px] font-bold mb-3">Custom</p>
                <div className="win95-sunken p-2 text-left text-[9px] space-y-1 mb-3">
                  <p>✓ Unlimited articles</p>
                  <p>✓ Team collaboration</p>
                  <p>✓ API access</p>
                  <p>✓ Dedicated support</p>
                </div>
                <Link href="/pricing">
                  <Win95Button size="sm" className="w-full">
                    Contact Sales
                  </Win95Button>
                </Link>
              </div>
            </div>
          </div>
        </Win95Window>

        {/* FAQ Window */}
        <Win95Window title="❓ Frequently Asked Questions" icon={<span>💡</span>}>
          <div className="p-2">
            <div className="text-center mb-3">
              <p className="text-[11px]">Everything you need to know about Drafter</p>
            </div>
            <div className="win95-sunken p-2 space-y-1">
              {faqs.map((faq, index) => (
                <div key={index} className="win95-raised">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-2 flex items-center justify-between text-left hover:bg-[var(--win95-bg-dark)]"
                  >
                    <span className="text-[11px] font-bold">{faq.question}</span>
                    <span className="text-[14px]">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="p-2 pt-0 text-[10px] text-[var(--win95-button-shadow)] border-t border-[var(--win95-button-shadow)]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Win95Window>

        {/* CTA Window */}
        <Win95Window title="🚀 Ready to Get Started?" icon={<span>🎯</span>}>
          <div className="p-4 text-center">
            <div className="text-[32px] mb-2">✨</div>
            <p className="text-[14px] font-bold mb-2">Start creating amazing content today</p>
            <p className="text-[11px] text-[var(--win95-button-shadow)] mb-4">
              Join thousands of content creators who trust Drafter for their writing needs.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/articles/generate/step-1">
                <Win95Button size="lg">✨ Get Started Free</Win95Button>
              </Link>
              <Link href="/login">
                <Win95Button size="md">🔐 Log In</Win95Button>
              </Link>
            </div>
          </div>
        </Win95Window>

        {/* Footer */}
        <div className="win95-raised p-3">
          <div className="grid md:grid-cols-4 gap-4 text-[10px]">
            <div>
              <p className="font-bold mb-2">📄 Drafter</p>
              <p className="text-[var(--win95-button-shadow)]">
                AI-powered writing assistant that creates articles in your unique voice.
              </p>
            </div>
            <div>
              <p className="font-bold mb-2">🔗 Quick Links</p>
              <div className="space-y-1">
                <Link href="/articles/generate/step-1" className="block hover:underline">
                  Get Started
                </Link>
                <Link href="/pricing" className="block hover:underline">
                  Pricing
                </Link>
                <Link href="/login" className="block hover:underline">
                  Log In
                </Link>
              </div>
            </div>
            <div>
              <p className="font-bold mb-2">📧 Contact</p>
              <p>support@drafter.app</p>
            </div>
            <div>
              <p className="font-bold mb-2">📊 Stats</p>
              <p>50K+ articles generated</p>
              <p>12K+ happy users</p>
            </div>
          </div>
          <hr className="my-3 border-[var(--win95-button-shadow)]" />
          <div className="flex flex-wrap justify-between items-center text-[9px] text-[var(--win95-button-shadow)]">
            <span>© 2025 Drafter. All rights reserved.</span>
            <span>Made with ❤️ for content creators</span>
          </div>
        </div>

        {/* Visitor Counter */}
        <div className="text-center text-[10px] py-2">
          <span className="win95-sunken px-2 py-1 inline-block">
            👁️ You are visitor #<span className="font-mono">000{visitorNumber ?? '----'}</span>
          </span>
        </div>

        {/* Classic Web 1.0 badges */}
        <div className="flex flex-wrap justify-center gap-2 pb-8">
          <div className="win95-raised px-2 py-1 text-[9px]">Best viewed in 800x600</div>
          <div className="win95-raised px-2 py-1 text-[9px]">🔊 Sound ON</div>
          <div className="win95-raised px-2 py-1 text-[9px]">Under Construction 🚧</div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 win95-raised h-[28px] flex items-center px-1 z-50">
        <button className="win95-btn h-[22px] flex items-center gap-1 px-2 text-[11px] font-bold">
          <span className="text-[14px]">🪟</span>
          Start
        </button>
        <div className="flex-1 flex items-center gap-1 px-2">
          <div className="win95-sunken h-[20px] flex items-center px-2 text-[10px] flex-1 max-w-[200px]">
            <span>🏠</span>
            <span className="ml-1 truncate">Drafter - AI Writing Assistant</span>
          </div>
        </div>
        <div className="win95-sunken h-[20px] flex items-center px-2 text-[10px]">
          {currentTime || '--:--'}
        </div>
      </div>
    </div>
  );
}
