/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Deterministic SVG avatar for a wallet address (no external requests). */
export function walletAvatar(wallet: string): string {
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) hash = (hash * 31 + wallet.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const cells: string[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      const bit = (hash >> (y * 3 + x)) & 1;
      if (!bit) continue;
      cells.push(`<rect x="${x * 4 + 2}" y="${y * 4 + 2}" width="4" height="4"/>`);
      if (x < 2) cells.push(`<rect x="${(4 - x) * 4 + 2}" y="${y * 4 + 2}" width="4" height="4"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="hsl(${hue},70%,92%)"/><g fill="hsl(${hue},55%,40%)">${cells.join('')}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
