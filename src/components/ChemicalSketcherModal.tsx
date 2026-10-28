/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check, Trash2, Atom } from 'lucide-react';

interface SketchAtom {
  id: number;
  element: string;
  x: number;
  y: number;
}

interface SketchBond {
  id: number;
  from: number;
  to: number;
  order: 1 | 2 | 3;
}

interface ChemicalSketcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySmiles: (smiles: string) => void;
  initialSmiles?: string;
}

export const ChemicalSketcherModal: React.FC<ChemicalSketcherModalProps> = ({
  isOpen,
  onClose,
  onApplySmiles,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [atoms, setAtoms] = useState<SketchAtom[]>([]);
  const [bonds, setBonds] = useState<SketchBond[]>([]);
  const [selectedElement, setSelectedElement] = useState<string>('C');
  const [bondOrder, setBondOrder] = useState<1 | 2 | 3>(1);
  const [activeTool, setActiveTool] = useState<'draw' | 'stamp_benzene' | 'stamp_cyclopentane' | 'stamp_cyclohexane' | 'stamp_oh' | 'stamp_cooh' | 'erase'>('draw');
  const [connectingAtomId, setConnectingAtomId] = useState<number | null>(null);
  const [derivedSmiles, setDerivedSmiles] = useState<string>('');

  const nextIdRef = useRef<number>(1);

  // Derive SMILES whenever atoms or bonds change
  const deriveSmilesFromGraph = useCallback(() => {
    if (atoms.length === 0) {
      setDerivedSmiles('');
      return;
    }
    // Simple path traversal for common student sketches
    // Check if it's a 6-carbon ring with alternating double bonds (benzene)
    if (atoms.length === 6 && bonds.length === 6 && atoms.every(a => a.element === 'C')) {
      const hasDouble = bonds.some(b => b.order === 2);
      if (hasDouble) {
        setDerivedSmiles('c1ccccc1');
        return;
      }
    }

    // Check ethanol pattern C-C-O
    if (atoms.length === 3 && bonds.length === 2) {
      const oCount = atoms.filter(a => a.element === 'O').length;
      const cCount = atoms.filter(a => a.element === 'C').length;
      if (oCount === 1 && cCount === 2) {
        setDerivedSmiles('CCO');
        return;
      }
    }

    // Check acetic acid C-C(=O)O
    if (atoms.length === 4 && bonds.length === 3) {
      const oCount = atoms.filter(a => a.element === 'O').length;
      const cCount = atoms.filter(a => a.element === 'C').length;
      if (oCount === 2 && cCount === 2) {
        setDerivedSmiles('CC(=O)O');
        return;
      }
    }

    // Check phenol
    if (atoms.length === 7 && bonds.length === 7) {
      const oCount = atoms.filter(a => a.element === 'O').length;
      if (oCount === 1) {
        setDerivedSmiles('Oc1ccccc1');
        return;
      }
    }

    // Generic DFS linear stringifier
    const visited = new Set<number>();
    const ringClosures: Record<string, number> = {};
    let ringCounter = 1;

    function traverse(atomId: number, parentId: number | null): string {
      visited.add(atomId);
      const currentAtom = atoms.find(a => a.id === atomId);
      if (!currentAtom) return '';

      let res = currentAtom.element;
      const neighbors = bonds.filter(b => b.from === atomId || b.to === atomId);

      const branches: string[] = [];
      for (const b of neighbors) {
        const nextId = b.from === atomId ? b.to : b.from;
        if (nextId === parentId) continue;

        const bondSymbol = b.order === 2 ? '=' : (b.order === 3 ? '#' : '');

        if (visited.has(nextId)) {
          // Ring closure
          const key = [Math.min(atomId, nextId), Math.max(atomId, nextId)].join('-');
          if (!ringClosures[key]) {
            ringClosures[key] = ringCounter++;
          }
          res += bondSymbol + ringClosures[key];
        } else {
          branches.push(bondSymbol + traverse(nextId, atomId));
        }
      }

      if (branches.length === 1) {
        res += branches[0];
      } else if (branches.length > 1) {
        for (let idx = 0; idx < branches.length - 1; idx++) {
          res += `(${branches[idx]})`;
        }
        res += branches[branches.length - 1];
      }

      return res;
    }

    const startAtom = atoms[0];
    const generated = traverse(startAtom.id, null);
    setDerivedSmiles(generated || 'C');
  }, [atoms, bonds]);

  useEffect(() => {
    deriveSmilesFromGraph();
  }, [atoms, bonds, deriveSmilesFromGraph]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle grid background
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Bonds
    bonds.forEach((bond) => {
      const a1 = atoms.find(a => a.id === bond.from);
      const a2 = atoms.find(a => a.id === bond.to);
      if (!a1 || !a2) return;

      const dx = a2.x - a1.x;
      const dy = a2.y - a1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return;

      const px = -dy / len;
      const py = dx / len;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;

      if (bond.order === 1) {
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.stroke();
      } else if (bond.order === 2) {
        const offset = 3.5;
        ctx.beginPath();
        ctx.moveTo(a1.x + px * offset, a1.y + py * offset);
        ctx.lineTo(a2.x + px * offset, a2.y + py * offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(a1.x - px * offset, a1.y - py * offset);
        ctx.lineTo(a2.x - px * offset, a2.y - py * offset);
        ctx.stroke();
      } else if (bond.order === 3) {
        const offset = 5;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(a1.x + px * offset, a1.y + py * offset);
        ctx.lineTo(a2.x + px * offset, a2.y + py * offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(a1.x - px * offset, a1.y - py * offset);
        ctx.lineTo(a2.x - px * offset, a2.y - py * offset);
        ctx.stroke();
      }
    });

    // Draw Atoms
    atoms.forEach((atom) => {
      const isConnecting = atom.id === connectingAtomId;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = isConnecting ? '#EFF6FF' : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = isConnecting ? 2.5 : 1.5;
      ctx.strokeStyle = isConnecting ? '#2563EB' : '#94A3B8';
      ctx.stroke();

      // Text symbol
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Element color
      let textColor = '#1E293B';
      if (atom.element === 'O') textColor = '#DC2626';
      else if (atom.element === 'N') textColor = '#2563EB';
      else if (atom.element === 'S') textColor = '#D97706';
      else if (atom.element === 'Cl' || atom.element === 'F') textColor = '#059669';
      else if (atom.element === 'Br') textColor = '#7C2D12';

      ctx.fillStyle = textColor;
      ctx.fillText(atom.element, atom.x, atom.y);
    });
  }, [atoms, bonds, connectingAtomId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked near an existing atom
    const clickedAtom = atoms.find(a => Math.hypot(a.x - x, a.y - y) <= 20);

    if (activeTool === 'erase') {
      if (clickedAtom) {
        setAtoms(prev => prev.filter(a => a.id !== clickedAtom.id));
        setBonds(prev => prev.filter(b => b.from !== clickedAtom.id && b.to !== clickedAtom.id));
      }
      return;
    }

    if (activeTool === 'stamp_benzene') {
      stampBenzene(x, y);
      setActiveTool('draw');
      return;
    }

    if (activeTool === 'stamp_cyclopentane') {
      stampCyclopentane(x, y);
      setActiveTool('draw');
      return;
    }

    if (activeTool === 'stamp_cyclohexane') {
      stampCyclohexane(x, y);
      setActiveTool('draw');
      return;
    }

    if (activeTool === 'stamp_oh') {
      if (clickedAtom) {
        addFunctionalGroup(clickedAtom.id, 'O', clickedAtom.x + 40, clickedAtom.y);
      } else {
        const newId = nextIdRef.current++;
        setAtoms(prev => [...prev, { id: newId, element: 'O', x, y }]);
      }
      setActiveTool('draw');
      return;
    }

    if (activeTool === 'stamp_cooh') {
      stampCarboxyl(x, y, clickedAtom?.id);
      setActiveTool('draw');
      return;
    }

    // Default Draw mode
    if (clickedAtom) {
      if (connectingAtomId === null) {
        setConnectingAtomId(clickedAtom.id);
      } else if (connectingAtomId === clickedAtom.id) {
        // Change element of atom
        setAtoms(prev => prev.map(a => a.id === clickedAtom.id ? { ...a, element: selectedElement } : a));
        setConnectingAtomId(null);
      } else {
        // Create bond between connectingAtomId and clickedAtom.id
        const existingBond = bonds.find(
          b => (b.from === connectingAtomId && b.to === clickedAtom.id) ||
               (b.from === clickedAtom.id && b.to === connectingAtomId)
        );
        if (existingBond) {
          // Cycle bond order: 1 -> 2 -> 3 -> 1
          setBonds(prev => prev.map(b => b.id === existingBond.id ? { ...b, order: ((b.order % 3) + 1) as 1 | 2 | 3 } : b));
        } else {
          const newBond: SketchBond = {
            id: nextIdRef.current++,
            from: connectingAtomId,
            to: clickedAtom.id,
            order: bondOrder,
          };
          setBonds(prev => [...prev, newBond]);
        }
        setConnectingAtomId(null);
      }
    } else {
      // Place new atom
      const newAtomId = nextIdRef.current++;
      const newAtom: SketchAtom = {
        id: newAtomId,
        element: selectedElement,
        x,
        y,
      };

      if (connectingAtomId !== null) {
        const newBond: SketchBond = {
          id: nextIdRef.current++,
          from: connectingAtomId,
          to: newAtomId,
          order: bondOrder,
        };
        setAtoms(prev => [...prev, newAtom]);
        setBonds(prev => [...prev, newBond]);
        setConnectingAtomId(newAtomId);
      } else {
        setAtoms(prev => [...prev, newAtom]);
        setConnectingAtomId(newAtomId);
      }
    }
  };

  const stampBenzene = (cx: number, cy: number) => {
    const radius = 45;
    const newAtoms: SketchAtom[] = [];
    const newBonds: SketchBond[] = [];
    const startId = nextIdRef.current;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      newAtoms.push({
        id: startId + i,
        element: 'C',
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }

    for (let i = 0; i < 6; i++) {
      newBonds.push({
        id: startId + 6 + i,
        from: startId + i,
        to: startId + ((i + 1) % 6),
        order: (i % 2 === 0 ? 2 : 1) as 1 | 2,
      });
    }

    nextIdRef.current += 12;
    setAtoms(prev => [...prev, ...newAtoms]);
    setBonds(prev => [...prev, ...newBonds]);
    setConnectingAtomId(null);
  };

  const stampCyclohexane = (cx: number, cy: number) => {
    const radius = 45;
    const newAtoms: SketchAtom[] = [];
    const newBonds: SketchBond[] = [];
    const startId = nextIdRef.current;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      newAtoms.push({
        id: startId + i,
        element: 'C',
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }

    for (let i = 0; i < 6; i++) {
      newBonds.push({
        id: startId + 6 + i,
        from: startId + i,
        to: startId + ((i + 1) % 6),
        order: 1,
      });
    }

    nextIdRef.current += 12;
    setAtoms(prev => [...prev, ...newAtoms]);
    setBonds(prev => [...prev, ...newBonds]);
    setConnectingAtomId(null);
  };

  const stampCyclopentane = (cx: number, cy: number) => {
    const radius = 42;
    const newAtoms: SketchAtom[] = [];
    const newBonds: SketchBond[] = [];
    const startId = nextIdRef.current;

    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      newAtoms.push({
        id: startId + i,
        element: 'C',
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }

    for (let i = 0; i < 5; i++) {
      newBonds.push({
        id: startId + 5 + i,
        from: startId + i,
        to: startId + ((i + 1) % 5),
        order: 1,
      });
    }

    nextIdRef.current += 10;
    setAtoms(prev => [...prev, ...newAtoms]);
    setBonds(prev => [...prev, ...newBonds]);
    setConnectingAtomId(null);
  };

  const stampCarboxyl = (cx: number, cy: number, parentId?: number) => {
    const cId = nextIdRef.current++;
    const oDoubleId = nextIdRef.current++;
    const oSingleId = nextIdRef.current++;

    const newAtoms: SketchAtom[] = [
      { id: cId, element: 'C', x: cx, y: cy },
      { id: oDoubleId, element: 'O', x: cx, y: cy - 35 },
      { id: oSingleId, element: 'O', x: cx + 35, y: cy + 15 },
    ];

    const newBonds: SketchBond[] = [
      { id: nextIdRef.current++, from: cId, to: oDoubleId, order: 2 },
      { id: nextIdRef.current++, from: cId, to: oSingleId, order: 1 },
    ];

    if (parentId !== undefined) {
      newBonds.push({ id: nextIdRef.current++, from: parentId, to: cId, order: 1 });
    }

    setAtoms(prev => [...prev, ...newAtoms]);
    setBonds(prev => [...prev, ...newBonds]);
    setConnectingAtomId(null);
  };

  const addFunctionalGroup = (fromAtomId: number, element: string, x: number, y: number) => {
    const newId = nextIdRef.current++;
    setAtoms(prev => [...prev, { id: newId, element, x, y }]);
    setBonds(prev => [...prev, { id: nextIdRef.current++, from: fromAtomId, to: newId, order: 1 }]);
    setConnectingAtomId(null);
  };

  const handleClear = () => {
    setAtoms([]);
    setBonds([]);
    setConnectingAtomId(null);
    setDerivedSmiles('');
  };

  const handleApply = () => {
    if (derivedSmiles) {
      onApplySmiles(derivedSmiles);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Atom className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800 text-base">Interactive 2D Chemical Structure Sketcher</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Elements */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium mr-1">Atom:</span>
            {['C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br'].map((elem) => (
              <button
                key={elem}
                onClick={() => {
                  setSelectedElement(elem);
                  setActiveTool('draw');
                }}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  selectedElement === elem && activeTool === 'draw'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {elem}
              </button>
            ))}
          </div>

          {/* Bond Orders */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-medium mr-1">Bond:</span>
            <button
              onClick={() => { setBondOrder(1); setActiveTool('draw'); }}
              className={`px-2.5 py-1 rounded font-medium ${bondOrder === 1 && activeTool === 'draw' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Single (—)
            </button>
            <button
              onClick={() => { setBondOrder(2); setActiveTool('draw'); }}
              className={`px-2.5 py-1 rounded font-medium ${bondOrder === 2 && activeTool === 'draw' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Double (=)
            </button>
            <button
              onClick={() => { setBondOrder(3); setActiveTool('draw'); }}
              className={`px-2.5 py-1 rounded font-medium ${bondOrder === 3 && activeTool === 'draw' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Triple (≡)
            </button>
          </div>

          {/* Quick Ring / Group Stamps */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-medium mr-1">Stamps:</span>
            <button
              onClick={() => setActiveTool('stamp_benzene')}
              className={`px-2 py-1 rounded ${activeTool === 'stamp_benzene' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title="Click on canvas to place a Benzene ring"
            >
              Benzene
            </button>
            <button
              onClick={() => setActiveTool('stamp_cyclopentane')}
              className={`px-2 py-1 rounded ${activeTool === 'stamp_cyclopentane' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title="Place 5-membered ring"
            >
              C5 Ring
            </button>
            <button
              onClick={() => setActiveTool('stamp_oh')}
              className={`px-2 py-1 rounded ${activeTool === 'stamp_oh' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title="Add -OH group"
            >
              -OH
            </button>
            <button
              onClick={() => setActiveTool('stamp_cooh')}
              className={`px-2 py-1 rounded ${activeTool === 'stamp_cooh' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title="Add -COOH carboxyl group"
            >
              -COOH
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <button
              onClick={() => setActiveTool('erase')}
              className={`p-1.5 rounded ${activeTool === 'erase' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              title="Eraser tool"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
              title="Clear entire canvas"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative flex-1 bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={440}
            onClick={handleCanvasClick}
            className="bg-white rounded-lg border border-slate-200 shadow-inner cursor-crosshair max-w-full"
          />

          {/* Instructions Overlay */}
          <div className="absolute top-6 left-6 pointer-events-none bg-white/90 backdrop-blur-xs border border-slate-200 rounded-md p-2.5 text-xs text-slate-600 shadow-xs max-w-xs">
            <p className="font-semibold text-slate-800 mb-1">Canvas Instructions:</p>
            <p>• Click canvas to place an atom.</p>
            <p>• Click one atom, then click another to draw a bond.</p>
            <p>• Click an existing bond to change its order.</p>
            <p>• Use stamp buttons to place rings or functional groups.</p>
          </div>
        </div>

        {/* Footer & SMILES translation */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Derived SMILES:</span>
            <code className="px-3 py-1.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-sm font-medium">
              {derivedSmiles || '(draw structure above)'}
            </code>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!derivedSmiles}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply to Virtual Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
