'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, Trophy, Target } from 'lucide-react';

interface Peg {
  x: number;
  y: number;
  radius: number;
  color: string;
  points: number;
  hitTimer: number;
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

export default function ZenOrbitalGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [combo, setCombo] = useState(0);

  const stateRef = useRef<{
    ball: { x: number; y: number; vx: number; vy: number; radius: number; active: boolean };
    pegs: Peg[];
    particles: Particle[];
    aimAngle: number;
    animId: number;
  }>({
    ball: { x: 300, y: 400, vx: 0, vy: 0, radius: 10, active: false },
    pegs: [],
    particles: [],
    aimAngle: -Math.PI / 2,
    animId: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('reclaim_zenorbital_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
      });
    }
  };

  const createPegs = (): Peg[] => {
    const pegs: Peg[] = [];
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    // Top target arch
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI / 8) * (i + 1);
      pegs.push({
        x: 300 + Math.cos(angle - Math.PI) * 180,
        y: 160 + Math.sin(angle - Math.PI) * 100,
        radius: 14,
        color: colors[i % colors.length],
        points: 50,
        hitTimer: 0,
      });
    }

    // Middle grid pegs
    for (let row = 0; row < 3; row++) {
      const count = row % 2 === 0 ? 5 : 4;
      const startX = row % 2 === 0 ? 120 : 165;
      for (let col = 0; col < count; col++) {
        pegs.push({
          x: startX + col * 90,
          y: 220 + row * 55,
          radius: 12,
          color: colors[(row + col) % colors.length],
          points: 30,
          hitTimer: 0,
        });
      }
    }
    return pegs;
  };

  const initGame = useCallback(() => {
    stateRef.current = {
      ball: { x: 300, y: 410, vx: 0, vy: 0, radius: 10, active: false },
      pegs: createPegs(),
      particles: [],
      aimAngle: -Math.PI / 2,
      animId: 0,
    };
    setScore(0);
    setBallsLeft(3);
    setCombo(0);
    setGameOver(false);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.ball.active || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const dx = clickX - 300;
    const dy = clickY - 410;
    let angle = Math.atan2(dy, dx);
    // Restrict angle upwards
    if (angle > -0.2) angle = -0.2;
    if (angle < -Math.PI + 0.2) angle = -Math.PI + 0.2;
    stateRef.current.aimAngle = angle;
  };

  const handleLaunch = () => {
    if (stateRef.current.ball.active || gameOver) return;
    const angle = stateRef.current.aimAngle;
    const power = 13;

    stateRef.current.ball.vx = Math.cos(angle) * power;
    stateRef.current.ball.vy = Math.sin(angle) * power;
    stateRef.current.ball.active = true;

    soundSynth.playPop(1.4);
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
      const b = state.ball;

      // Draw Light Background
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      // Draw Aim Line
      if (!b.active && !gameOver) {
        ctx.save();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(300, 410);
        ctx.lineTo(300 + Math.cos(state.aimAngle) * 120, 410 + Math.sin(state.aimAngle) * 120);
        ctx.stroke();
        ctx.restore();
      }

      // Physics & Ball Movement
      if (b.active) {
        b.vy += 0.22; // Gravity
        b.x += b.vx;
        b.y += b.vy;

        // Bounce Walls
        if (b.x < b.radius) {
          b.x = b.radius;
          b.vx *= -0.85;
          soundSynth.playPop(0.8);
        }
        if (b.x > width - b.radius) {
          b.x = width - b.radius;
          b.vx *= -0.85;
          soundSynth.playPop(0.8);
        }
        if (b.y < b.radius) {
          b.y = b.radius;
          b.vy *= -0.85;
          soundSynth.playPop(0.8);
        }

        // Check Peg Collisions
        state.pegs.forEach((peg) => {
          const dist = Math.hypot(b.x - peg.x, b.y - peg.y);
          if (dist < b.radius + peg.radius) {
            // Calculate collision normal
            const nx = (b.x - peg.x) / dist;
            const ny = (b.y - peg.y) / dist;

            // Reflect velocity
            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 2 * dot * nx) * 0.9;
            b.vy = (b.vy - 2 * dot * ny) * 0.9;

            // Separate ball
            b.x = peg.x + nx * (b.radius + peg.radius);
            b.y = peg.y + ny * (b.radius + peg.radius);

            peg.hitTimer = 10;
            soundSynth.playChime(score % 8);
            spawnParticles(peg.x, peg.y, peg.color, 12);

            setScore((prev) => {
              const next = prev + peg.points;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('reclaim_zenorbital_highscore', next.toString());
              }
              return next;
            });
          }
        });

        // Bottom Drain Check
        if (b.y > height + 20) {
          b.active = false;
          b.x = 300;
          b.y = 410;
          b.vx = 0;
          b.vy = 0;

          setBallsLeft((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setGameOver(true);
              soundSynth.playBump();
            } else {
              soundSynth.playPop(0.6);
            }
            return next;
          });
        }
      }

      // Draw Pegs
      state.pegs.forEach((peg) => {
        if (peg.hitTimer > 0) peg.hitTimer--;

        ctx.save();
        ctx.fillStyle = peg.hitTimer > 0 ? '#38bdf8' : peg.color;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius + (peg.hitTimer > 0 ? 3 : 0), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Draw Launcher Base
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(300, 410, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Ball
      ctx.save();
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

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
  }, [initGame, gameOver, score, highScore]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm p-4">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 rounded-xl text-slate-800 font-bold text-lg flex items-center gap-2 shadow-xs">
            <Target className="w-4 h-4 text-sky-600" />
            <span className="text-xs text-slate-500 font-semibold uppercase">Score</span>
            <span className="text-sky-600 text-xl">{score}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-sky-700 font-bold text-xs shadow-xs">
            <span>Orbs Left:</span>
            <span className="text-sky-800 text-sm font-extrabold">{ballsLeft}</span>
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
        height={460}
        onPointerMove={handlePointerMove}
        onClick={handleLaunch}
        className="w-full h-[460px] max-w-[600px] rounded-xl cursor-crosshair touch-none"
      />

      {!stateRef.current.ball.active && !gameOver && (
        <div className="absolute bottom-6 text-slate-600 text-xs font-semibold bg-white/90 backdrop-blur px-4 py-1.5 rounded-full border border-slate-200 shadow-xs pointer-events-none animate-pulse">
          Aim cursor and click to launch target orb
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20 fade-in p-6">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Target Bounce Complete!
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
