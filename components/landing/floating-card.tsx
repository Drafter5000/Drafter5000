"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FloatingCardProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FloatingCard({ children, delay = 0, className = "" }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ 
        y: -8, 
        transition: { duration: 0.3 } 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Float3DCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover="hover"
      initial="rest"
    >
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-chart-2/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        variants={{
          rest: { scale: 0.95 },
          hover: { scale: 1.05 }
        }}
      />
      <motion.div
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
        variants={{
          rest: { rotateX: 0, rotateY: 0 },
          hover: { rotateX: -5, rotateY: 5 }
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
