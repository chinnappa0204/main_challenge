'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Award, Sparkles, Smile, Mic, MicOff, CheckCircle } from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { EveningReflectionLog, UserProfile } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Web Speech API typings
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

export default function EveningReflectionModal({ isOpen, onClose, onSave }: Props) {
  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [step, setStep]                   = useState<'form' | 'loading' | 'result'>('form');
  const [error, setError]                 = useState('');
  const [isRecording, setIsRecording]     = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef                    = useRef<unknown>(null);

  // Form state
  const [habitDuration, setHabitDuration]           = useState(0);
  const [strongestTrigger, setStrongestTrigger]     = useState('');
  const [emotionalState, setEmotionalState]         = useState('stressed');
  const [replacementActivity, setReplacementActivity] = useState('');
  const [helped, setHelped]                         = useState(true);
  const [reclaimedTime, setReclaimedTime]           = useState(0);
  const [notes, setNotes]                           = useState('');

  const [analysis, setAnalysis] = useState<EveningReflectionLog | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const p = storageRepository.getUserProfile();
        setProfile(p);
        setStep('form');
        setError('');
        if (p) {
          setStrongestTrigger(p.triggers[0] || '');
          setEmotionalState(p.emotions[0] || 'stressed');
          setReplacementActivity(p.personalInterests[0] || '');
        }
        // Check voice support
        setVoiceSupported(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
      }, 0);
    }
  }, [isOpen]);

  const toggleVoice = () => {
    if (!voiceSupported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!isRecording) {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
        setNotes((prev) => (prev ? prev + ' ' + transcript : transcript));
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend   = () => setIsRecording(false);
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    } else {
      (recognitionRef.current as any)?.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setStep('loading');
    setError('');
    try {
      const res = await fetch('/api/reflection/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          habitDurationMinutes: Number(habitDuration),
          strongestTrigger,
          emotionalState,
          replacementActivityAttempted: replacementActivity,
          helped,
          reclaimedTimeMinutes: Number(reclaimedTime),
          notes,
        }),
      });
      if (!res.ok) throw new Error('Analysis failed. Please try again.');
      const data = await res.json();
      const log: EveningReflectionLog = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toISOString().split('T')[0],
        habitDurationMinutes: Number(habitDuration),
        strongestTrigger,
        emotionalState,
        replacementActivityAttempted: replacementActivity,
        helped,
        reclaimedTimeMinutes: Number(reclaimedTime),
        notes,
        ...data,
        timestamp: new Date().toISOString(),
      };
      storageRepository.saveEveningReflection(log);
      setAnalysis(log);
      setStep('result');
      onSave();
    } catch (err: any) {
      setError(err.message);
      setStep('form');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)' }}
    >
      <div className="relative w-full max-w-2xl card p-6 sm:p-8 max-h-[90vh] overflow-y-auto fade-in">
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}>
          <X className="h-5 w-5" />
        </button>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Evening Reflection</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>A moment to notice, not judge. Your answers shape tomorrow's plan.</p>
            </div>

            {error && (
              <div className="card-error flex items-center gap-2 p-3 rounded-xl text-xs" style={{ color: 'var(--error)' }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Habit duration today (minutes)', value: habitDuration, onChange: setHabitDuration },
                { label: 'Time reclaimed today (minutes)', value: reclaimedTime, onChange: setReclaimedTime },
              ].map(({ label, value, onChange }) => (
                <div key={label}>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input type="number" required min="0" value={value}
                    onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field w-full px-3 py-2 text-sm" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Strongest trigger</label>
                <select value={strongestTrigger} onChange={(e) => setStrongestTrigger(e.target.value)} className="input-field w-full px-3 py-2 text-sm">
                  {profile?.triggers.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="Boredom">Boredom</option>
                  <option value="Work Stress">Work Stress</option>
                  <option value="Loneliness">Loneliness</option>
                  <option value="Late night fatigue">Late night fatigue</option>
                  <option value="Automatic craving">Automatic craving</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Emotional state</label>
                <select value={emotionalState} onChange={(e) => setEmotionalState(e.target.value)} className="input-field w-full px-3 py-2 text-sm">
                  {['stressed','bored','lonely','low','restless','angry','avoiding something','automatic urge'].map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-subtle)' }}>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Replacement activity attempted</label>
                <input type="text" required value={replacementActivity} onChange={(e) => setReplacementActivity(e.target.value)}
                  placeholder="e.g. Walking, calling a friend..." className="input-field w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <span className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Did this help reduce the urge?</span>
                <div className="grid grid-cols-2 gap-2">
                  {[{v: true, l: 'Yes, it helped'},{v: false, l: 'Not really'}].map(({v, l}) => (
                    <button key={l} type="button" onClick={() => setHelped(v)}
                      className="py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all"
                      style={{
                        background: helped === v ? (v ? 'var(--success-light)' : 'var(--error-light)') : '#fff',
                        borderColor: helped === v ? (v ? 'var(--success)' : 'var(--error)') : 'var(--border)',
                        color: helped === v ? (v ? 'var(--success)' : 'var(--error)') : 'var(--text-secondary)',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes with voice toggle */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Notes (optional)</label>
                {voiceSupported && (
                  <button type="button" onClick={toggleVoice}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all"
                    style={{
                      background: isRecording ? 'var(--error-light)' : 'var(--accent-blue-light)',
                      borderColor: isRecording ? 'var(--error)' : 'var(--accent-blue-border)',
                      color: isRecording ? 'var(--error)' : 'var(--accent-blue-mid)',
                    }}>
                    {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    {isRecording ? 'Stop recording' : 'Voice note'}
                  </button>
                )}
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
                  <span className="h-2 w-2 rounded-full bg-[var(--error)] animate-pulse" />
                  Listening... speak naturally, tap Stop when done.
                </div>
              )}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="How did your day feel? Anything worth remembering?"
                className="input-field w-full px-3 py-2.5 text-sm resize-none" />
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button type="submit" className="btn-primary px-6 py-2.5 text-sm cursor-pointer">Submit Reflection</button>
            </div>
          </form>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative h-14 w-14 mb-5">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'var(--accent-blue-border)' }} />
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-blue) transparent transparent transparent' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Generating your daily summary...</p>
            <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--text-secondary)' }}>Reviewing your log for patterns and gentle adjustments.</p>
          </div>
        )}

        {step === 'result' && analysis && (
          <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Your Daily Analysis</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{analysis.date}</p>
                </div>
              </div>
              <span className="badge badge-green">+{analysis.reclaimedTimeMinutes}m reclaimed</span>
            </div>

            {/* AI Summary */}
            <div className="card-blue p-4 rounded-xl flex gap-3">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--accent-blue)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{analysis.aiSummary}</p>
            </div>

            {/* Quote */}
            <blockquote className="text-sm italic pl-4 border-l-2" style={{ color: 'var(--accent-blue-mid)', borderColor: 'var(--accent-blue)' }}>
              "{analysis.aiEncouragement}"
            </blockquote>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'What worked', text: analysis.aiWhatWorked, color: 'success' },
                { label: 'What was hard', text: analysis.aiWhatDidNotWork, color: 'orange' },
              ].map(({ label, text, color }) => (
                <div key={label} className={`card-${color === 'success' ? 'success' : 'orange'} p-4 rounded-xl`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: color === 'success' ? 'var(--success)' : 'var(--accent-orange)' }}>{label}</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{text}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-subtle)' }}>
              <div><span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Detected pattern</span><p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{analysis.aiPattern}</p></div>
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}><span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Tomorrow's adjustment</span><p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{analysis.aiAdjustment}</p></div>
            </div>

            <div className="card-blue p-4 rounded-xl flex items-center justify-between gap-4">
              <div><span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--accent-blue-mid)' }}>Nightly action</span><p className="text-xs" style={{ color: 'var(--text-primary)' }}>{analysis.aiNextAction}</p></div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                <Smile className="h-4 w-4" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={onClose} className="btn-secondary px-6 py-2 text-sm cursor-pointer">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
