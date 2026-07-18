'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Lightbulb, FlaskConical, Eye, Compass, Clock, Zap } from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { InterventionLog, EveningReflectionLog, UserProfile } from '@/lib/types';
import AnalyticsGate from '@/components/AnalyticsGate';

const DEMO_URGE_DATA = [
  { date: 'Mon', before: 8, after: 4, reclaimed: 20 },
  { date: 'Tue', before: 7, after: 3, reclaimed: 30 },
  { date: 'Wed', before: 9, after: 5, reclaimed: 15 },
  { date: 'Thu', before: 6, after: 2, reclaimed: 45 },
  { date: 'Fri', before: 8, after: 4, reclaimed: 25 },
  { date: 'Sat', before: 5, after: 1, reclaimed: 60 },
  { date: 'Sun', before: 7, after: 3, reclaimed: 40 },
];

const DEMO_ACTIVITY_DATA = [
  { name: 'Walking', effectiveness: 4.2 },
  { name: 'Music', effectiveness: 3.8 },
  { name: 'Breathing', effectiveness: 3.5 },
  { name: 'Calling Friend', effectiveness: 4.5 },
  { name: 'Reading', effectiveness: 1.2 },
];

const DEMO_MOOD_DATA = [
  { day: 'Mon', mood: 5 },
  { day: 'Tue', mood: 6 },
  { day: 'Wed', mood: 4 },
  { day: 'Thu', mood: 7 },
  { day: 'Fri', mood: 6 },
  { day: 'Sat', mood: 8 },
  { day: 'Sun', mood: 7 },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
};

export default function Insights() {
  const router = useRouter();
  const [profile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return storageRepository.getUserProfile();
    }
    return null;
  });
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
  const [useDemoMode, setUseDemoMode] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.push('/onboarding');
    }
  }, [router, profile]);

  // Data computations
  const getUrgeData = () => {
    if (useDemoMode) return DEMO_URGE_DATA;
    return reflections.slice(-7).map((r, i) => {
      const dayInterventions = interventions.filter((iv) => iv.timestamp.startsWith(r.date));
      const avgBefore = dayInterventions.length
        ? dayInterventions.reduce((s, iv) => s + iv.initialUrge, 0) / dayInterventions.length
        : 0;
      const avgAfter = dayInterventions.filter((iv) => iv.finalUrge).length
        ? dayInterventions.filter((iv) => iv.finalUrge).reduce((s, iv) => s + (iv.finalUrge || 0), 0) /
          dayInterventions.filter((iv) => iv.finalUrge).length
        : 0;
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      return {
        date: days[new Date(r.date).getDay()] || `Day ${i + 1}`,
        before: Math.round(avgBefore * 10) / 10,
        after: Math.round(avgAfter * 10) / 10,
        reclaimed: r.reclaimedTimeMinutes,
      };
    });
  };

  const getActivityData = () => {
    if (useDemoMode) return DEMO_ACTIVITY_DATA;
    const activityMap: Record<string, { totalReduction: number; count: number }> = {};
    interventions
      .filter((i) => i.finalUrge !== undefined && i.completed)
      .forEach((i) => {
        const key = i.missionTitle;
        const reduction = i.initialUrge - (i.finalUrge || i.initialUrge);
        if (!activityMap[key]) activityMap[key] = { totalReduction: 0, count: 0 };
        activityMap[key].totalReduction += reduction;
        activityMap[key].count += 1;
      });
    return Object.entries(activityMap).map(([name, data]) => ({
      name: name.length > 15 ? name.slice(0, 15) + '…' : name,
      effectiveness: Math.round((data.totalReduction / data.count) * 10) / 10,
    }));
  };

  const getMoodData = () => {
    if (useDemoMode) return DEMO_MOOD_DATA;
    const moodMap: Record<string, number> = { better: 7, same: 5, worse: 3 };
    return reflections.slice(-7).map((r, i) => {
      const dayInterventions = interventions.filter((iv) => iv.timestamp.startsWith(r.date) && iv.moodAfter);
      const dayMoodScore = dayInterventions.length
        ? dayInterventions.reduce((sum, iv) => sum + (moodMap[iv.moodAfter || 'same'] || 5), 0) / dayInterventions.length
        : 5;
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      return {
        day: days[new Date(r.date).getDay()] || `Day ${i + 1}`,
        mood: Math.min(10, Math.max(1, dayMoodScore)),
      };
    });
  };

  // Real data metrics lengths for gates
  const realReflectionsCount   = reflections.length;
  const realInterventionsCount = interventions.filter((i) => i.completed).length;

  // Render stats
  const checkinsCount = useDemoMode ? 7 : realReflectionsCount;
  const missionStarts = useDemoMode ? 10 : interventions.length;
  const missionCompletes = useDemoMode ? 8 : realInterventionsCount;

  const totalReclaimed = useDemoMode
    ? 240
    : reflections.reduce((sum, r) => sum + r.reclaimedTimeMinutes, 0);

  const getPatternSentence = () => {
    if (useDemoMode) {
      return 'Boredom is your strongest trigger. Reset activities like Walking outdoors and Calling a Friend show the highest urge reduction.';
    }
    if (realReflectionsCount < 2) return '';
    const triggerCounts: Record<string, number> = {};
    reflections.forEach((r) => {
      triggerCounts[r.strongestTrigger] = (triggerCounts[r.strongestTrigger] || 0) + 1;
    });
    const top = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      return `"${top[0]}" is your most frequently reported trigger (${top[1]} times).`;
    }
    return '';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 fade-in" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Decorative Wave */}
      <div className="wave-container">
        <div className="wave-blue" style={{ opacity: 0.15 }} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <div>
          <span className="badge badge-blue">Deterministic Analytics</span>
          <h1 className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>Behaviour Insights</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Observe patterns, compare urge shifts, and evaluate replacement activities.</p>
        </div>

        <div className="flex items-center gap-3">
          {useDemoMode && (
            <span className="badge badge-orange flex items-center gap-1">
              <FlaskConical className="h-3 w-3" />
              Demonstration dataset
            </span>
          )}
          <button
            onClick={() => setUseDemoMode(!useDemoMode)}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            {useDemoMode ? 'Exit demo mode' : 'Preview Demo Mode'}
          </button>
        </div>
      </div>

      {/* Summary Insights banner */}
      <div className="card p-5 relative overflow-hidden" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
        <div className="relative z-10 flex gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}>
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Daily Progress Overview</h2>
            <div className="flex gap-6 flex-wrap mt-2">
              <div><span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Missions completed</span><span className="text-sm font-bold">{missionCompletes} of {missionStarts}</span></div>
              <div><span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Time Reclaimed</span><span className="text-sm font-bold">{totalReclaimed} min</span></div>
              <div><span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Evening reflections</span><span className="text-sm font-bold">{checkinsCount}</span></div>
            </div>
            {getPatternSentence() && (
              <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong>AI Trend observation:</strong> {getPatternSentence()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Urge shifts before/after */}
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Urge Shift comparison</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Comparison of urge scores before and after missions (requires 1+ completed check-in)</p>
          </div>

          <AnalyticsGate
            dataPoints={useDemoMode ? 5 : realInterventionsCount}
            minRequired={1}
            emptyIcon={Zap}
            emptyTitle="Urge shift comparison"
            emptyDescription="Your insights will appear after your first few check-ins."
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getUrgeData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="before" stroke="var(--error)" strokeWidth={2} dot={{ r: 3 }} name="Before Mission" />
                <Line type="monotone" dataKey="after" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} name="After Mission" />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsGate>
        </div>

        {/* Chart 2: Activity effectiveness */}
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Intervention Effectiveness</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Average urge reduction by activity type (requires 2+ completed missions)</p>
          </div>

          <AnalyticsGate
            dataPoints={useDemoMode ? 5 : realInterventionsCount}
            minRequired={2}
            emptyIcon={Compass}
            emptyTitle="Intervention effectiveness breakdown"
            emptyDescription="Complete real-life redirect missions and evening reflections to help Reclaim AI identify patterns that are specific to you."
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getActivityData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="effectiveness" fill="var(--accent-blue-mid)" radius={[0, 4, 4, 0]} name="Urge Reduction (points)" />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsGate>
        </div>

        {/* Chart 3: Mood shift trend */}
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Mood Trend</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Emotional state trend score (requires 3+ reflections)</p>
          </div>

          <AnalyticsGate
            dataPoints={useDemoMode ? 5 : realReflectionsCount}
            minRequired={3}
            emptyIcon={Lightbulb}
            emptyTitle="Mood trend analytics"
            emptyDescription="Keep logging your evening reflections to generate emotional shifts trends."
          >
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={getMoodData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Mood Score" />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsGate>
        </div>

        {/* Chart 4: Reclaimed time progression */}
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Daily Reclaimed Minutes</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Accumulated reclaimed time (requires 3+ reflections)</p>
          </div>

          <AnalyticsGate
            dataPoints={useDemoMode ? 5 : realReflectionsCount}
            minRequired={3}
            emptyIcon={Clock}
            emptyTitle="Daily reclaimed time graph"
            emptyDescription="Log your evening recovered time to see your offline progress progression."
          >
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={getUrgeData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="reclaimed" fill="var(--success)" radius={[4, 4, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsGate>
        </div>
      </div>
    </div>
  );
}
