'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, RefreshCw, CheckCircle, AlertTriangle,
  Compass, Coffee,
} from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { UserProfile, DailyPlan, InterventionLog, UrgeIntensity } from '@/lib/types';
import NudgeBanner from '@/components/NudgeBanner';
import EveningReflectionModal from '@/components/EveningReflectionModal';

/* ── Landing hero for unauthenticated users ─────────────── */
function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {/* Decorative waves */}
      <div className="wave-container">
        <div className="wave-blue" style={{ width: 600, height: 600, top: -120, right: -100, opacity: 0.7 }} />
        <div className="wave-orange" style={{ width: 440, height: 440, bottom: -80, left: -100, opacity: 0.7 }} />
        <div className="wave-blue-sm" style={{ width: 260, height: 260, top: '40%', left: '45%', opacity: 0.5 }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="badge badge-blue text-sm px-4 py-1.5">GenAI Behaviour Companion</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
          Reclaim the time<br />
          <span style={{ color: 'var(--accent-blue-mid)' }}>your habits took from you.</span>
        </h1>

        {/* Sub-copy */}
        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Reclaim AI helps you understand <em>why</em> you return to harmful habits, then guides you back to real‑world meaning — one small mission at a time.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base">
            Begin your journey <ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#how-it-works" className="btn-secondary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base">
            How it works
          </a>
        </div>

        {/* Trust note */}
        <p className="mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
          No account required. Your data stays on your device.
        </p>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--text-primary)' }}>
          The Reclaim cycle
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Understand the trigger', desc: 'Identify the emotion, time, and context behind your habit through a calm conversational onboarding.', color: 'blue' },
            { step: '02', title: 'Generate a real-world mission', desc: 'One personalised off-screen activity — specific to your interests, emotions, and available time.', color: 'orange' },
            { step: '03', title: 'Adapt and progress', desc: 'Every outcome teaches the AI. Your plan evolves with your history, making coaching smarter every day.', color: 'blue' },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="card p-6 card-hover text-center">
              <div className={`badge badge-${color === 'blue' ? 'blue' : 'orange'} mb-4 mx-auto`}>{step}</div>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Today Dashboard for returning users ────────────────── */
function TodayDashboard({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [dailyPlan, setDailyPlan]               = useState<DailyPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isRedirectLoading, setIsRedirectLoading] = useState(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [showUrgeForm, setShowUrgeForm]         = useState(false);
  const [urgeIntensity, setUrgeIntensity]       = useState<UrgeIntensity>(5);
  const [availableTime, setAvailableTime]       = useState(10);
  const [currentEmotion, setCurrentEmotion]     = useState('stressed');
  const [redirectContext, setRedirectContext]   = useState('');
  // Check for commitment letter unlock
  const [letterUnlockReady, setLetterUnlockReady] = useState(false);
  const [letterContent, setLetterContent]          = useState('');

  const generateTodayPlan = async (p: UserProfile, easier = false) => {
    setIsGeneratingPlan(true);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: p,
          recentReflections: storageRepository.getEveningReflections(),
          interventions:     storageRepository.getInterventions(),
          makeEasier: easier,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newPlan: DailyPlan = {
          id: Math.random().toString(36).substring(7),
          date: todayStr,
          focus: data.focus,
          predictedRisk: data.predictedRisk,
          purposeAction:    { id: 'act-purpose',    name: data.purposeActionName,    category: 'purpose',    completed: false },
          connectionAction: { id: 'act-connection', name: data.connectionActionName, category: 'connection', completed: false },
          protectionAction: { id: 'act-protection', name: data.protectionActionName, category: 'protection', completed: false },
          accepted: false,
        };
        storageRepository.saveDailyPlan(newPlan);
        setDailyPlan(newPlan);
      }
    } catch (e) { console.error(e); }
    finally { setIsGeneratingPlan(false); }
  };

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const plan = storageRepository.getDailyPlan(todayStr);

    setTimeout(() => {
      if (plan) setDailyPlan(plan);
      else generateTodayPlan(profile);

      // Check commitment letter
      const letter = storageRepository.getCommitmentLetter();
      if (letter && !letter.unlocked && new Date() >= new Date(letter.unlockAt)) {
        setLetterUnlockReady(true);
        setLetterContent(letter.aiEnhanced || letter.content);
        storageRepository.markLetterUnlocked();
      }
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAction = (cat: 'purpose' | 'connection' | 'protection') => {
    if (!dailyPlan) return;
    const p = { ...dailyPlan };
    if (cat === 'purpose')    p.purposeAction    = { ...p.purposeAction,    completed: !p.purposeAction.completed };
    if (cat === 'connection') p.connectionAction = { ...p.connectionAction, completed: !p.connectionAction.completed };
    if (cat === 'protection') p.protectionAction = { ...p.protectionAction, completed: !p.protectionAction.completed };
    storageRepository.saveDailyPlan(p);
    setDailyPlan(p);
  };

  const handleStartRedirect = async () => {
    if (!profile) return;
    setIsRedirectLoading(true);
    const logs = storageRepository.getInterventions();
    try {
      const res = await fetch('/api/redirect/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile, currentEmotion, urgeIntensity, availableTime,
          context: redirectContext,
          successfulActivities:   logs.filter((i) => i.completed && i.helped).map((i) => i.missionTitle),
          unsuccessfulActivities: logs.filter((i) => !i.completed || i.helped === false).map((i) => i.missionTitle),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const logId = Math.random().toString(36).substring(7);
        const newLog: InterventionLog = {
          id: logId, timestamp: new Date().toISOString(),
          habitType: profile.habitType, initialEmotion: currentEmotion,
          initialUrge: urgeIntensity, availableTime, context: redirectContext,
          missionTitle: data.missionTitle, missionSteps: data.missionSteps, completed: false,
        };
        storageRepository.saveIntervention(newLog);
        router.push(`/exit-mode?id=${logId}`);
      }
    } catch (e) { console.error(e); }
    finally { setIsRedirectLoading(false); }
  };

  const EMOTIONS = ['stressed','bored','lonely','low','restless','angry','avoiding something','automatic urge'];
  const ACTION_CONFIG = [
    { cat: 'purpose' as const,    label: 'Purpose Action',      accent: 'blue',   action: dailyPlan?.purposeAction },
    { cat: 'connection' as const, label: 'Connection Action',   accent: 'orange', action: dailyPlan?.connectionAction },
    { cat: 'protection' as const, label: 'Protection Boundary', accent: 'green',  action: dailyPlan?.protectionAction },
  ];

  const completed = [dailyPlan?.purposeAction, dailyPlan?.connectionAction, dailyPlan?.protectionAction].filter(a => a?.completed).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 fade-in" style={{ background: 'var(--bg-page)' }}>

      {/* Commitment Letter Unlock Banner */}
      {letterUnlockReady && (
        <div className="card-orange p-5 rounded-2xl relative overflow-hidden fade-in">
          <div className="wave-orange" style={{ opacity: 0.5, width: 200, height: 200, bottom: -60, right: -40 }} />
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--accent-orange)' }}>You wrote this to yourself on Day 1</p>
          <p className="text-sm leading-relaxed mb-3 italic" style={{ color: 'var(--text-primary)' }}>&ldquo;{letterContent}&rdquo;</p>
          <button onClick={() => setLetterUnlockReady(false)} className="text-xs font-semibold" style={{ color: 'var(--accent-orange)' }}>Dismiss</button>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--accent-blue)' }}>Today&apos;s Journey</p>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}.</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Focus: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.specificHabit}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generateTodayPlan(profile)} disabled={isGeneratingPlan}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer">
            <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
            Refresh plan
          </button>
          <button onClick={() => setIsReflectionOpen(true)}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer">
            <Coffee className="h-3.5 w-3.5" />
            Evening reflection
          </button>
        </div>
      </div>

      <NudgeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Plan */}
        <div className="lg:col-span-7 space-y-5">

          {/* Focus card */}
          <div className="card p-5 relative overflow-hidden">
            <div className="wave-blue" style={{ opacity: 0.4, width: 280, height: 280, top: -80, right: -60 }} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--accent-blue-mid)' }}>Today&apos;s Focus</p>
              {isGeneratingPlan ? (
                <div className="h-6 w-2/3 rounded-lg animate-pulse" style={{ background: 'var(--bg-subtle)' }} />
              ) : (
                <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{dailyPlan?.focus}</p>
              )}
            </div>
          </div>

          {/* Risk alert */}
          {dailyPlan?.predictedRisk && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--warning-light)', border: '1px solid #fde68a' }}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--warning)' }}>Predicted Risk</p>
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{dailyPlan.predictedRisk}</p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {dailyPlan && (
            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Daily progress</span>
                <span>{completed} / 3 actions</span>
              </div>
              <div className="h-2 w-full rounded-full" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(completed / 3) * 100}%`, background: 'var(--success)' }} />
              </div>
            </div>
          )}

          {/* Action cards */}
          <div className="space-y-3">
            {ACTION_CONFIG.map(({ cat, label, accent, action }) => (
              <div key={cat} className="card p-4 flex items-center gap-4 card-hover">
                <button onClick={() => toggleAction(cat)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: action?.completed ? 'var(--success)' : 'var(--border)',
                    background:  action?.completed ? 'var(--success-light)' : 'transparent',
                  }}>
                  {action?.completed && <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: accent === 'blue' ? 'var(--accent-blue-mid)' : accent === 'orange' ? 'var(--accent-orange)' : 'var(--success)' }}>
                    {label}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', opacity: action?.completed ? 0.5 : 1, textDecoration: action?.completed ? 'line-through' : 'none' }}>
                    {isGeneratingPlan ? '...' : action?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan footer */}
          <div className="flex flex-wrap gap-2">
            {!dailyPlan?.accepted ? (
              <button onClick={() => { if (dailyPlan) { const u = {...dailyPlan, accepted: true}; storageRepository.saveDailyPlan(u); setDailyPlan(u); }}} className="btn-primary px-4 py-2 text-xs cursor-pointer">
                Accept plan
              </button>
            ) : (
              <span className="badge badge-green">Plan accepted</span>
            )}
            <button onClick={() => generateTodayPlan(profile, true)} className="btn-secondary px-4 py-2 text-xs cursor-pointer">
              Make it easier
            </button>
          </div>
        </div>

        {/* Right: Step Away */}
        <div className="lg:col-span-5">
          <div className="card p-6 relative overflow-hidden h-full" style={{ borderTop: '3px solid var(--accent-blue)' }}>
            <div className="wave-blue" style={{ opacity: 0.35, width: 300, height: 300, top: -80, right: -80 }} />
            <div className="relative z-10 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="h-5 w-5" style={{ color: 'var(--accent-blue)' }} />
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Real-Life Redirect</h2>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Feeling the pull? Get a personalised off-screen mission that matches how you feel right now.
                </p>
              </div>

              {!showUrgeForm ? (
                <button onClick={() => setShowUrgeForm(true)}
                  className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2 cursor-pointer">
                  Help me step away now <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="space-y-4 fade-in">
                  {/* Urge slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Urge intensity</span>
                      <span className="font-bold" style={{ color: 'var(--accent-blue-mid)' }}>{urgeIntensity} / 10</span>
                    </div>
                    <input type="range" min="1" max="10" value={urgeIntensity}
                      onChange={(e) => setUrgeIntensity(Number(e.target.value) as UrgeIntensity)}
                      className="w-full h-1.5 rounded-full cursor-pointer accent-[var(--accent-blue)]"
                      style={{ background: 'var(--border)' }} />
                  </div>

                  {/* Time chips */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Available time</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5, 10, 15, 20].map((t) => (
                        <button key={t} type="button" onClick={() => setAvailableTime(t)}
                          className="py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-all"
                          style={{
                            background:   availableTime === t ? 'var(--accent-blue-light)' : '#fff',
                            borderColor:  availableTime === t ? 'var(--accent-blue)' : 'var(--border)',
                            color:        availableTime === t ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
                          }}>
                          {t}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emotion */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current emotion</p>
                    <select value={currentEmotion} onChange={(e) => setCurrentEmotion(e.target.value)} className="input-field w-full px-3 py-2 text-xs">
                      {EMOTIONS.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                    </select>
                  </div>

                  {/* Context */}
                  <input type="text" value={redirectContext} onChange={(e) => setRedirectContext(e.target.value)}
                    placeholder="Context (optional) — e.g. at desk, late night"
                    className="input-field w-full px-3 py-2 text-xs" />

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowUrgeForm(false)} className="btn-secondary flex-1 py-2.5 text-xs cursor-pointer">Cancel</button>
                    <button onClick={handleStartRedirect} disabled={isRedirectLoading}
                      className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                      {isRedirectLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><ArrowRight className="h-3.5 w-3.5" />Begin</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EveningReflectionModal isOpen={isReflectionOpen} onClose={() => setIsReflectionOpen(false)} onSave={() => {}} />
    </div>
  );
}

/* ── Root page: smart router ────────────────────────────── */
export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    setTimeout(() => {
      setProfile(storageRepository.getUserProfile());
    }, 0);
  }, []);

  if (profile === undefined) return null; // prevent flash
  if (!profile) return <LandingPage />;
  return <TodayDashboard profile={profile} />;
}
