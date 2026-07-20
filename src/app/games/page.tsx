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
    description: 'Stack moving glowing neon blocks with perfect timing to build a tower.',
    icon: Layers,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
  },
  {
    id: 'warp' as GameId,
    title: 'Neon Warp',
    subtitle: 'Particle Arcade',
    description: 'Control your energy orb, collect Zen Orbs, and grab power-ups.',
    icon: Rocket,
    color: 'from-emerald-500 to-cyan-600',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'light' as GameId,
    title: 'Mindful Light Shift',
    subtitle: 'Laser & Mirror Puzzle',
    description: 'Rotate optical mirrors to reflect laser beams onto target crystals.',
    icon: Lightbulb,
    color: 'from-cyan-400 to-emerald-500',
    borderColor: 'border-cyan-400/30',
  },
  {
    id: 'bubble' as GameId,
    title: 'Cosmic Bubble Burst',
    subtitle: 'Tactile Stress Relief',
    description: 'Pop bouncing translucent bubbles to trigger particle combo cascades.',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-500/30',
  },
];

export default function GamesHubPage() {
  const [activeGame, setActiveGame] = useState<GameId>('stack');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Gamepad2 className="w-4 h-4" />
            <span>Mindful Refreshment Zone</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Dopamine Reset Mini-Games
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            4 minimal, satisfying games designed to redirect urge loops and refresh your focus.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-xs font-semibold transition-all self-start sm:self-auto cursor-pointer"
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
                  ? `bg-slate-900 ${g.borderColor} shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40`
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-white mb-3 shadow-md`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-100 text-sm leading-tight">{g.title}</span>
              <span className="text-[11px] text-slate-400 mt-0.5 font-medium">{g.subtitle}</span>
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
