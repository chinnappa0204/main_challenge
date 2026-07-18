'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart, Clock, CheckCircle, AlertTriangle, Sparkles, Phone, FileText, ArrowRight, X, Star
} from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { UserProfile, BookingRequest } from '@/lib/types';

const SUPPORT_PROFILES = [
  {
    id: 'profile-1',
    name: 'Sophia Rivera',
    role: 'Accountability Guide',
    description: 'Specializes in screen time and social media boundaries with a structured weekly check-in approach.',
    specialty: ['Screen Habits', 'Goal Setting', 'Weekly Accountability'],
    rating: '4.9',
    isDemo: true,
  },
  {
    id: 'profile-2',
    name: 'James Okonkwo',
    role: 'Peer Support Volunteer',
    description: 'A lived-experience peer volunteer who personally overcame gaming addiction. Empathy-centric recovery guides.',
    specialty: ['Gaming Addiction', 'Peer Support', 'Relapse Recovery'],
    rating: '4.7',
    isDemo: true,
  },
  {
    id: 'profile-3',
    name: 'Dr. Priya Nair',
    role: 'Professional Pathway Developer',
    description: 'Evidence-based professional counseling connection pathways. CBT-informed strategies for behavioral change.',
    specialty: ['CBT-Informed Support', 'Substance Concerns', 'Complex Dependencies'],
    rating: '5.0',
    isDemo: true,
  },
];

const SAFETY_KEYWORDS = [
  'suicid', 'self-harm', 'kill myself', 'end my life', 'withdrawal danger',
  'severe withdrawal', 'overdose', 'cannot stay safe', 'immediate danger', 'medical emergency',
];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '02:00 PM', '03:00 PM', '04:00 PM',
];

interface BookingModalProps {
  profile: typeof SUPPORT_PROFILES[0];
  userProfile: UserProfile;
  onClose: () => void;
  onConfirm: (booking: BookingRequest) => void;
}

function BookingModal({ profile: supportProfile, userProfile, onClose, onConfirm }: BookingModalProps) {
  const [step, setStep] = useState<'select' | 'describe' | 'brief' | 'confirm'>('select');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [supportNeeded, setSupportNeeded] = useState('');
  const [isSafetyAlert, setIsSafetyAlert] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const checkSafety = (text: string) => {
    return SAFETY_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));
  };

  const handleDescribeContinue = async () => {
    if (checkSafety(supportNeeded)) {
      setIsSafetyAlert(true);
      return;
    }

    setStep('brief');
    setIsGenerating(true);

    const interventions = storageRepository.getInterventions();
    const successfulActivities = interventions.filter((i) => i.completed && i.helped).map((i) => i.missionTitle);
    const unsuccessfulActivities = interventions.filter((i) => !i.completed || i.helped === false).map((i) => i.missionTitle);
    const reflections = storageRepository.getEveningReflections();
    const recentPattern = reflections.slice(-3).map((r) => `${r.date}: triggered by ${r.strongestTrigger}`).join('; ');

    try {
      const response = await fetch('/api/support/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: userProfile,
          supportNeeded,
          successfulActivities,
          unsuccessfulActivities,
          recentPattern,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedBrief(data.brief);
      }
    } catch (err) {
      console.error(err);
      setGeneratedBrief('Brief generation failed. A manual summary will be shared with your coach.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    const booking: BookingRequest = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString().split('T')[0],
      timeSlot: selectedSlot,
      supportNeeded,
      profileId: supportProfile.id,
      brief: generatedBrief,
      createdAt: new Date().toISOString(),
    };
    storageRepository.saveBooking(booking);
    onConfirm(booking);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl card p-6 sm:p-8 max-h-[90vh] overflow-y-auto fade-in">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 cursor-pointer">
          <X className="h-5 w-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b pb-4 mb-5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl font-bold" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}>
            {supportProfile.name[0]}
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{supportProfile.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{supportProfile.role}</p>
          </div>
        </div>

        {/* Safety Alert Escalation */}
        {isSafetyAlert && (
          <div className="card-error p-5 space-y-3 mb-4">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Safety Escalation Triggered</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              The concerns you mentioned require immediate professional counseling support. Reclaim AI does not offer medical intervention services.
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-bold">Please contact a helpline immediately:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Emergency: <strong>911 / 999 / 112</strong></li>
                <li>Crisis text line: <strong>Text HOME to 741741</strong></li>
                <li>Samaritans: <strong>116 123</strong></li>
              </ul>
            </div>
            <button onClick={onClose} className="btn-primary w-full py-2 text-xs cursor-pointer">
              Close & Seek Help
            </button>
          </div>
        )}

        {/* Step: Select slot */}
        {step === 'select' && !isSafetyAlert && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Choose a Time Slot</h3>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className="py-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all"
                  style={{
                    background:  selectedSlot === slot ? 'var(--accent-blue-light)' : '#fff',
                    borderColor: selectedSlot === slot ? 'var(--accent-blue)' : 'var(--border)',
                    color:       selectedSlot === slot ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
                  }}
                >
                  <Clock className="h-3 w-3 inline mr-1" />
                  {slot}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep('describe')}
                disabled={!selectedSlot}
                className="btn-primary px-5 py-2 text-xs cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Describe support */}
        {step === 'describe' && !isSafetyAlert && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>What is the main challenge?</h3>
            <textarea
              value={supportNeeded}
              onChange={(e) => setSupportNeeded(e.target.value)}
              rows={4}
              placeholder="What would you like support with? Share as much details as you feel comfortable."
              className="input-field w-full px-3 py-2 text-xs resize-none"
            />
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep('select')} className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer">← Back</button>
              <button
                onClick={handleDescribeContinue}
                disabled={!supportNeeded.trim()}
                className="btn-primary px-5 py-2 text-xs cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate brief
              </button>
            </div>
          </div>
        )}

        {/* Step: AI Brief */}
        {step === 'brief' && !isSafetyAlert && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <FileText className="h-4 w-4 text-indigo-500" /> AI Consultation Brief
            </h3>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-blue) transparent transparent transparent' }}></div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assembling consultation brief...</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl text-xs whitespace-pre-wrap font-mono" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                {generatedBrief}
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep('describe')} className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer">← Back</button>
              <button
                onClick={() => setStep('confirm')}
                disabled={isGenerating}
                className="btn-primary px-5 py-2 text-xs cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                Confirm brief <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm booking */}
        {step === 'confirm' && !isSafetyAlert && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Confirm Booking Request</h3>
            <div className="p-4 rounded-xl space-y-2.5 text-xs" style={{ background: 'var(--bg-subtle)' }}>
              <div className="flex justify-between"><span className="text-slate-400">Coach</span><span className="font-semibold">{supportProfile.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Time slot</span><span className="font-semibold">{selectedSlot}</span></div>
            </div>
            <p className="text-[10px] p-3 rounded-lg" style={{ background: 'var(--warning-light)', border: '1px solid #fde68a' }}>
              ⚠️ Demonstration booking only. No actual live sessions are scheduled with these coaches.
            </p>
            <div className="flex justify-between items-center">
              <button onClick={() => setStep('brief')} className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer">← Back</button>
              <button
                onClick={handleConfirm}
                className="btn-primary px-5 py-2 text-xs cursor-pointer"
              >
                Book Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Support() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<typeof SUPPORT_PROFILES[0] | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRequest | null>(null);

  useEffect(() => {
    const p = storageRepository.getUserProfile();
    if (!p) { router.push('/onboarding'); return; }
    setTimeout(() => {
      setUserProfile(p);
    }, 0);
  }, [router]);

  const handleBookingConfirmed = (booking: BookingRequest) => {
    setConfirmedBooking(booking);
    setSelectedProfile(null);
  };

  if (!userProfile) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 fade-in" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Wave background */}
      <div className="wave-container">
        <div className="wave-orange" style={{ opacity: 0.15 }} />
      </div>

      <div className="border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <span className="badge badge-blue">Accountability & Support</span>
        <h1 className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>Support Hub</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Reach out to peer advisors, accountability coaches, or counseling resources.</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl text-xs" style={{ background: 'var(--warning-light)', border: '1px solid #fde68a' }}>
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
        <div>
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Important Disclaimer</p>
          <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Reclaim AI provides behaviour-change support and does not replace qualified medical or mental-health care. All coaches are demo profiles.
          </p>
        </div>
      </div>

      {confirmedBooking && (
        <div className="card-success p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />
            <p className="text-xs font-semibold">Demo Booking request saved! slot: {confirmedBooking.timeSlot}</p>
          </div>
          <button onClick={() => setConfirmedBooking(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SUPPORT_PROFILES.map((profile) => (
          <div key={profile.id} className="card p-5 flex flex-col justify-between space-y-4 card-hover">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}>
                  {profile.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.name}</h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{profile.role}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Star className="h-3 w-3 fill-amber-400 stroke-none" />
                    <span className="text-[10px] font-bold text-amber-500">{profile.rating}</span>
                  </div>
                </div>
              </div>

              <span className="badge badge-orange text-[9px]">Demo Profile</span>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{profile.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {profile.specialty.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full border text-[9px] font-medium" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                    {s}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setSelectedProfile(profile)}
                className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Heart className="h-3.5 w-3.5" /> Book check-in
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency panel */}
      <div className="card p-6 border-red-200 bg-red-50/20 space-y-4">
        <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
          <Phone className="h-4.5 w-4.5" /> Crisis Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Emergency services', val: '911 / 999 / 112' },
            { label: 'Samaritans (UK)', val: '116 123' },
            { label: 'Crisis Text Line', val: 'Text HOME to 741741' },
          ].map(({ label, val }) => (
            <div key={label} className="p-3 rounded-lg bg-white border border-red-100">
              <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <strong className="text-sm text-red-600">{val}</strong>
            </div>
          ))}
        </div>
      </div>

      {selectedProfile && (
        <BookingModal
          profile={selectedProfile}
          userProfile={userProfile}
          onClose={() => setSelectedProfile(null)}
          onConfirm={handleBookingConfirmed}
        />
      )}
    </div>
  );
}
