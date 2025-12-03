"use client"

import { motion } from "framer-motion"

const brands = [
  { name: "TechCrunch", logo: "TC" },
  { name: "Forbes", logo: "F" },
  { name: "Wired", logo: "W" },
  { name: "The Verge", logo: "TV" },
  { name: "Mashable", logo: "M" },
  { name: "Engadget", logo: "E" },
]

export function BrandsSection() {
  return (
    <section className="py-16 px-6 border-y border-border/50 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-10"
        >
          Trusted by content teams at leading companies
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {brands.map((brand, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">
                {brand.logo}
              </div>
              <span className="font-semibold text-lg hidden sm:inline">{brand.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
