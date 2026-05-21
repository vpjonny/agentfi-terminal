export const BASE_CHAIN_ID = 8453;

/**
 * DIEM peg (locked decision from T3).
 *
 * Methodology: compute_val = stakedDiem × 365 × diemPriceUsd. We use spot price
 * (not a fixed $1 peg) because the underlying claim "1 DIEM = $1/day API credit"
 * is a redemption guarantee from Venice — market price can drift above/below.
 *
 * For scaffolding, DIEM_PRICE_USD is a hardcoded $1.00. Replace with a live
 * Coingecko/Geckoterminal fetch in a later task before launch — this is the
 * #1 methodology nit a CT semi-expert will find.
 */
export const DIEM_PRICE_USD = 1.0;

export const BUILD_MODE_THRESHOLD_DIEM_PER_DAY = 0.5;
