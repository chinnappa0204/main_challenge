'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Check, X, Sparkles } from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { NudgeLog, NudgeStatus } from '@/lib/types';

export default function NudgeBanner() {
  const [nudge, setNudge] = useState<NudgeLog | null>(() => {
    if (typeof window !== 'undefined') {
      return storageRepository.getNudges().find((n) => n.status === 'pending') || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [thanked, setThanked] = useState(false);

  const fetchNudge = async () => {
    setLoading(true);
    setThanked(false);
    const profile = storageRepository.getUserProfile();
    if (!profile) return;

    const interventions = storageRepository.getInterventions();
    const reflections   = storageRepository.getEveningReflections();

    const successfulActivities = Array.from(
      new Set(interventions.filter((i) => i.completed && i.helped).map((i) => i.missionTitle))
    ).slice(0, 3);
    const unsuccessfulActivities = Array.from(
      new Set(interventions.filter((i) => !i.completed || i.helped === false).map((i) => i.missionTitle))
    ).slice(0, 3);
    const recentTriggers = reflections.map((r) => r.strongestTrigger).slice(0, 3);

    try {
      const res = await fetch('/api/nudge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, successfulActivities, unsuccessfulActivities, recentTriggers }),
      });
      if (res.ok) {
        const data = await res.json();
        const newNudge: NudgeLog = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          content: data.content,
          status: 'pending',
        };
        storageRepository.saveNudge(newNudge);
        setNudge(newNudge);
      }
    } catch (e) {
      console.error('Nudge fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!nudge) {
      setTimeout(() => {
        fetchNudge();
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = (status: NudgeStatus) => {
    if (!nudge) return;
    storageRepository.updateNudgeStatus(nudge.id, status);
    if (status === 'helpful') { setThanked(true); setTimeout(() => setNudge(null), 2500); }
    else if (status === 'dismissed') setNudge(null);
    else fetchNudge();
  };

  if (!nudge) return null;

  return (
    <div className="card fade-in relative overflow-hidden" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
      <div className="wave-blue-sm" />
      <div className="flex gap-3 p-4 relative z-10">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}
        >
          <Lightbulb className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue-mid)' }}>
              Personalized Nudge
            </span>
            <Sparkles className="h-2.5 w-2.5" style={{ color: 'var(--accent-blue)' }} />
          </div>

          {loading ? (
            <div className="h-4 w-3/4 rounded-md animate-pulse" style={{ background: 'var(--bg-subtle)' }} />
          ) : thanked ? (
            <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
              Noted! We will suggest similar activities next time.
            </p>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{nudge.content}</p>
          )}

          {!thanked && !loading && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              <button onClick={() => act('helpful')} className="btn-primary flex items-center gap-1 px-3 py-1 text-xs cursor-pointer">
                <Check className="h-3 w-3" /> Helpful
              </button>
              <button onClick={() => act('requested_easier')} className="btn-secondary px-3 py-1 text-xs cursor-pointer">Make easier</button>
              <button onClick={() => act('requested_another')} className="btn-secondary px-3 py-1 text-xs cursor-pointer">Another suggestion</button>
              <button onClick={() => act('dismissed')} title="Dismiss" className="p-1 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
