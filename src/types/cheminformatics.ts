/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BondInformation {
  heavyAtomBonds: number;
  sigmaBonds: number;
  piBonds: number;
  totalBonds: number;
  totalAtomsIncludingH: number;
}

export interface MolecularProperties {
  formula: string;
  molecularWeight: number;
  exactMass: number;
  logP: number;
  tpsa: number;
  hbd: number;
  hba: number;
  rotatableBonds: number;
  ringCount: number;
  aromaticRings: number;
  aliphaticRings: number;
  heavyAtoms: number;
  totalAtomsWithH: number;
  heavyAtomBonds: number;
  sigmaBonds: number;
  piBonds: number;
  totalBonds: number;
  fractionCsp3: number;
  molarRefractivity: number;
}

export interface LipinskiRuleResult {
  mw: { value: number; limit: number; passed: boolean };
  logP: { value: number; limit: number; passed: boolean };
  hbd: { value: number; limit: number; passed: boolean };
  hba: { value: number; limit: number; passed: boolean };
  violations: number;
  isCompliant: boolean;
  veberRotatable: { value: number; limit: number; passed: boolean };
  veberTpsa: { value: number; limit: number; passed: boolean };
  isVeberCompliant: boolean;
}

export interface MoleculeRecord {
  name: string;
  smiles: string;
  canonicalSmiles: string;
  properties: MolecularProperties;
  lipinski: LipinskiRuleResult;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
}

export type LabPage = 
  | 'home'
  | 'theory'
  | 'studio'
  | 'properties'
  | 'drug-comparison'
  | 'comparison'
  | 'assessment'
  | 'report';
