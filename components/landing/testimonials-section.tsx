"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Marketing Manager",
    company: "TechFlow",
    avatar: "/avatars/sarah.jpg",
    content: "ArticleForge has completely transformed our content strategy. The AI captures our brand voice perfectly, and we've increased our output by 400% without sacrificing quality.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Freelance Writer",
    company: "Self-employed",
    avatar: "/avatars/marcus.jpg",
    content: "As a freelancer, time is money. This tool helps me deliver more projects while maintaining the unique style my clients love. It's like having a writing partner who knows exactly what I need.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Content",
    company: "StartupHub",
    avatar: "/avatars/emily.jpg",
    content: "The quality of articles is incredible. Our SEO rankings have improved significantly, and our audience engagement has never been higher. Absolutely worth every penny.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Blog Owner",
    company: "TechInsights",
    avatar: "/avatars/david.jpg",
    content: "I was skeptical at first, but the AI truly learned my writing style. Now I can focus on strategy while ArticleForge handles the heavy lifting of content creation.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Digital Marketing Director",
    company: "GrowthLabs",
    avatar: "/avatars/lisa.jpg",
    content: "We've tried many AI writing tools, but none come close to ArticleForge. The personalization is unmatched, and the results speak for themselves.",
    rating: 5,
  },
  {
    name: "Alex Rivera",
    role: "Entrepreneur",
    company: "MultiVenture",
    avatar: "/avatars/alex.jpg",
    content: "Running multiple businesses means I need efficient tools. ArticleForge delivers consistent, high-quality content across all my brands. Game changer!",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-4/10 text-chart-4 text-sm font-medium mb-6">
            <Star className="h-4 w-4 fill-current" />
            Customer Stories
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Loved by content creators{" "}
            <span className="bg-gradient-to-r from-chart-4 to-chart-5 bg-clip-text text-transparent">
              worldwide
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about their experience with ArticleForge
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-chart-2/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative p-8 rounded-3xl bg-card border border-border hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                <Quote className="h-10 w-10 text-primary/20 mb-4" />
                <p className="text-muted-foreground leading-relaxed flex-grow mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-chart-4 text-chart-4" />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
