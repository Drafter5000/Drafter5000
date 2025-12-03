"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedTextProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedHeading({ children, className = "", delay = 0 }: AnimatedTextProps) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.h1>
  )
}

export function AnimatedParagraph({ children, className = "", delay = 0 }: AnimatedTextProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.p>
  )
}

export function GradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-primary via-chart-2 to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  )
}

export function TypewriterText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <motion.span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.03, delay: index * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}
