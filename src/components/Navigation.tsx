'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, TrendingUp, Heart, MessageSquare, Compass, LogOut, Gamepad2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { storageRepository } from '@/lib/storage';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!storageRepository.getUserProfile();
    }
    return false;
  });

  useEffect(() => {
    setTimeout(() => {
      setHasProfile(!!storageRepository.getUserProfile());
    }, 0);
  }, [pathname]);

  const handleReset = () => {
    if (confirm('Reset all your Reclaim AI data? This cannot be undone.')) {
      storageRepository.clearAll();
      router.push('/onboarding');
    }
  };

  const navItems = [
    { name: 'Today',         path: '/',              icon: Calendar },
    { name: 'Games',         path: '/games',          icon: Gamepad2 },
    { name: 'Reclaimed',     path: '/reclaimed-life', icon: Compass },
    { name: 'Insights',      path: '/insights',       icon: TrendingUp },
    { name: 'Companion',     path: '/companion',      icon: MessageSquare },
    { name: 'Support',       path: '/support',        icon: Heart },
  ];

  if (pathname === '/onboarding' || pathname === '/exit-mode') return null;

  return (
    <>
      {/* Desktop top bar */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-15 items-center justify-between py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span
                className="text-lg font-extrabold tracking-tight"
                style={{ color: 'var(--accent-blue-mid)' }}
              >
                Reclaim AI
              </span>
              <span className="badge badge-blue hidden sm:inline-flex">Companion</span>
            </Link>

            {/* Desktop nav links */}
            {hasProfile && (
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(({ name, path, icon: Icon }) => {
                  const active = pathname === path;
                  return (
                    <Link
                      key={path}
                      href={path}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: active ? 'var(--accent-blue-light)' : 'transparent',
                        color: active ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {name}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Reset button */}
            {hasProfile && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                style={{
                  borderColor: 'var(--error-border)',
                  color: 'var(--error)',
                  background: 'transparent',
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      {hasProfile && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 border-t"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-w-[52px]"
                style={{
                  color: active ? 'var(--accent-blue-mid)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-blue-light)' : 'transparent',
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-semibold">{name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
