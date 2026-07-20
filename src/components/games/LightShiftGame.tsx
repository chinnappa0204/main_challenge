'use client';

import React, { useState, useEffect } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, CheckCircle2, ChevronRight, Lightbulb } from 'lucide-react';

interface GridCell {
  type: 'empty' | 'mirror' | 'target' | 'emitter';
  angle?: 0 | 90 | 180 | 270; // Mirror angle
  hit?: boolean;
}

interface Level {
  id: number;
  gridSize: number;
  emitter: { x: number; y: number; dir: 'right' | 'down' | 'left' | 'up' };
  target: { x: number; y: number };
  initialGrid: GridCell[][];
}

const LEVELS: Level[] = [
  {
    id: 1,
    gridSize: 4,
    emitter: { x: 0, y: 0, dir: 'right' },
    target: { x: 3, y: 3 },
    initialGrid: [
      [{ type: 'emitter' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'mirror', angle: 90 }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'empty' }, { type: 'mirror', angle: 0 }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'target' }],
    ],
  },
  {
    id: 2,
    gridSize: 4,
    emitter: { x: 0, y: 0, dir: 'right' },
    target: { x: 0, y: 3 },
    initialGrid: [
      [{ type: 'emitter' }, { type: 'empty' }, { type: 'mirror', angle: 0 }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'mirror', angle: 90 }, { type: 'mirror', angle: 180 }, { type: 'empty' }],
      [{ type: 'target' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
    ],
  },
  {
    id: 3,
    gridSize: 5,
    emitter: { x: 0, y: 2, dir: 'right' },
    target: { x: 4, y: 2 },
    initialGrid: [
      [{ type: 'empty' }, { type: 'mirror', angle: 90 }, { type: 'empty' }, { type: 'mirror', angle: 0 }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'emitter' }, { type: 'empty' }, { type: 'mirror', angle: 0 }, { type: 'empty' }, { type: 'target' }],
      [{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'mirror', angle: 180 }, { type: 'empty' }, { type: 'mirror', angle: 270 }, { type: 'empty' }],
    ],
  },
];

export default function LightShiftGame() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [laserPath, setLaserPath] = useState<{ x: number; y: number }[]>([]);
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const level = LEVELS[currentLevelIdx];

  // Initialize level grid
  useEffect(() => {
    if (!level) return;
    const clonedGrid = JSON.parse(JSON.stringify(level.initialGrid));
    setGrid(clonedGrid);
    setIsLevelSolved(false);
  }, [currentLevelIdx, level]);

  // Recalculate Laser Beam Path whenever grid changes
  useEffect(() => {
    if (!level || grid.length === 0) return;

    const path: { x: number; y: number }[] = [];
    let curX = level.emitter.x;
    let curY = level.emitter.y;
    let dir = level.emitter.dir;

    let steps = 0;
    const maxSteps = 30;
    let hitTarget = false;

    while (curX >= 0 && curX < level.gridSize && curY >= 0 && curY < level.gridSize && steps < maxSteps) {
      path.push({ x: curX, y: curY });

      const cell = grid[curY]?.[curX];

      if (curX === level.target.x && curY === level.target.y && path.length > 1) {
        hitTarget = true;
        break;
      }

      if (cell && cell.type === 'mirror') {
        const angle = cell.angle || 0;
        // Mirror reflection math
        if (angle === 0 || angle === 180) {
          // '/' direction mirror
          if (dir === 'right') dir = 'up';
          else if (dir === 'down') dir = 'left';
          else if (dir === 'left') dir = 'down';
          else if (dir === 'up') dir = 'right';
        } else {
          // '\' direction mirror
          if (dir === 'right') dir = 'down';
          else if (dir === 'down') dir = 'right';
          else if (dir === 'left') dir = 'up';
          else if (dir === 'up') dir = 'left';
        }
      }

      // Move next step
      if (dir === 'right') curX++;
      else if (dir === 'left') curX--;
      else if (dir === 'down') curY++;
      else if (dir === 'up') curY--;

      steps++;
    }

    setLaserPath(path);

    if (hitTarget && !isLevelSolved) {
      setIsLevelSolved(true);
      soundSynth.playSuccess();
    }
  }, [grid, level, isLevelSolved]);

  const rotateMirror = (r: number, c: number) => {
    if (isLevelSolved) return;
    const cell = grid[r][c];
    if (cell.type !== 'mirror') return;

    soundSynth.playLaserTurn();

    const newGrid = [...grid.map((row) => [...row])];
    const newAngle = (((cell.angle || 0) + 90) % 360) as 0 | 90 | 180 | 270;
    newGrid[r][c].angle = newAngle;
    setGrid(newGrid);
  };

  const nextLevel = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
    } else {
      setCurrentLevelIdx(0); // Restart level loop
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-6">
      {/* Top Bar */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <span>Puzzle Level {currentLevelIdx + 1} / {LEVELS.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              soundSynth.setMuted(next);
            }}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      <p className="text-slate-400 text-xs mb-6 text-center max-w-sm">
        Tap optical mirrors to rotate laser reflections until the beam activates the Zen Crystal!
      </p>

      {/* Grid Container */}
      <div className="relative p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))` }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isLaser = laserPath.some((p) => p.x === cIdx && p.y === rIdx);
              const isTargetHit = isLevelSolved && cIdx === level.target.x && rIdx === level.target.y;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => rotateMirror(rIdx, cIdx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
                    isTargetHit
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/30'
                      : isLaser
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cell.type === 'emitter' && (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    </div>
                  )}

                  {cell.type === 'target' && (
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs transition-all ${
                        isTargetHit ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      ❖
                    </div>
                  )}

                  {cell.type === 'mirror' && (
                    <div
                      className="w-10 h-10 flex items-center justify-center text-cyan-300 font-bold text-xl transition-transform duration-300"
                      style={{ transform: `rotate(${cell.angle || 0}deg)` }}
                    >
                      /
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Solved Overlay Modal */}
      {isLevelSolved && (
        <div className="mt-6 flex flex-col items-center fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-lg mb-3">
            <CheckCircle2 className="w-5 h-5" /> Level Solved!
          </div>

          <button
            onClick={nextLevel}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 cursor-pointer text-sm"
          >
            <span>Next Puzzle</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
