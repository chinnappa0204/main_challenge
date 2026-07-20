'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, Compass, Activity, Users, Trophy, Target, Zap, ArrowRight, Star, CheckCircle, TrendingUp
} from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { InterventionLog, EveningReflectionLog, UserProfile } from '@/lib/types';

interface TimeCategory {
  name: string;
  minutes: number;
  colorClass: string;
  icon: React.ReactNode;
}

export default function ReclaimedLife() {
  const router = useRouter();
  const [interventions] = useState<InterventionLog[]>(() => {
    if (typeof window !== 'undefined') {
      return storageRepository.getInterventions();
    }
    return [];
  });
  const [reflections] = useState<EveningReflectionLog[]>(() => {
    if (typeof window !== 'undefined') {
      return storageRepository.getEveningReflections();
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !storageRepository.getUserProfile()) {
      router.push('/onboarding');
    }
  }, [router]);

  const completedMissions = interventions.filter((l) => l.completed);
  const categoryMap: Record<string, number> = {};

  completedMissions.forEach((m) => {
    const title = m.missionTitle.toLowerCase();
    let category = 'Other Activities';

    if (title.includes('walk') || title.includes('outdoor') || title.includes('move')) category = 'Walking & Movement';
    else if (title.includes('music') || title.includes('song') || title.includes('listen')) category = 'Music & Listening';
    else if (title.includes('breath') || title.includes('calm') || title.includes('reset')) category = 'Breathing & Calm';
    else if (title.includes('connect') || title.includes('friend') || title.includes('call')) category = 'Social Connection';
    else if (title.includes('read') || title.includes('book') || title.includes('learn')) category = 'Reading & Learning';
    else if (title.includes('sketch') || title.includes('draw') || title.includes('photo') || title.includes('create')) category = 'Creative Activities';

    categoryMap[category] = (categoryMap[category] || 0) + m.availableTime;
  });

  const colors: Record<string, string> = {
    'Walking & Movement': 'var(--success)',
    'Music & Listening': 'var(--accent-blue-mid)',
    'Breathing & Calm': 'var(--accent-blue)',
    'Social Connection': 'var(--accent-orange)',
    'Reading & Learning': 'var(--warning)',
    'Creative Activities': '#8b5cf6',
    'Other Activities': 'var(--text-secondary)',
  };

  const icons: Record<string, React.ReactNode> = {
    'Walking & Movement': <Activity className="h-4 w-4" />,
    'Music & Listening': <Star className="h-4 w-4" />,
    'Breathing & Calm': <Zap className="h-4 w-4" />,
    'Social Connection': <Users className="h-4 w-4" />,
    'Reading & Learning': <TrendingUp className="h-4 w-4" />,
    'Creative Activities': <Trophy className="h-4 w-4" />,
    'Other Activities': <Compass className="h-4 w-4" />,
  };

  const timeCategories: TimeCategory[] = Object.entries(categoryMap)
    .map(([name, minutes]) => ({
      name,
      minutes,
      colorClass: colors[name] || 'var(--text-muted)',
      icon: icons[name] || <Compass className="h-4 w-4" />,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const totalReclaimedMins = reflections.reduce((sum, r) => sum + r.reclaimedTimeMinutes, 0);
  const totalReclaimedHours = Math.floor(totalReclaimedMins / 60);
  const totalReclaimedRemMins = totalReclaimedMins % 60;

  const completedInterventions = interventions.filter((i) => i.completed).length;
  const totalInterventions = interventions.length;

  const milestones = [
    { label: 'First Step Away', achieved: totalInterventions >= 1, icon: <Compass className="h-5 w-5" /> },
    { label: '5 Missions Complete', achieved: completedInterventions >= 5, icon: <CheckCircle className="h-5 w-5" /> },
    { label: '30 Minutes Reclaimed', achieved: totalReclaimedMins >= 30, icon: <Clock className="h-5 w-5" /> },
    { label: '3 Hours Reclaimed', achieved: totalReclaimedMins >= 180, icon: <Trophy className="h-5 w-5" /> },
    { label: 'First Social Connection', achieved: interventions.some(i => i.missionTitle.toLowerCase().includes('connect') || i.missionTitle.toLowerCase().includes('friend')), icon: <Users className="h-5 w-5" /> },
    { label: '7 Days of Reflections', achieved: reflections.length >= 7, icon: <Star className="h-5 w-5" /> },
  ];

  const achievedCount = milestones.filter((m) => m.achieved).length;

  const purposePathSteps = [
    { label: 'Harmful habit recognized', done: totalInterventions > 0 },
    { label: 'Time reclaimed from screen', done: totalReclaimedMins > 0 },
    { label: 'Real-world activity started', done: completedInterventions > 0 },
    { label: 'Progress measured & logged', done: reflections.length > 0 },
  ];

  const hasRealData = totalInterventions > 0 || reflections.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 fade-in" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Wave Decorative shapes */}
      <div className="wave-container">
        <div className="wave-blue" style={{ opacity: 0.2 }} />
      </div>

      <div className="border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <span className="badge badge-blue">Reclaimed Life Dashboard</span>
        <h1 className="text-2xl font-extrabold mt-2" style={{ color: 'var(--text-primary)' }}>Your Recovered Time</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Track the minutes you take back from habit loops, spent on what truly matters.</p>
      </div>

      {!hasRealData ? (
        /* Empty State */
        <div className="card p-12 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-blue-light)' }}>
            <Compass className="h-8 w-8" style={{ color: 'var(--accent-blue-mid)' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No reclaimed activity recorded yet</h2>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your completed offline missions and recovered time will appear here. Start your first redirect activity to begin.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer"
          >
            Go to Today <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Time Reclaimed',
                value: totalReclaimedHours > 0 ? `${totalReclaimedHours}h ${totalReclaimedRemMins}m` : `${totalReclaimedMins}m`,
                sub: 'recovered from screen time',
                icon: <Clock className="h-4.5 w-4.5" />,
                bg: 'var(--success-light)',
                color: 'var(--success)',
              },
              {
                label: 'Missions Completed',
                value: completedInterventions,
                sub: `out of ${totalInterventions} starts`,
                icon: <CheckCircle className="h-4.5 w-4.5" />,
                bg: 'var(--accent-blue-light)',
                color: 'var(--accent-blue-mid)',
              },
              {
                label: 'Milestones Unlocked',
                value: `${achievedCount} / ${milestones.length}`,
                sub: 'milestones unlocked',
                icon: <Trophy className="h-4.5 w-4.5" />,
                bg: 'var(--accent-orange-light)',
                color: 'var(--accent-orange)',
              },
              {
                label: 'Check-in Streak',
                value: reflections.length,
                sub: 'evening logs submitted',
                icon: <Target className="h-4.5 w-4.5" />,
                bg: 'var(--success-light)',
                color: 'var(--success)',
              },
            ].map((stat) => (
              <div key={stat.label} className="card p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg, color: stat.color }}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reinvested Time category breakdown */}
            <div className="card p-6 space-y-5">
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Reclaimed Time Distribution</h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>How your recovered screen minutes are being reinvested</p>
              </div>

              {timeCategories.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Complete more missions to see activity categories.</p>
              ) : (
                <div className="space-y-4">
                  {timeCategories.map((cat) => {
                    const totalCatMins = timeCategories.reduce((s, c) => s + c.minutes, 0);
                    const pct = totalCatMins > 0 ? Math.round((cat.minutes / totalCatMins) * 100) : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            {cat.icon}
                            <span>{cat.name}</span>
                          </div>
                          <span className="font-semibold">{cat.minutes} min ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full" style={{ background: 'var(--bg-subtle)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: cat.colorClass }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Purpose Path */}
            <div className="card p-6 space-y-5">
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Purpose Path</h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Visual path from acknowledging the habit to reclaiming offline life</p>
              </div>

              <div className="relative space-y-0 pl-1">
                {purposePathSteps.map((step, index) => (
                  <div key={step.label} className="flex items-start gap-4 relative">
                    {index < purposePathSteps.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 z-0" style={{ background: 'var(--border)' }} />
                    )}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                      style={{
                        borderColor: step.done ? 'var(--accent-blue-mid)' : 'var(--border)',
                        background: step.done ? 'var(--accent-blue-light)' : '#fff',
                        color: step.done ? 'var(--accent-blue-mid)' : 'var(--text-muted)',
                      }}>
                      {step.done ? <CheckCircle className="h-4.5 w-4.5" /> : <span className="text-xs font-bold">{index + 1}</span>}
                    </div>
                    <div className="pb-6 pt-1">
                      <p className="text-xs font-semibold" style={{ color: step.done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {step.label}
                      </p>
                      {step.done && (
                        <span className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>Complete</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Milestones grid */}
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Personal Milestones</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Celebrate small steps of off-screen persistence</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {milestones.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border p-4 transition-all flex flex-col items-center text-center space-y-2"
                  style={{
                    borderColor: m.achieved ? 'var(--accent-blue-border)' : 'var(--border)',
                    background: m.achieved ? 'var(--accent-blue-light)' : '#fff',
                  }}
                >
                  <div style={{ color: m.achieved ? 'var(--accent-blue-mid)' : 'var(--text-muted)' }}>
                    {m.icon}
                  </div>
                  <p className="text-xs font-bold" style={{ color: m.achieved ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.label}</p>
                  {m.achieved && (
                    <span className="badge badge-green text-[9px]">Unlocked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
