'use client';

import { useEffect, useState } from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessHours {
  id: string;
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface ContactSettings {
  email: string | null;
  emailCategory: string | null;
  location: string | null;
  locationCategory: string | null;
  businessHours: BusinessHours[] | null;
  businessHoursCategory: string | null;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

function formatBusinessHours(hours: BusinessHours[]): { days: string; time: string }[] {
  const groups: { days: string[]; openTime: string; closeTime: string; isClosed: boolean }[] = [];

  hours.forEach(h => {
    const lastGroup = groups[groups.length - 1];
    if (
      lastGroup &&
      lastGroup.openTime === h.openTime &&
      lastGroup.closeTime === h.closeTime &&
      lastGroup.isClosed === h.isClosed
    ) {
      lastGroup.days.push(h.day);
    } else {
      groups.push({
        days: [h.day],
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      });
    }
  });

  return groups.map(g => {
    const dayRange = g.days.length > 1 ? `${g.days[0]} - ${g.days[g.days.length - 1]}` : g.days[0];
    const time = g.isClosed ? 'Closed' : `${formatTime(g.openTime)} - ${formatTime(g.closeTime)}`;
    return { days: dayRange, time };
  });
}

export function ContactInfo() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/contact-settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching contact settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Email skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {/* Location skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
        {/* Business hours skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
    );
  }

  const hasAnyInfo = settings?.email || settings?.location || settings?.businessHours;

  if (!hasAnyInfo) {
    return null;
  }

  return (
    <div className="space-y-6">
      {settings?.email && (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Email</h3>
            <a
              href={`mailto:${settings.email}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {settings.email}
            </a>
          </div>
        </div>
      )}

      {settings?.location && (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Location</h3>
            <p className="text-muted-foreground whitespace-pre-line">{settings.location}</p>
          </div>
        </div>
      )}

      {settings?.businessHours && settings.businessHours.length > 0 && (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Business Hours</h3>
            <div className="text-muted-foreground space-y-1">
              {formatBusinessHours(settings.businessHours).map((group, idx) => (
                <p key={idx}>
                  {group.days}
                  <br />
                  {group.time}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
