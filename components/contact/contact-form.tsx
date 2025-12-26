'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient, APIError } from '@/lib/api-client';
import { CheckCircle2, Loader2 } from 'lucide-react';

export type ContactCategory = string;

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: ContactCategory;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  category?: string;
  message?: string;
}

// Fallback categories if API fails
const DEFAULT_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'sales', label: 'Sales Question' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'other', label: 'Other' },
];

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  category: '',
  message: '',
};

interface ContactFormProps {
  onSuccess?: () => void;
}

export function ContactForm({ onSuccess }: ContactFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/contact-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            const formattedCategories = data.categories.map((cat: string) => ({
              value: cat,
              label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '),
            }));
            setCategories(formattedCategories);
          } else {
            setCategories(DEFAULT_CATEGORIES);
          }
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone.trim() && !/^[\d\s\-+()]{7,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);

    // Focus first error field
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0] as keyof ContactFormErrors;
      const refMap: Record<
        string,
        React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
      > = {
        name: nameRef,
        email: emailRef,
        subject: subjectRef,
        message: messageRef,
      };
      refMap[firstError]?.current?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Reset success state when user starts editing
    if (isSuccess) {
      setIsSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim(),
      });

      setIsSuccess(true);
      setFormData(initialFormData);
      setErrors({});

      toast({
        title: 'Message sent successfully!',
        description: "Thank you for reaching out. We'll get back to you soon.",
      });

      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error instanceof APIError
          ? error.message
          : 'Failed to send message. Please try again later.';

      toast({
        title: 'Failed to send message',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12 px-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
          Message Sent Successfully!
        </h3>
        <p className="text-green-700 dark:text-green-300 mb-6">
          Thank you for contacting us. We&apos;ll get back to you as soon as possible.
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSuccess(false)}
          className="border-green-600 text-green-700 hover:bg-green-100 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-950"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={nameRef}
            id="contact-name"
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            className={errors.name ? 'border-destructive' : ''}
            maxLength={100}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={emailRef}
            id="contact-email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={e => handleChange('email', e.target.value)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            className={errors.email ? 'border-destructive' : ''}
            maxLength={254}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Field (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone (Optional)</Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={e => handleChange('phone', e.target.value)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            aria-invalid={!!errors.phone}
            className={errors.phone ? 'border-destructive' : ''}
            maxLength={20}
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm text-destructive" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={value => handleChange('category', value)}
            disabled={loadingCategories}
          >
            <SelectTrigger
              id="contact-category"
              aria-describedby={errors.category ? 'category-error' : undefined}
              aria-invalid={!!errors.category}
              className={errors.category ? 'border-destructive' : ''}
            >
              <SelectValue placeholder={loadingCategories ? 'Loading...' : 'Select a category'} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p id="category-error" className="text-sm text-destructive" role="alert">
              {errors.category}
            </p>
          )}
        </div>
      </div>

      {/* Subject Field */}
      <div className="space-y-2">
        <Label htmlFor="contact-subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          ref={subjectRef}
          id="contact-subject"
          type="text"
          placeholder="What is this about?"
          value={formData.subject}
          onChange={e => handleChange('subject', e.target.value)}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          aria-invalid={!!errors.subject}
          className={errors.subject ? 'border-destructive' : ''}
          maxLength={200}
        />
        {errors.subject && (
          <p id="subject-error" className="text-sm text-destructive" role="alert">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <Label htmlFor="contact-message">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          ref={messageRef}
          id="contact-message"
          placeholder="Tell us how we can help you..."
          value={formData.message}
          onChange={e => handleChange('message', e.target.value)}
          aria-describedby={errors.message ? 'message-error' : undefined}
          aria-invalid={!!errors.message}
          className={`min-h-[150px] resize-y ${errors.message ? 'border-destructive' : ''}`}
          maxLength={5000}
        />
        {errors.message && (
          <p id="message-error" className="text-sm text-destructive" role="alert">
            {errors.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{formData.message.length}/5000 characters</p>
      </div>

      {/* Submit Button */}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </Button>
    </form>
  );
}
