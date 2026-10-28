/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { calculateProperties, getPropertyInterpretation, buildKeyInterpretationPoints, isValidSmiles, evaluateLipinskiRules } from '../services/cheminformatics';
import { ChemicalDrawer2D } from './ChemicalDrawer2D';
import { Structure3DFigure } from './Structure3DFigure';
import { render3DProjection } from '../services/draw3dProjection';
import { REFERENCE_DRUGS } from './DrugComparisonMatrix';
import { jsPDF } from 'jspdf';
import { 
  Printer, 
  Download, 
  User, 
  BookOpen, 
  Code2, 
  AlertCircle, 
  CheckCircle2, 
  Box, 
  GitCompare, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Sparkles,
  Table as TableIcon
} from 'lucide-react';
import { OKABE_ITO_PALETTE } from '../constants/palette';

interface LabReportGeneratorProps {
  initialSmiles: string;
  studentName: string;
  registrationNumber: string;
  onUpdateStudentInfo: (name: string, reg: string) => void;
}

export const LabReportGenerator: React.FC<LabReportGeneratorProps> = ({
  initialSmiles,
  studentName,
  registrationNumber,
  onUpdateStudentInfo,
}) => {
  const [name, setName] = useState<string>(studentName);
  const [reg, setReg] = useState<string>(registrationNumber);
  const [smilesInput, setSmilesInput] = useState<string>(initialSmiles || 'CCO\nc1ccccc1\nCC(=O)Oc1ccccc1C(=O)O');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [includeDrugBenchmarks, setIncludeDrugBenchmarks] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'default' | 'mw' | 'logP' | 'tpsa' | 'violations'>('default');

  // Parse multi-SMILES
  const parsedRecords = useMemo(() => {
    const lines = smilesInput.split('\n').map(l => l.trim()).filter(Boolean);
    const valid: Array<{ smiles: string; props: ReturnType<typeof calculateProperties> }> = [];
    const invalid: string[] = [];

    lines.forEach(s => {
      if (isValidSmiles(s)) {
        try {
          const props = calculateProperties(s);
          valid.push({ smiles: s, props });
        } catch {
          invalid.push(s);
        }
      } else {
        invalid.push(s);
      }
    });

    return { valid, invalid };
  }, [smilesInput]);

  // Compile items for comparison table (candidate molecules + reference drugs)
  const comparisonItems = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      type: 'candidate' | 'benchmark';
      smiles: string;
      props: ReturnType<typeof calculateProperties>;
      lipinski: ReturnType<typeof evaluateLipinskiRules>;
      indication: string;
      drugClass: string;
    }> = [];

    // Add candidate molecules from input batch
    parsedRecords.valid.forEach((rec, idx) => {
      const lip = evaluateLipinskiRules(rec.props);
      let label = `Compound ${idx + 1}`;
      if (rec.smiles === 'CCO') label = 'Ethanol (Compound 1)';
      else if (rec.smiles === 'c1ccccc1') label = 'Benzene (Compound 2)';
      else if (rec.smiles.includes('Oc1ccccc1C(=O)O')) label = `Aspirin Analog (Compound ${idx + 1})`;

      list.push({
        id: `candidate-${idx}`,
        name: label,
        type: 'candidate',
        smiles: rec.smiles,
        props: rec.props,
        lipinski: lip,
        indication: 'Target candidate under virtual laboratory evaluation.',
        drugClass: 'Analyzed Test Molecule',
      });
    });

    // Optionally include pharmaceutical benchmarks
    if (includeDrugBenchmarks) {
      const benchmarkSubset = REFERENCE_DRUGS.slice(0, 5); // Aspirin, Paracetamol, Ibuprofen, Caffeine, Metformin
      benchmarkSubset.forEach((drug) => {
        try {
          const p = calculateProperties(drug.smiles);
          const lip = evaluateLipinskiRules(p);
          list.push({
            id: `benchmark-${drug.name}`,
            name: `${drug.name} (${drug.genericName})`,
            type: 'benchmark',
            smiles: drug.smiles,
            props: p,
            lipinski: lip,
            indication: drug.indication,
            drugClass: drug.drugClass,
          });
        } catch (e) {
          console.warn('Benchmark property calculation error:', e);
        }
      });
    }

    if (sortBy === 'mw') {
      return [...list].sort((a, b) => a.props.molecularWeight - b.props.molecularWeight);
    }
    if (sortBy === 'logP') {
      return [...list].sort((a, b) => a.props.logP - b.props.logP);
    }
    if (sortBy === 'tpsa') {
      return [...list].sort((a, b) => a.props.tpsa - b.props.tpsa);
    }
    if (sortBy === 'violations') {
      return [...list].sort((a, b) => a.lipinski.violations - b.lipinski.violations);
    }

    return list;
  }, [parsedRecords.valid, includeDrugBenchmarks, sortBy]);

  // Aggregate statistics for comparative synthesis
  const stats = useMemo(() => {
    if (comparisonItems.length === 0) {
      return { minMw: 0, maxMw: 0, minLogP: 0, maxLogP: 0, minTpsa: 0, maxTpsa: 0, compliantCount: 0, total: 0 };
    }
    const mws = comparisonItems.map(i => i.props.molecularWeight);
    const logPs = comparisonItems.map(i => i.props.logP);
    const tpsas = comparisonItems.map(i => i.props.tpsa);
    const compliant = comparisonItems.filter(i => i.lipinski.violations <= 1).length;

    return {
      minMw: Math.min(...mws),
      maxMw: Math.max(...mws),
      minLogP: Math.min(...logPs),
      maxLogP: Math.max(...logPs),
      minTpsa: Math.min(...tpsas),
      maxTpsa: Math.max(...tpsas),
      compliantCount: compliant,
      total: comparisonItems.length,
    };
  }, [comparisonItems]);

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudentInfo(name, reg);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    if (parsedRecords.valid.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const totalPages = parsedRecords.valid.length + 2;

      // For each molecule create a page
      for (let idx = 0; idx < parsedRecords.valid.length; idx++) {
        const record = parsedRecords.valid[idx];
        if (idx > 0) doc.addPage();
        let y = 35;

        // Header band
        doc.setFillColor(23, 54, 93);
        doc.rect(0, 0, pageWidth, 55, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('CHEMINFORMATICS VIRTUAL LABORATORY', pageWidth / 2, 24, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('SRM Institute of Science and Technology · Division of Chemistry', pageWidth / 2, 40, { align: 'center' });

        y = 75;
        doc.setTextColor(23, 54, 93);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`FINAL STUDENT MOLECULAR ANALYSIS REPORT (Molecule ${idx + 1} of ${parsedRecords.valid.length})`, 40, y);

        y += 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);

        // Student metadata table
        doc.setFillColor(240, 244, 250);
        doc.rect(40, y, pageWidth - 80, 42, 'F');
        doc.setDrawColor(200, 210, 225);
        doc.rect(40, y, pageWidth - 80, 42, 'S');

        doc.text(`Student Name: ${name || 'Not provided'}`, 50, y + 16);
        doc.text(`Registration No: ${reg || 'Not provided'}`, 280, y + 16);
        doc.text(`SMILES: ${record.smiles}`, 50, y + 32);
        doc.text(`Formula: ${record.props.formula}  |  MW: ${record.props.molecularWeight} g/mol`, 280, y + 32);

        y += 60;

        // Render 3D Conformer Image for this molecule
        try {
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = 400;
          offscreenCanvas.height = 220;
          const img3dDataUrl = await render3DProjection(record.smiles, offscreenCanvas, { width: 400, height: 220 });
          if (img3dDataUrl) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(23, 54, 93);
            doc.text('1. 3D Molecular Conformation (Ball-and-Stick Model)', 40, y);
            y += 8;
            doc.addImage(img3dDataUrl, 'PNG', 40, y, 220, 110);

            // Add side summary box
            doc.setFillColor(248, 250, 252);
            doc.rect(275, y, pageWidth - 315, 110, 'F');
            doc.setDrawColor(220, 225, 230);
            doc.rect(275, y, pageWidth - 315, 110, 'S');

            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            doc.text(`Formula: ${record.props.formula}`, 285, y + 18);
            doc.text(`Molecular Weight: ${record.props.molecularWeight} g/mol`, 285, y + 33);
            doc.text(`Sigma (s) Bonds: ${record.props.sigmaBonds}`, 285, y + 48);
            doc.text(`Pi (p) Bonds: ${record.props.piBonds}`, 285, y + 63);
            doc.text(`Rotatable Bonds: ${record.props.rotatableBonds}`, 285, y + 78);
            doc.text(`Aromatic Rings: ${record.props.aromaticRings}`, 285, y + 93);

            y += 125;
          }
        } catch (err) {
          console.warn('3D embed warning:', err);
        }

        // Property Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(23, 54, 93);
        doc.text('2. Calculated Molecular Properties & Academic Interpretation', 40, y);
        y += 12;

        // Table header
        doc.setFillColor(47, 85, 151);
        doc.rect(40, y, pageWidth - 80, 16, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.text('Property', 48, y + 11);
        doc.text('Value', 180, y + 11);
        doc.text('Interpretation', 270, y + 11);
        y += 16;

        const p = record.props;
        const rows = [
          ['Molecular Formula', p.formula],
          ['Molecular Weight', `${p.molecularWeight} g/mol`],
          ['Exact Mass', `${p.exactMass} Da`],
          ['LogP', `${p.logP}`],
          ['TPSA', `${p.tpsa} Å²`],
          ['H-Bond Donors', `${p.hbd}`],
          ['H-Bond Acceptors', `${p.hba}`],
          ['Rotatable Bonds', `${p.rotatableBonds}`],
          ['Ring Count', `${p.ringCount} (${p.aromaticRings} arom)`],
          ['Sigma (σ) Bonds', `${p.sigmaBonds}`],
          ['Pi (π) Bonds', `${p.piBonds}`],
          ['Total Bonds (σ + π)', `${p.totalBonds}`],
          ['Fraction Csp3', `${p.fractionCsp3}`],
          ['Molar Refractivity', `${p.molarRefractivity}`],
        ];

        doc.setFont('helvetica', 'normal');
        rows.forEach(([prop, val], rIdx) => {
          doc.setFillColor(rIdx % 2 === 0 ? 248 : 255, rIdx % 2 === 0 ? 250 : 255, rIdx % 2 === 0 ? 252 : 255);
          doc.rect(40, y, pageWidth - 80, 14, 'F');
          doc.setDrawColor(220, 225, 230);
          doc.line(40, y + 14, pageWidth - 40, y + 14);

          doc.setTextColor(40, 40, 40);
          doc.text(prop, 48, y + 10);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(val, 180, y + 10);
          doc.setFont('helvetica', 'normal');

          const interp = getPropertyInterpretation(prop, val);
          doc.setTextColor(80, 80, 80);
          const truncated = interp.length > 65 ? interp.slice(0, 62) + '...' : interp;
          doc.text(truncated, 270, y + 10);

          y += 14;
        });

        y += 20;

        // Key Interpretation points
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(23, 54, 93);
        doc.text('3. Point-wise Molecular Interpretation & Bonding Summary', 40, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);

        const points = buildKeyInterpretationPoints(p);
        points.slice(0, 5).forEach(pt => {
          const cleanPt = pt.replace(/<b>/g, '').replace(/<\/b>/g, '');
          const lines = doc.splitTextToSize(cleanPt, pageWidth - 80);
          doc.text(lines, 40, y);
          y += lines.length * 11 + 3;
        });

        // Bottom page footer
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(`Page ${idx + 1} of ${totalPages} · Generated by Cheminformatics Virtual Laboratory`, 40, pageHeight - 20);
      }

      // Append Comparison Table Page
      doc.addPage();
      let compY = 35;

      // Header band
      doc.setFillColor(23, 54, 93);
      doc.rect(0, 0, pageWidth, 55, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CHEMINFORMATICS VIRTUAL LABORATORY', pageWidth / 2, 24, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('SRM Institute of Science and Technology · Division of Chemistry', pageWidth / 2, 40, { align: 'center' });

      compY = 75;
      doc.setTextColor(23, 54, 93);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('COMPARATIVE MOLECULAR PROPERTIES & DRUG BENCHMARK TABLE', 40, compY);

      compY += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('Cross-compound screening against reference pharmaceutical agents across core physicochemical descriptors and Lipinski Rule of 5.', 40, compY);

      compY += 15;

      // Table Header
      doc.setFillColor(47, 85, 151);
      doc.rect(40, compY, pageWidth - 80, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text('Molecule / Drug', 46, compY + 12);
      doc.text('Formula', 150, compY + 12);
      doc.text('MW (g/mol)', 205, compY + 12);
      doc.text('LogP', 255, compY + 12);
      doc.text('TPSA (Å²)', 285, compY + 12);
      doc.text('HBD', 330, compY + 12);
      doc.text('HBA', 355, compY + 12);
      doc.text('RotB', 380, compY + 12);
      doc.text('Lipinski Status', 410, compY + 12);
      doc.text('Class / Biological Note', 485, compY + 12);

      compY += 18;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      comparisonItems.slice(0, 10).forEach((item, rIdx) => {
        const isAlt = rIdx % 2 === 0;
        doc.setFillColor(isAlt ? 248 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
        doc.rect(40, compY, pageWidth - 80, 16, 'F');
        doc.setDrawColor(220, 225, 230);
        doc.line(40, compY + 16, pageWidth - 40, compY + 16);

        // Name
        doc.setTextColor(item.type === 'candidate' ? 0 : 60, item.type === 'candidate' ? 114 : 60, item.type === 'candidate' ? 178 : 60);
        doc.setFont('helvetica', 'bold');
        const shortName = item.name.length > 20 ? item.name.slice(0, 18) + '..' : item.name;
        doc.text(shortName, 46, compY + 11);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(item.props.formula, 150, compY + 11);
        doc.text(item.props.molecularWeight.toFixed(2), 205, compY + 11);
        doc.text(item.props.logP.toFixed(2), 255, compY + 11);
        doc.text(item.props.tpsa.toFixed(1), 285, compY + 11);
        doc.text(String(item.props.hbd), 330, compY + 11);
        doc.text(String(item.props.hba), 355, compY + 11);
        doc.text(String(item.props.rotatableBonds), 380, compY + 11);

        // Lipinski badge text with color
        if (item.lipinski.violations === 0) {
          doc.setTextColor(0, 158, 115); // #009E73 Okabe-Ito Bluish Green
          doc.text('0 (Compliant)', 410, compY + 11);
        } else if (item.lipinski.violations === 1) {
          doc.setTextColor(230, 159, 0); // #E69F00 Okabe-Ito Orange
          doc.text('1 (Acceptable)', 410, compY + 11);
        } else {
          doc.setTextColor(213, 94, 0); // #D55E00 Okabe-Ito Vermillion
          doc.text(`${item.lipinski.violations} (Failed)`, 410, compY + 11);
        }

        // Class / Note
        doc.setTextColor(90, 90, 90);
        const shortClass = item.drugClass.length > 18 ? item.drugClass.slice(0, 16) + '..' : item.drugClass;
        doc.text(shortClass, 485, compY + 11);

        compY += 16;
      });

      compY += 16;

      // Comparative Synthesis Box
      doc.setFillColor(245, 248, 252);
      doc.rect(40, compY, pageWidth - 80, 105, 'F');
      doc.setDrawColor(180, 205, 235);
      doc.rect(40, compY, pageWidth - 80, 105, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(23, 54, 93);
      doc.text('Key Comparative Observations & Physicochemical Trends:', 50, compY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);

      const compNotes = [
        `• Molecular Weight Span: Ranges from ${stats.minMw.toFixed(1)} to ${stats.maxMw.toFixed(1)} g/mol. Small-molecule drug space typically concentrates below 500 Da.`,
        `• Lipophilicity (LogP) Window: Values span from ${stats.minLogP.toFixed(2)} to ${stats.maxLogP.toFixed(2)}, illustrating the balance between aqueous solubility and membrane permeability.`,
        `• Polar Surface Area (TPSA): Spans from ${stats.minTpsa.toFixed(1)} to ${stats.maxTpsa.toFixed(1)} Å². Values under 140 Å² favor oral gastrointestinal absorption; values under 90 Å² favor blood-brain barrier penetration.`,
        `• Lipinski Rule of 5 Oral Bioavailability: ${stats.compliantCount} of ${stats.total} molecules in this comparative table (${Math.round((stats.compliantCount / stats.total) * 100)}%) satisfy Lipinski drug-likeness criteria.`,
        `• Conformational Flexibility: Rotatable bond counts show structural rigidity differences between planar aromatic cores and flexible aliphatic linkers.`
      ];

      compNotes.forEach((note, nIdx) => {
        doc.text(note, 50, compY + 32 + nIdx * 14);
      });

      // Page footer for comparison page
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text(`Page ${parsedRecords.valid.length + 1} of ${totalPages} · Generated by Cheminformatics Virtual Laboratory · SRMIST`, 40, pageHeight - 20);

      // Append Python Libraries & Code Appendix Page
      doc.addPage();
      let y = 35;

      doc.setFillColor(23, 54, 93);
      doc.rect(0, 0, pageWidth, 55, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CHEMINFORMATICS VIRTUAL LABORATORY', pageWidth / 2, 24, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Technical Appendix: Scientific Libraries and RDKit Reference Code', pageWidth / 2, 40, { align: 'center' });

      y = 80;
      doc.setTextColor(23, 54, 93);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Python Scientific Libraries & Their Importance', 40, y);
      y += 16;

      const libs = [
        ['RDKit', 'Reads SMILES, generates 2D/3D representations, and computes Descriptors (MW, LogP, TPSA, HBD, HBA, bonds).'],
        ['Streamlit / Web SPA', 'Provides responsive inputs, 3D visualization canvas controls, and export interfaces.'],
        ['py3Dmol / 3Dmol.js', 'Provides high-performance interactive WebGL 3D molecular structures in the browser.'],
        ['ReportLab / jsPDF', 'Compiles formatted student molecular analysis PDF reports with tables and figures.'],
        ['Pandas & NumPy', 'Structures descriptor datasets, performs numerical linear algebra, and exports tabular data.'],
      ];

      doc.setFontSize(8);
      libs.forEach(([lName, lDesc]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${lName}: `, 45, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        doc.text(lDesc, 140, y);
        y += 14;
      });

      y += 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(23, 54, 93);
      doc.text('Illustrative Python & RDKit Workflow Code', 40, y);
      y += 14;

      const codeLines = [
        'from rdkit import Chem',
        'from rdkit.Chem import Descriptors, Crippen, Lipinski, rdMolDescriptors, AllChem',
        '',
        '# 1. Parse SMILES notation',
        'mol = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")  # Aspirin',
        '',
        '# 2. Compute Descriptors',
        'formula = rdMolDescriptors.CalcMolFormula(mol)',
        'mw = Descriptors.MolWt(mol)',
        'logp = Crippen.MolLogP(mol)',
        'tpsa = rdMolDescriptors.CalcTPSA(mol)',
        '',
        '# 3. Generate 3D Conformer with ETKDG and MMFF',
        'mol3d = Chem.AddHs(mol)',
        'AllChem.EmbedMolecule(mol3d, randomSeed=42)',
        'AllChem.MMFFOptimizeMolecule(mol3d)',
      ];

      doc.setFillColor(245, 247, 250);
      doc.rect(40, y, pageWidth - 80, 160, 'F');
      doc.setDrawColor(220, 225, 230);
      doc.rect(40, y, pageWidth - 80, 160, 'S');

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      codeLines.forEach((line, lineIdx) => {
        doc.text(line, 50, y + 14 + lineIdx * 10);
      });

      y += 175;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Reproducibility Note: Calculated values represent computational estimates for academic inquiry. Experimental measurements may vary with solvent conditions.',
        40,
        pageHeight - 34
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(
        'Developer: LUTUKURTHI H S S V KRISHNA SATYA · Academic Inquiries & Queries: srisailutukurthi@gmail.com',
        40,
        pageHeight - 20
      );
      doc.text(
        `Page ${totalPages} of ${totalPages} · Generated by Cheminformatics Virtual Laboratory · SRMIST`,
        pageWidth - 255,
        pageHeight - 20
      );

      doc.save(`SRMIST_Cheminformatics_Report_${name.replace(/\s+/g, '_') || 'Student'}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Details Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Student Lab Information & Assignment Credentials
            </h2>
          </div>
          <span className="text-xs text-slate-500">SRMIST Chemistry Virtual Laboratory</span>
        </div>

        <form onSubmit={handleSaveStudent} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Student Full Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harini L."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Registration / Roll Number:
            </label>
            <input
              type="text"
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              placeholder="e.g. RA2311003010..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Update Credentials
            </button>
          </div>
        </form>
      </div>

      {/* Multi-SMILES Input for Report */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              📄 Multi-Molecule Report Batch
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter one SMILES string per line. The report will compile all molecules into a single formal document.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || parsedRecords.valid.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={smilesInput}
          onChange={(e) => setSmilesInput(e.target.value)}
          rows={3}
          placeholder="CCO&#10;c1ccccc1&#10;CC(=O)Oc1ccccc1C(=O)O"
          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        />

        {parsedRecords.invalid.length > 0 && (
          <div className="mt-2 text-xs text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Skipped invalid SMILES: {parsedRecords.invalid.join(', ')}</span>
          </div>
        )}

        <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{parsedRecords.valid.length} valid molecule(s) queued for formal laboratory report.</span>
        </div>
      </div>

      {/* Printable Report View (Visible on Screen & Perfectly Formatted for Print) */}
      <div id="printable-report" className="space-y-8 print:p-0">
        {parsedRecords.valid.map((record, index) => {
          const p = record.props;
          const points = buildKeyInterpretationPoints(p);

          return (
            <div
              key={record.smiles + index}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs print:border-none print:shadow-none print:p-0 print:mb-8"
            >
              {/* Report Header Band */}
              <div className="border-b-2 border-[#1E3A8A] pb-4 mb-4 text-center">
                <span className="text-xs uppercase tracking-wider font-bold text-blue-900 block">
                  SRM INSTITUTE OF SCIENCE AND TECHNOLOGY · TIRUCHIRAPPALLI
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Faculty of Engineering and Technology | School of Sciences | Division of Chemistry
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  FINAL STUDENT MOLECULAR ANALYSIS REPORT
                </h3>
              </div>

              {/* Student and Compound Meta Box */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-5">
                <div>
                  <span className="text-slate-500">Student Name: </span>
                  <strong className="text-slate-800">{name || 'Not provided'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Registration Number: </span>
                  <strong className="text-slate-800 font-mono">{reg || 'Not provided'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Input SMILES: </span>
                  <code className="text-slate-800 font-mono font-medium">{record.smiles}</code>
                </div>
                <div>
                  <span className="text-slate-500">Molecular Formula: </span>
                  <strong className="text-slate-800 font-mono">{p.formula}</strong> (MW: {p.molecularWeight} g/mol)
                </div>
              </div>

              {/* 1. Molecular Structures Figure (2D Connectivity & 3D Conformation) */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-blue-700" />
                  <span>1. Molecular Structures (2D Connectivity Graph & 3D Conformation)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-slate-700 mb-1">2D Connectivity Diagram</span>
                    <div className="bg-white rounded-lg p-2 border border-slate-200 w-full flex justify-center">
                      <ChemicalDrawer2D smiles={record.smiles} width={300} height={180} theme="light" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-slate-700 mb-1">3D Ball-and-Stick Spatial Model</span>
                    <div className="bg-white rounded-lg p-2 border border-slate-200 w-full flex justify-center">
                      <Structure3DFigure smiles={record.smiles} width={300} height={180} />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-1.5 italic">
                  Figure 1. Left: 2D molecular connectivity graph. Right: generated 3D ball-and-stick spatial conformation showing CPK element colors.
                </p>
              </div>

              {/* 2. Complete Properties Table */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wide mb-2">
                  2. Complete Molecular Properties & Interpretation
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-[#2F5597] text-white">
                      <tr>
                        <th className="py-1.5 px-3 font-semibold w-1/4">Property</th>
                        <th className="py-1.5 px-3 font-semibold w-1/6 font-mono">Value</th>
                        <th className="py-1.5 px-3 font-semibold">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {([
                        ['Molecular Formula', p.formula],
                        ['Molecular Weight', `${p.molecularWeight} g/mol`],
                        ['Exact Mass', `${p.exactMass} Da`],
                        ['LogP', `${p.logP}`],
                        ['TPSA', `${p.tpsa} Å²`],
                        ['Hydrogen Bond Donors', String(p.hbd)],
                        ['Hydrogen Bond Acceptors', String(p.hba)],
                        ['Rotatable Bonds', String(p.rotatableBonds)],
                        ['Ring Count', String(p.ringCount)],
                        ['Aromatic Rings', String(p.aromaticRings)],
                        ['Aliphatic Rings', String(p.aliphaticRings)],
                        ['Heavy Atoms', String(p.heavyAtoms)],
                        ['Total Atoms (with H)', String(p.totalAtomsWithH)],
                        ['Heavy Atom Bonds', String(p.heavyAtomBonds)],
                        ['Sigma (σ) Bonds', String(p.sigmaBonds)],
                        ['Pi (π) Bonds', String(p.piBonds)],
                        ['Total Bonds (σ + π)', String(p.totalBonds)],
                        ['Fraction Csp3', String(p.fractionCsp3)],
                        ['Molar Refractivity', String(p.molarRefractivity)],
                      ] as [string, string][]).map(([prop, val], rIdx) => (
                        <tr key={prop} className={rIdx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{prop}</td>
                          <td className="py-1.5 px-3 font-mono font-medium text-blue-900">{val}</td>
                          <td className="py-1.5 px-3 text-slate-600">
                            {getPropertyInterpretation(prop, val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Point-wise Conclusions */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wide mb-2">
                  3. Point-wise Molecular Interpretation
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  {points.map((pt, ptIdx) => (
                    <p
                      key={ptIdx}
                      dangerouslySetInnerHTML={{ __html: pt }}
                      className="leading-relaxed"
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* 4. Comparative Molecular Properties & Drug Benchmark Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wide flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-blue-700" />
                <span>4. Comparative Molecular Properties & Drug Benchmark Table</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-molecule cross-screening comparing candidate molecules alongside standard clinical drug benchmarks across physicochemical space and Lipinski Rule of 5 bioavailability.
              </p>
            </div>

            {/* Controls toolbar */}
            <div className="flex flex-wrap items-center gap-3 no-print">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeDrugBenchmarks}
                  onChange={(e) => setIncludeDrugBenchmarks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Reference Drug Benchmarks</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="default">Default Order</option>
                  <option value="mw">Molecular Weight (MW)</option>
                  <option value="logP">Lipophilicity (LogP)</option>
                  <option value="tpsa">Polar Surface Area (TPSA)</option>
                  <option value="violations">Lipinski Violations</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2F5597] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Compound / Identifier</th>
                  <th className="py-2.5 px-2 font-semibold text-center">Type</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Formula</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">MW (g/mol)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">LogP</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">TPSA (Å²)</th>
                  <th className="py-2.5 px-2 font-semibold text-center font-mono">HBD</th>
                  <th className="py-2.5 px-2 font-semibold text-center font-mono">HBA</th>
                  <th className="py-2.5 px-2 font-semibold text-center font-mono">RotB</th>
                  <th className="py-2.5 px-2 font-semibold text-center font-mono">σ / π</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Lipinski Status</th>
                  <th className="py-2.5 px-3 font-semibold">Pharmacological Profile / Indication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {comparisonItems.map((item, idx) => {
                  const isCandidate = item.type === 'candidate';
                  const p = item.props;
                  const lip = item.lipinski;
                  
                  return (
                    <tr
                      key={item.id}
                      className={
                        isCandidate
                          ? 'bg-blue-50/40 hover:bg-blue-50/70 transition-colors font-medium'
                          : idx % 2 === 0
                          ? 'bg-slate-50/50 hover:bg-slate-50 transition-colors'
                          : 'bg-white hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <strong className={isCandidate ? 'text-[#0072B2] font-semibold' : 'text-slate-800'}>
                            {item.name}
                          </strong>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={item.smiles}>
                            {item.smiles}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        {isCandidate ? (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                            Candidate
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Reference
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 font-semibold">{p.formula}</td>
                      <td className="py-2 px-3 font-mono text-slate-900">{p.molecularWeight.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono text-slate-900">{p.logP.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono text-slate-900">{p.tpsa.toFixed(1)}</td>
                      <td className="py-2 px-2 text-center font-mono">{p.hbd}</td>
                      <td className="py-2 px-2 text-center font-mono">{p.hba}</td>
                      <td className="py-2 px-2 text-center font-mono">{p.rotatableBonds}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-600">
                        {p.sigmaBonds} / {p.piBonds}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {lip.violations === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-[#009E73]" />
                            <span>Compliant (0)</span>
                          </span>
                        ) : lip.violations === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-[#E69F00]" />
                            <span>Acceptable (1)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-[#D55E00]" />
                            <span>Failed ({lip.violations})</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] max-w-[220px]">
                        <span className="font-medium text-slate-700 block">{item.drugClass}</span>
                        <span className="text-slate-500 line-clamp-1">{item.indication}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Comparative Synthesis Cards & Academic Notes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">MW Span</span>
              <strong className="text-sm font-bold text-slate-900 font-mono">
                {stats.minMw.toFixed(1)} – {stats.maxMw.toFixed(1)} <span className="text-xs font-normal text-slate-500">g/mol</span>
              </strong>
              <p className="text-[10px] text-slate-500 mt-0.5">Drug threshold: &lt; 500 Da</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">LogP Window</span>
              <strong className="text-sm font-bold text-slate-900 font-mono">
                {stats.minLogP.toFixed(2)} to {stats.maxLogP.toFixed(2)}
              </strong>
              <p className="text-[10px] text-slate-500 mt-0.5">Optimal: -0.4 to +5.0</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">TPSA Range</span>
              <strong className="text-sm font-bold text-slate-900 font-mono">
                {stats.minTpsa.toFixed(1)} – {stats.maxTpsa.toFixed(1)} <span className="text-xs font-normal text-slate-500">Å²</span>
              </strong>
              <p className="text-[10px] text-slate-500 mt-0.5">Oral absorption: &lt; 140 Å²</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Lipinski Compliance</span>
              <strong className="text-sm font-bold text-[#009E73] font-mono">
                {stats.compliantCount} / {stats.total} <span className="text-xs font-normal text-slate-600">({Math.round((stats.compliantCount / stats.total) * 100)}%)</span>
              </strong>
              <p className="text-[10px] text-slate-500 mt-0.5">Bioavailability criterion</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 text-xs text-slate-700">
            <h5 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Academic Observations on Cross-Molecular Trends:</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>
                <strong>Molecular Weight &amp; Size:</strong> Small-molecule oral therapeutics typically feature molecular weights below 500 Da, ensuring adequate paracellular or transcellular intestinal flux.
              </li>
              <li>
                <strong>Lipophilicity &amp; Partitioning:</strong> Compounds with moderate LogP (1.0 – 3.0) maintain optimal balance between aqueous gastric solubility and passive lipid bilayer permeability.
              </li>
              <li>
                <strong>Hydrogen-Bonding Architecture:</strong> The ratio of donors (HBD) to acceptors (HBA) governs desolvation penalties during membrane partitioning; molecules with fewer than 5 donors and 10 acceptors exhibit favorable oral bioavailability.
              </li>
              <li>
                <strong>Conformational Flexibility (Rotatable Bonds):</strong> Compounds with ≤ 10 rotatable bonds display reduced conformational entropy loss upon target receptor binding, promoting binding affinity.
              </li>
            </ul>
          </div>
        </div>

        {/* 5. Python Libraries Used & Illustrative Code */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs print:border-none print:shadow-none print:p-0">
          <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wide mb-2">
            5. Python & Cheminformatics Libraries Used
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-6">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <strong className="text-slate-800 block">RDKit Cheminformatics Toolkit</strong>
              <p className="text-slate-600 mt-0.5">
                Reads SMILES notation, validates molecular graphs, computes 2D diagrams, generates 3D conformers, and calculates descriptors (MW, LogP, TPSA, HBD, HBA, rotatable bonds).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <strong className="text-slate-800 block">Streamlit & Modern Web Framework</strong>
              <p className="text-slate-600 mt-0.5">
                Provides real-time interactive input fields, responsive state handling, 3D molecular controls, and automated PDF report export.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <strong className="text-slate-800 block">py3Dmol / WebGL Engine</strong>
              <p className="text-slate-600 mt-0.5">
                Renders GPU-accelerated interactive 3D molecular conformations with Ball & Stick, Space Filling (CPK), and van der Waals surface meshes.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <strong className="text-slate-800 block">ReportLab / jsPDF Engine</strong>
              <p className="text-slate-600 mt-0.5">
                Assembles standardized student lab reports into high-resolution printable PDF documents with tables, figures, and academic attributions.
              </p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-blue-700" />
            <span>5. Educational Python Code: SMILES to Molecular Properties</span>
          </h4>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed mb-4">
{`from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, Lipinski, rdMolDescriptors, AllChem

# 1. Convert SMILES notation into a molecular object
smiles = "CCO"  # Example: Ethanol
mol = Chem.MolFromSmiles(smiles)

if mol is None:
    raise ValueError("Invalid SMILES notation")

# 2. Calculate primary physicochemical descriptors
formula = rdMolDescriptors.CalcMolFormula(mol)
mw = Descriptors.MolWt(mol)
logp = Crippen.MolLogP(mol)
tpsa = rdMolDescriptors.CalcTPSA(mol)
hbd = Lipinski.NumHDonors(mol)
hba = Lipinski.NumHAcceptors(mol)

print("Formula:", formula)
print("Molecular Weight:", round(mw, 3), "g/mol")
print("LogP:", round(logp, 3))
print("TPSA:", round(tpsa, 3), "A^2")

# 3. Generate 3D conformer with ETKDG and MMFF
mol3d = Chem.AddHs(mol)
status = AllChem.EmbedMolecule(mol3d, randomSeed=42)
if status == 0:
    AllChem.MMFFOptimizeMolecule(mol3d)`}
          </pre>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-slate-600 font-medium">
                <strong>Cheminformatics Virtual Laboratory Developer:</strong> LUTUKURTHI H S S V KRISHNA SATYA<br />
                <span className="text-slate-500 font-normal">Faculty Mentor &amp; Course Coordinator: Dr. R. Subramanian · Division of Chemistry, School of Sciences, SRM Institute of Science and Technology, Tiruchirappalli.</span>
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-slate-500 text-[11px] block">Academic Inquiries &amp; Queries:</span>
              <a href="mailto:srisailutukurthi@gmail.com" className="text-blue-700 font-mono font-medium hover:underline text-xs">
                srisailutukurthi@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
