'use client';

import { motion } from 'framer-motion';
import { HelpCircle, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'How does Drafter learn my writing style?',
    answer:
      'Simply paste 2-3 of your existing articles or writing samples. Our AI analyzes your vocabulary, sentence structure, tone, and unique patterns to create a personalized writing model that captures your authentic voice.',
  },
  {
    question: 'Can I edit the generated articles?',
    answer:
      'Absolutely! All generated articles are delivered to your inbox where you can review, edit, and refine them before publishing. You have complete control over the final content.',
  },
  {
    question: 'What topics can Drafter write about?',
    answer:
      'Drafter can write about virtually any topic. You can choose from AI-suggested topics based on your niche, or add your own custom topics. Our AI is trained on diverse subjects and can adapt to your specific industry.',
  },
  {
    question: 'Is the content plagiarism-free?',
    answer:
      'Yes, 100%. Every article is generated from scratch based on your style and topics. All content passes plagiarism detection tools and is completely original.',
  },
  {
    question: 'How many articles can I generate per month?',
    answer:
      'It depends on your plan. The free tier includes 5 articles/month, Pro includes 50 articles/month, and Enterprise offers unlimited generation. Check our pricing page for full details.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time with no questions asked. Your access will continue until the end of your billing period.',
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-b border-border last:border-0"
    >
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="font-semibold text-lg pr-8 group-hover:text-primary transition-colors">
          {question}
        </span>
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
            isOpen ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-6 text-muted-foreground leading-relaxed pr-12">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 px-6 bg-secondary/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-3/10 text-chart-3 text-sm font-medium mb-6">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently asked{' '}
            <span className="bg-gradient-to-r from-chart-3 to-primary bg-clip-text text-transparent">
              questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">Everything you need to know about Drafter</p>
        </motion.div>

        <div className="bg-card rounded-3xl border border-border p-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
