/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Box, Compass, Layers, ShieldCheck, Atom } from 'lucide-react';
import { CheminformaticsFlowchart } from './CheminformaticsFlowchart';

export const TheorySection: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-blue-700">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Educational Curriculum</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          📖 Fundamentals of Cheminformatics & Molecular Modeling
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Division of Chemistry, School of Sciences, SRM Institute of Science and Technology, Tiruchirappalli.
        </p>
      </div>

      {/* Interactive Workflow & Decision Flowcharts */}
      <CheminformaticsFlowchart />

      {/* 1. What is Cheminformatics? */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Atom className="w-4 h-4 text-blue-600" />
          <span>1. What is Cheminformatics?</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Cheminformatics is an interdisciplinary field that merges <strong>Chemistry</strong>, <strong>Computer Science</strong>, and <strong>Information Technology</strong> to solve chemical problems. It utilizes computational techniques to represent, store, search, visualize, and analyze chemical information and structure-activity relationships.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
            <strong className="text-blue-900 block font-semibold mb-1">⚗️ Chemistry</strong>
            <p className="text-slate-600">
              Chemical bonds, thermodynamics, stereochemistry, reactivity, and synthetic pathways.
            </p>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
            <strong className="text-indigo-900 block font-semibold mb-1">💻 Computer Science</strong>
            <p className="text-slate-600">
              Graph algorithms, graph traversal (DFS/BFS), relational data structures, and WebGL rendering.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block font-semibold mb-1">📊 Data Analysis</strong>
            <p className="text-slate-600">
              QSAR models, descriptor clustering, machine learning, and statistical screening.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SMILES Notation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-indigo-600" />
          <span>2. SMILES (Simplified Molecular Input Line Entry System)</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          <strong>SMILES</strong> encodes 2D molecular graph connectivity into a 1D typographical text string. It is universally used in chemical databases and machine learning pipelines.
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block">Atoms & Valence:</strong>
            <span className="text-slate-600">Organic subset elements (C, N, O, P, S, F, Cl, Br, I) are written without brackets. Implicit hydrogens are automatically filled based on normal valence rules. Non-organic atoms are bracketed (e.g. [Na+], [OH-]).</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block">Bonds:</strong>
            <span className="text-slate-600">Single bonds are implied by adjacency (e.g. <code>CCO</code>). Double bonds use <code>=</code> (e.g. <code>C=C</code>), triple bonds use <code>#</code> (e.g. <code>C#C</code>).</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block">Branches:</strong>
            <span className="text-slate-600">Branches are enclosed in round parentheses <code>( )</code>. For example, acetic acid is written as <code>CC(=O)O</code>.</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block">Rings & Aromaticity:</strong>
            <span className="text-slate-600">Ring closures use numbers matching opening and closing atoms (e.g. <code>C1CCCCC1</code> for cyclohexane). Aromatic atoms are written in lowercase letters (e.g. <code>c1ccccc1</code> for benzene).</span>
          </div>
        </div>
      </div>

      {/* 3. Molecular Descriptors */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>3. Molecular Descriptors & Physicochemical Indices</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Molecular descriptors convert chemical structures into numerical properties that determine pharmacokinetic and pharmacological behavior:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900 block font-semibold">Molecular Weight (MW)</strong>
            <p className="text-slate-600 mt-0.5">Average atomic weight sum. Influences molecular size, passive diffusion rates, and formulation.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900 block font-semibold">Octanol-Water Partition (LogP)</strong>
            <p className="text-slate-600 mt-0.5">Measures lipophilicity. Determines membrane permeability, lipid bilayer partitioning, and solubility.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900 block font-semibold">Topological Polar Surface Area (TPSA)</strong>
            <p className="text-slate-600 mt-0.5">Sum of polar oxygen, nitrogen, and attached hydrogen surface areas. Crucial for blood-brain barrier and gut permeation.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900 block font-semibold">Hydrogen Bond Donors (HBD) & Acceptors (HBA)</strong>
            <p className="text-slate-600 mt-0.5">HBD: OH and NH groups. HBA: Electronegative N, O, and F atoms with available lone pairs.</p>
          </div>
        </div>
      </div>

      {/* 4. Drug-Likeness Criteria */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>4. Drug-Likeness & Bioavailability Rules</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Medicinal chemistry applies empirical heuristic rules to screen small molecule candidates for oral bioavailability:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100">
            <strong className="text-blue-900 block font-bold mb-1">Lipinski's Rule of Five (Pfizer Rule)</strong>
            <ul className="space-y-1 text-slate-700 list-disc list-inside mt-1">
              <li>Molecular Weight (MW) ≤ 500 Da</li>
              <li>Calculated LogP ≤ 5.0</li>
              <li>Hydrogen Bond Donors (HBD) ≤ 5</li>
              <li>Hydrogen Bond Acceptors (HBA) ≤ 10</li>
            </ul>
            <span className="text-[11px] text-blue-700 block mt-2">A compound is deemed orally bioavailable if it has ≤ 1 violation.</span>
          </div>

          <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <strong className="text-indigo-900 block font-bold mb-1">Veber's Bioavailability Criteria</strong>
            <ul className="space-y-1 text-slate-700 list-disc list-inside mt-1">
              <li>Rotatable Bonds ≤ 10 (controls conformational entropy upon binding)</li>
              <li>Topological Polar Surface Area (TPSA) ≤ 140 Å² (cell membrane crossing)</li>
            </ul>
            <span className="text-[11px] text-indigo-700 block mt-2">Essential supplementary filters for passive intestinal absorption.</span>
          </div>
        </div>
      </div>

      {/* 5. 3D Molecular Representation Models */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Box className="w-4 h-4 text-emerald-600" />
          <span>5. 3D Molecular Representation Models</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-800 block">🟢 Ball & Stick</strong>
            <p className="text-slate-600 mt-1">Atoms as spheres and bonds as connecting cylinders; optimal for stereochemistry and bond angles.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-800 block">🟡 Stick Model</strong>
            <p className="text-slate-600 mt-1">Focuses directly on the covalent bonding skeleton and ring geometry.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-800 block">🔵 Space Filling (CPK)</strong>
            <p className="text-slate-600 mt-1">Atoms sized to their van der Waals radii; illustrates steric volume and molecular packing.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-800 block">⚪ van der Waals Surface</strong>
            <p className="text-slate-600 mt-1">Continuous solvent-accessible or electron density surface mesh around the molecule.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
