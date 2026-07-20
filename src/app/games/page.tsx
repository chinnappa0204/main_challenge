'use client';

import React, { useState } from 'react';
import ZenStackGame from '@/components/games/ZenStackGame';
import NeonWarpGame from '@/components/games/NeonWarpGame';
import LightShiftGame from '@/components/games/LightShiftGame';
import CosmicBubbleGame from '@/components/games/CosmicBubbleGame';
import { Layers, Rocket, Lightbulb, Sparkles, Gamepad2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type GameId = 'stack' | 'warp' | 'light' | 'bubble';

const GAMES = [
  {
    id: 'stack' as GameId,
    title: 'Zen Stack',
    subtitle: 'Timing & Precision',
    description: 'Stack moving blocks with perfect timing on a crisp light stage.',
    icon: Layers,
    bgAccent: 'bg-sky-50 text-sky-600 border-sky-200',
    activeRing: 'ring-2 ring-sky-500 border-sky-300 bg-white shadow-md',
  },
  {
    id: 'warp' as GameId,
    title: 'Neon Warp',
    subtitle: 'Particle Arcade',
    description: 'Control your energy orb, collect Zen Orbs, and grab power-ups.',
    icon: Rocket,
    bgAccent: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    activeRing: 'ring-2 ring-emerald-500 border-emerald-300 bg-white shadow-md',
  },
  {
    id: 'light' as GameId,
    title: 'Mindful Light Shift',
    subtitle: 'Laser & Mirror Puzzle',
    description: 'Rotate optical mirrors to reflect laser beams onto target crystals.',
    icon: Lightbulb,
    bgAccent: 'bg-amber-50 text-amber-600 border-amber-200',
    activeRing: 'ring-2 ring-amber-500 border-amber-300 bg-white shadow-md',
  },
  {
    id: 'bubble' as GameId,
    title: 'Cosmic Bubble Burst',
    subtitle: 'Tactile Stress Relief',
    description: 'Pop bouncing translucent bubbles to trigger particle combo cascades.',
    icon: Sparkles,
    bgAccent: 'bg-purple-50 text-purple-600 border-purple-200',
    activeRing: 'ring-2 ring-purple-500 border-purple-300 bg-white shadow-md',
  },
];

export default function GamesHubPage() {
  const [activeGame, setActiveGame] = useState<GameId>('stack');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 fade-in" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-xs tracking-wider uppercase mb-1" style={{ color: 'var(--accent-blue-mid)' }}>
            <Gamepad2 className="w-4 h-4" />
            <span>Mindful Refreshment Zone</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Dopamine Reset Mini-Games
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            4 minimal, satisfying games designed to redirect urge loops and refresh your focus.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 text-xs font-semibold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Today</span>
        </Link>
      </div>

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {GAMES.map((g) => {
          const Icon = g.icon;
          const isActive = activeGame === g.id;

          return (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? g.activeRing
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl border ${g.bgAccent} flex items-center justify-center mb-3 shadow-xs`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{g.title}</span>
              <span className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{g.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Active Game Stage Container */}
      <div className="w-full flex justify-center">
        {activeGame === 'stack' && <ZenStackGame />}
        {activeGame === 'warp' && <NeonWarpGame />}
        {activeGame === 'light' && <LightShiftGame />}
        {activeGame === 'bubble' && <CosmicBubbleGame />}
      </div>
    </div>
  );
}
