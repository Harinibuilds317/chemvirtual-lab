/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EXAMPLE_MOLECULES, isValidSmiles } from '../services/cheminformatics';
import { Search, PenTool, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface MoleculeInputBarProps {
  currentSmiles: string;
  onSmilesChange: (smiles: string) => void;
  onOpenSketcher: () => void;
}

export const MoleculeInputBar: React.FC<MoleculeInputBarProps> = ({
  currentSmiles,
  onSmilesChange,
  onOpenSketcher,
}) => {
  const [inputValue, setInputValue] = useState<string>(currentSmiles);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isValid = isValidSmiles(currentSmiles);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (isValidSmiles(val)) {
      onSmilesChange(val);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidSmiles(inputValue)) {
      onSmilesChange(inputValue);
    }
  };

  const handleSelectExample = (key: string) => {
    const preset = EXAMPLE_MOLECULES[key];
    if (preset) {
      setInputValue(preset.smiles);
      onSmilesChange(preset.smiles);
    }
  };

  const handlePubChemSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
        searchTerm.trim()
      )}/property/CanonicalSMILES/JSON`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const smiles = data?.PropertyTable?.Properties?.[0]?.CanonicalSMILES;
        if (smiles) {
          setInputValue(smiles);
          onSmilesChange(smiles);
          setSearchTerm('');
        } else {
          setSearchError('Compound found but SMILES unavailable.');
        }
      } else {
        setSearchError(`"${searchTerm}" not found in PubChem.`);
      }
    } catch (err) {
      setSearchError('Unable to connect to PubChem database.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6">
      {/* Top Presets Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-500 uppercase tracking-wide mr-1 text-[11px]">
            Curated Presets:
          </span>
          {Object.entries(EXAMPLE_MOLECULES).map(([name, data]) => {
            const isActive = currentSmiles === data.smiles;
            return (
              <button
                key={name}
                onClick={() => handleSelectExample(name)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={data.description}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* 2D Sketcher Button */}
        <button
          onClick={onOpenSketcher}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-medium transition-colors"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Draw in 2D Sketcher</span>
        </button>
      </div>

      {/* Main SMILES & Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* SMILES Input Form */}
        <form onSubmit={handleFormSubmit} className="md:col-span-8 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter chemical SMILES notation (e.g. CCO, c1ccccc1, CC(=O)Oc1ccccc1C(=O)O)..."
              className="w-full px-3.5 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="absolute right-3 top-2.5">
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0"
          >
            Update
          </button>
        </form>

        {/* Search PubChem by Name */}
        <form onSubmit={handlePubChemSearch} className="md:col-span-4 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Look up name (e.g. Menthol)..."
              className="w-full px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchTerm.trim()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1"
          >
            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {searchError && (
        <div className="mt-2 text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{searchError}</span>
        </div>
      )}
    </div>
  );
};
