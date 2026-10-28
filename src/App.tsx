/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { LabPage } from './types/cheminformatics';
import { calculateProperties, evaluateLipinskiRules, isValidSmiles } from './services/cheminformatics';
import { Header } from './components/Header';
import { MoleculeInputBar } from './components/MoleculeInputBar';
import { ChemicalSketcherModal } from './components/ChemicalSketcherModal';
import { HomeSection } from './components/HomeSection';
import { TheorySection } from './components/TheorySection';
import { MolecularStudioTab } from './components/MolecularStudioTab';
import { PropertiesAndLipinski } from './components/PropertiesAndLipinski';
import { BatchComparator } from './components/BatchComparator';
import { AssessmentQuiz } from './components/AssessmentQuiz';
import { LabReportGenerator } from './components/LabReportGenerator';
import { DrugComparisonMatrix } from './components/DrugComparisonMatrix';

export default function App() {
  const [currentPage, setCurrentPage] = useState<LabPage>('home');
  const [activeSmiles, setActiveSmiles] = useState<string>('CCO');
  const [isSketcherOpen, setIsSketcherOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('srmist_chem_student_name') || '';
  });
  const [registrationNumber, setRegistrationNumber] = useState<string>(() => {
    return localStorage.getItem('srmist_chem_reg_no') || '';
  });

  // Persist student info
  const handleUpdateStudentInfo = (name: string, reg: string) => {
    setStudentName(name);
    setRegistrationNumber(reg);
    localStorage.setItem('srmist_chem_student_name', name);
    localStorage.setItem('srmist_chem_reg_no', reg);
  };

  // Compute properties and Lipinski evaluation whenever activeSmiles changes
  const { properties, lipinski, isValid } = useMemo(() => {
    const valid = isValidSmiles(activeSmiles);
    if (!valid) {
      // Fallback safe calculation for ethanol
      const props = calculateProperties('CCO');
      const lip = evaluateLipinskiRules(props);
      return { properties: props, lipinski: lip, isValid: false };
    }
    const props = calculateProperties(activeSmiles);
    const lip = evaluateLipinskiRules(props);
    return { properties: props, lipinski: lip, isValid: true };
  }, [activeSmiles]);

  const handleSelectMolecule = (smiles: string) => {
    setActiveSmiles(smiles);
    setCurrentPage('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Institutional Navigation Header */}
      <Header
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        studentName={studentName}
        registrationNumber={registrationNumber}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Shared Molecule Input Bar shown on Studio, Properties & Drug Comparison pages */}
        {(currentPage === 'studio' || currentPage === 'properties' || currentPage === 'drug-comparison') && (
          <MoleculeInputBar
            currentSmiles={activeSmiles}
            onSmilesChange={(s) => setActiveSmiles(s)}
            onOpenSketcher={() => setIsSketcherOpen(true)}
          />
        )}

        {/* View Routing */}
        {currentPage === 'home' && (
          <HomeSection
            onNavigate={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSmiles={(s) => setActiveSmiles(s)}
          />
        )}

        {currentPage === 'theory' && <TheorySection />}

        {currentPage === 'studio' && (
          <MolecularStudioTab
            smiles={isValid ? activeSmiles : 'CCO'}
            properties={properties}
            onOpenSketcher={() => setIsSketcherOpen(true)}
          />
        )}

        {currentPage === 'properties' && (
          <PropertiesAndLipinski
            smiles={isValid ? activeSmiles : 'CCO'}
            properties={properties}
            lipinski={lipinski}
            studentName={studentName}
            registrationNumber={registrationNumber}
          />
        )}

        {currentPage === 'drug-comparison' && (
          <DrugComparisonMatrix
            currentSmiles={isValid ? activeSmiles : 'CCO'}
            currentProperties={properties}
          />
        )}

        {currentPage === 'comparison' && (
          <BatchComparator onSelectMolecule={handleSelectMolecule} />
        )}

        {currentPage === 'assessment' && (
          <AssessmentQuiz
            studentName={studentName}
            registrationNumber={registrationNumber}
          />
        )}

        {currentPage === 'report' && (
          <LabReportGenerator
            initialSmiles={isValid ? activeSmiles : 'CCO'}
            studentName={studentName}
            registrationNumber={registrationNumber}
            onUpdateStudentInfo={handleUpdateStudentInfo}
          />
        )}
      </main>

      {/* Interactive 2D Chemical Sketcher Modal */}
      <ChemicalSketcherModal
        isOpen={isSketcherOpen}
        onClose={() => setIsSketcherOpen(false)}
        onApplySmiles={(newSmiles) => {
          setActiveSmiles(newSmiles);
        }}
        initialSmiles={activeSmiles}
      />

      {/* Academic Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">
              🧪 Cheminformatics Virtual Laboratory · SRMIST
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
              Developed by <strong className="text-slate-900 font-bold">LUTUKURTHI H S S V KRISHNA SATYA</strong> · Faculty Mentor: Dr. R. Subramanian (Division of Chemistry)
            </p>
          </div>
          <div className="text-right text-[11px]">
            <p>School of Sciences · SRM Institute of Science and Technology, Tiruchirappalli</p>
            <p className="text-slate-500 mt-0.5">
              Academic Inquiries &amp; Queries: <a href="mailto:srisailutukurthi@gmail.com" className="text-blue-700 font-mono font-medium hover:underline">srisailutukurthi@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
