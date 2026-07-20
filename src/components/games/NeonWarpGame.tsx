'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, Shield, Zap, Magnet } from 'lucide-react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'zen' | 'distraction' | 'powerup';
  powerType?: 'shield' | 'slow' | 'magnet';
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

export default function NeonWarpGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activePowerup, setActivePowerup] = useState<string | null>(null);

  const stateRef = useRef<{
    player: { x: number; y: number; radius: number; trail: { x: number; y: number }[] };
    orbs: Orb[];
    particles: Particle[];
    shieldActive: boolean;
    slowActive: boolean;
    magnetActive: boolean;
    powerupTimer: number;
    animId: number;
  }>({
    player: { x: 300, y: 220, radius: 14, trail: [] },
    orbs: [],
    particles: [],
    shieldActive: false,
    slowActive: false,
    magnetActive: false,
    powerupTimer: 0,
    animId: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('reclaim_neonwarp_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
      });
    }
  };

  const initGame = useCallback(() => {
    const initialOrbs: Orb[] = [];
    // Spawn initial zen orbs & distraction orbs
    for (let i = 0; i < 6; i++) {
      initialOrbs.push({
        x: Math.random() * 540 + 30,
        y: Math.random() * 380 + 30,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 10,
        type: 'zen',
      });
    }
    for (let i = 0; i < 5; i++) {
      initialOrbs.push({
        x: Math.random() * 540 + 30,
        y: Math.random() * 380 + 30,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 12,
        type: 'distraction',
      });
    }

    stateRef.current = {
      player: { x: 300, y: 220, radius: 14, trail: [] },
      orbs: initialOrbs,
      particles: [],
      shieldActive: false,
      slowActive: false,
      magnetActive: false,
      powerupTimer: 0,
      animId: 0,
    };

    setScore(0);
    setActivePowerup(null);
    setGameOver(false);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    stateRef.current.player.x = x;
    stateRef.current.player.y = y;
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
      const p = state.player;

      // Update player trail
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 12) p.trail.pop();

      // Powerup timer decay
      if (state.powerupTimer > 0) {
        state.powerupTimer--;
        if (state.powerupTimer <= 0) {
          state.shieldActive = false;
          state.slowActive = false;
          state.magnetActive = false;
          setActivePowerup(null);
        }
      }

      // Draw background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw Player Trail
      p.trail.forEach((t, idx) => {
        const alpha = (1 - idx / p.trail.length) * 0.4;
        ctx.fillStyle = state.shieldActive ? `rgba(59, 130, 246, ${alpha})` : `rgba(6, 182, 212, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.radius * (1 - idx / p.trail.length * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player
      ctx.save();
      ctx.shadowColor = state.shieldActive ? '#3b82f6' : '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = state.shieldActive ? '#60a5fa' : '#22d3ee';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      if (state.shieldActive) {
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Update & draw Orbs
      const speedMult = state.slowActive ? 0.4 : 1;

      for (let i = state.orbs.length - 1; i >= 0; i--) {
        const orb = state.orbs[i];

        // Move orb
        orb.x += orb.vx * speedMult;
        orb.y += orb.vy * speedMult;

        // Bounce walls
        if (orb.x < orb.radius || orb.x > width - orb.radius) orb.vx *= -1;
        if (orb.y < orb.radius || orb.y > height - orb.radius) orb.vy *= -1;

        // Magnet effect for zen orbs
        if (state.magnetActive && orb.type === 'zen') {
          const dx = p.x - orb.x;
          const dy = p.y - orb.y;
          orb.x += dx * 0.05;
          orb.y += dy * 0.05;
        }

        // Draw Orb
        ctx.save();
        if (orb.type === 'zen') {
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#34d399';
        } else if (orb.type === 'distraction') {
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fb7185';
        } else {
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#c084fc';
        }

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Check collision with Player
        const dist = Math.hypot(p.x - orb.x, p.y - orb.y);
        if (dist < p.radius + orb.radius) {
          if (orb.type === 'zen') {
            soundSynth.playPop(1.2);
            spawnParticles(orb.x, orb.y, '#34d399', 10);
            state.orbs.splice(i, 1);

            // Increase Score
            setScore((prev) => {
              const next = prev + 10;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('reclaim_neonwarp_highscore', next.toString());
              }
              return next;
            });

            // Respawn Zen orb
            state.orbs.push({
              x: Math.random() * (width - 60) + 30,
              y: Math.random() * (height - 60) + 30,
              vx: (Math.random() - 0.5) * 2.5,
              vy: (Math.random() - 0.5) * 2.5,
              radius: 10,
              type: 'zen',
            });

            // Chance to spawn powerup
            if (Math.random() < 0.15) {
              const types: ('shield' | 'slow' | 'magnet')[] = ['shield', 'slow', 'magnet'];
              state.orbs.push({
                x: Math.random() * (width - 60) + 30,
                y: Math.random() * (height - 60) + 30,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius: 14,
                type: 'powerup',
                powerType: types[Math.floor(Math.random() * types.length)],
              });
            }
          } else if (orb.type === 'powerup') {
            soundSynth.playSuccess();
            spawnParticles(orb.x, orb.y, '#c084fc', 16);
            state.orbs.splice(i, 1);

            state.powerupTimer = 300; // 5 seconds
            if (orb.powerType === 'shield') {
              state.shieldActive = true;
              setActivePowerup('Shield Active!');
            } else if (orb.powerType === 'slow') {
              state.slowActive = true;
              setActivePowerup('Time Slow-Mo!');
            } else if (orb.powerType === 'magnet') {
              state.magnetActive = true;
              setActivePowerup('Orb Magnet!');
            }
          } else if (orb.type === 'distraction') {
            if (state.shieldActive) {
              soundSynth.playBump();
              spawnParticles(orb.x, orb.y, '#60a5fa', 12);
              state.orbs.splice(i, 1);
              state.shieldActive = false;
              setActivePowerup(null);
            } else if (!gameOver) {
              soundSynth.playBump();
              spawnParticles(p.x, p.y, '#fb7185', 25);
              setGameOver(true);
            }
          }
        }
      }

      // Render Particles
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
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-4">
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 px-4 py-2 rounded-xl text-white font-bold text-lg flex items-center gap-2 shadow-lg">
            <span className="text-xs text-slate-400 font-semibold uppercase">Zen Orbs</span>
            <span className="text-emerald-400 text-xl">{score}</span>
          </div>
          {activePowerup && (
            <div className="bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 rounded-xl text-purple-300 font-extrabold text-xs flex items-center gap-1.5 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              {activePowerup}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold">
            Best: {highScore}
          </div>
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              soundSynth.setMuted(next);
            }}
            className="p-2.5 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Game Legend */}
      <div className="absolute top-16 left-4 flex items-center gap-3 z-10 text-[10px] font-semibold text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400" /> Collect</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-sm shadow-rose-400" /> Dodge</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shadow-sm shadow-purple-400" /> Powerup</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={440}
        onPointerMove={handlePointerMove}
        className="w-full h-[440px] max-w-[600px] rounded-xl cursor-crosshair touch-none"
      />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20 fade-in p-6">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2">
            Warp Session Complete!
          </h2>
          <p className="text-slate-400 text-sm mb-6">Score: <span className="text-emerald-400 font-bold">{score}</span> Orbs Collected</p>

          <button
            onClick={initGame}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
