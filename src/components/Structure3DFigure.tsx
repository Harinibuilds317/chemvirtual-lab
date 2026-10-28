/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { render3DProjection } from '../services/draw3dProjection';
import { RefreshCw } from 'lucide-react';

interface Structure3DFigureProps {
  smiles: string;
  width?: number;
  height?: number;
}

export const Structure3DFigure: React.FC<Structure3DFigureProps> = ({
  smiles,
  width = 320,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const draw = async () => {
      if (!canvasRef.current) return;
      await render3DProjection(smiles, canvasRef.current, { width, height });
      if (!isCancelled) {
        setLoading(false);
      }
    };

    draw();

    return () => {
      isCancelled = true;
    };
  }, [smiles, width, height]);

  return (
    <div className="relative flex flex-col items-center justify-center bg-white rounded-lg p-2 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-2xs text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-1.5" />
          <span>Generating 3D projection...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto object-contain"
      />
    </div>
  );
};
