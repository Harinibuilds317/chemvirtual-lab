/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseSmiles } from './cheminformatics';
import { get3DConformer } from './conformer3d';

// Okabe-Ito Scientific Colorblind-Safe Palette
const CPK_COLORS: Record<string, string> = {
  C: '#000000', // Black
  H: '#56B4E9', // Sky Blue
  O: '#D55E00', // Vermillion
  N: '#0072B2', // Blue
  S: '#E69F00', // Orange
  Cl: '#009E73', // Bluish Green
  F: '#009E73', // Bluish Green
  P: '#F0E442', // Yellow
  Br: '#CC79A7', // Reddish Purple
  I: '#CC79A7', // Reddish Purple
};

const ATOM_RADII: Record<string, number> = {
  H: 6,
  C: 12,
  N: 13,
  O: 13,
  F: 11,
  P: 14,
  S: 14,
  Cl: 14,
  Br: 15,
  I: 16,
};

interface AtomCoord {
  element: string;
  x: number;
  y: number;
  z: number;
}

interface BondItem {
  from: number;
  to: number;
  order: number;
}

/**
 * Parses SDF text to extract 3D atom positions and bonds
 */
function parseSdfToCoords(sdfText: string): { atoms: AtomCoord[]; bonds: BondItem[] } {
  const lines = sdfText.split('\n');
  const atoms: AtomCoord[] = [];
  const bonds: BondItem[] = [];

  let inCounts = false;
  let numAtoms = 0;
  let numBonds = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('V2000')) {
      numAtoms = parseInt(line.substring(0, 3).trim(), 10) || 0;
      numBonds = parseInt(line.substring(3, 6).trim(), 10) || 0;
      inCounts = true;
      continue;
    }

    if (inCounts) {
      if (atoms.length < numAtoms) {
        // Atom line: x y z elem
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          atoms.push({
            x: parseFloat(parts[0]),
            y: parseFloat(parts[1]),
            z: parseFloat(parts[2]),
            element: parts[3],
          });
        }
      } else if (bonds.length < numBonds) {
        // Bond line: from to order
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          bonds.push({
            from: parseInt(parts[0], 10) - 1,
            to: parseInt(parts[1], 10) - 1,
            order: parseInt(parts[2], 10) || 1,
          });
        }
      }
    }
  }

  return { atoms, bonds };
}

/**
 * Projects 3D conformer coordinates onto a 2D canvas with high-clarity Ball-and-Stick CPK rendering
 */
export async function render3DProjection(
  smiles: string,
  canvas: HTMLCanvasElement,
  options?: { width?: number; height?: number; rotX?: number; rotY?: number }
): Promise<string> {
  const width = options?.width || canvas.width || 400;
  const height = options?.height || canvas.height || 300;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const sdf = await get3DConformer(smiles);
  let { atoms, bonds } = parseSdfToCoords(sdf);

  if (atoms.length === 0) {
    // Fallback: build from parsed 2D
    const parsed = parseSmiles(smiles);
    atoms = parsed.atoms.map((a, idx) => ({
      element: a.element,
      x: (idx % 4) * 1.5,
      y: Math.floor(idx / 4) * 1.5,
      z: (idx % 2) * 0.5,
    }));
    bonds = parsed.bonds.map(b => ({
      from: b.from,
      to: b.to,
      order: b.type === 'double' ? 2 : (b.type === 'triple' ? 3 : 1),
    }));
  }

  // Center coordinates
  let sumX = 0, sumY = 0, sumZ = 0;
  atoms.forEach(a => { sumX += a.x; sumY += a.y; sumZ += a.z; });
  const centerX = sumX / (atoms.length || 1);
  const centerY = sumY / (atoms.length || 1);
  const centerZ = sumZ / (atoms.length || 1);

  // Apply default camera angle (slight perspective rotation)
  const angleX = options?.rotX ?? 0.35;
  const angleY = options?.rotY ?? 0.55;

  const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY), sinY = Math.sin(angleY);

  const projectedAtoms = atoms.map(a => {
    // Center
    let x = a.x - centerX;
    let y = a.y - centerY;
    let z = a.z - centerZ;

    // Rotate Y
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotate X
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return {
      element: a.element,
      x: x1,
      y: y2,
      z: z2,
    };
  });

  // Calculate bounding box for scale
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  projectedAtoms.forEach(a => {
    minX = Math.min(minX, a.x);
    maxX = Math.max(maxX, a.x);
    minY = Math.min(minY, a.y);
    maxY = Math.max(maxY, a.y);
  });

  const spanX = Math.max(maxX - minX, 1.5);
  const spanY = Math.max(maxY - minY, 1.5);
  const scale = Math.min((width - 80) / spanX, (height - 80) / spanY);

  const midX = width / 2;
  const midY = height / 2;

  // Convert to screen coordinates
  const screenAtoms = projectedAtoms.map(a => ({
    element: a.element,
    sx: midX + a.x * scale,
    sy: midY - a.y * scale, // invert Y
    sz: a.z,
  }));

  // Sort bonds and atoms by Z-depth for correct painter's algorithm
  // Draw bonds first
  bonds.forEach(b => {
    const a1 = screenAtoms[b.from];
    const a2 = screenAtoms[b.to];
    if (!a1 || !a2) return;

    const dx = a2.sx - a1.sx;
    const dy = a2.sy - a1.sy;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const px = -dy / len;
    const py = dx / len;

    ctx.strokeStyle = '#64748B';
    ctx.lineCap = 'round';

    if (b.order === 1) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(a1.sx, a1.sy);
      ctx.lineTo(a2.sx, a2.sy);
      ctx.stroke();
    } else if (b.order === 2) {
      ctx.lineWidth = 2.5;
      const off = 3;
      ctx.beginPath();
      ctx.moveTo(a1.sx + px * off, a1.sy + py * off);
      ctx.lineTo(a2.sx + px * off, a2.sy + py * off);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a1.sx - px * off, a1.sy - py * off);
      ctx.lineTo(a2.sx - px * off, a2.sy - py * off);
      ctx.stroke();
    } else {
      ctx.lineWidth = 2;
      const off = 4.5;
      ctx.beginPath();
      ctx.moveTo(a1.sx, a1.sy);
      ctx.lineTo(a2.sx, a2.sy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a1.sx + px * off, a1.sy + py * off);
      ctx.lineTo(a2.sx + px * off, a2.sy + py * off);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a1.sx - px * off, a1.sy - py * off);
      ctx.lineTo(a2.sx - px * off, a2.sy - py * off);
      ctx.stroke();
    }
  });

  // Draw atoms ordered from back to front
  const sortedIndices = screenAtoms.map((_, i) => i).sort((i, j) => screenAtoms[i].sz - screenAtoms[j].sz);

  sortedIndices.forEach(idx => {
    const a = screenAtoms[idx];
    const r = ATOM_RADII[a.element] || 12;
    const color = CPK_COLORS[a.element] || '#64748B';

    // Sphere radial gradient for 3D depth
    const grad = ctx.createRadialGradient(
      a.sx - r * 0.3,
      a.sy - r * 0.3,
      r * 0.1,
      a.sx,
      a.sy,
      r
    );
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, '#0F172A');

    ctx.beginPath();
    ctx.arc(a.sx, a.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Element symbol (skip H to avoid clutter if desired, or show all non-carbon/hydrogen)
    if (a.element !== 'H' && a.element !== 'C') {
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(a.element, a.sx, a.sy);
    }
  });

  return canvas.toDataURL('image/png');
}
