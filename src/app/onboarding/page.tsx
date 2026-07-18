'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, CheckCircle, Sparkles,
  RefreshCw, SkipForward,
} from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { UserProfile, HabitType, CoachingTone, CommitmentLetter } from '@/lib/types';

type OnboardingStep =
  | 'intro'
  | 'habit_type'
  | 'specific_habit'
  | 'triggers'
  | 'risk_periods'
  | 'interests'
  | 'outcome'
  | 'tone'
  | 'letter'
  | 'extracting'
  | 'review';

const HABIT_OPTIONS: { id: HabitType; label: string; desc: string }[] = [
  { id: 'phone-social', label: 'Phone & Social Media', desc: 'Scrolling, app checking, endless feeds' },
  { id: 'gaming',       label: 'Gaming',              desc: 'Video games, online competitive play' },
  { id: 'procrastination', label: 'Procrastination',  desc: 'Avoidance, distraction loops' },
  { id: 'junk-food',    label: 'Junk Food',            desc: 'Emotional eating, sugar habits' },
  { id: 'nicotine',     label: 'Smoking / Nicotine',  desc: 'Cigarettes, vaping, patches' },
  { id: 'alcohol-substance', label: 'Alcohol',        desc: 'Regular drinking patterns' },
  { id: 'custom',       label: 'Something else',      desc: 'Describe your own habit' },
];

const TONE_OPTIONS: { id: CoachingTone; label: string; desc: string }[] = [
  { id: 'gentle',   label: 'Gentle & Compassionate', desc: 'Kind, patient, non-judgemental' },
  { id: 'direct',   label: 'Honest & Direct',        desc: 'Straight-talking, no fluff' },
  { id: 'energetic',label: 'Motivating & Energetic', desc: 'Upbeat, action-focused' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]                 = useState<OnboardingStep>('intro');
  const [habitType, setHabitType]       = useState<HabitType | ''>('');
  const [specificHabit, setSpecificHabit] = useState('');
  const [triggers, setTriggers]         = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [riskPeriods, setRiskPeriods]   = useState<string[]>([]);
  const [interests, setInterests]       = useState('');
  const [outcome, setOutcome]           = useState('');
  const [tone, setTone]                 = useState<CoachingTone>('gentle');
  const [letterText, setLetterText]     = useState('');
  const [isEnhancingLetter, setIsEnhancingLetter] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<UserProfile | null>(null);
  const [error, setError]               = useState('');

  const TRIGGER_OPTIONS = ['Work stress', 'Boredom', 'Loneliness', 'Late night fatigue', 'Social pressure', 'Anxiety'];
  const RISK_OPTIONS    = ['After work', 'Late evenings', 'Weekends', 'During breaks', 'When tired', 'When alone'];

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const handleExtract = async () => {
    setStep('extracting');
    setError('');

    try {
      const res = await fetch('/api/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitType, specificHabit, triggers: [...triggers, customTrigger].filter(Boolean),
          riskPeriods, interests, desiredOutcome: outcome, preferredCoachingTone: tone,
        }),
      });
      const data = await res.json();
      setExtractedProfile(data as UserProfile);
      setStep('review');
    } catch {
      setError('Something went wrong. Please review and try again.');
      setStep('tone');
    }
  };

  const handleSaveLetter = async (skip: boolean) => {
    if (!skip && letterText.trim()) {
      setIsEnhancingLetter(true);
      try {
        const res = await fetch('/api/letter/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawLetter: letterText, habitType, desiredOutcome: outcome }),
        });
        const data = await res.json();
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + 30);

        const letter: CommitmentLetter = {
          id: Math.random().toString(36).substring(7),
          content: letterText,
          aiEnhanced: data.enhanced || letterText,
          writtenAt: new Date().toISOString(),
          unlockAt: unlockDate.toISOString(),
          unlocked: false,
          habitType: habitType as HabitType,
        };
        storageRepository.saveCommitmentLetter(letter);
      } catch {
        // Silently save raw letter if enhance fails
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + 30);
        storageRepository.saveCommitmentLetter({
          id: Math.random().toString(36).substring(7),
          content: letterText,
          aiEnhanced: letterText,
          writtenAt: new Date().toISOString(),
          unlockAt: unlockDate.toISOString(),
          unlocked: false,
          habitType: habitType as HabitType,
        });
      } finally {
        setIsEnhancingLetter(false);
      }
    }
    await handleExtract();
  };

  const handleConfirm = () => {
    if (!extractedProfile) return;
    storageRepository.setUserProfile({
      ...extractedProfile,
      onboardedAt: new Date().toISOString(),
    });
    router.push('/');
  };

  /* ─ Rendering helper ─────────────────────── */
  const renderStepCard = (children: React.ReactNode) => (
    <div className="mx-auto max-w-xl w-full px-4 py-12 sm:py-20">
      <div className="card p-7 sm:p-9 fade-in relative overflow-hidden">
        <div className="wave-blue" style={{ opacity: 0.3, width: 300, height: 300, top: -100, right: -80 }} />
        <div className="wave-orange" style={{ opacity: 0.25, width: 200, height: 200, bottom: -60, left: -60 }} />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* ── INTRO ── */}
      {step === 'intro' && renderStepCard(
        <div className="text-center space-y-5">
          <span className="badge badge-blue mx-auto">Private & on-device</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Let&apos;s personalise<br />your journey
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A few honest questions — no judgement, no accounts needed. Your answers help Reclaim AI build a plan that actually fits your life.
          </p>
          <button onClick={() => setStep('habit_type')} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer">
            Get started <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── HABIT TYPE ── */}
      {step === 'habit_type' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 1 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>What habit are you working on?</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Pick the one that fits best. You can describe it more precisely next.</p>
          </div>
          <div className="space-y-2">
            {HABIT_OPTIONS.map((h) => (
              <button key={h.id} onClick={() => setHabitType(h.id)}
                className="w-full text-left p-4 rounded-xl border cursor-pointer transition-all"
                style={{
                  background:   habitType === h.id ? 'var(--accent-blue-light)' : '#fff',
                  borderColor:  habitType === h.id ? 'var(--accent-blue)' : 'var(--border)',
                  boxShadow:    habitType === h.id ? '0 0 0 2px rgba(59,167,255,0.15)' : 'none',
                }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{h.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{h.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('specific_habit')} disabled={!habitType} className="btn-primary w-full py-3 text-sm cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── SPECIFIC HABIT ── */}
      {step === 'specific_habit' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 2 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Describe it in your own words</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Be as specific as you feel comfortable. For example: &ldquo;I scroll Instagram for 2 hours every night before sleep.&rdquo;</p>
          </div>
          <textarea value={specificHabit} onChange={(e) => setSpecificHabit(e.target.value)} rows={4}
            placeholder="Describe your habit specifically..." className="input-field w-full px-4 py-3 text-sm resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setStep('habit_type')} className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button onClick={() => setStep('triggers')} disabled={!specificHabit.trim()} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── TRIGGERS ── */}
      {step === 'triggers' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 3 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>What usually triggers the urge?</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Select all that apply, or type your own.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((t) => (
              <button key={t} onClick={() => toggleItem(triggers, t, setTriggers)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all"
                style={{
                  background:  triggers.includes(t) ? 'var(--accent-blue-light)' : '#fff',
                  borderColor: triggers.includes(t) ? 'var(--accent-blue)' : 'var(--border)',
                  color:       triggers.includes(t) ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
                }}>
                {t}
              </button>
            ))}
          </div>
          <input value={customTrigger} onChange={(e) => setCustomTrigger(e.target.value)}
            placeholder="Add your own trigger..." className="input-field w-full px-4 py-2.5 text-sm" />
          <div className="flex gap-3">
            <button onClick={() => setStep('specific_habit')} className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button onClick={() => setStep('risk_periods')} disabled={triggers.length === 0 && !customTrigger} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── RISK PERIODS ── */}
      {step === 'risk_periods' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 4 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>When are you most at risk?</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>The app uses this to send timely support before risky moments.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RISK_OPTIONS.map((r) => (
              <button key={r} onClick={() => toggleItem(riskPeriods, r, setRiskPeriods)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all"
                style={{
                  background:  riskPeriods.includes(r) ? 'var(--accent-orange-light)' : '#fff',
                  borderColor: riskPeriods.includes(r) ? 'var(--accent-orange)' : 'var(--border)',
                  color:       riskPeriods.includes(r) ? '#d97706' : 'var(--text-secondary)',
                }}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('triggers')} className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button onClick={() => setStep('interests')} disabled={riskPeriods.length === 0} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── INTERESTS ── */}
      {step === 'interests' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 5 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>What do you genuinely enjoy?</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>List activities or interests — even small ones. These become your real-life redirects.</p>
          </div>
          <textarea value={interests} onChange={(e) => setInterests(e.target.value)} rows={3}
            placeholder="e.g. walking, photography, cooking, calling a friend, music..." className="input-field w-full px-4 py-3 text-sm resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setStep('risk_periods')} className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button onClick={() => setStep('outcome')} disabled={!interests.trim()} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── OUTCOME ── */}
      {step === 'outcome' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 6 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>What would change if this habit were gone?</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Paint a picture of the life you want to reclaim.</p>
          </div>
          <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3}
            placeholder="e.g. I would sleep better, have energy for the gym, actually finish my projects..." className="input-field w-full px-4 py-3 text-sm resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setStep('interests')} className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button onClick={() => setStep('tone')} disabled={!outcome.trim()} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── TONE ── */}
      {step === 'tone' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-blue mb-3">Step 7 of 7</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>How would you like to be coached?</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>This sets the tone for all AI responses you receive.</p>
          </div>
          <div className="space-y-2">
            {TONE_OPTIONS.map((t) => (
              <button key={t.id} onClick={() => setTone(t.id)}
                className="w-full text-left p-4 rounded-xl border cursor-pointer transition-all"
                style={{
                  background:  tone === t.id ? 'var(--success-light)' : '#fff',
                  borderColor: tone === t.id ? 'var(--success)' : 'var(--border)',
                }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.desc}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-[var(--error)]">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep('outcome')} className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button onClick={() => setStep('letter')} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── COMMITMENT LETTER (optional) ── */}
      {step === 'letter' && renderStepCard(
        <div className="space-y-5">
          <div>
            <span className="badge badge-orange mb-3">Optional — Commitment Letter</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Write a letter to your future self</h2>
            <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
              Start with &ldquo;Dear Future Me, I&apos;m doing this because...&rdquo;. Your words will be saved privately and revealed back to you after 30 days.
            </p>
          </div>
          <textarea value={letterText} onChange={(e) => setLetterText(e.target.value)} rows={6}
            placeholder="Dear Future Me, I'm doing this because..."
            className="input-field w-full px-4 py-3 text-sm resize-none" />
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Gemini AI will gently polish your words — never change the meaning — and return them to you on day 30. You can skip this.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => handleSaveLetter(false)} disabled={!letterText.trim() || isEnhancingLetter}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              {isEnhancingLetter ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" />Save letter and continue</>}
            </button>
            <button onClick={() => handleSaveLetter(true)} className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <SkipForward className="h-4 w-4" />
              Skip this step
            </button>
          </div>
        </div>
      )}

      {/* ── EXTRACTING ── */}
      {step === 'extracting' && (
        <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
          <div className="text-center space-y-4">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'var(--accent-blue-border)' }} />
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-blue) transparent transparent transparent' }} />
            </div>
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Building your profile...</p>
            <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>Personalising your coaching plan based on everything you shared.</p>
          </div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && extractedProfile && (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="card p-7 sm:p-9 space-y-6 fade-in">
            <div>
              <span className="badge badge-green mb-3">Profile ready</span>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Review your profile</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Confirm this looks right before we generate your first plan.</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Habit type',        value: extractedProfile.habitType },
                { label: 'Specific habit',    value: extractedProfile.specificHabit },
                { label: 'Triggers',          value: (extractedProfile.triggers ?? []).join(', ') },
                { label: 'Risk periods',      value: (extractedProfile.riskPeriods ?? []).join(', ') },
                { label: 'Interests',         value: (extractedProfile.personalInterests ?? []).join(', ') },
                { label: 'Desired outcome',   value: extractedProfile.desiredOutcome },
                { label: 'Coaching tone',     value: extractedProfile.preferredCoachingTone },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold w-32 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={() => setStep('habit_type')} className="btn-secondary flex items-center justify-center gap-2 px-5 py-3 text-sm cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> Edit answers
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm cursor-pointer">
                <CheckCircle className="h-4 w-4" /> Start my journey
              </button>
            </div>

            <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
              Reclaim AI provides behaviour-change support and does not replace qualified medical or mental-health care.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
