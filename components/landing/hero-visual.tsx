'use client';

import { motion } from 'framer-motion';

interface HeroVisualProps {
  articleCount?: string;
}

export function HeroVisual({ articleCount: _articleCount = '0+' }: HeroVisualProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto lg:mx-0">
      {/* Video container with 3D effect */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
        style={{ perspective: '1000px' }}
      >
        <div className="relative rounded-3xl border-2 border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden aspect-video">
          {/* Demo Video */}
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster="/video-placeholder.jpg"
          >
            {/* Test video - replace with actual demo video later */}
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>

          {/* Gradient overlay for polish */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/20 via-transparent to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}
