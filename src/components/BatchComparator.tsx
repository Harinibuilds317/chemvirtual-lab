/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { calculateProperties, evaluateLipinskiRules, isValidSmiles } from '../services/cheminformatics';
import { Download, Plus, CheckCircle, AlertTriangle, Eye, ArrowUpDown } from 'lucide-react';

interface BatchComparatorProps {
  onSelectMolecule: (smiles: string) => void;
}

const DEFAULT_BATCH_INPUT = `Ethanol, CCO
Benzene, c1ccccc1
Phenol, Oc1ccccc1
Acetic Acid, CC(=O)O
Aspirin, CC(=O)Oc1ccccc1C(=O)O
Caffeine, CN1C=NC2=C1C(=O)N(C(=O)N2C)C
Paracetamol, CC(=O)Nc1ccc(O)cc1
Ibuprofen, CC(C)Cc1ccc(cc1)C(C)C(=O)O`;

export const BatchComparator: React.FC<BatchComparatorProps> = ({ onSelectMolecule }) => {
  const [inputText, setInputText] = useState<string>(DEFAULT_BATCH_INPUT);
  const [sortField, setSortField] = useState<string>('mw');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [chartMetricX, setChartMetricX] = useState<'mw' | 'logp' | 'tpsa'>('mw');
  const [chartMetricY, setChartMetricY] = useState<'logp' | 'tpsa' | 'hbd'>('logp');

  // Parse lines into records
  const records = useMemo(() => {
    const lines = inputText.split('\n');
    const results: Array<{
      id: number;
      name: string;
      smiles: string;
      formula: string;
      mw: number;
      logp: number;
      tpsa: number;
      hbd: number;
      hba: number;
      rotBonds: number;
      rings: number;
      violations: number;
      isLipinski: boolean;
    }> = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(',')) return;

      const [namePart, ...smilesParts] = trimmed.split(',');
      const smiles = smilesParts.join(',').trim();
      const name = namePart.trim();

      if (isValidSmiles(smiles)) {
        try {
          const props = calculateProperties(smiles);
          const lip = evaluateLipinskiRules(props);
          results.push({
            id: index + 1,
            name,
            smiles,
            formula: props.formula,
            mw: props.molecularWeight,
            logp: props.logP,
            tpsa: props.tpsa,
            hbd: props.hbd,
            hba: props.hba,
            rotBonds: props.rotatableBonds,
            rings: props.ringCount,
            violations: lip.violations,
            isLipinski: lip.isCompliant,
          });
        } catch (e) {
          // ignore parsing error
        }
      }
    });

    return results;
  }, [inputText]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [records, sortField, sortAsc]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDownloadCsv = () => {
    const headers = ['Molecule Name', 'SMILES', 'Formula', 'MW (g/mol)', 'LogP', 'TPSA (A^2)', 'HBD', 'HBA', 'Rotatable Bonds', 'Rings', 'Lipinski Violations', 'Ro5 Status'];
    const rows = sortedRecords.map(r => [
      r.name,
      r.smiles,
      r.formula,
      r.mw.toString(),
      r.logp.toString(),
      r.tpsa.toString(),
      r.hbd.toString(),
      r.hba.toString(),
      r.rotBonds.toString(),
      r.rings.toString(),
      r.violations.toString(),
      r.isLipinski ? 'Compliant' : 'Violated',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Structure_Property_Comparison.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Min/Max for scatter chart
  const minX = Math.min(...records.map(r => (r as any)[chartMetricX]), 0);
  const maxX = Math.max(...records.map(r => (r as any)[chartMetricX]), 100);
  const minY = Math.min(...records.map(r => (r as any)[chartMetricY]), 0);
  const maxY = Math.max(...records.map(r => (r as any)[chartMetricY]), 10);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-800">
          📈 Structure–Property Batch Analysis
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Compare physicochemical descriptors, Lipinski compliance, and structural trends across multiple candidate compounds simultaneously.
        </p>

        {/* Input Text Area */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
            Input Molecules (format: <code>Molecule Name, SMILES</code> on each line):
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            placeholder="Aspirin, CC(=O)Oc1ccccc1C(=O)O&#10;Caffeine, CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
          />
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>{records.length} valid molecule(s) parsed</span>
          <button
            onClick={handleDownloadCsv}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Comparison CSV</span>
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="font-semibold text-slate-800 text-sm">
            Comparison Table
          </h3>
          <span className="text-[11px] text-slate-400">Click column headers to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-[#1E3A8A] text-white uppercase text-[11px]">
              <tr>
                <th onClick={() => toggleSort('name')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900">
                  <div className="flex items-center gap-1"><span>Molecule</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-2 px-3 font-semibold font-mono">Formula</th>
                <th onClick={() => toggleSort('mw')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>MW</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('logp')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>LogP</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('tpsa')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>TPSA</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('hbd')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>HBD</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('hba')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>HBA</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('rotBonds')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>RotB</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('rings')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900 font-mono">
                  <div className="flex items-center gap-1"><span>Rings</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => toggleSort('violations')} className="py-2 px-3 font-semibold cursor-pointer hover:bg-blue-900">
                  <div className="flex items-center gap-1"><span>Ro5 Status</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-2 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedRecords.map((r, idx) => (
                <tr key={r.name + idx} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="py-2 px-3 font-semibold text-slate-800">{r.name}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{r.formula}</td>
                  <td className="py-2 px-3 font-mono font-medium">{r.mw}</td>
                  <td className="py-2 px-3 font-mono font-medium">{r.logp}</td>
                  <td className="py-2 px-3 font-mono font-medium">{r.tpsa}</td>
                  <td className="py-2 px-3 font-mono">{r.hbd}</td>
                  <td className="py-2 px-3 font-mono">{r.hba}</td>
                  <td className="py-2 px-3 font-mono">{r.rotBonds}</td>
                  <td className="py-2 px-3 font-mono">{r.rings}</td>
                  <td className="py-2 px-3">
                    {r.isLipinski ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#009E73] bg-[#009E73]/10 px-2 py-0.5 rounded border border-[#009E73]/30">
                        <CheckCircle className="w-3 h-3" /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D55E00] bg-[#D55E00]/10 px-2 py-0.5 rounded border border-[#D55E00]/30">
                        <AlertTriangle className="w-3 h-3" /> {r.violations} Viol.
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectMolecule(r.smiles)}
                      className="px-2 py-1 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded font-medium inline-flex items-center gap-1"
                      title="Load into 2D/3D studio and full report"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive 2D Correlation Scatter Plot */}
      {records.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">
                📊 Property Correlation Scatter Plot
              </h3>
              <p className="text-xs text-slate-500">
                Visualize structure-property distributions across the batch.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">X-Axis:</span>
                <select
                  value={chartMetricX}
                  onChange={(e) => setChartMetricX(e.target.value as any)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
                >
                  <option value="mw">Molecular Weight (MW)</option>
                  <option value="logp">LogP (Lipophilicity)</option>
                  <option value="tpsa">Polar Surface Area (TPSA)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Y-Axis:</span>
                <select
                  value={chartMetricY}
                  onChange={(e) => setChartMetricY(e.target.value as any)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
                >
                  <option value="logp">LogP (Lipophilicity)</option>
                  <option value="tpsa">Polar Surface Area (TPSA)</option>
                  <option value="hbd">H-Bond Donors (HBD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SVG Scatter Plot */}
          <div className="relative w-full h-64 bg-slate-50 rounded-lg border border-slate-100 p-4 flex items-center justify-center">
            <svg viewBox="0 0 500 220" className="w-full h-full">
              {/* Axes */}
              <line x1="40" y1="180" x2="480" y2="180" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="40" y1="20" x2="40" y2="180" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Ticks & Labels */}
              <text x="260" y="210" textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600">
                {chartMetricX.toUpperCase()}
              </text>
              <text x="15" y="100" textAnchor="middle" transform="rotate(-90 15 100)" fontSize="11" fill="#64748B" fontWeight="600">
                {chartMetricY.toUpperCase()}
              </text>

              {/* Data points */}
              {records.map((r) => {
                const vx = (r as any)[chartMetricX];
                const vy = (r as any)[chartMetricY];

                const cx = 40 + ((vx - minX) / (maxX - minX || 1)) * 420;
                const cy = 180 - ((vy - minY) / (maxY - minY || 1)) * 150;

                return (
                  <g key={r.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="6.5"
                      fill={r.isLipinski ? '#0072B2' : '#D55E00'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:r-8 transition-all"
                    />
                    <text
                      x={cx}
                      y={cy - 9}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#334155"
                      fontWeight="600"
                    >
                      {r.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
