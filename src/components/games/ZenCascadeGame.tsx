'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { soundSynth } from '@/lib/audio';
import { RotateCcw, Volume2, VolumeX, Trophy, Sparkles } from 'lucide-react';

const GRID_SIZE = 6;
const COLORS = [
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
];

interface Tile {
  id: string;
  color: string;
}

export default function ZenCascadeGame() {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('reclaim_zencascade_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  const initGrid = useCallback(() => {
    const newGrid: Tile[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({
          id: Math.random().toString(36).substring(7),
          color: getRandomColor(),
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setScore(0);
    setComboCount(0);
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  // Find connected matching tiles
  const getConnectedTiles = (startR: number, startC: number, currentGrid: Tile[][]): [number, number][] => {
    const targetColor = currentGrid[startR][startC].color;
    const visited = new Set<string>();
    const matchGroup: [number, number][] = [];

    const queue: [number, number][] = [[startR, startC]];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      matchGroup.push([r, c]);

      const neighbors: [number, number][] = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];

      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && currentGrid[nr][nc]?.color === targetColor) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
    return matchGroup;
  };

  const handleTileClick = (r: number, c: number) => {
    if (!grid[r] || !grid[r][c]) return;

    const group = getConnectedTiles(r, c, grid);
    if (group.length < 2) {
      soundSynth.playBump();
      return;
    }

    soundSynth.playPop(1 + group.length * 0.1);

    const count = group.length;
    const points = count * 20 + (count > 3 ? (count - 3) * 30 : 0);

    setComboCount((prev) => prev + 1);
    setScore((prev) => {
      const next = prev + points;
      if (next > highScore) {
        setHighScore(next);
        localStorage.setItem('reclaim_zencascade_highscore', next.toString());
      }
      return next;
    });

    // Remove group and collapse grid
    const newGrid = grid.map((row) => [...row]);
    group.forEach(([gr, gc]) => {
      newGrid[gr][gc] = null as unknown as Tile;
    });

    // Drop tiles down (gravity)
    for (let col = 0; col < GRID_SIZE; col++) {
      const remaining: Tile[] = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        if (newGrid[row][col]) remaining.push(newGrid[row][col]);
      }
      // Fill top with new random tiles
      while (remaining.length < GRID_SIZE) {
        remaining.unshift({
          id: Math.random().toString(36).substring(7),
          color: getRandomColor(),
        });
      }
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row][col] = remaining[row];
      }
    }

    setGrid(newGrid);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[520px] rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm p-6">
      {/* Top Bar */}
      <div className="w-full max-w-[440px] flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl text-sky-800 font-bold text-base flex items-center gap-2 shadow-xs">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-xs text-slate-500 uppercase">Score</span>
            <span className="text-sky-600 text-lg font-extrabold">{score}</span>
          </div>
          {comboCount > 1 && (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-700 font-extrabold text-xs shadow-xs animate-bounce">
              {comboCount}x BLAST!
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
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

      {/* Grid Container */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <div className="grid grid-cols-6 gap-2 w-[340px] h-[340px]">
          {grid.map((row, rIdx) =>
            row.map((tile, cIdx) => (
              <button
                key={tile?.id || `${rIdx}-${cIdx}`}
                onClick={() => handleTileClick(rIdx, cIdx)}
                className="w-12 h-12 rounded-xl border border-white/60 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: tile?.color || '#cbd5e1' }}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-[440px]">
        <p className="text-slate-500 text-xs font-medium">
          Tap 2 or more adjacent matching color tiles to blast them!
        </p>

        <button
          onClick={initGrid}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Grid</span>
        </button>
      </div>
    </div>
  );
}
