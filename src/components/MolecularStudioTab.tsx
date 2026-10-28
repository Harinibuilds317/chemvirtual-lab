/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MolecularProperties } from '../types/cheminformatics';
import { MolecularViewer3D } from './MolecularViewer3D';
import { ChemicalDrawer2D } from './ChemicalDrawer2D';
import { Layers, Box, Atom, Info } from 'lucide-react';

interface MolecularStudioTabProps {
  smiles: string;
  properties: MolecularProperties;
  onOpenSketcher: () => void;
}

export const MolecularStudioTab: React.FC<MolecularStudioTabProps> = ({
  smiles,
  properties,
  onOpenSketcher,
}) => {
  const [activeView, setActiveView] = useState<'both' | '3d' | '2d'>('both');

  return (
    <div className="space-y-6">
      {/* View mode switcher */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-600" />
            <span>Interactive 2D & 3D Molecular Studio</span>
          </h2>
          <p className="text-xs text-slate-500">
            Simultaneously explore 2D topological connectivity and 3D spatial conformation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveView('both')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeView === 'both' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dual View (2D + 3D)
          </button>
          <button
            onClick={() => setActiveView('3d')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeView === '3d' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3D Studio Only
          </button>
          <button
            onClick={() => setActiveView('2d')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeView === '2d' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2D Connectivity Only
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D WebGL Canvas Viewport */}
        {(activeView === 'both' || activeView === '3d') && (
          <div className={activeView === 'both' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <MolecularViewer3D smiles={smiles} height={520} />
          </div>
        )}

        {/* 2D & Information Column */}
        {(activeView === 'both' || activeView === '2d') && (
          <div className={activeView === 'both' ? 'lg:col-span-4 space-y-4' : 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6'}>
            {/* 2D Chemical Canvas Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-indigo-600" />
                  <span>2D Chemical Graph</span>
                </span>
                <button
                  onClick={onOpenSketcher}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Edit in Sketcher
                </button>
              </div>

              <div className="bg-slate-50/70 rounded-lg p-2 flex items-center justify-center border border-slate-100">
                <ChemicalDrawer2D smiles={smiles} width={320} height={230} theme="light" />
              </div>
            </div>

            {/* Geometry & Symmetry Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Spatial & Bonding Characteristics</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Chemical Formula:</span>
                  <span className="font-mono font-bold text-slate-800">{properties.formula}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Molecular Mass:</span>
                  <span className="font-mono font-semibold text-slate-800">{properties.molecularWeight} g/mol</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Total Atoms (w/ H):</span>
                  <span className="font-mono font-semibold text-slate-800">{properties.totalAtomsWithH}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Sigma (σ) Bonds:</span>
                  <span className="font-mono font-semibold text-blue-700">{properties.sigmaBonds}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pi (π) Bonds:</span>
                  <span className="font-mono font-semibold text-indigo-700">{properties.piBonds}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Fraction Csp3:</span>
                  <span className="font-mono font-semibold text-slate-800">{properties.fractionCsp3}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Aromatic Rings:</span>
                  <span className="font-mono font-semibold text-slate-800">{properties.aromaticRings}</span>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/70 rounded-lg text-[11px] text-blue-900 flex items-start gap-2 border border-blue-100">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Tip: Toggle between <strong>Ball & Stick</strong>, <strong>Space Filling (CPK)</strong>, and <strong>van der Waals Surface</strong> in the 3D controls to study steric volume and active binding pockets.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
