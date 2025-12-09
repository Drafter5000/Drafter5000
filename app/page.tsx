'use client';

import { Win95Window, Win95Button } from '@/components/win95';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [visitorNumber, setVisitorNumber] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Set random visitor number only on client
    setVisitorNumber(Math.floor(Math.random() * 9000) + 1000);

    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4">
      {/* Desktop Icons */}
      <div className="fixed top-4 left-4 flex flex-col gap-4 z-10">
        <Link href="/login" className="flex flex-col items-center gap-1 w-[70px] group">
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[24px]">🔐</div>
          <span className="text-[11px] text-center text-white bg-[var(--win95-title-bar)] px-1 group-hover:underline">
            Log In
          </span>
        </Link>
        <Link
          href="/articles/generate/step-1"
          className="flex flex-col items-center gap-1 w-[70px] group"
        >
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[24px]">✨</div>
          <span className="text-[11px] text-center text-white bg-[var(--win95-title-bar)] px-1 group-hover:underline">
            Get Started
          </span>
        </Link>
      </div>

      {/* Main Window */}
      <div className="max-w-[800px] mx-auto pt-8">
        <Win95Window
          title="Welcome to Drafter - Alexander's Personal Page"
          icon={<span>🏠</span>}
          showControls={true}
        >
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="win95-sunken p-2 text-center">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[24px]">🌟</span>
                <h1 className="text-[16px] font-bold text-[var(--win95-title-bar)]">
                  Welcome to Alexander's Homepage!
                </h1>
                <span className="text-[24px]">🌟</span>
              </div>
              <p className="text-[11px] mt-1">
                <span className="animate-pulse">★</span> Last updated: December 2025{' '}
                <span className="animate-pulse">★</span>
              </p>
            </div>

            {/* About Me Section */}
            <div className="win95-groupbox">
              <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                <legend className="win95-groupbox-title font-bold">👤 About Me</legend>
                <div className="flex gap-4 flex-wrap md:flex-nowrap">
                  <div className="win95-sunken p-2 flex-shrink-0">
                    <div className="w-[100px] h-[100px] bg-[var(--win95-bg-dark)] flex items-center justify-center text-[48px]">
                      👨‍💻
                    </div>
                  </div>
                  <div className="flex-1 text-[11px] space-y-2">
                    <p>
                      <strong>Name:</strong> Alexander
                    </p>
                    <p>
                      <strong>Location:</strong> 🇷🇺 Russia
                    </p>
                    <p>
                      <strong>Occupation:</strong> Creator of Drafter
                    </p>
                    <p>
                      <strong>Interests:</strong> AI, Writing, Technology
                    </p>
                    <hr className="border-[var(--win95-button-shadow)]" />
                    <p className="italic">
                      "Building tools that help people write better content with AI assistance."
                    </p>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* What is Drafter Section */}
            <div className="win95-groupbox">
              <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                <legend className="win95-groupbox-title font-bold">📄 What is Drafter?</legend>
                <div className="text-[11px] space-y-2">
                  <p>
                    <strong>Drafter</strong> is an AI-powered writing assistant that creates
                    articles that sound like <em>you</em> wrote them!
                  </p>
                  <div className="win95-sunken p-2 mt-2">
                    <p className="font-bold mb-1">✨ Key Features:</p>
                    <ul className="list-none space-y-1 ml-2">
                      <li>📝 Train AI on your writing style</li>
                      <li>🎯 Pick your favorite topics</li>
                      <li>📬 Get articles delivered to your inbox</li>
                      <li>⚡ Setup in just 3 minutes</li>
                    </ul>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* How It Works Section */}
            <div className="win95-groupbox">
              <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                <legend className="win95-groupbox-title font-bold">🔧 How It Works</legend>
                <div className="grid md:grid-cols-3 gap-3 text-[11px]">
                  <div className="win95-raised p-2 text-center">
                    <div className="text-[24px] mb-1">1️⃣</div>
                    <p className="font-bold">Define Your Style</p>
                    <p className="text-[10px] mt-1">Share examples of your writing</p>
                  </div>
                  <div className="win95-raised p-2 text-center">
                    <div className="text-[24px] mb-1">2️⃣</div>
                    <p className="font-bold">Choose Topics</p>
                    <p className="text-[10px] mt-1">Select what you want to write about</p>
                  </div>
                  <div className="win95-raised p-2 text-center">
                    <div className="text-[24px] mb-1">3️⃣</div>
                    <p className="font-bold">Get Articles</p>
                    <p className="text-[10px] mt-1">Receive content in your inbox</p>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Navigation Links */}
            <div className="win95-groupbox">
              <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                <legend className="win95-groupbox-title font-bold">🔗 Quick Links</legend>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link href="/articles/generate/step-1">
                    <Win95Button size="md">✨ Get Started Free</Win95Button>
                  </Link>
                  <Link href="/login">
                    <Win95Button size="md">🔐 Log In</Win95Button>
                  </Link>
                  <Link href="/pricing">
                    <Win95Button size="md">💰 Pricing</Win95Button>
                  </Link>
                </div>
              </fieldset>
            </div>

            {/* Guestbook / Stats Section */}
            <div className="win95-groupbox">
              <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                <legend className="win95-groupbox-title font-bold">📊 Stats</legend>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="win95-sunken p-2">
                    <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">10K+</div>
                    <div>Articles Generated</div>
                  </div>
                  <div className="win95-sunken p-2">
                    <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">500+</div>
                    <div>Happy Users</div>
                  </div>
                  <div className="win95-sunken p-2">
                    <div className="text-[16px] font-bold text-[var(--win95-title-bar)]">99%</div>
                    <div>Satisfaction</div>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Footer */}
            <div className="win95-status-bar flex justify-between items-center">
              <span className="text-[10px]">📧 Contact: alexander@drafter.app</span>
              <span className="text-[10px]">Made with ❤️ in Russia | © 2025</span>
            </div>

            {/* Visitor Counter (classic!) */}
            <div className="text-center text-[10px] py-2">
              <span className="win95-sunken px-2 py-1 inline-block">
                👁️ You are visitor #<span className="font-mono">000{visitorNumber ?? '----'}</span>
              </span>
            </div>

            {/* Classic Web 1.0 badges */}
            <div className="flex flex-wrap justify-center gap-2 pb-2">
              <div className="win95-raised px-2 py-1 text-[9px]">Best viewed in 800x600</div>
              <div className="win95-raised px-2 py-1 text-[9px]">🔊 Sound ON</div>
              <div className="win95-raised px-2 py-1 text-[9px]">Under Construction 🚧</div>
            </div>
          </div>
        </Win95Window>
      </div>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 win95-raised h-[28px] flex items-center px-1 z-50">
        <button className="win95-btn h-[22px] flex items-center gap-1 px-2 text-[11px] font-bold">
          <span className="text-[14px]">🪟</span>
          Start
        </button>
        <div className="flex-1 flex items-center gap-1 px-2">
          <div className="win95-sunken h-[20px] flex items-center px-2 text-[10px] flex-1 max-w-[200px]">
            <span>🏠</span>
            <span className="ml-1 truncate">Drafter - Alexander's Page</span>
          </div>
        </div>
        <div className="win95-sunken h-[20px] flex items-center px-2 text-[10px]">
          {currentTime || '--:--'}
        </div>
      </div>
    </div>
  );
}
