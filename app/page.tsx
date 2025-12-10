'use client';

import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { DesignToggle } from '@/components/design-toggle';
import { MarketingHeader } from '@/components/marketing-header';
import { Win95Window, Win95Button } from '@/components/win95';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import {
  Hero3D,
  HeroVisual,
  StatsSection,
  FeatureSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingPreview,
  CTASection,
  Footer,
  GradientText,
  FAQSection,
} from '@/components/landing';

export default function Home() {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [visitorNumber, setVisitorNumber] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

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

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="min-h-screen p-4">
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

        {/* Main Window */}
        <div className="max-w-[800px] mx-auto pt-8">
          <Win95Window
            title="Welcome to Drafter - Alexander's Personal Page"
            icon={<span>🏠</span>}
            showControls={true}
          >
            <div className="space-y-4">
              <div className="win95-sunken p-2 text-center">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[24px]">🌟</span>
                  <h1 className="text-[16px] font-bold text-[var(--win95-title-bar)]">
                    Welcome to Alexander's Homepage!
                  </h1>
                  <span className="text-[24px]">🌟</span>
                </div>
                <p className="text-[11px] mt-1">
                  <span className="animate-pulse">★</span> Last updated: December 2025{' '}
                  <span className="animate-pulse">★</span>
                </p>
              </div>

              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">👤 About Me</legend>
                  <div className="flex gap-4 flex-wrap md:flex-nowrap">
                    <div className="win95-sunken p-2 flex-shrink-0">
                      <div className="w-[100px] h-[100px] bg-[var(--win95-bg-dark)] flex items-center justify-center text-[48px]">
                        👨‍💻
                      </div>
                    </div>
                    <div className="flex-1 text-[11px] space-y-2">
                      <p>
                        <strong>Name:</strong> Alexander
                      </p>
                      <p>
                        <strong>Location:</strong> 🇷🇺 Russia
                      </p>
                      <p>
                        <strong>Occupation:</strong> Creator of Drafter
                      </p>
                      <p>
                        <strong>Interests:</strong> AI, Writing, Technology
                      </p>
                      <hr className="border-[var(--win95-button-shadow)]" />
                      <p className="italic">
                        "Building tools that help people write better content with AI assistance."
                      </p>
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">📄 What is Drafter?</legend>
                  <div className="text-[11px] space-y-2">
                    <p>
                      <strong>Drafter</strong> is an AI-powered writing assistant that creates
                      articles that sound like <em>you</em> wrote them!
                    </p>
                    <div className="win95-sunken p-2 mt-2">
                      <p className="font-bold mb-1">✨ Key Features:</p>
                      <ul className="list-none space-y-1 ml-2">
                        <li>📝 Train AI on your writing style</li>
                        <li>🎯 Pick your favorite topics</li>
                        <li>📬 Get articles delivered to your inbox</li>
                        <li>⚡ Setup in just 3 minutes</li>
                      </ul>
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">🔧 How It Works</legend>
                  <div className="grid md:grid-cols-3 gap-3 text-[11px]">
                    <div className="win95-raised p-2 text-center">
                      <div className="text-[24px] mb-1">1️⃣</div>
                      <p className="font-bold">Define Your Style</p>
                      <p className="text-[10px] mt-1">Share examples of your writing</p>
                    </div>
                    <div className="win95-raised p-2 text-center">
                      <div className="text-[24px] mb-1">2️⃣</div>
                      <p className="font-bold">Choose Topics</p>
                      <p className="text-[10px] mt-1">Select what you want to write about</p>
                    </div>
                    <div className="win95-raised p-2 text-center">
                      <div className="text-[24px] mb-1">3️⃣</div>
                      <p className="font-bold">Get Articles</p>
                      <p className="text-[10px] mt-1">Receive content in your inbox</p>
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">🔗 Quick Links</legend>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Link href="/articles/generate/step-1">
                      <Win95Button size="md">✨ Get Started Free</Win95Button>
                    </Link>
                    <Link href="/login">
                      <Win95Button size="md">🔐 Log In</Win95Button>
                    </Link>
                    <Link href="/pricing">
                      <Win95Button size="md">💰 Pricing</Win95Button>
                    </Link>
                  </div>
                </fieldset>
              </div>

              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">📊 Stats</legend>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="win95-sunken p-2">
                      <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">
                        10K+
                      </div>
                      <div>Articles Generated</div>
                    </div>
                    <div className="win95-sunken p-2">
                      <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">
                        500+
                      </div>
                      <div>Happy Users</div>
                    </div>
                    <div className="win95-sunken p-2">
                      <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">99%</div>
                      <div>Satisfaction</div>
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="win95-status-bar flex justify-between items-center">
                <span className="text-[10px]">📧 Contact: alexander@drafter.app</span>
                <span className="text-[10px]">Made with ❤️ in Russia | © 2025</span>
              </div>

              <div className="text-center text-[10px] py-2">
                <span className="win95-sunken px-2 py-1 inline-block">
                  👁️ You are visitor #
                  <span className="font-mono">000{visitorNumber ?? '----'}</span>
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pb-2">
                <div className="win95-raised px-2 py-1 text-[9px]">Best viewed in 800x600</div>
                <div className="win95-raised px-2 py-1 text-[9px]">🔊 Sound ON</div>
                <div className="win95-raised px-2 py-1 text-[9px]">Under Construction 🚧</div>
              </div>
            </div>
          </Win95Window>
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
              <span className="ml-1 truncate">Drafter - Alexander's Page</span>
            </div>
          </div>
          <DesignToggle variant="inline" />
          <div className="win95-sunken h-[20px] flex items-center px-2 text-[10px] ml-1">
            {currentTime || '--:--'}
          </div>
        </div>
      </div>
    );
  }

  // Modern Design (from feature/07-dec-2025 branch)
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <MarketingHeader />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 pb-32 px-6">
          <Hero3D />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Hero Content */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>AI-Powered Writing Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    New
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
                >
                  Articles that <GradientText>sound like you</GradientText> wrote them
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-xl text-muted-foreground max-w-lg leading-relaxed"
                >
                  Train our AI on your writing style, pick your topics, and receive professionally
                  written articles delivered straight to your inbox. It's that simple.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap gap-4 pt-4"
                >
                  <Link href="/articles/generate/step-1">
                    <Button
                      size="lg"
                      className="gap-2 shadow-2xl shadow-primary/30 text-lg px-8 h-14 rounded-2xl"
                    >
                      Get Started Free <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 text-lg px-8 h-14 rounded-2xl bg-background/50 backdrop-blur-sm gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>

              {/* Hero Visual */}
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <FeatureSection />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Pricing Preview */}
        <PricingPreview />

        {/* FAQ */}
        <FAQSection />

        {/* CTA */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
