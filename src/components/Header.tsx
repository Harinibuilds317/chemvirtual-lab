/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LabPage } from '../types/cheminformatics';
import { FlaskConical, BookOpen, Eye, BarChart2, TrendingUp, HelpCircle, FileText, User, GitCompare } from 'lucide-react';

interface HeaderProps {
  currentPage: LabPage;
  onNavigate: (page: LabPage) => void;
  studentName?: string;
  registrationNumber?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  studentName,
  registrationNumber,
}) => {
  const navItems: { id: LabPage; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'theory', label: 'Theory & Flowcharts', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'studio', label: '2D/3D Studio', icon: <Eye className="w-4 h-4" /> },
    { id: 'properties', label: 'Properties & Pies', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'drug-comparison', label: 'Drug Comparison', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'comparison', label: 'Batch Analysis', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'assessment', label: 'Assessment', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'report', label: 'Lab Report', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Institutional Top Strip */}
      <div className="bg-[#1E3A8A] text-white px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/40">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide uppercase text-blue-100">SRM Institute of Science and Technology</span>
          <span className="text-blue-300 hidden md:inline">·</span>
          <span className="text-blue-200 hidden md:inline">Tiruchirappalli Campus</span>
          <span className="text-blue-300 hidden lg:inline">·</span>
          <span className="text-blue-200 hidden lg:inline">School of Sciences | Division of Chemistry</span>
        </div>
        <div className="flex items-center gap-4 text-blue-200 text-[11px]">
          <span>Developer: <strong className="text-white font-semibold">LUTUKURTHI H S S V KRISHNA SATYA</strong></span>
          <span className="hidden sm:inline text-blue-300">·</span>
          <span className="hidden sm:inline">Mentor: Dr. R. Subramanian</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-6">
          {/* Brand Wordmark with SRM Crest Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left shrink-0 cursor-pointer focus:outline-hidden"
          >
            <img
              src="/srm_logo.svg"
              alt="SRM Institute of Science and Technology Logo"
              className="h-10 w-auto object-contain shrink-0"
              onError={(e) => {
                // If svg fails fallback gracefully
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="border-l border-slate-200 pl-3">
              <span className="text-sm font-bold text-slate-800 tracking-tight leading-tight block">
                Cheminformatics Virtual Lab
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
                Division of Chemistry
              </span>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Student Status Action Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {studentName ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-800">{studentName}</span>
                {registrationNumber && (
                  <span className="text-slate-400 font-mono text-[11px]">({registrationNumber})</span>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('report')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Student Info</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
