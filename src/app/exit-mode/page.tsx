'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, CheckCircle, X, Pause, Play, PhoneOff } from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { InterventionLog, UrgeIntensity } from '@/lib/types';

function ExitModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interventionId = searchParams.get('id');

  const [intervention] = useState<InterventionLog | null>(() => {
    if (typeof window !== 'undefined' && interventionId) {
      const logs = storageRepository.getInterventions();
      return logs.find((l) => l.id === interventionId) || null;
    }
    return null;
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined' && interventionId) {
      const logs = storageRepository.getInterventions();
      const found = logs.find((l) => l.id === interventionId);
      return found ? found.availableTime * 60 : 0;
    }
    return 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);

  // Urge Surfing sub-flow before countdown starts
  const [isUrgeSurfing, setIsUrgeSurfing] = useState(true);
  const [surfTimer, setSurfTimer] = useState(90); // 90-second clinical urge surfing technique
  const [surfComplete, setSurfComplete] = useState(false);

  // Post-mission feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [finalUrge, setFinalUrge] = useState<UrgeIntensity>(5);
  const [moodAfter, setMoodAfter] = useState('same');
  const [helped, setHelped] = useState<boolean>(true);
  const [missionCompleted, setMissionCompleted] = useState<boolean>(true);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const surfIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!interventionId) {
      router.push('/');
      return;
    }

    if (!intervention) {
      router.push('/');
      return;
    }

    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (surfIntervalRef.current) clearInterval(surfIntervalRef.current);
    };
  }, [interventionId, router, intervention]);

  // Urge Surfing Timer
  useEffect(() => {
    if (isUrgeSurfing && surfTimer > 0) {
      surfIntervalRef.current = setInterval(() => {
        setSurfTimer((prev) => {
          if (prev <= 1) {
            clearInterval(surfIntervalRef.current!);
            setSurfComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (surfIntervalRef.current) clearInterval(surfIntervalRef.current);
    }
    return () => {
      if (surfIntervalRef.current) clearInterval(surfIntervalRef.current);
    };
  }, [isUrgeSurfing, surfTimer]);

  // Main countdown timer
  useEffect(() => {
    if (isUrgeSurfing) return;
    if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setShowFeedback(true);
            setIsDimmed(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, timeLeft, isUrgeSurfing]);

  const resetDimTimer = () => {
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    setIsDimmed(false);
    dimTimerRef.current = setTimeout(() => {
      setIsDimmed(true);
    }, 10000); // 10 seconds to dim
  };

  useEffect(() => {
    if (isUrgeSurfing || showFeedback) return;
    setTimeout(() => {
      resetDimTimer();
    }, 0);
    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    };
  }, [isUrgeSurfing, showFeedback]);

  const handleStartMission = () => {
    setIsUrgeSurfing(false);
    resetDimTimer();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndEarly = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsDimmed(false);
    setShowFeedback(true);
  };

  const handleSaveFeedback = () => {
    if (!intervention) return;

    storageRepository.updateIntervention(intervention.id, {
      finalUrge,
      moodAfter,
      helped,
      completed: missionCompleted,
      notes: feedbackNotes,
    });

    router.push('/');
  };

  const progressPercent = intervention
    ? ((intervention.availableTime * 60 - timeLeft) / (intervention.availableTime * 60)) * 100
    : 0;

  if (!intervention) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-blue) transparent transparent transparent' }}></div>
      </div>
    );
  }

  // ─── Phase 1: Urge Surfing ───────────────────────────────
  if (isUrgeSurfing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="wave-container">
          <div className="wave-blue" style={{ width: 400, height: 400, opacity: 0.4 }} />
        </div>

        <div className="relative z-10 w-full max-w-md card p-8 space-y-6">
          <div>
            <span className="badge badge-blue mb-2">90-Second Urge Surfing</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Let the urge peak and pass</h2>
            <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
              Urges are like waves. They build, crest, and dissolve naturally within 90 seconds if you do not fight or feed them. Breathe calmly.
            </p>
          </div>

          {/* Animated wave visual */}
          <div className="relative h-32 w-full rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'var(--accent-blue-light)' }}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-300/40 transition-all duration-1000"
              style={{
                height: `${Math.sin((90 - surfTimer) * 0.1) * 20 + 50}%`,
                background: 'var(--accent-blue)',
                opacity: 0.15,
              }}
            />
            <div className="z-10 flex flex-col items-center">
              <span className="text-3xl font-bold font-mono" style={{ color: 'var(--accent-blue-mid)' }}>
                {surfTimer}s
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase mt-1" style={{ color: 'var(--text-secondary)' }}>
                {surfTimer > 60 ? 'Observe the wave' : surfTimer > 30 ? 'Let it crest' : 'Watch it dissolve'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStartMission}
              className="btn-secondary flex-1 py-3 text-xs cursor-pointer"
            >
              Skip to offline activity
            </button>
            {surfComplete && (
              <button
                onClick={handleStartMission}
                className="btn-primary flex-1 py-3 text-xs cursor-pointer"
              >
                Start redirect activity
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Phase 3: Feedback Screen with Real-Time Urge Graph ────
  if (showFeedback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="w-full max-w-lg card p-8 space-y-6 text-left">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>You stepped away!</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Let&apos;s record the details to help improve your future plans.</p>
          </div>

          {/* Real-time comparison graph */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
              Urge Shift Real-time Graph
            </span>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>Initial Urge</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{intervention.initialUrge} / 10</span>
                </div>
                <div className="h-2 w-full rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${intervention.initialUrge * 10}%`, background: 'var(--error)' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>Urge Now</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{finalUrge} / 10</span>
                </div>
                <div className="h-2 w-full rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${finalUrge * 10}%`, background: 'var(--success)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Final urge intensity */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Current urge intensity</span>
                <span className="font-bold" style={{ color: 'var(--accent-blue-mid)' }}>{finalUrge} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={finalUrge}
                onChange={(e) => setFinalUrge(Number(e.target.value) as UrgeIntensity)}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>

            {/* Mood selector */}
            <div>
              <span className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>How is your mood now?</span>
              <div className="grid grid-cols-3 gap-2">
                {['better', 'same', 'worse'].map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setMoodAfter(mood)}
                    className="py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer capitalize"
                    style={{
                      background:  moodAfter === mood ? 'var(--accent-blue-light)' : '#fff',
                      borderColor: moodAfter === mood ? 'var(--accent-blue)' : 'var(--border)',
                      color:       moodAfter === mood ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
                    }}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Did it help? */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHelped(true)}
                className="py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer"
                style={{
                  background:  helped ? 'var(--success-light)' : '#fff',
                  borderColor: helped ? 'var(--success)' : 'var(--border)',
                  color:       helped ? 'var(--success)' : 'var(--text-secondary)',
                }}
              >
                Yes, it helped
              </button>
              <button
                onClick={() => setHelped(false)}
                className="py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer"
                style={{
                  background:  !helped ? 'var(--error-light)' : '#fff',
                  borderColor: !helped ? 'var(--error)' : 'var(--border)',
                  color:       !helped ? 'var(--error)' : 'var(--text-secondary)',
                }}
              >
                Not really
              </button>
            </div>

            {/* Completed mission? */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMissionCompleted(true)}
                className="py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer"
                style={{
                  background:  missionCompleted ? 'var(--accent-blue-light)' : '#fff',
                  borderColor: missionCompleted ? 'var(--accent-blue)' : 'var(--border)',
                  color:       missionCompleted ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
                }}
              >
                Fully completed
              </button>
              <button
                onClick={() => setMissionCompleted(false)}
                className="py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer"
                style={{
                  background:  !missionCompleted ? 'var(--accent-orange-light)' : '#fff',
                  borderColor: !missionCompleted ? 'var(--accent-orange)' : 'var(--border)',
                  color:       !missionCompleted ? '#d97706' : 'var(--text-secondary)',
                }}
              >
                Partial / ended early
              </button>
            </div>

            {/* Optional note */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Quick notes (optional)</label>
              <input
                type="text"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="What did you learn during this break?"
                className="input-field w-full px-3 py-2 text-xs"
              />
            </div>
          </div>

          <button
            onClick={handleSaveFeedback}
            className="btn-primary w-full py-3.5 text-sm cursor-pointer"
          >
            Save & Return Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase 2: Active Redirect Mission ────────────────────
  return (
    <div
      onClick={resetDimTimer}
      className="min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-1000"
      style={{
        backgroundColor: 'var(--bg-page)',
        filter: isDimmed ? 'brightness(0.3)' : 'none',
      }}
    >
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Mission Title */}
        <div className="space-y-2 fade-in">
          <div className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}>
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{intervention.missionTitle}</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Leave your screen and focus on the activity steps below.</p>
        </div>

        {/* Countdown Ring */}
        <div className="relative mx-auto h-36 w-36 fade-in">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--accent-blue-mid)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPercent / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{formatTime(timeLeft)}</span>
            <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>remaining</span>
          </div>
        </div>

        {/* Mission Steps */}
        <div className="text-left card p-5 space-y-3.5 fade-in">
          {intervention.missionSteps.map((step, index) => (
            <div key={index} className="flex gap-3 items-start">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}>
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 fade-in">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs cursor-pointer"
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleEndEarly}
            className="flex items-center gap-1.5 px-4 py-2 text-xs cursor-pointer border-red-200 text-red-500 hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" />
            Complete Mission
          </button>
        </div>

        {isDimmed && (
          <div className="fixed inset-0 flex items-center justify-center p-8 bg-slate-950/90 text-center cursor-pointer">
            <div className="space-y-3">
              <PhoneOff className="h-12 w-12 text-slate-400 mx-auto" />
              <p className="text-lg font-bold text-slate-200 leading-relaxed">
                Mission Active.<br />Stepping away from the screen.
              </p>
              <p className="text-xs text-slate-500">Tap anywhere to restore active view.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExitMode() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-blue) transparent transparent transparent' }}></div>
      </div>
    }>
      <ExitModeContent />
    </Suspense>
  );
}
