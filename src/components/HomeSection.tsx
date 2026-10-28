/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LabPage } from '../types/cheminformatics';
import { EXAMPLE_MOLECULES } from '../services/cheminformatics';
import { 
  FlaskConical, 
  Eye, 
  BarChart2, 
  TrendingUp, 
  HelpCircle, 
  FileText, 
  BookOpen, 
  Mail, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HomeSectionProps {
  onNavigate: (page: LabPage) => void;
  onSelectSmiles: (smiles: string) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  onNavigate,
  onSelectSmiles,
}) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner with SRMIST Branding and Logo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-100">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>SRM Institute of Science and Technology · Tiruchirappalli</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Cheminformatics Virtual Laboratory
            </h1>

            <p className="text-sm font-medium text-slate-600 mt-1">
              Faculty of Engineering and Technology | School of Sciences | Division of Chemistry
            </p>

            <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">
              An advanced computational chemistry workbench designed to train students in molecular SMILES grammar, 2D graph topology, interactive 3D WebGL conformation, bond order partitioning, drug-likeness screening, flowcharts, and comparative pharmacology.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={() => onNavigate('studio')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Launch 2D/3D Studio</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>

              <button
                onClick={() => onNavigate('drug-comparison')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <span>Drug Comparison Matrix</span>
              </button>

              <button
                onClick={() => onNavigate('properties')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                <span>Properties & Pie Charts</span>
              </button>

              <button
                onClick={() => onNavigate('report')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Lab Report (3D Figures)</span>
              </button>
            </div>
          </div>

          {/* SRM Institute Logo Emblem Card */}
          <div className="shrink-0 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs max-w-sm flex items-center justify-center">
            <img
              src="/srm_logo.svg"
              alt="SRM Institute of Science and Technology"
              className="w-72 h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Laboratory Modules Quick Access Bento */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Interactive Virtual Laboratory Modules</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: 2D & 3D Studio */}
          <div
            onClick={() => onNavigate('studio')}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-700 transition-colors">
                2D & 3D Molecular Studio
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Interact with 3D WebGL models (Ball & Stick, CPK Space-Filling, Wireframe, vdW Surface) and sketch structures with the 2D canvas editor.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Properties & Drug-Likeness */}
          <div
            onClick={() => onNavigate('properties')}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-indigo-700 transition-colors">
                Properties & Lipinski Ro5
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Calculate complete descriptors (MW, LogP, TPSA, HBD, HBA, σ/π bonds) with real-time Lipinski Rule of 5 and Veber bioavailability radar charts.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>Evaluate Properties</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Batch Analysis */}
          <div
            onClick={() => onNavigate('comparison')}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                Batch Compound Comparison
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Input multi-compound libraries, sort properties, analyze correlation scatter plots, and export comparison datasets as CSV.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span>Compare Compounds</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Assessment Mode */}
          <div
            onClick={() => onNavigate('assessment')}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-amber-700 transition-colors">
                Interactive Assessment
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Practice 12 cheminformatics test questions with tiered hints, pedagogical explanations, and score tracking with celebrations.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-600">
              <span>Take Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Final Lab Report */}
          <div
            onClick={() => onNavigate('report')}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-rose-700 transition-colors">
                Student Lab Report Generator
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Compile student credentials, 2D/3D structure figures, full property tables, and educational RDKit code into a single downloadable PDF.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-600">
              <span>Generate Report</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Theory & Curriculum */}
          <div
            onClick={() => onNavigate('theory')}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-slate-900 transition-colors">
                Theory & Learning Guides
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Read core textbook chapters on SMILES grammar, topological descriptors, bonding partition rules, and Lipinski's Rule of 5.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-700">
              <span>Read Theory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Example Molecules Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              🧪 Curriculum Benchmark Molecules
            </h3>
            <p className="text-xs text-slate-500">
              Click any compound to load its structure and calculate properties across all laboratory views.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-[#1E3A8A] text-white uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-1/4">Compound Name</th>
                <th className="py-2.5 px-4 font-semibold w-1/3 font-mono">SMILES Notation</th>
                <th className="py-2.5 px-4 font-semibold">Curriculum Description</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.entries(EXAMPLE_MOLECULES).map(([name, data], idx) => (
                <tr key={name} className={idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="py-2 px-4 font-semibold text-slate-800">{name}</td>
                  <td className="py-2 px-4 font-mono text-blue-900 font-medium">{data.smiles}</td>
                  <td className="py-2 px-4 text-slate-600">{data.description}</td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => {
                        onSelectSmiles(data.smiles);
                        onNavigate('properties');
                      }}
                      className="px-2.5 py-1 text-xs text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded font-medium transition-colors"
                    >
                      Load & Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Credits & Coordinator Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Developed By</span>
            <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
              LUTUKURTHI H S S V KRISHNA SATYA
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              School of Sciences · Faculty of Engineering and Technology<br />
              SRM Institute of Science and Technology, Tiruchirappalli
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              <strong>Faculty Mentor & Course Coordinator:</strong> Dr. R. Subramanian (Assistant Professor, Division of Chemistry)
            </p>
          </div>
          <div className="md:col-span-4 bg-white p-4 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">Academic Inquiries & Queries:</span>
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <a href="mailto:srisailutukurthi@gmail.com" className="hover:underline font-mono">
                srisailutukurthi@gmail.com
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              SRMIST Tiruchirappalli Campus, Tamil Nadu, India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
