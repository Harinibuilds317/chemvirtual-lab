/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LipinskiRuleResult, MolecularProperties } from '../types/cheminformatics';

interface LipinskiRadarChartProps {
  properties: MolecularProperties;
  lipinski: LipinskiRuleResult;
}

export const LipinskiRadarChart: React.FC<LipinskiRadarChartProps> = ({
  properties,
  lipinski,
}) => {
  // 6 Radial Dimensions: MW (<=500), LogP (<=5), HBD (<=5), HBA (<=10), RotBonds (<=10), TPSA (<=140)
  const dimensions = [
    { name: 'MW', label: 'Mol Wt (≤500)', max: 600, limit: 500, value: properties.molecularWeight },
    { name: 'LogP', label: 'LogP (≤5.0)', max: 6.0, limit: 5.0, value: Math.max(0, properties.logP) },
    { name: 'HBD', label: 'HBD (≤5)', max: 8, limit: 5, value: properties.hbd },
    { name: 'HBA', label: 'HBA (≤10)', max: 14, limit: 10, value: properties.hba },
    { name: 'RotB', label: 'Rot Bonds (≤10)', max: 15, limit: 10, value: properties.rotatableBonds },
    { name: 'TPSA', label: 'TPSA (≤140)', max: 180, limit: 140, value: properties.tpsa },
  ];

  const size = 300;
  const center = size / 2;
  const radius = 100;
  const total = dimensions.length;

  const getCoordinates = (index: number, valNorm: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = radius * Math.min(1.0, Math.max(0.05, valNorm));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Safe boundary polygon points (each at its normalized limit)
  const safePoints = dimensions.map((d, i) => {
    const norm = d.limit / d.max;
    const { x, y } = getCoordinates(i, norm);
    return `${x},${y}`;
  }).join(' ');

  // Current molecule polygon points
  const moleculePoints = dimensions.map((d, i) => {
    const norm = d.value / d.max;
    const { x, y } = getCoordinates(i, norm);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
      <div className="w-full flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Drug-Likeness Bioavailability Radar
        </h4>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#009E73] font-semibold">
            <span className="w-2.5 h-0.5 bg-[#009E73] inline-block" /> Rule Limit (≤)
          </span>
          <span className="flex items-center gap-1 text-[#0072B2] font-semibold">
            <span className="w-2 h-2 bg-[#0072B2]/40 border border-[#0072B2] rounded-2xs inline-block" /> Molecule Profile
          </span>
        </div>
      </div>

      <svg width={size} height={size} className="overflow-visible">
        {/* Concentric reference rings */}
        {[0.25, 0.5, 0.75, 1.0].map((ring) => {
          const r = radius * ring;
          return (
            <circle
              key={ring}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="#E2E8F0"
              strokeDasharray={ring < 1.0 ? '2,2' : undefined}
            />
          );
        })}

        {/* Radial Axis Spokes */}
        {dimensions.map((d, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={d.name}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#CBD5E1"
              strokeWidth={1}
            />
          );
        })}

        {/* Safe threshold polygon (Okabe-Ito Bluish Green #009E73) */}
        <polygon
          points={safePoints}
          fill="rgba(0, 158, 115, 0.12)"
          stroke="#009E73"
          strokeWidth={1.8}
          strokeDasharray="4,2"
        />

        {/* Current molecule polygon (Okabe-Ito Blue #0072B2) */}
        <polygon
          points={moleculePoints}
          fill="rgba(0, 114, 178, 0.28)"
          stroke="#0072B2"
          strokeWidth={2}
        />

        {/* Vertex points & Labels */}
        {dimensions.map((d, i) => {
          const norm = d.value / d.max;
          const { x, y } = getCoordinates(i, norm);
          const labelCoord = getCoordinates(i, 1.22);

          const isViolated = (d.name === 'MW' && !lipinski.mw.passed) ||
                            (d.name === 'LogP' && !lipinski.logP.passed) ||
                            (d.name === 'HBD' && !lipinski.hbd.passed) ||
                            (d.name === 'HBA' && !lipinski.hba.passed) ||
                            (d.name === 'RotB' && !lipinski.veberRotatable.passed) ||
                            (d.name === 'TPSA' && !lipinski.veberTpsa.passed);

          return (
            <g key={d.name}>
              <circle
                cx={x}
                cy={y}
                r={4}
                fill={isViolated ? '#D55E00' : '#0072B2'}
                stroke="#FFFFFF"
                strokeWidth={1.2}
              />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={isViolated ? 700 : 600}
                fill={isViolated ? '#D55E00' : '#000000'}
                fontFamily="system-ui, sans-serif"
              >
                {d.name} ({typeof d.value === 'number' ? (Number.isInteger(d.value) ? d.value : d.value.toFixed(1)) : d.value})
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[11px] text-slate-500 text-center max-w-xs">
        Values within the green dotted boundary satisfy standard Lipinski & Veber drug-likeness rules.
      </p>
    </div>
  );
};
