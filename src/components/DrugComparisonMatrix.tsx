/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MolecularProperties } from '../types/cheminformatics';
import { calculateProperties, evaluateLipinskiRules } from '../services/cheminformatics';
import { ChemicalDrawer2D } from './ChemicalDrawer2D';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertCircle, 
  Pill, 
  Activity, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ReferenceDrug {
  name: string;
  genericName: string;
  smiles: string;
  indication: string;
  mechanism: string;
  drugClass: string;
}

export const REFERENCE_DRUGS: ReferenceDrug[] = [
  {
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    indication: 'Analgesic, antipyretic, anti-inflammatory, cardiovascular anti-platelet.',
    mechanism: 'Irreversible non-selective cyclooxygenase (COX-1 and COX-2) inhibitor blocking thromboxane A2 and prostaglandin synthesis.',
    drugClass: 'Salicylate NSAID',
  },
  {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
    indication: 'Mild-to-moderate pain and pyrexia / fever reduction.',
    mechanism: 'Central nervous system inhibition of prostaglandin synthesis and modulation of the endogenous cannabinoid system via AM404 metabolite.',
    drugClass: 'Aniline Analgesic',
  },
  {
    name: 'Ibuprofen',
    genericName: '2-(4-isobutylphenyl)propanoic acid',
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
    indication: 'Inflammatory pain, dysmenorrhea, rheumatoid arthritis, osteoarthritis.',
    mechanism: 'Reversible non-selective inhibition of COX-1 and COX-2, diminishing peripheral prostaglandin biosynthesis.',
    drugClass: 'Propionic Acid NSAID',
  },
  {
    name: 'Caffeine',
    genericName: '1,3,7-Trimethylxanthine',
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    indication: 'Central nervous system stimulant, alertness, respiratory stimulant in neonatal apnea.',
    mechanism: 'Competitive non-selective antagonist of A1 and A2A adenosine receptors in the brain and phosphodiesterase (PDE) inhibitor.',
    drugClass: 'Purine Methylxanthine',
  },
  {
    name: 'Metformin',
    genericName: 'N,N-Dimethylimidodicarbonimidic diamide',
    smiles: 'CN(C)C(=N)NC(=N)N',
    indication: 'First-line therapy for type 2 diabetes mellitus and metabolic syndrome.',
    mechanism: 'Activates AMP-activated protein kinase (AMPK), inhibiting hepatic gluconeogenesis and increasing peripheral insulin sensitivity.',
    drugClass: 'Biguanide Antidiabetic',
  },
  {
    name: 'Amoxicillin',
    genericName: 'p-Hydroxyampicillin',
    smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=C(C=C3)O)N)C(=O)O)C',
    indication: 'Gram-positive and gram-negative bacterial infections (respiratory, ENT, urinary).',
    mechanism: 'Binds penicillin-binding proteins (PBPs), inhibiting the final transpeptidation step of bacterial peptidoglycan cell wall synthesis.',
    drugClass: 'Aminopenicillin β-Lactam',
  },
  {
    name: 'Atorvastatin',
    genericName: 'Lipitor',
    smiles: 'CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4',
    indication: 'Primary hypercholesterolemia, dyslipidemia, cardiovascular event prevention.',
    mechanism: 'Selective, competitive inhibitor of HMG-CoA reductase, the rate-limiting enzyme converting HMG-CoA to mevalonate.',
    drugClass: 'Synthetic Statin',
  },
];

interface DrugComparisonMatrixProps {
  currentSmiles: string;
  currentProperties: MolecularProperties;
}

export const DrugComparisonMatrix: React.FC<DrugComparisonMatrixProps> = ({
  currentSmiles,
  currentProperties,
}) => {
  const [selectedDrugIndex, setSelectedDrugIndex] = useState<number>(0);
  const targetDrug = REFERENCE_DRUGS[selectedDrugIndex];

  // Calculate drug properties
  const drugProperties = useMemo(() => {
    return calculateProperties(targetDrug.smiles);
  }, [targetDrug]);

  const currentLipinski = useMemo(() => evaluateLipinskiRules(currentProperties), [currentProperties]);
  const drugLipinski = useMemo(() => evaluateLipinskiRules(drugProperties), [drugProperties]);

  // Derive similarities & differences
  const comparisonAnalysis = useMemo(() => {
    const similarities: string[] = [];
    const differences: string[] = [];

    // MW comparison
    const mwDiff = Math.abs(currentProperties.molecularWeight - drugProperties.molecularWeight);
    if (mwDiff < 30) {
      similarities.push(`Comparable molecular bulk and mass (~${currentProperties.molecularWeight} vs ~${drugProperties.molecularWeight} g/mol).`);
    } else {
      differences.push(
        currentProperties.molecularWeight > drugProperties.molecularWeight
          ? `Current molecule is significantly heavier (+${Math.round(mwDiff)} g/mol), indicating higher steric volume.`
          : `Current molecule is lighter (-${Math.round(mwDiff)} g/mol) than ${targetDrug.name}.`
      );
    }

    // Lipophilicity (LogP)
    const logpDiff = Math.abs(currentProperties.logP - drugProperties.logP);
    if (logpDiff < 0.6) {
      similarities.push(`Similar partition coefficient (LogP ${currentProperties.logP} vs ${drugProperties.logP}), suggesting closely matched aqueous-lipid balance.`);
    } else {
      differences.push(
        currentProperties.logP > drugProperties.logP
          ? `Higher lipophilicity (LogP ${currentProperties.logP} vs ${drugProperties.logP}), favoring lipid bilayer membrane partitioning.`
          : `Higher hydrophilicity / lower LogP (${currentProperties.logP} vs ${drugProperties.logP}), favoring aqueous solubility.`
      );
    }

    // Polar Surface Area (TPSA)
    const tpsaDiff = Math.abs(currentProperties.tpsa - drugProperties.tpsa);
    if (tpsaDiff < 20) {
      similarities.push(`Closely matched polar surface area (${currentProperties.tpsa} vs ${drugProperties.tpsa} Å²), indicating comparable cellular permeability.`);
    } else {
      differences.push(
        currentProperties.tpsa > drugProperties.tpsa
          ? `Higher polar surface area (${currentProperties.tpsa} vs ${drugProperties.tpsa} Å²), which may lower central nervous system (BBB) permeability.`
          : `Lower polar surface area (${currentProperties.tpsa} vs ${drugProperties.tpsa} Å²), enhancing potential for passive transcellular passage.`
      );
    }

    // Aromatic Rings
    if (currentProperties.aromaticRings === drugProperties.aromaticRings) {
      similarities.push(`Equal aromatic ring count (${currentProperties.aromaticRings} aromatic ring(s)), sharing similar π-stacking capability.`);
    } else {
      differences.push(`Aromatic ring disparity: ${currentProperties.aromaticRings} aromatic ring(s) vs ${drugProperties.aromaticRings} in ${targetDrug.name}.`);
    }

    // Hydrogen bonding
    if (currentProperties.hbd === drugProperties.hbd && currentProperties.hba === drugProperties.hba) {
      similarities.push(`Identical hydrogen bond donor/acceptor counts (HBD: ${currentProperties.hbd}, HBA: ${currentProperties.hba}).`);
    } else {
      differences.push(`Hydrogen bond donor/acceptor profile: Current has ${currentProperties.hbd} HBD / ${currentProperties.hba} HBA; ${targetDrug.name} has ${drugProperties.hbd} HBD / ${drugProperties.hba} HBA.`);
    }

    // Flexibility
    if (Math.abs(currentProperties.rotatableBonds - drugProperties.rotatableBonds) <= 1) {
      similarities.push(`Similar conformational flexibility (${currentProperties.rotatableBonds} vs ${drugProperties.rotatableBonds} rotatable bond(s)).`);
    } else {
      differences.push(`Flexibility divergence: ${currentProperties.rotatableBonds} rotatable bond(s) vs ${drugProperties.rotatableBonds} in ${targetDrug.name}.`);
    }

    // Lipinski Rule Compliance
    if (currentLipinski.isCompliant === drugLipinski.isCompliant) {
      similarities.push(`Both molecules exhibit ${currentLipinski.isCompliant ? 'satisfactory' : 'borderline'} oral bioavailability according to Lipinski's Rule of 5.`);
    } else {
      differences.push(`Oral bioavailability status differs: Current (${currentLipinski.violations} violations) vs ${targetDrug.name} (${drugLipinski.violations} violations).`);
    }

    return { similarities, differences };
  }, [currentProperties, drugProperties, currentLipinski, drugLipinski, targetDrug]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      {/* Header and Drug Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-600" />
            <span>Drug & Molecule Comparative Profiler</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Benchmark candidate chemical structures against landmark pharmaceutical drugs, therapeutic usages, and pharmacophores.
          </p>
        </div>

        {/* Drug Selection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Benchmark Drug:</span>
          {REFERENCE_DRUGS.map((d, idx) => (
            <button
              key={d.name}
              onClick={() => setSelectedDrugIndex(idx)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                selectedDrugIndex === idx
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side 2D & Pharmacological Profile Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left: Current Submitted Molecule */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Candidate Molecule
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {currentProperties.formula}
              </span>
            </div>

            <div className="bg-white rounded-lg p-2 flex items-center justify-center border border-slate-200/80 mb-3 h-48">
              <ChemicalDrawer2D smiles={currentSmiles} width={280} height={180} theme="light" />
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">SMILES:</span>
                <code className="font-mono text-slate-800 truncate max-w-[190px]">{currentSmiles}</code>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Molecular Weight:</span>
                <span className="font-mono font-semibold text-slate-800">{currentProperties.molecularWeight} g/mol</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">LogP (Lipophilicity):</span>
                <span className="font-mono font-semibold text-slate-800">{currentProperties.logP}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Polar Surface (TPSA):</span>
                <span className="font-mono font-semibold text-slate-800">{currentProperties.tpsa} Å²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">H-Bond Donors / Acceptors:</span>
                <span className="font-mono font-semibold text-slate-800">{currentProperties.hbd} / {currentProperties.hba}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lipinski Ro5 Status:</span>
                <span className={`font-semibold ${currentLipinski.isCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {currentLipinski.isCompliant ? `Compliant (${currentLipinski.violations} viol)` : `Violated (${currentLipinski.violations} viol)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Reference Benchmark Drug */}
        <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Reference Drug: {targetDrug.name}
                </span>
                <span className="text-[11px] text-blue-600 block">({targetDrug.drugClass})</span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                {drugProperties.formula}
              </span>
            </div>

            <div className="bg-white rounded-lg p-2 flex items-center justify-center border border-blue-100 mb-3 h-48">
              <ChemicalDrawer2D smiles={targetDrug.smiles} width={280} height={180} theme="light" />
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-500">Generic Name:</span>
                <span className="font-semibold text-slate-800">{targetDrug.genericName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-500">Molecular Weight:</span>
                <span className="font-mono font-semibold text-slate-800">{drugProperties.molecularWeight} g/mol</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-500">LogP (Lipophilicity):</span>
                <span className="font-mono font-semibold text-slate-800">{drugProperties.logP}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-500">Polar Surface (TPSA):</span>
                <span className="font-mono font-semibold text-slate-800">{drugProperties.tpsa} Å²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-500">H-Bond Donors / Acceptors:</span>
                <span className="font-mono font-semibold text-slate-800">{drugProperties.hbd} / {drugProperties.hba}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lipinski Ro5 Status:</span>
                <span className={`font-semibold ${drugLipinski.isCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {drugLipinski.isCompliant ? `Compliant (${drugLipinski.violations} viol)` : `Violated (${drugLipinski.violations} viol)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Usage & Mechanism of Reference Drug */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
        <div>
          <strong className="text-slate-800 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-blue-600" />
            <span>Therapeutic Indications & Relevant Clinical Usage for {targetDrug.name}:</span>
          </strong>
          <p className="text-slate-600 mt-0.5 leading-relaxed pl-5">
            {targetDrug.indication}
          </p>
        </div>
        <div>
          <strong className="text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mechanism of Action & Target Binding:</span>
          </strong>
          <p className="text-slate-600 mt-0.5 leading-relaxed pl-5">
            {targetDrug.mechanism}
          </p>
        </div>
      </div>

      {/* Comparative Analysis: Similarities and Differences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Similarities Card */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Key Physicochemical & Structural Similarities</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-700">
            {comparisonAnalysis.similarities.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Differences Card */}
        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Key Divergences & Pharmacological Differences</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-700">
            {comparisonAnalysis.differences.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
