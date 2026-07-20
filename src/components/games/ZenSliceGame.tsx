'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, Trophy, Zap } from 'lucide-react';

interface FloatingTarget {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'zen' | 'distraction';
  sliced: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

export default function ZenSliceGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const stateRef = useRef<{
    targets: FloatingTarget[];
    particles: Particle[];
    trail: TrailPoint[];
    isMouseDown: boolean;
    spawnTimer: number;
    animId: number;
  }>({
    targets: [],
    particles: [],
    trail: [],
    isMouseDown: false,
    spawnTimer: 0,
    animId: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('reclaim_zenslice_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.5) * 9,
        size: Math.random() * 5 + 2,
        color,
        alpha: 1,
      });
    }
  };

  const spawnTarget = (width = 600) => {
    const isDistraction = Math.random() < 0.25;
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    stateRef.current.targets.push({
      id: Math.random().toString(36).substring(7),
      x: Math.random() * (width - 120) + 60,
      y: 460,
      vx: (Math.random() - 0.5) * 4,
      vy: -(Math.random() * 4 + 10),
      radius: isDistraction ? 16 : 22,
      color: isDistraction ? '#ef4444' : colors[Math.floor(Math.random() * colors.length)],
      type: isDistraction ? 'distraction' : 'zen',
      sliced: false,
    });
  };

  const initGame = useCallback(() => {
    stateRef.current = {
      targets: [],
      particles: [],
      trail: [],
      isMouseDown: false,
      spawnTimer: 0,
      animId: 0,
    };
    setScore(0);
    setLives(3);
    setGameOver(false);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    stateRef.current.trail.unshift({ x, y });
    if (stateRef.current.trail.length > 10) stateRef.current.trail.pop();

    // Check collision with slice trail
    const targets = stateRef.current.targets;
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (t.sliced) continue;

      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist < t.radius + 15) {
        t.sliced = true;
        if (t.type === 'zen') {
          soundSynth.playPop(1.3);
          spawnParticles(t.x, t.y, t.color, 18);
          setScore((prev) => {
            const next = prev + 10;
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('reclaim_zenslice_highscore', next.toString());
            }
            return next;
          });
        } else {
          // Hit distraction spike
          soundSynth.playBump();
          spawnParticles(t.x, t.y, '#ef4444', 24);
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) setGameOver(true);
            return next;
          });
        }
      }
    }
  };

  useEffect(() => {
    initGame();
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const state = stateRef.current;

      // Spawner timer
      if (!gameOver) {
        state.spawnTimer++;
        if (state.spawnTimer > 45) {
          spawnTarget(width);
          state.spawnTimer = 0;
        }
      }

      // Draw Light Background
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      // Draw Blade Trail
      if (state.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(state.trail[0].x, state.trail[0].y);
        for (let i = 1; i < state.trail.length; i++) {
          ctx.lineTo(state.trail[i].x, state.trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Targets
      for (let i = state.targets.length - 1; i >= 0; i--) {
        const t = state.targets[i];
        t.vy += 0.24; // Gravity
        t.x += t.vx;
        t.y += t.vy;

        if (t.y > height + 40) {
          state.targets.splice(i, 1);
          continue;
        }

        if (!t.sliced) {
          ctx.save();
          ctx.fillStyle = t.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;

        if (pt.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [initGame, gameOver, highScore]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm p-4">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 rounded-xl text-slate-800 font-bold text-lg flex items-center gap-2 shadow-xs">
            <Zap className="w-4 h-4 text-sky-600" />
            <span className="text-xs text-slate-500 font-semibold uppercase">Score</span>
            <span className="text-sky-600 text-xl">{score}</span>
          </div>

          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-red-600 font-extrabold text-xs shadow-xs">
            <span>Lives:</span>
            <span className="text-red-700 text-sm">{lives}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Best: {highScore}</span>
          </div>
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              soundSynth.setMuted(next);
            }}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition-all cursor-pointer shadow-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={440}
        onPointerMove={handlePointerMove}
        className="w-full h-[440px] max-w-[600px] rounded-xl cursor-crosshair touch-none"
      />

      {!gameOver && (
        <div className="absolute bottom-6 text-slate-500 text-xs font-semibold bg-white/90 backdrop-blur px-4 py-1.5 rounded-full border border-slate-200 shadow-xs pointer-events-none animate-pulse">
          Swipe cursor across targets to slice (Dodge red spikes!)
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20 fade-in p-6">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Slice Session Complete!
          </h2>
          <p className="text-slate-600 text-sm mb-6">Total Score: <span className="text-sky-600 font-bold">{score}</span> points</p>

          <button
            onClick={initGame}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-105 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
