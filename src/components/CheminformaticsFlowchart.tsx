/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GitBranch, ArrowRight, ArrowDown, CheckCircle2, AlertTriangle, Layers, Activity } from 'lucide-react';

export const CheminformaticsFlowchart: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<number | null>(1);

  const steps = [
    {
      id: 1,
      name: 'Chemical Input',
      short: 'SMILES / Sketch',
      desc: 'User inputs SMILES string or draws 2D molecular graph via interactive sketcher canvas.',
      details: 'Converts typographical ASCII strings or mouse clicks into graph adjacency matrices. Handles branching parentheses and ring closures.',
      badge: 'Input Stage',
    },
    {
      id: 2,
      name: 'Validation & Graph Parsing',
      short: 'Valence Checking',
      desc: 'RDKit / cheminformatics parser validates atom valences and ring closures.',
      details: 'Computes implicit hydrogens using standard organic valence (C=4, N=3, O=2, S=2/4/6). Rejects malformed connectivity.',
      badge: 'Parsing Stage',
    },
    {
      id: 3,
      name: '2D & 3D Structure Generation',
      short: 'Conformer Modeling',
      desc: 'SmilesDrawer maps 2D coordinates; ETKDG/MMFF or PubChem maps 3D conformers.',
      details: 'Calculates bond angles (sp3 tetrahedral 109.5°, sp2 120°). Renders WebGL Ball & Stick, Space Filling CPK, and vdW surface.',
      badge: 'Visualization',
    },
    {
      id: 4,
      name: 'Descriptor Calculation',
      short: 'Physicochemical Indices',
      desc: 'Calculates MW, exact mass, LogP, TPSA, HBD, HBA, and σ/π bond partitioning.',
      details: 'Distinguishes axial framework σ bonds (with implicit H) from conjugated/double π bonds. Evaluates aromaticity.',
      badge: 'Analytics',
    },
    {
      id: 5,
      name: 'Drug-Likeness Screening',
      short: 'Lipinski & Veber Ro5',
      desc: 'Checks Lipinski Rule of 5 (MW ≤500, LogP ≤5, HBD ≤5, HBA ≤10) and Veber criteria.',
      details: 'Generates radial spider chart to assess oral bioavailability and cellular membrane permeation.',
      badge: 'Pharmacology',
    },
    {
      id: 6,
      name: 'Report & Export',
      short: 'PDF & CSV Export',
      desc: 'Generates publication-grade student lab PDF reports with figures and data tables.',
      details: 'Compiles student registration credentials, 2D/3D structure figures, educational interpretations, and RDKit Python tutorial.',
      badge: 'Final Output',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <span>Interactive Cheminformatics Pipeline Flowchart</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Architectural data flow from molecular input notation to physicochemical screening and lab report generation.
          </p>
        </div>
      </div>

      {/* Horizontal / Stacked Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 relative">
        {steps.map((st, idx) => {
          const isSelected = selectedStep === st.id;
          return (
            <div key={st.id} className="relative flex flex-col items-center">
              <button
                onClick={() => setSelectedStep(st.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[115px] ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-500'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold font-mono text-slate-400">0{st.id}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {st.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 leading-tight">{st.name}</h4>
                  <span className="text-[11px] text-blue-700 font-medium block mt-0.5">{st.short}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{st.desc}</p>
              </button>

              {/* Step arrow */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Step Deep Dive Details */}
      {selectedStep !== null && (
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-blue-900 uppercase tracking-wide text-[11px]">
              Stage 0{selectedStep}: {steps[selectedStep - 1].name} Details
            </span>
            <span className="text-blue-600 font-semibold">{steps[selectedStep - 1].badge}</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {steps[selectedStep - 1].details}
          </p>
        </div>
      )}

      {/* Drug-Likeness Decision Tree Flowchart */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lipinski's Rule of 5 Screening Decision Tree</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">1. Molecular Mass</span>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>MW ≤ 500 Da</span>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Prevents excessive molecular bulk</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">2. Lipophilicity</span>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>LogP ≤ 5.0</span>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Balances lipid and aqueous phases</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">3. H-Bond Donors</span>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>HBD ≤ 5</span>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Limit desolvation penalty</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">4. H-Bond Acceptors</span>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>HBA ≤ 10</span>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Ensures cell membrane permeability</span>
          </div>
        </div>

        {/* Decision outcome box */}
        <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Rule Compliance Outcome:</strong> If total violations ≤ 1 → Compound is candidate for favorable oral absorption.</span>
          </div>
          <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
            Pfizer Heuristic
          </span>
        </div>
      </div>
    </div>
  );
};
