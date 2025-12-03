"use client"

import { motion } from "framer-motion"
import { Target, Sparkles, Clock, Send, CheckCircle2 } from "lucide-react"

const steps = [
  {
    icon: Target,
    number: "01",
    title: "Train Your AI",
    description: "Paste your existing articles or writing samples. Our AI analyzes your unique voice, vocabulary, and style patterns to create a personalized writing model.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Choose Your Topics",
    description: "Select from AI-suggested topics or add your own. Our system understands your niche and generates relevant, engaging topic ideas.",
    color: "from-primary to-teal-400",
  },
  {
    icon: Clock,
    number: "03",
    title: "Set Your Schedule",
    description: "Pick the days and frequency for article delivery. Whether daily, weekly, or custom schedules, we've got you covered.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Send,
    number: "04",
    title: "Receive & Publish",
    description: "Get professionally written articles delivered to your inbox. Review, edit if needed, and publish to your platform of choice.",
    color: "from-pink-500 to-rose-500",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-32 px-6 bg-gradient-to-b from-background via-secondary/30 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-2/10 text-chart-2 text-sm font-medium mb-6">
            <CheckCircle2 className="h-4 w-4" />
            Simple Process
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How it{" "}
            <span className="bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">
              works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple four-step process
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-8 px-4 py-1 rounded-full bg-background border border-border text-sm font-bold text-muted-foreground">
                    Step {step.number}
                  </div>

                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${step.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
