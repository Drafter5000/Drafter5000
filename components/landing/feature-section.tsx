"use client"

import { motion } from "framer-motion"
import { FloatingCard } from "./floating-card"
import { 
  Sparkles, Brain, Zap, Clock, Target, Shield, 
  BarChart3, Palette, Globe, Rocket, Users, Award 
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Our advanced AI analyzes your writing samples to capture your unique voice, tone, and style patterns.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Sparkles,
    title: "Smart Topic Generation",
    description: "Get intelligent topic suggestions based on your industry, audience, and content goals.",
    gradient: "from-primary to-teal-400",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate high-quality articles in seconds, not hours. Scale your content production effortlessly.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Palette,
    title: "Style Customization",
    description: "Fine-tune the AI output with adjustable parameters for tone, formality, and creativity levels.",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Create content in 50+ languages while maintaining your authentic writing style.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Plagiarism Free",
    description: "Every article is 100% original and passes all plagiarism detection tools.",
    gradient: "from-emerald-500 to-green-600",
  },
]

export function FeatureSection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden" id="features">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/5 to-chart-2/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              create amazing content
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with intuitive design 
            to help you produce professional content at scale.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FloatingCard key={index} delay={index * 0.1}>
              <div className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-500 h-full">
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </FloatingCard>
          ))}
        </div>
      </div>
    </section>
  )
}
