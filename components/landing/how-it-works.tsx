'use client';

import { motion } from 'framer-motion';
import { FileText, Sparkles, Calendar, Mail, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    number: '01',
    title: 'Train Your AI',
    description:
      'Paste your existing articles or writing samples. Our AI analyzes your unique voice, vocabulary, and style patterns.',
    highlight: 'Takes only 5 minutes',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-500/10',
    textColor: 'text-violet-500',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Choose Topics',
    description:
      'Select from AI-suggested topics or add your own. Our system understands your niche and generates relevant ideas.',
    highlight: 'AI-powered suggestions',
    color: 'bg-primary',
    lightColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Calendar,
    number: '03',
    title: 'Set Schedule',
    description:
      'Pick the days and frequency for article delivery. Daily, weekly, or custom schedules available.',
    highlight: 'Flexible delivery',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
  },
  {
    icon: Mail,
    number: '04',
    title: 'Receive Articles',
    description:
      'Get professionally written articles delivered to your inbox. Review, edit, and publish anywhere.',
    highlight: 'Ready to publish',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Get your personalized AI writer up and running in four simple steps
          </p>
        </motion.div>

        {/* Desktop: Horizontal Process */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-violet-500/30 via-amber-500/30 to-emerald-500/30" />

            <div className="grid grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Step Circle */}
                  <div className="flex justify-center mb-8">
                    <div
                      className={`relative z-10 h-32 w-32 rounded-full ${step.lightColor} flex items-center justify-center`}
                    >
                      <div
                        className={`h-20 w-20 rounded-full ${step.color} flex items-center justify-center shadow-lg`}
                      >
                        <step.icon className="h-9 w-9 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <span className={`inline-block text-xs font-bold ${step.textColor} mb-2`}>
                      STEP {step.number}
                    </span>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {step.description}
                    </p>
                    <span
                      className={`inline-block text-xs font-medium ${step.textColor} ${step.lightColor} px-3 py-1 rounded-full`}
                    >
                      {step.highlight}
                    </span>
                  </div>

                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-16 -right-3 z-20 hidden lg:block">
                      <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Vertical Timeline */}
        <div className="lg:hidden">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex gap-6"
                >
                  {/* Icon Circle */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`h-16 w-16 rounded-full ${step.lightColor} flex items-center justify-center`}
                    >
                      <div
                        className={`h-12 w-12 rounded-full ${step.color} flex items-center justify-center shadow-md`}
                      >
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 pb-8">
                    <div className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-bold ${step.textColor}`}>
                          STEP {step.number}
                        </span>
                        <span
                          className={`text-xs font-medium ${step.textColor} ${step.lightColor} px-2 py-0.5 rounded-full`}
                        >
                          {step.highlight}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Ready to get started? It only takes 5 minutes.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
