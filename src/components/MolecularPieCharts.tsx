/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MolecularProperties } from '../types/cheminformatics';
import { parseSmiles } from '../services/cheminformatics';
import { PieChart, Layers } from 'lucide-react';

interface MolecularPieChartsProps {
  smiles: string;
  properties: MolecularProperties;
}

// Okabe-Ito Colorblind-Safe Scientific Palette
const ELEMENT_COLORS: Record<string, string> = {
  C: '#000000', // Black
  H: '#56B4E9', // Sky Blue
  O: '#D55E00', // Vermillion
  N: '#0072B2', // Blue
  S: '#E69F00', // Orange
  Cl: '#009E73', // Bluish Green
  F: '#009E73', // Bluish Green
  P: '#F0E442', // Yellow
  Br: '#CC79A7', // Reddish Purple
  I: '#CC79A7', // Reddish Purple
};

export const MolecularPieCharts: React.FC<MolecularPieChartsProps> = ({
  smiles,
  properties,
}) => {
  const [compositionMode, setCompositionMode] = useState<'mass' | 'atoms'>('mass');

  // Compute elemental breakdown
  const { elementSlices, totalMass, totalAtoms } = useMemo(() => {
    const { atoms } = parseSmiles(smiles);
    const counts: Record<string, number> = {};
    const masses: Record<string, number> = {};

    const weights: Record<string, number> = {
      C: 12.011, H: 1.008, O: 15.999, N: 14.007,
      S: 32.06, P: 30.974, F: 18.998, Cl: 35.45,
      Br: 79.904, I: 126.904,
    };

    let totalH = 0;
    atoms.forEach((a) => {
      counts[a.element] = (counts[a.element] || 0) + 1;
      totalH += a.implicitHydrogens;
    });

    if (totalH > 0) {
      counts['H'] = totalH;
    }

    let totM = 0;
    let totA = 0;

    Object.entries(counts).forEach(([elem, count]) => {
      const w = weights[elem] || 12.0;
      const m = count * w;
      masses[elem] = m;
      totM += m;
      totA += count;
    });

    const slices = Object.entries(counts).map(([elem, count]) => {
      const mass = masses[elem] || 0;
      const massPct = (mass / (totM || 1)) * 100;
      const atomPct = (count / (totA || 1)) * 100;
      return {
        element: elem,
        count,
        mass: Math.round(mass * 100) / 100,
        massPct: Math.round(massPct * 10) / 10,
        atomPct: Math.round(atomPct * 10) / 10,
        color: ELEMENT_COLORS[elem] || '#64748B',
      };
    }).sort((a, b) => b.mass - a.mass);

    return { elementSlices: slices, totalMass: totM, totalAtoms: totA };
  }, [smiles]);

  // Compute bonding distribution
  const bondSlices = useMemo(() => {
    const sigma = properties.sigmaBonds;
    const pi = properties.piBonds;
    const total = sigma + pi || 1;

    return [
      {
        type: 'Sigma (σ) Bonds',
        count: sigma,
        pct: Math.round((sigma / total) * 1000) / 10,
        color: '#0072B2', // Okabe-Ito Blue
        desc: 'Framework single & axial bonds',
      },
      {
        type: 'Pi (π) Bonds',
        count: pi,
        pct: Math.round((pi / total) * 1000) / 10,
        color: '#CC79A7', // Okabe-Ito Reddish Purple
        desc: 'Multiple & delocalized bonds',
      },
    ].filter(s => s.count > 0);
  }, [properties]);

  // SVG Pie Generator Helper
  const renderPieSvg = (
    data: Array<{ label: string; value: number; color: string; pct: number }>,
    size = 200,
    donut = true
  ) => {
    const radius = size / 2;
    const innerRadius = donut ? radius * 0.55 : 0;
    let cumulativeAngle = 0;

    const paths = data.map((item, idx) => {
      const sliceAngle = (item.pct / 100) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      // Handle 100% single slice
      if (item.pct >= 99.9) {
        return (
          <circle
            key={idx}
            cx={radius}
            cy={radius}
            r={radius - 5}
            fill={item.color}
          />
        );
      }

      const x1 = radius + (radius - 5) * Math.cos(startAngle - Math.PI / 2);
      const y1 = radius + (radius - 5) * Math.sin(startAngle - Math.PI / 2);
      const x2 = radius + (radius - 5) * Math.cos(endAngle - Math.PI / 2);
      const y2 = radius + (radius - 5) * Math.sin(endAngle - Math.PI / 2);

      const x3 = radius + innerRadius * Math.cos(endAngle - Math.PI / 2);
      const y3 = radius + innerRadius * Math.sin(endAngle - Math.PI / 2);
      const x4 = radius + innerRadius * Math.cos(startAngle - Math.PI / 2);
      const y4 = radius + innerRadius * Math.sin(startAngle - Math.PI / 2);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const pathData = donut
        ? `M ${x1} ${y1} A ${radius - 5} ${radius - 5} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
        : `M ${radius} ${radius} L ${x1} ${y1} A ${radius - 5} ${radius - 5} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={idx}
          d={pathData}
          fill={item.color}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          className="hover:opacity-90 transition-opacity"
        />
      );
    });

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {paths}
      </svg>
    );
  };

  const elementPieData = elementSlices.map(s => ({
    label: s.element,
    value: compositionMode === 'mass' ? s.mass : s.count,
    color: s.color,
    pct: compositionMode === 'mass' ? s.massPct : s.atomPct,
  }));

  const bondPieData = bondSlices.map(s => ({
    label: s.type,
    value: s.count,
    color: s.color,
    pct: s.pct,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Molecular Composition & Bonding Pie Diagrams</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Proportional distribution of elemental mass and covalent bond orders for {properties.formula}.
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setCompositionMode('mass')}
            className={`px-3 py-1 rounded-md transition-colors ${
              compositionMode === 'mass' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mass % (Weight)
          </button>
          <button
            onClick={() => setCompositionMode('atoms')}
            className={`px-3 py-1 rounded-md transition-colors ${
              compositionMode === 'atoms' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atom Count %
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Pie Diagram 1: Elemental Breakdown */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="relative shrink-0 flex items-center justify-center">
            {renderPieSvg(elementPieData, 170, true)}
            <div className="absolute text-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Elements</span>
              <span className="text-sm font-bold font-mono text-slate-800">{elementSlices.length}</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[11px] mb-2">
              Elemental Distribution ({compositionMode === 'mass' ? 'Mass Weight %' : 'Atom Count %'}):
            </h4>
            {elementSlices.map((s) => (
              <div key={s.element} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-bold text-slate-800 font-mono">{s.element}</span>
                  <span className="text-slate-400 text-[11px]">({s.count} atoms)</span>
                </div>
                <div className="font-mono text-slate-700">
                  <strong className="text-blue-950">
                    {compositionMode === 'mass' ? `${s.massPct}%` : `${s.atomPct}%`}
                  </strong>
                  {compositionMode === 'mass' && (
                    <span className="text-slate-400 text-[10px] ml-1">({s.mass} g)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Diagram 2: Bonding Partition Breakdown */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="relative shrink-0 flex items-center justify-center">
            {renderPieSvg(bondPieData, 170, true)}
            <div className="absolute text-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
              <span className="text-sm font-bold font-mono text-slate-800">{properties.totalBonds}</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[11px] mb-2">
              Bond Partitioning (σ and π Orders):
            </h4>
            {bondSlices.map((s) => (
              <div key={s.type} className="p-2 bg-white rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-slate-800">{s.type}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{s.count} ({s.pct}%)</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 ml-4">{s.desc}</span>
              </div>
            ))}
            <div className="text-[11px] text-slate-500 pt-1">
              Heavy atom bonds: <strong className="font-mono text-slate-700">{properties.heavyAtomBonds}</strong> · Total atoms with H: <strong className="font-mono text-slate-700">{properties.totalAtomsWithH}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Okabe-Ito Scientific Colorblind-Safe Palette Reference Bar */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
            Scientific Colorblind-Safe Color Palette (Okabe &amp; Ito, 2008):
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Accessible for deuteranopia, protanopia &amp; tritanopia</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { name: 'Black', hex: '#000000', text: '#FFFFFF', desc: 'Carbon (C)' },
            { name: 'Orange', hex: '#E69F00', text: '#000000', desc: 'Sulfur (S)' },
            { name: 'Sky Blue', hex: '#56B4E9', text: '#000000', desc: 'Hydrogen (H)' },
            { name: 'Bluish Green', hex: '#009E73', text: '#FFFFFF', desc: 'Halogens (Cl, F)' },
            { name: 'Yellow', hex: '#F0E442', text: '#000000', desc: 'Phosphorus (P)' },
            { name: 'Blue', hex: '#0072B2', text: '#FFFFFF', desc: 'Nitrogen / Sigma' },
            { name: 'Vermillion', hex: '#D55E00', text: '#FFFFFF', desc: 'Oxygen (O)' },
            { name: 'Reddish Purple', hex: '#CC79A7', text: '#000000', desc: 'Br, I / Pi' },
          ].map((c) => (
            <div
              key={c.name}
              className="p-1.5 rounded-md flex flex-col justify-between h-14 border border-black/10 shadow-2xs"
              style={{ backgroundColor: c.hex, color: c.text }}
            >
              <div className="font-bold text-[10px] leading-tight truncate">{c.name}</div>
              <div>
                <span className="font-mono text-[9px] block opacity-90">{c.hex}</span>
                <span className="text-[8.5px] block opacity-95 truncate font-medium">{c.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
