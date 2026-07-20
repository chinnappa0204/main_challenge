'use client';

import React, { useState, useEffect } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, CheckCircle2, ChevronRight, Lightbulb } from 'lucide-react';

interface GridCell {
  type: 'empty' | 'mirror' | 'target' | 'emitter';
  angle?: 0 | 90 | 180 | 270;
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

  useEffect(() => {
    if (!level) return;
    const clonedGrid = JSON.parse(JSON.stringify(level.initialGrid));
    setGrid(clonedGrid);
    setIsLevelSolved(false);
  }, [currentLevelIdx, level]);

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
        if (angle === 0 || angle === 180) {
          if (dir === 'right') dir = 'up';
          else if (dir === 'down') dir = 'left';
          else if (dir === 'left') dir = 'down';
          else if (dir === 'up') dir = 'right';
        } else {
          if (dir === 'right') dir = 'down';
          else if (dir === 'down') dir = 'right';
          else if (dir === 'left') dir = 'up';
          else if (dir === 'up') dir = 'left';
        }
      }

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
      setCurrentLevelIdx(0);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm p-6">
      {/* Top Bar */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl text-sky-800 font-bold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-sky-600" />
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
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition-all cursor-pointer shadow-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      </div>

      <p className="text-slate-600 text-xs mb-6 text-center max-w-sm">
        Tap optical mirrors to rotate laser reflections until the beam activates the Zen Crystal!
      </p>

      {/* Grid Container */}
      <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
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
                      ? 'bg-emerald-100 border-emerald-400 shadow-md text-emerald-800'
                      : isLaser
                      ? 'bg-sky-100 border-sky-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cell.type === 'emitter' && (
                    <div className="w-6 h-6 rounded-full bg-sky-500 shadow-md flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    </div>
                  )}

                  {cell.type === 'target' && (
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs transition-all ${
                        isTargetHit ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      ❖
                    </div>
                  )}

                  {cell.type === 'mirror' && (
                    <div
                      className="w-10 h-10 flex items-center justify-center text-sky-600 font-bold text-xl transition-transform duration-300"
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
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-lg mb-3">
            <CheckCircle2 className="w-5 h-5" /> Level Solved!
          </div>

          <button
            onClick={nextLevel}
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-105 cursor-pointer text-sm"
          >
            <span>Next Puzzle</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
