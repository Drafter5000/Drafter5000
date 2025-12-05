'use client';

import { MarketingHeader } from '@/components/marketing-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, Play } from 'lucide-react';
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
  BrandsSection,
  FAQSection,
} from '@/components/landing';

export default function Home() {
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>Setup in 3 minutes</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero Visual */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="hidden lg:block"
              >
                <HeroVisual />
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* Brands Section */}
        <BrandsSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <div id="features">
          <FeatureSection />
        </div>

        {/* How It Works Section */}
        <div id="how-it-works">
          <HowItWorksSection />
        </div>

        {/* Testimonials Section */}
        <div id="testimonials">
          <TestimonialsSection />
        </div>

        {/* Pricing Preview */}
        <PricingPreview />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
