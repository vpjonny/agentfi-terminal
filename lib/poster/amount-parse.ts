/**
 * Extract a DIEM amount from an action detail string.
 *
 * Matches:  +0.18 DIEM   -0.05 DIEM   0.5 DIEM   DIEM 0.5   "0.18 DIEM paired"
 * Returns:  null if no clean numeric+DIEM token is found.
 *
 * Used by:
 *   - poster/templates rendering ({amount} substitution)
 *   - poster/materiality (claim > 0.1 DIEM rule)
 */
export function parseDiemAmount(detail: string): number | null {
  // Try "<sign><number> DIEM" first (most common: "+0.18 DIEM")
  const forward = detail.match(/([+-]?\d+(?:\.\d+)?)\s*DIEM/i);
  if (forward) return Number(forward[1]);

  // Fallback "DIEM <number>"
  const reverse = detail.match(/DIEM\s+([+-]?\d+(?:\.\d+)?)/i);
  if (reverse) return Number(reverse[1]);

  return null;
}
