'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { LandingStats } from '@/lib/services/landing-stats';

interface StatsSectionProps {
  dynamicStats?: LandingStats | null;
  isLoading?: boolean;
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && value > 0) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function StatSkeleton() {
  return (
    <div className="text-center p-8 rounded-3xl bg-card border border-border">
      <Skeleton className="h-12 w-24 mx-auto mb-3" />
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-40 mx-auto" />
    </div>
  );
}

export function StatsSection({ dynamicStats, isLoading = false }: StatsSectionProps) {
  // Memoize stats array to prevent unnecessary re-renders
  const stats = useMemo(
    () => [
      {
        value: dynamicStats?.articlesSent ?? 0,
        suffix: '+',
        label: 'Articles Sent',
        description: 'High-quality content delivered',
        hasData: dynamicStats !== null && dynamicStats !== undefined,
      },
      {
        value: dynamicStats?.activeCustomers ?? 0,
        suffix: '+',
        label: 'Happy Writers',
        description: 'Entrepreneurs worldwide',
        hasData: dynamicStats !== null && dynamicStats !== undefined,
      },
      {
        value: 100,
        suffix: '%',
        label: 'Satisfaction Rate',
        description: '7-day money back guarantee',
        hasData: true, // Static value, always has data
      },
    ],
    [dynamicStats]
  );

  // Show loading state when stats are being fetched
  const showLoading = isLoading || dynamicStats === null;

  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by cool early adopters</h2>
          <p className="text-muted-foreground text-lg">
            Join the growing community of entrepreneurs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {showLoading && !stat.hasData ? (
                <StatSkeleton />
              ) : (
                <div className="text-center p-8 rounded-3xl bg-card border border-border hover:border-primary/20 transition-colors">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="font-semibold text-lg mb-1">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
