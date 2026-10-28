/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MolecularProperties, LipinskiRuleResult } from '../types/cheminformatics';
import { getPropertyInterpretation } from '../services/cheminformatics';
import { ChemicalDrawer2D } from './ChemicalDrawer2D';
import { MolecularViewer3D } from './MolecularViewer3D';
import { LipinskiRadarChart } from './LipinskiRadarChart';
import { MolecularPieCharts } from './MolecularPieCharts';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Info,
  Maximize2
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface PropertiesAndLipinskiProps {
  smiles: string;
  properties: MolecularProperties;
  lipinski: LipinskiRuleResult;
  studentName?: string;
  registrationNumber?: string;
}

export const PropertiesAndLipinski: React.FC<PropertiesAndLipinskiProps> = ({
  smiles,
  properties,
  lipinski,
  studentName = '',
  registrationNumber = '',
}) => {
  const [show3DModal, setShow3DModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Download CSV of properties
  const handleDownloadCsv = () => {
    const rows = [
      ['Property', 'Value', 'Interpretation'],
      ['Input SMILES', smiles, 'User submitted structure notation'],
      ['Molecular Formula', properties.formula, getPropertyInterpretation('Molecular Formula', properties.formula)],
      ['Molecular Weight (g/mol)', properties.molecularWeight.toString(), getPropertyInterpretation('Molecular Weight', properties.molecularWeight)],
      ['Exact Molecular Weight', properties.exactMass.toString(), getPropertyInterpretation('Exact Mass', properties.exactMass)],
      ['LogP', properties.logP.toString(), getPropertyInterpretation('LogP', properties.logP)],
      ['TPSA (A^2)', properties.tpsa.toString(), getPropertyInterpretation('TPSA', properties.tpsa)],
      ['Hydrogen Bond Donors', properties.hbd.toString(), getPropertyInterpretation('HBD', properties.hbd)],
      ['Hydrogen Bond Acceptors', properties.hba.toString(), getPropertyInterpretation('HBA', properties.hba)],
      ['Rotatable Bonds', properties.rotatableBonds.toString(), getPropertyInterpretation('Rotatable Bonds', properties.rotatableBonds)],
      ['Ring Count', properties.ringCount.toString(), getPropertyInterpretation('Ring Count', properties.ringCount)],
      ['Aromatic Rings', properties.aromaticRings.toString(), getPropertyInterpretation('Aromatic Rings', properties.aromaticRings)],
      ['Aliphatic Rings', properties.aliphaticRings.toString(), getPropertyInterpretation('Aliphatic Rings', properties.aliphaticRings)],
      ['Heavy Atoms', properties.heavyAtoms.toString(), getPropertyInterpretation('Heavy Atoms', properties.heavyAtoms)],
      ['Total Atoms (including H)', properties.totalAtomsWithH.toString(), getPropertyInterpretation('Total Atoms (including H)', properties.totalAtomsWithH)],
      ['Heavy-Atom Bonds', properties.heavyAtomBonds.toString(), getPropertyInterpretation('Heavy Atom Bonds', properties.heavyAtomBonds)],
      ['Sigma (s) Bonds', properties.sigmaBonds.toString(), getPropertyInterpretation('Sigma (σ) Bonds', properties.sigmaBonds)],
      ['Pi (p) Bonds', properties.piBonds.toString(), getPropertyInterpretation('Pi (π) Bonds', properties.piBonds)],
      ['Total Bonds (s + p)', properties.totalBonds.toString(), getPropertyInterpretation('Total Bonds (σ + π)', properties.totalBonds)],
      ['Fraction Csp3', properties.fractionCsp3.toString(), getPropertyInterpretation('Fraction Csp3', properties.fractionCsp3)],
      ['Molar Refractivity', properties.molarRefractivity.toString(), getPropertyInterpretation('Molar Refractivity', properties.molarRefractivity)],
      ['Lipinski Violations', lipinski.violations.toString(), lipinski.isCompliant ? 'Passes Lipinski Rule of 5' : 'Fails Lipinski Rule of 5'],
      ['Veber Oral Bioavailability', lipinski.isVeberCompliant ? 'Compliant' : 'Non-compliant', 'Evaluates rotatable bonds and polar surface area'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Molecular_Properties_${properties.formula}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick single-molecule PDF export
  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    // Institutional Header
    doc.setFillColor(23, 54, 93);
    doc.rect(0, 0, pageWidth, 55, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CHEMINFORMATICS VIRTUAL LABORATORY', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SRM Institute of Science and Technology · Division of Chemistry', pageWidth / 2, 42, { align: 'center' });

    y = 80;
    doc.setTextColor(23, 54, 93);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Molecular Properties & Drug-Likeness Report', 40, y);

    y += 25;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    if (studentName || registrationNumber) {
      doc.text(`Student: ${studentName || 'N/A'}   |   Reg No: ${registrationNumber || 'N/A'}`, 40, y);
      y += 18;
    }
    doc.text(`SMILES: ${smiles}   |   Formula: ${properties.formula}   |   MW: ${properties.molecularWeight} g/mol`, 40, y);

    y += 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    // Properties summary table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(23, 54, 93);
    doc.text('1. Calculated Physicochemical Descriptors', 40, y);
    y += 15;

    const propList = [
      ['Molecular Formula', properties.formula],
      ['Molecular Weight', `${properties.molecularWeight} g/mol`],
      ['Exact Molecular Weight', `${properties.exactMass} Da`],
      ['LogP (Lipophilicity)', `${properties.logP}`],
      ['TPSA (Polar Surface Area)', `${properties.tpsa} Å²`],
      ['H-Bond Donors (HBD)', `${properties.hbd}`],
      ['H-Bond Acceptors (HBA)', `${properties.hba}`],
      ['Rotatable Bonds', `${properties.rotatableBonds}`],
      ['Ring Count (Arom / Aliph)', `${properties.ringCount} (${properties.aromaticRings} / ${properties.aliphaticRings})`],
      ['Sigma (σ) Bonds', `${properties.sigmaBonds}`],
      ['Pi (π) Bonds', `${properties.piBonds}`],
      ['Total Bonds (σ + π)', `${properties.totalBonds}`],
      ['Fraction Csp3', `${properties.fractionCsp3}`],
      ['Molar Refractivity', `${properties.molarRefractivity}`],
      ['Lipinski Violations', `${lipinski.violations} (${lipinski.isCompliant ? 'Passed Rule of 5' : 'Violates Rule of 5'})`],
      ['Veber Oral Criteria', `${lipinski.isVeberCompliant ? 'Passed (RotB ≤10 & TPSA ≤140)' : 'Borderline/Violated'}`],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    let startX = 40;
    propList.forEach(([prop, val], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const curX = col === 0 ? startX : startX + 260;
      const curY = y + row * 18;

      doc.setFillColor(row % 2 === 0 ? 245 : 255, row % 2 === 0 ? 247 : 255, row % 2 === 0 ? 250 : 255);
      doc.rect(curX, curY - 11, 250, 16, 'F');
      doc.setTextColor(70, 70, 70);
      doc.text(prop, curX + 5, curY);
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.text(val, curX + 170, curY);
      doc.setFont('helvetica', 'normal');
    });

    y += Math.ceil(propList.length / 2) * 18 + 25;

    // Drug likeness statement
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(23, 54, 93);
    doc.text('2. Drug-Likeness & Bioavailability Assessment', 40, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);

    const lipinskiSummary = lipinski.isCompliant
      ? `This molecule complies with Lipinski's Rule of Five (${lipinski.violations} violation(s)), suggesting favorable theoretical oral bioavailability and membrane permeability.`
      : `This molecule exhibits ${lipinski.violations} violation(s) of Lipinski's Rule of Five, indicating potential challenges with intestinal absorption or oral drug formulation.`;

    const splitText = doc.splitTextToSize(lipinskiSummary, pageWidth - 80);
    doc.text(splitText, 40, y);
    y += splitText.length * 14 + 15;

    const veberSummary = lipinski.isVeberCompliant
      ? `It satisfies Veber's criteria (Rotatable Bonds ≤ 10, TPSA ≤ 140 Å²), indicating sufficient conformational rigidity and balanced polarity for cellular uptake.`
      : `Veber criteria indicates high rotatable bonds or elevated polar surface area, which can limit passive cellular membrane permeability.`;

    const splitVeber = doc.splitTextToSize(veberSummary, pageWidth - 80);
    doc.text(splitVeber, 40, y);
    y += splitVeber.length * 14 + 25;

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'Generated automatically by the Cheminformatics Virtual Laboratory (SRMIST). Computational descriptors should be evaluated alongside experimental validation.',
      40,
      doc.internal.pageSize.getHeight() - 30
    );

    doc.save(`Molecular_Report_${properties.formula}.pdf`);
  };

  const copySmiles = () => {
    navigator.clipboard.writeText(smiles);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 2D Structure & Chemical Identity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 2D Chemical Diagram */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <span>🧬 2D Molecular Connectivity</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              SmilesDrawer
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 bg-slate-50/50 rounded-lg border border-slate-100">
            <ChemicalDrawer2D smiles={smiles} width={380} height={260} theme="light" />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate max-w-[240px]">
              <span className="text-slate-400 font-medium shrink-0">SMILES:</span>
              <code className="font-mono text-slate-700 truncate" title={smiles}>
                {smiles}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copySmiles}
                className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setShow3DModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-medium transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>3D View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Structural Identity & Bond Analysis */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <span>📋 Chemical Framework & Bonding Partition</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Formula: {properties.formula}
              </span>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Molecular Formula</span>
                <span className="text-base font-bold font-mono text-slate-800">{properties.formula}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Mol Weight</span>
                <span className="text-base font-bold font-mono text-slate-800">{properties.molecularWeight} <span className="text-xs font-normal text-slate-500">g/mol</span></span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Exact Mass</span>
                <span className="text-base font-bold font-mono text-slate-800">{properties.exactMass}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Atoms (w/ H)</span>
                <span className="text-base font-bold font-mono text-slate-800">{properties.totalAtomsWithH}</span>
              </div>
            </div>

            {/* Bonding Partitioning Table */}
            <div className="bg-blue-50/40 rounded-lg p-3.5 border border-blue-100 mb-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                Bond Type Breakdown (σ and π Partitioning)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 block">Heavy Atom Bonds:</span>
                  <span className="text-sm font-bold font-mono text-slate-800">{properties.heavyAtomBonds}</span>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 block">Sigma (σ) Bonds:</span>
                  <span className="text-sm font-bold font-mono text-blue-700">{properties.sigmaBonds}</span>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 block">Pi (π) Bonds:</span>
                  <span className="text-sm font-bold font-mono text-indigo-700">{properties.piBonds}</span>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="text-slate-500 block">Total Bonds (σ+π):</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{properties.totalBonds}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every bonded atom pair contains one framework σ bond (including implicit hydrogens).
              π bonds originate from unsaturated multiple bonds (=, ≡) and aromatic π-electron delocalization.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Properties (CSV)</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Molecular PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block">LogP (Lipophilicity)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-800">{properties.logP}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {properties.logP < 0 ? 'Hydrophilic (<0)' : properties.logP <= 3 ? 'Moderate (0-3)' : 'Lipophilic (>3)'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block">Polar Surface (TPSA)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-800">{properties.tpsa}</span>
            <span className="text-xs text-slate-500 font-mono">Å²</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {properties.tpsa <= 140 ? 'Permeable (≤140)' : 'High polarity (>140)'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block">H-Bond Donors / Acceptors</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-800">{properties.hbd}</span>
            <span className="text-sm font-semibold text-slate-400">/</span>
            <span className="text-2xl font-bold font-mono text-slate-800">{properties.hba}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            HBD: {properties.hbd} · HBA: {properties.hba}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block">Rings (Arom / Aliph)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-800">{properties.ringCount}</span>
            <span className="text-xs text-slate-500 font-mono">({properties.aromaticRings} / {properties.aliphaticRings})</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Rotatable bonds: {properties.rotatableBonds}
          </span>
        </div>
      </div>

      {/* Composition & Bonding Pie Diagrams */}
      <MolecularPieCharts smiles={smiles} properties={properties} />

      {/* Drug-Likeness & Lipinski Rule of 5 Evaluation Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Drug-Likeness Screening (Lipinski Rule of 5 & Veber Criteria)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Computational evaluation of theoretical oral drug bioavailability in humans.
            </p>
          </div>

          {/* Compliance Status Badge */}
          <div className="flex items-center gap-2">
            {lipinski.isCompliant ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Lipinski Compliant ({lipinski.violations} violations)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Lipinski Violated ({lipinski.violations} violations)</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Rules Checklist */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* MW */}
              <div className={`p-3 rounded-lg border ${lipinski.mw.passed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/60 border-rose-200'}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-800">Molecular Weight (MW)</span>
                  <span className={lipinski.mw.passed ? 'text-emerald-700' : 'text-rose-700'}>
                    {lipinski.mw.passed ? 'Passed (≤ 500)' : 'Violated (> 500)'}
                  </span>
                </div>
                <div className="mt-1 text-slate-600 font-mono text-sm">
                  {properties.molecularWeight} <span className="text-xs font-normal text-slate-400">g/mol</span>
                </div>
              </div>

              {/* LogP */}
              <div className={`p-3 rounded-lg border ${lipinski.logP.passed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/60 border-rose-200'}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-800">Lipophilicity (LogP)</span>
                  <span className={lipinski.logP.passed ? 'text-emerald-700' : 'text-rose-700'}>
                    {lipinski.logP.passed ? 'Passed (≤ 5.0)' : 'Violated (> 5.0)'}
                  </span>
                </div>
                <div className="mt-1 text-slate-600 font-mono text-sm">
                  {properties.logP}
                </div>
              </div>

              {/* HBD */}
              <div className={`p-3 rounded-lg border ${lipinski.hbd.passed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/60 border-rose-200'}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-800">H-Bond Donors (HBD)</span>
                  <span className={lipinski.hbd.passed ? 'text-emerald-700' : 'text-rose-700'}>
                    {lipinski.hbd.passed ? 'Passed (≤ 5)' : 'Violated (> 5)'}
                  </span>
                </div>
                <div className="mt-1 text-slate-600 font-mono text-sm">
                  {properties.hbd} donor(s)
                </div>
              </div>

              {/* HBA */}
              <div className={`p-3 rounded-lg border ${lipinski.hba.passed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/60 border-rose-200'}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-800">H-Bond Acceptors (HBA)</span>
                  <span className={lipinski.hba.passed ? 'text-emerald-700' : 'text-rose-700'}>
                    {lipinski.hba.passed ? 'Passed (≤ 10)' : 'Violated (> 10)'}
                  </span>
                </div>
                <div className="mt-1 text-slate-600 font-mono text-sm">
                  {properties.hba} acceptor(s)
                </div>
              </div>
            </div>

            {/* Veber Rules Sub-block */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800">Veber's Bioavailability Criteria:</span>
                <span className={`font-semibold ${lipinski.isVeberCompliant ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {lipinski.isVeberCompliant ? '✓ Satisfies Veber Rules' : '⚠ Caution on Veber Filters'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span>Rotatable Bonds (≤10): </span>
                  <span className="font-mono font-semibold text-slate-800">{properties.rotatableBonds}</span>
                  <span className="text-[11px] text-slate-400 block">Measures conformational entropy penalty</span>
                </div>
                <div>
                  <span>Polar Surface Area (≤140 Å²): </span>
                  <span className="font-mono font-semibold text-slate-800">{properties.tpsa} Å²</span>
                  <span className="text-[11px] text-slate-400 block">Predicts passive cellular membrane permeation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Radar Chart */}
          <div className="lg:col-span-5 flex justify-center">
            <LipinskiRadarChart properties={properties} lipinski={lipinski} />
          </div>
        </div>
      </div>

      {/* Complete Molecular Property Table with Student Interpretation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              📑 Complete Molecular Descriptors & Educational Interpretation
            </h3>
            <p className="text-xs text-slate-500">
              Computed in accordance with the curriculum of the Division of Chemistry, SRMIST.
            </p>
          </div>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-[#1E3A8A] text-white uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-1/4">Descriptor Name</th>
                <th className="py-2.5 px-4 font-semibold w-1/6 font-mono">Calculated Value</th>
                <th className="py-2.5 px-4 font-semibold w-7/12">Student Educational Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                { name: 'Molecular Formula', value: properties.formula },
                { name: 'Molecular Weight', value: `${properties.molecularWeight} g/mol` },
                { name: 'Exact Molecular Weight', value: `${properties.exactMass} Da` },
                { name: 'LogP', value: properties.logP },
                { name: 'TPSA', value: `${properties.tpsa} Å²` },
                { name: 'Hydrogen Bond Donors', value: properties.hbd },
                { name: 'Hydrogen Bond Acceptors', value: properties.hba },
                { name: 'Rotatable Bonds', value: properties.rotatableBonds },
                { name: 'Ring Count', value: properties.ringCount },
                { name: 'Aromatic Rings', value: properties.aromaticRings },
                { name: 'Aliphatic Rings', value: properties.aliphaticRings },
                { name: 'Heavy Atoms', value: properties.heavyAtoms },
                { name: 'Total Atoms (including H)', value: properties.totalAtomsWithH },
                { name: 'Heavy Atom Bonds', value: properties.heavyAtomBonds },
                { name: 'Sigma (σ) Bonds', value: properties.sigmaBonds },
                { name: 'Pi (π) Bonds', value: properties.piBonds },
                { name: 'Total Bonds (σ + π)', value: properties.totalBonds },
                { name: 'Fraction Csp3', value: properties.fractionCsp3 },
                { name: 'Molar Refractivity', value: properties.molarRefractivity },
              ].map((row, idx) => (
                <tr key={row.name} className={idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="py-2 px-4 font-semibold text-slate-800">{row.name}</td>
                  <td className="py-2 px-4 font-mono font-medium text-blue-900">{row.value}</td>
                  <td className="py-2 px-4 text-slate-600 leading-normal">
                    {getPropertyInterpretation(row.name, row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3D Structure Preview Modal */}
      {show3DModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-800 text-sm">3D Molecular Structure: {properties.formula}</h3>
              <button
                onClick={() => setShow3DModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 text-sm rounded hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <MolecularViewer3D smiles={smiles} height={480} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
