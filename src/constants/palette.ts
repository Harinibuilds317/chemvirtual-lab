/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Okabe-Ito Scientific Colorblind-Safe Color Palette:
 * - Black: #000000
 * - Orange: #E69F00
 * - Sky Blue: #56B4E9
 * - Bluish Green: #009E73
 * - Yellow: #F0E442
 * - Blue: #0072B2
 * - Vermillion: #D55E00
 * - Reddish Purple: #CC79A7
 */

export const OKABE_ITO_PALETTE = {
  black: '#000000',
  orange: '#E69F00',
  skyBlue: '#56B4E9',
  bluishGreen: '#009E73',
  yellow: '#F0E442',
  blue: '#0072B2',
  vermillion: '#D55E00',
  reddishPurple: '#CC79A7',
} as const;

export const ELEMENT_PALETTE: Record<string, string> = {
  C: '#000000', // Black
  H: '#56B4E9', // Sky Blue
  O: '#D55E00', // Vermillion
  N: '#0072B2', // Blue
  S: '#E69F00', // Orange
  Cl: '#009E73', // Bluish Green
  F: '#009E73', // Bluish Green
  Br: '#CC79A7', // Reddish Purple
  I: '#CC79A7', // Reddish Purple
  P: '#F0E442', // Yellow
};

export const BOND_PALETTE = {
  sigma: '#0072B2', // Blue
  pi: '#CC79A7', // Reddish Purple
  heavy: '#000000', // Black
  aromatic: '#E69F00', // Orange
};
