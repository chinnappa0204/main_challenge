'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Bubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  mantra: string;
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

const MANTRAS = [
  'Urges pass in waves.',
  'I choose real life.',
  'Breathe deep.',
  'Focus returns now.',
  'I am in control.',
  'Mind over habit.',
  'Peace in this moment.',
];

const COLORS = [
  'hsl(190, 90%, 55%)',
  'hsl(210, 85%, 60%)',
  'hsl(270, 80%, 65%)',
  'hsl(160, 85%, 55%)',
  'hsl(330, 80%, 60%)',
];

export default function CosmicBubbleGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [lastMantra, setLastMantra] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const stateRef = useRef<{
    bubbles: Bubble[];
    particles: Particle[];
    animId: number;
  }>({
    bubbles: [],
    particles: [],
    animId: 0,
  });

  const spawnParticles = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 5 + 2,
        color,
        alpha: 1,
      });
    }
  };

  const createBubble = (width = 600, height = 440): Bubble => ({
    id: Math.random().toString(36).substring(7),
    x: Math.random() * (width - 100) + 50,
    y: Math.random() * (height - 100) + 50,
    vx: (Math.random() - 0.5) * 2.5,
    vy: (Math.random() - 0.5) * 2.5,
    radius: Math.random() * 18 + 24,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    mantra: MANTRAS[Math.floor(Math.random() * MANTRAS.length)],
  });

  const initGame = useCallback(() => {
    const bubbles: Bubble[] = [];
    for (let i = 0; i < 10; i++) {
      bubbles.push(createBubble());
    }
    stateRef.current = {
      bubbles,
      particles: [],
      animId: 0,
    };
    setPoppedCount(0);
    setLastMantra('Tap any cosmic bubble to release focus!');
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const { bubbles } = stateRef.current;

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      if (dist <= b.radius) {
        soundSynth.playPop(1 + poppedCount * 0.05);
        spawnParticles(b.x, b.y, b.color, 18);
        setLastMantra(b.mantra);
        setPoppedCount((prev) => prev + 1);

        // Remove bubble and respawn new one
        bubbles.splice(i, 1);
        bubbles.push(createBubble(canvas.width, canvas.height));
        break;
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
      const { bubbles, particles } = stateRef.current;

      // Draw dark cosmic background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Move & draw bubbles
      bubbles.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;
        if (b.y < b.radius || b.y > height - b.radius) b.vy *= -1;

        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;

        const grad = ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, 2, b.x, b.y, b.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.4, b.color);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.4)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.025;

        if (pt.alpha <= 0) {
          particles.splice(i, 1);
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
  }, [initGame, poppedCount]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-4">
      {/* Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Bubbles Released:</span>
            <span className="text-purple-400 text-lg">{poppedCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Mantra Overlay */}
      {lastMantra && (
        <div className="absolute top-18 z-10 bg-slate-900/90 border border-purple-500/30 px-4 py-2 rounded-xl text-purple-200 text-xs font-semibold shadow-lg animate-fade-in text-center max-w-xs">
          ✨ "{lastMantra}"
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={440}
        onPointerDown={handlePointerDown}
        className="w-full h-[440px] max-w-[600px] rounded-xl cursor-pointer touch-none"
      />
    </div>
  );
}
