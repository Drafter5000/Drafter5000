"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function Hero3D() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setMousePosition({ x, y })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: mousePosition.x * 2,
          y: mousePosition.y * 2,
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.div
        className="absolute top-40 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: mousePosition.x * -1.5,
          y: mousePosition.y * -1.5,
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.div
        className="absolute bottom-20 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: mousePosition.x * 1,
          y: mousePosition.y * 1,
        }}
        transition={{ duration: 2 }}
      />

      {/* 3D Floating elements */}
      <motion.div
        className="absolute top-32 right-[15%] w-20 h-20"
        style={{ perspective: "1000px" }}
        animate={{
          rotateX: mousePosition.y * 0.5,
          rotateY: mousePosition.x * 0.5,
          y: [0, -20, 0],
        }}
        transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      >
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 backdrop-blur-sm shadow-xl" 
          style={{ transform: "rotateX(20deg) rotateY(-20deg)" }} />
      </motion.div>

      <motion.div
        className="absolute top-[60%] left-[10%] w-16 h-16"
        style={{ perspective: "1000px" }}
        animate={{
          rotateX: mousePosition.y * -0.3,
          rotateY: mousePosition.x * -0.3,
          y: [0, 15, 0],
        }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
      >
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/20 backdrop-blur-sm shadow-lg"
          style={{ transform: "rotateX(-15deg) rotateY(25deg)" }} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-[20%] w-12 h-12"
        style={{ perspective: "1000px" }}
        animate={{
          rotateX: mousePosition.y * 0.4,
          rotateY: mousePosition.x * 0.4,
          y: [0, -10, 0],
        }}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
      >
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-chart-5/20 to-chart-5/5 border border-chart-5/20 backdrop-blur-sm shadow-md"
          style={{ transform: "rotateX(25deg) rotateY(15deg)" }} />
      </motion.div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
    </div>
  )
}
