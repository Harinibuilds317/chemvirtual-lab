/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';

interface ChemicalDrawer2DProps {
  smiles: string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export const ChemicalDrawer2D: React.FC<ChemicalDrawer2DProps> = ({
  smiles,
  width = 450,
  height = 320,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !smiles || !smiles.trim()) return;

    setError(null);
    const canvas = canvasRef.current;

    const drawerOptions = {
      width,
      height,
      bondThickness: 1.8,
      bondLength: 22,
      shortBondLength: 0.85,
      bondSpacing: 0.18 * 22,
      atomVisualization: 'default',
      isomeric: true,
      themes: {
        light: {
          C: '#000000', // Black
          O: '#D55E00', // Vermillion
          N: '#0072B2', // Blue
          S: '#E69F00', // Orange
          P: '#F0E442', // Yellow
          Cl: '#009E73', // Bluish Green
          F: '#009E73', // Bluish Green
          Br: '#CC79A7', // Reddish Purple
          I: '#CC79A7', // Reddish Purple
          BACKGROUND: '#FFFFFF',
        },
        dark: {
          C: '#FFFFFF',
          O: '#D55E00',
          N: '#56B4E9', // Sky Blue in dark
          S: '#E69F00',
          P: '#F0E442',
          Cl: '#009E73',
          F: '#009E73',
          Br: '#CC79A7',
          I: '#CC79A7',
          BACKGROUND: '#000000',
        },
      },
    };

    try {
      const drawer = new SmilesDrawer.Drawer(drawerOptions);
      SmilesDrawer.parse(
        smiles.trim(),
        (tree: any) => {
          drawer.draw(tree, canvas, theme, false);
        },
        (err: any) => {
          // If smiles-drawer parse fails, draw custom fallback structure
          drawFallbackDiagram(canvas, smiles);
        }
      );
    } catch (e: any) {
      drawFallbackDiagram(canvas, smiles);
    }
  }, [smiles, width, height, theme]);

  const drawFallbackDiagram = (canvas: HTMLCanvasElement, s: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme === 'dark' ? '#0F172A' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = theme === 'dark' ? '#94A3B8' : '#475569';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`2D Diagram: ${s}`, canvas.width / 2, canvas.height / 2);
  };

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-white p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto object-contain"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 text-xs text-rose-600 p-2">
          {error}
        </div>
      )}
    </div>
  );
};
