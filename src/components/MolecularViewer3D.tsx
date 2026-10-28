/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as $3Dmol from '3dmol';
import { get3DConformer } from '../services/conformer3d';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Camera, RefreshCw } from 'lucide-react';

export type VisualizationStyle = 'Ball and Stick' | 'Stick' | 'Space Filling' | 'Wireframe' | 'Cartoon';

interface MolecularViewer3DProps {
  smiles: string;
  height?: number;
  initialStyle?: VisualizationStyle;
  initialShowSurface?: boolean;
}

export const MolecularViewer3D: React.FC<MolecularViewer3DProps> = ({
  smiles,
  height = 500,
  initialStyle = 'Ball and Stick',
  initialShowSurface = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [style, setStyle] = useState<VisualizationStyle>(initialStyle);
  const [showSurface, setShowSurface] = useState<boolean>(initialShowSurface);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<'white' | 'dark'>('white');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentSdf, setCurrentSdf] = useState<string>('');
  const surfaceIdRef = useRef<any>(null);

  // Apply styling to the 3D model
  const applyStyle = useCallback((viewer: any, chosenStyle: VisualizationStyle, surfaceEnabled: boolean) => {
    if (!viewer) return;

    // Reset styles
    viewer.setStyle({}, {});

    if (chosenStyle === 'Ball and Stick') {
      viewer.setStyle({}, {
        stick: { radius: 0.15, colorscheme: 'Jmol' },
        sphere: { scale: 0.30, colorscheme: 'Jmol' },
      });
    } else if (chosenStyle === 'Stick') {
      viewer.setStyle({}, {
        stick: { radius: 0.20, colorscheme: 'Jmol' },
      });
    } else if (chosenStyle === 'Space Filling') {
      viewer.setStyle({}, {
        sphere: { scale: 1.0, colorscheme: 'Jmol' },
      });
    } else if (chosenStyle === 'Wireframe') {
      viewer.setStyle({}, {
        line: { linewidth: 2.0, colorscheme: 'Jmol' },
      });
    } else if (chosenStyle === 'Cartoon') {
      viewer.setStyle({}, {
        stick: { radius: 0.12, colorscheme: 'Jmol' },
        sphere: { scale: 0.20, colorscheme: 'Jmol' },
      });
    }

    // Handle surface
    if (surfaceIdRef.current) {
      viewer.removeSurface(surfaceIdRef.current);
      surfaceIdRef.current = null;
    }

    if (surfaceEnabled) {
      try {
        surfaceIdRef.current = viewer.addSurface($3Dmol.SurfaceType.VDW, {
          opacity: 0.70,
          color: 'white',
        });
      } catch (err) {
        console.warn('Surface generation warning:', err);
      }
    }

    viewer.render();
  }, []);

  // Initialize viewer on mount or smiles change
  useEffect(() => {
    if (!containerRef.current || !smiles) return;

    let isCancelled = false;
    setLoading(true);

    const initViewer = async () => {
      const sdf = await get3DConformer(smiles);
      if (isCancelled) return;
      setCurrentSdf(sdf);

      const container = containerRef.current;
      if (!container) return;

      // Clear previous canvas if any
      container.innerHTML = '';

      const viewer = $3Dmol.createViewer(container, {
        backgroundColor: bgColor === 'white' ? 'white' : '#0F172A',
      });
      viewerRef.current = viewer;

      viewer.clear();
      viewer.addModel(sdf, 'sdf');
      applyStyle(viewer, style, showSurface);
      viewer.zoomTo();
      viewer.render();

      if (isSpinning) {
        viewer.spin('y', 1.0);
      }

      setLoading(false);
    };

    initViewer();

    return () => {
      isCancelled = true;
      if (viewerRef.current) {
        viewerRef.current.clear();
      }
    };
  }, [smiles, bgColor]);

  // Handle style or surface state changes without full reload
  useEffect(() => {
    if (viewerRef.current && currentSdf) {
      applyStyle(viewerRef.current, style, showSurface);
    }
  }, [style, showSurface, currentSdf, applyStyle]);

  // Handle spin toggle
  const toggleSpin = () => {
    if (!viewerRef.current) return;
    if (isSpinning) {
      viewerRef.current.spin(false);
      setIsSpinning(false);
    } else {
      viewerRef.current.spin('y', 1.0);
      setIsSpinning(true);
    }
  };

  const handleResetCamera = () => {
    if (!viewerRef.current) return;
    viewerRef.current.zoomTo();
    viewerRef.current.render();
  };

  const handleZoom = (factor: number) => {
    if (!viewerRef.current) return;
    viewerRef.current.zoom(factor);
    viewerRef.current.render();
  };

  const handleCapturePng = () => {
    if (!viewerRef.current) return;
    const uri = viewerRef.current.pngURI();
    if (!uri) return;
    const link = document.createElement('a');
    link.download = `3D_structure_${smiles.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = uri;
    link.click();
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 3D Controls Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Style Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="model-style-select" className="font-medium text-slate-600">Model Style:</label>
          <select
            id="model-style-select"
            value={style}
            onChange={(e) => setStyle(e.target.value as VisualizationStyle)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="Ball and Stick">Ball and Stick</option>
            <option value="Stick">Stick</option>
            <option value="Space Filling">Space Filling (CPK)</option>
            <option value="Wireframe">Wireframe</option>
            <option value="Cartoon">Cartoon</option>
          </select>
        </div>

        {/* Surface & Background Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showSurface}
              onChange={(e) => setShowSurface(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>van der Waals Surface</span>
          </label>

          <button
            onClick={() => setBgColor(prev => prev === 'white' ? 'dark' : 'white')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
            title="Toggle viewer background"
          >
            {bgColor === 'white' ? 'Theme: Light' : 'Theme: Dark'}
          </button>
        </div>

        {/* Camera and Interaction Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSpin}
            className={`p-1.5 rounded-md border transition-colors ${
              isSpinning 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Auto-rotate molecule"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            title="Reset Camera"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCapturePng}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            title="Save PNG image"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snapshot</span>
          </button>
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs text-xs text-slate-600">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <span>Generating 3D molecular conformer...</span>
          </div>
        )}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        />
        
        {/* Interaction hints */}
        <div className="absolute bottom-3 left-3 pointer-events-none text-[11px] text-slate-400 bg-white/70 px-2 py-1 rounded backdrop-blur-xs border border-slate-200/50">
          Left Click + Drag: Rotate · Right Click: Pan · Scroll: Zoom
        </div>
      </div>
    </div>
  );
};
