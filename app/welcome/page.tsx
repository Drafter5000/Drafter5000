'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Calendar, Mail, ArrowRight, Sparkles, Clock, Loader2 } from 'lucide-react';

// Day names for display
const DAY_NAMES: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

// Day order for finding next delivery day
const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface UserData {
  email: string;
  deliveryDays: string[];
  nextDeliveryDay: string;
  displayName: string;
}

function getNextDeliveryDay(deliveryDays: string[]): string {
  if (!deliveryDays || deliveryDays.length === 0) {
    return 'your next scheduled day';
  }

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();

  // If it's before 9 AM and today is a delivery day, today is the next delivery
  const todayCode = DAY_ORDER[currentDayIndex];
  if (currentHour < 9 && deliveryDays.includes(todayCode)) {
    return `Today (${DAY_NAMES[todayCode]})`;
  }

  // Find the next delivery day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayCode = DAY_ORDER[nextDayIndex];
    if (deliveryDays.includes(nextDayCode)) {
      if (i === 1) {
        return `Tomorrow (${DAY_NAMES[nextDayCode]})`;
      }
      return DAY_NAMES[nextDayCode];
    }
  }

  return 'your next scheduled day';
}

function WelcomeContent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchUserData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user's article style to get delivery days
        const styles = await apiClient.get<
          Array<{
            email: string;
            display_name: string;
            delivery_days: string[];
          }>
        >(`/article-styles?user_id=${user.id}`);

        const style = styles[0];

        if (style) {
          const deliveryDays = style.delivery_days || [];
          setUserData({
            email: style.email || user.email || '',
            deliveryDays,
            nextDeliveryDay: getNextDeliveryDay(deliveryDays),
            displayName: style.display_name || user.email?.split('@')[0] || 'there',
          });
        } else {
          setUserData({
            email: user.email || '',
            deliveryDays: [],
            nextDeliveryDay: 'your next scheduled day',
            displayName: user.email?.split('@')[0] || 'there',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white overflow-hidden relative">
        <Header />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <main className="pt-32 pb-20 px-6 relative z-10">
          <div className="max-w-lg mx-auto">
            <Card className="border border-gray-200 shadow-2xl">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="text-center space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                  <Skeleton className="h-8 w-64 mx-auto" />
                  <Skeleton className="h-5 w-80 mx-auto" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-12 w-48 mx-auto rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden relative">
      <Header />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-32 left-[10%] w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/10 shadow-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{ animation: mounted ? 'float 6s ease-in-out infinite' : 'none' }}
        />
        <div
          className={`absolute top-48 right-[15%] w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-lg transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{ animation: mounted ? 'float 7s ease-in-out infinite reverse' : 'none' }}
        />
        <div
          className={`absolute bottom-40 left-[20%] w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-400/20 to-violet-500/10 shadow-lg transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ animation: mounted ? 'float 8s ease-in-out infinite' : 'none' }}
        />
      </div>

      <main className="pt-32 pb-20 px-6 relative z-10">
        <Card
          className={`max-w-lg mx-auto border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/90 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <CardContent className="pt-8 pb-8 px-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div
                className={`inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 shadow-xl shadow-emerald-500/30 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Congratulations! 🎉
              </h1>
              <p className="text-gray-600">Your account is all set up, {userData?.displayName}!</p>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 mb-8">
              {/* Next Article Generation */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Your first article</p>
                    <p className="font-semibold text-gray-900">{userData?.nextDeliveryDay}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>at 09:00 EST</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Delivery */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Delivered to</p>
                    <p className="font-semibold text-gray-900 break-all">
                      {userData?.email || 'your email'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Message */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 border border-purple-200/50 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">Your AI is ready</span>
              </div>
              <p className="text-sm text-gray-600">
                Your bespoke AI has learned your writing style and will generate personalized
                articles based on your topics.
              </p>
            </div>

            {/* Dashboard Link */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Want to modify your settings or add more topics?
              </p>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/25 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
