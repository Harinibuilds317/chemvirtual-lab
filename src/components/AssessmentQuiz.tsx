/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ASSESSMENT_QUESTIONS } from '../services/cheminformatics';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle, RotateCcw, Award, ArrowRight } from 'lucide-react';

interface AssessmentQuizProps {
  studentName?: string;
  registrationNumber?: string;
}

export const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({
  studentName,
  registrationNumber,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const handleSelectOption = (questionId: number, option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const toggleHint = (questionId: number) => {
    setRevealedHints(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = () => {
    // Check if all answered
    let calculatedScore = 0;
    ASSESSMENT_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.answer) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    const percentage = (calculatedScore / ASSESSMENT_QUESTIONS.length) * 100;
    if (percentage >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setRevealedHints({});
    setIsSubmitted(false);
    setScore(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const percentage = Math.round((score / ASSESSMENT_QUESTIONS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Quiz Introduction Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Cheminformatics Knowledge Assessment</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test your understanding of chemical SMILES grammar, molecular descriptors, bonding theory, and 3D representations.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600 font-medium">
              Progress: <strong className="text-blue-700 font-mono">{answeredCount} / {ASSESSMENT_QUESTIONS.length}</strong>
            </span>
            {isSubmitted && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Score Card if Submitted */}
        {isSubmitted && (
          <div className={`mt-5 p-4 rounded-xl border ${
            percentage >= 80 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
              : percentage >= 50 
              ? 'bg-blue-50 border-blue-200 text-blue-950' 
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wide font-bold block">
                  {percentage >= 80 ? '🎉 Outstanding Performance!' : percentage >= 50 ? '👍 Good Effort!' : '📚 Review Recommended'}
                </span>
                <p className="text-sm font-semibold mt-0.5">
                  Your Score: <span className="font-mono text-lg">{score}</span> / {ASSESSMENT_QUESTIONS.length} ({percentage}%)
                </p>
                {studentName && (
                  <p className="text-xs mt-1 text-slate-600">
                    Candidate: <strong>{studentName}</strong> {registrationNumber ? `(${registrationNumber})` : ''}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs block text-slate-600">
                  {percentage >= 80 
                    ? 'Excellent mastery of cheminformatics fundamentals.' 
                    : percentage >= 50 
                    ? 'Solid foundation. Review the hints and explanations below.' 
                    : 'Please review the Theory module and try again.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {ASSESSMENT_QUESTIONS.map((q, idx) => {
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.answer;
          const hintVisible = revealedHints[q.id];

          return (
            <div
              key={q.id}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold font-mono text-xs text-slate-700">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {q.question}
                  </h3>
                </div>

                {/* Show Hint Toggle */}
                {!isSubmitted && (
                  <button
                    onClick={() => toggleHint(q.id)}
                    className="flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded hover:bg-amber-50 transition-colors shrink-0"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{hintVisible ? 'Hide Hint' : 'Hint'}</span>
                  </button>
                )}
              </div>

              {/* Hint Box */}
              {hintVisible && !isSubmitted && (
                <div className="mb-3 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{q.hint}</span>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2 mt-3">
                {q.options.map((opt) => {
                  const isThisSelected = selected === opt;
                  let optStyle = 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700';

                  if (isSubmitted) {
                    if (opt === q.answer) {
                      optStyle = 'border-emerald-400 bg-emerald-100/70 text-emerald-950 font-semibold';
                    } else if (isThisSelected && !isCorrect) {
                      optStyle = 'border-rose-400 bg-rose-100/70 text-rose-950 line-through';
                    } else {
                      optStyle = 'border-slate-200 bg-slate-50/50 text-slate-400';
                    }
                  } else if (isThisSelected) {
                    optStyle = 'border-blue-500 bg-blue-50 text-blue-900 font-medium shadow-2xs';
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(q.id, opt)}
                      disabled={isSubmitted}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && opt === q.answer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isSubmitted && isThisSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submission */}
              {isSubmitted && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg">
                  <strong className="text-slate-800 block mb-0.5">Pedagogical Explanation:</strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button Bar */}
      {!isSubmitted && (
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {answeredCount === ASSESSMENT_QUESTIONS.length ? (
              <span className="text-emerald-700 font-semibold">✓ All {ASSESSMENT_QUESTIONS.length} questions answered</span>
            ) : (
              <span>Answer all questions ({answeredCount}/{ASSESSMENT_QUESTIONS.length} completed) to submit.</span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={answeredCount === 0}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <span>Submit Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
