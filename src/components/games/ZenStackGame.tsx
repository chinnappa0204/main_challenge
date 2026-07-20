'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, Trophy } from 'lucide-react';

interface Block {
  x: number;
  z: number;
  width: number;
  depth: number;
  y: number;
  color: string;
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

export default function ZenStackGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [combo, setCombo] = useState(0);

  const gameStateRef = useRef<{
    stack: Block[];
    currentBlock: {
      x: number;
      z: number;
      width: number;
      depth: number;
      y: number;
      color: string;
      direction: 'x' | 'z';
      speed: number;
    };
    particles: Particle[];
    cameraY: number;
    targetCameraY: number;
    animId: number;
  }>({
    stack: [],
    currentBlock: {
      x: 0,
      z: 0,
      width: 140,
      depth: 140,
      y: 0,
      color: 'hsl(210, 80%, 60%)',
      direction: 'x',
      speed: 3,
    },
    particles: [],
    cameraY: 0,
    targetCameraY: 0,
    animId: 0,
  });

  const getHslColor = (index: number) => {
    const hue = (200 + index * 12) % 360;
    return `hsl(${hue}, 75%, 60%)`;
  };

  useEffect(() => {
    const saved = localStorage.getItem('reclaim_zenstack_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const initGame = useCallback(() => {
    const baseWidth = 140;
    const baseDepth = 140;
    const initialStack: Block[] = [
      {
        x: 0,
        z: 0,
        width: baseWidth,
        depth: baseDepth,
        y: 0,
        color: 'hsl(210, 80%, 50%)',
      },
    ];

    gameStateRef.current = {
      stack: initialStack,
      currentBlock: {
        x: -250,
        z: 0,
        width: baseWidth,
        depth: baseDepth,
        y: 20,
        color: getHslColor(1),
        direction: 'x',
        speed: 3.5,
      },
      particles: [],
      cameraY: 0,
      targetCameraY: 0,
      animId: 0,
    };

    setScore(0);
    setCombo(0);
    setGameOver(false);
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      gameStateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
      });
    }
  };

  const handlePlaceBlock = useCallback(() => {
    if (gameOver) return;

    const { stack, currentBlock } = gameStateRef.current;
    const prevBlock = stack[stack.length - 1];
    const isX = currentBlock.direction === 'x';

    const diff = isX ? currentBlock.x - prevBlock.x : currentBlock.z - prevBlock.z;
    const maxOverlap = isX ? currentBlock.width : currentBlock.depth;

    const overlap = maxOverlap - Math.abs(diff);

    if (overlap <= 0) {
      // Missed completely -> Game Over
      setGameOver(true);
      soundSynth.playBump();
      return;
    }

    const isPerfect = Math.abs(diff) < 6;
    let newWidth = currentBlock.width;
    let newDepth = currentBlock.depth;
    let newX = currentBlock.x;
    let newZ = currentBlock.z;

    if (isPerfect) {
      // Perfect placement alignment!
      newX = prevBlock.x;
      newZ = prevBlock.z;
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      soundSynth.playChime(nextCombo);
      spawnParticles(0, -currentBlock.y, currentBlock.color, 20);
    } else {
      setCombo(0);
      soundSynth.playPop(1 + stack.length * 0.05);

      if (isX) {
        newWidth = overlap;
        newX = prevBlock.x + diff / 2;
      } else {
        newDepth = overlap;
        newZ = prevBlock.z + diff / 2;
      }
      spawnParticles(diff * 0.5, -currentBlock.y, currentBlock.color, 10);
    }

    const placedBlock: Block = {
      x: newX,
      z: newZ,
      width: newWidth,
      depth: newDepth,
      y: currentBlock.y,
      color: currentBlock.color,
    };

    stack.push(placedBlock);

    const newScore = stack.length - 1;
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('reclaim_zenstack_highscore', newScore.toString());
    }

    const nextDirection: 'x' | 'z' = isX ? 'z' : 'x';
    const speed = Math.min(3.5 + newScore * 0.12, 9);
    const startPos = (Math.random() > 0.5 ? 1 : -1) * 220;

    gameStateRef.current.currentBlock = {
      x: nextDirection === 'x' ? startPos : newX,
      z: nextDirection === 'z' ? startPos : newZ,
      width: newWidth,
      depth: newDepth,
      y: currentBlock.y + 20,
      color: getHslColor(stack.length),
      direction: nextDirection,
      speed,
    };

    gameStateRef.current.targetCameraY = stack.length * 20;
  }, [gameOver, combo, highScore]);

  // Main rendering loop
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
      const state = gameStateRef.current;

      // Update Camera
      state.cameraY += (state.targetCameraY - state.cameraY) * 0.1;

      // Update Current Block position
      if (!gameOver) {
        const cur = state.currentBlock;
        if (cur.direction === 'x') {
          cur.x += cur.speed;
          if (cur.x > 220 || cur.x < -220) cur.speed *= -1;
        } else {
          cur.z += cur.speed;
          if (cur.z > 220 || cur.z < -220) cur.speed *= -1;
        }
      }

      // Draw background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid ambient gradient
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2 + 120 + state.cameraY);

      // Isometric projection helper
      const project = (x: number, y: number, z: number) => {
        const isoX = (x - z) * 0.866;
        const isoY = (x + z) * 0.5 - y;
        return { x: isoX, y: isoY };
      };

      const drawIsometricBlock = (block: Block, isCurrent = false) => {
        const w = block.width / 2;
        const d = block.depth / 2;
        const h = 20;

        const p1 = project(block.x - w, block.y, block.z - d);
        const p2 = project(block.x + w, block.y, block.z - d);
        const p3 = project(block.x + w, block.y, block.z + d);
        const p4 = project(block.x - w, block.y, block.z + d);

        const p1Top = project(block.x - w, block.y + h, block.z - d);
        const p2Top = project(block.x + w, block.y + h, block.z - d);
        const p3Top = project(block.x + w, block.y + h, block.z + d);
        const p4Top = project(block.x - w, block.y + h, block.z + d);

        // Top Face
        ctx.fillStyle = block.color;
        ctx.beginPath();
        ctx.moveTo(p1Top.x, p1Top.y);
        ctx.lineTo(p2Top.x, p2Top.y);
        ctx.lineTo(p3Top.x, p3Top.y);
        ctx.lineTo(p4Top.x, p4Top.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right Face
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(p2Top.x, p2Top.y);
        ctx.lineTo(p3Top.x, p3Top.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = block.color;
        ctx.fill();

        // Left Face
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(p3Top.x, p3Top.y);
        ctx.lineTo(p4Top.x, p4Top.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();

        if (isCurrent) {
          ctx.shadowColor = block.color;
          ctx.shadowBlur = 15;
        }
      };

      // Draw Stack
      state.stack.forEach((b) => drawIsometricBlock(b));

      // Draw Current Moving Block
      if (!gameOver) {
        drawIsometricBlock(state.currentBlock as Block, true);
      }

      // Draw & update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [initGame, gameOver]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl p-4">
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 px-4 py-2 rounded-xl text-white font-bold text-lg flex items-center gap-2 shadow-lg">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Score</span>
            <span className="text-cyan-400 text-xl">{score}</span>
          </div>
          {combo > 1 && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-400 font-extrabold text-xs animate-bounce">
              {combo}x PERFECT COMBO!
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Best: {highScore}</span>
          </div>
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              soundSynth.setMuted(next);
            }}
            className="p-2.5 bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 rounded-xl text-slate-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Canvas Game Area */}
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        onClick={handlePlaceBlock}
        className="w-full h-[460px] max-w-[600px] rounded-xl cursor-pointer touch-none"
      />

      {/* Tap Instruction */}
      {!gameOver && (
        <div className="absolute bottom-6 text-slate-400 text-xs font-medium bg-slate-900/80 backdrop-blur px-4 py-1.5 rounded-full border border-slate-800 pointer-events-none animate-pulse">
          Tap or Click anywhere to drop block
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-20 fade-in p-6">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Mindful Stack Complete!
          </h2>
          <p className="text-slate-400 text-sm mb-6">You built a tower of <span className="text-cyan-300 font-bold">{score}</span> blocks.</p>

          <button
            onClick={initGame}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
