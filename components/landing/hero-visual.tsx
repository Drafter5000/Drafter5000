"use client"

import { motion } from "framer-motion"
import { Sparkles, BarChart3, FileText, Zap, Check } from "lucide-react"

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-2xl mx-auto lg:mx-0">
      {/* Main card with 3D effect */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
        style={{ perspective: "1000px" }}
      >
        <div className="relative rounded-3xl border-2 border-border bg-card p-8 shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Window controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-chart-4/60" />
            <div className="h-3 w-3 rounded-full bg-chart-1/60" />
          </div>

          {/* Content preview */}
          <div className="pt-8 space-y-6">
            {/* Title skeleton */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-6 bg-gradient-to-r from-foreground/20 to-foreground/5 rounded-lg"
            />

            {/* Paragraph lines */}
            <div className="space-y-3">
              {[100, 90, 85, 95, 80].map((width, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${width}%`, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 + i * 0.1 }}
                  className="h-3 bg-muted rounded"
                />
              ))}
            </div>

            {/* Second paragraph */}
            <div className="space-y-3 pt-4">
              {[95, 88, 92].map((width, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${width}%`, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 + i * 0.1 }}
                  className="h-3 bg-muted rounded"
                />
              ))}
            </div>
          </div>

          {/* Animated cursor */}
          <motion.div
            className="absolute w-0.5 h-5 bg-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 1.5 }}
            style={{ bottom: "40%", right: "25%" }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Floating badge - Your Style */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute -top-4 -right-4 md:right-4"
      >
        <div className="bg-gradient-to-r from-primary to-chart-2 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-xl shadow-primary/30 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Your Style
        </div>
      </motion.div>

      {/* Floating card - Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        whileHover={{ scale: 1.05 }}
        className="absolute -bottom-6 -left-6 md:left-4"
      >
        <div className="bg-card border-2 border-border px-5 py-4 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Articles Generated</p>
            <p className="text-xl font-bold">12,847</p>
          </div>
        </div>
      </motion.div>

      {/* Floating card - AI Processing */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute top-1/2 -right-8 md:-right-16 hidden lg:block"
      >
        <div className="bg-card border border-border px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-4 w-4 text-chart-4" />
            </motion.div>
            <span className="text-muted-foreground">AI Processing...</span>
          </div>
        </div>
      </motion.div>

      {/* Success indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1.8 }}
        className="absolute bottom-1/4 right-8 hidden md:block"
      >
        <div className="h-8 w-8 rounded-full bg-chart-4 flex items-center justify-center shadow-lg">
          <Check className="h-4 w-4 text-white" />
        </div>
      </motion.div>
    </div>
  )
}
