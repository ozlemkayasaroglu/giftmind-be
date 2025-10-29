const supabase = require('../config/supabaseClient');

// Removed runtime probing that could be blocked by RLS. Default to standard column names.
let detectedColumns = { minCol: 'budget_min', maxCol: 'budget_max' };

async function detectColumns() {
  // Keep API compatible; return defaults.
  return detectedColumns;
}

function toNumberLoose(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string') return null;

  // Normalize: remove currency symbols and spaces
  let s = v.trim()
    .replace(/[₺₤$€£]|TL|TRY/gi, '')
    .replace(/\s+/g, '');

  // Range pattern like '100-200' or '1.000-2.500'
  const rangeMatch = s.match(/^([-0-9.,]+)[–—-]([-0-9.,]+)$/); // hyphen/en-dash/em-dash
  if (rangeMatch) {
    const a = toNumberLoose(rangeMatch[1]);
    const b = toNumberLoose(rangeMatch[2]);
    // Caller handles assignment; here return NaN to indicate not a single number
    return Number.isFinite(a) && Number.isFinite(b) ? NaN : null;
  }

  // Keep only digits, comma, dot, and minus
  s = s.replace(/[^0-9,.-]/g, '');

  // If both comma and dot exist, assume commas are thousands separators -> remove commas
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',') && !s.includes('.')) {
    // If only comma exists, treat it as decimal separator
    s = s.replace(/,/g, '.');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseBudgetFromBody(body) {
  // Top-level variants (expanded alias set)
  let minRaw = body?.budget_min
    ?? body?.min_budget
    ?? body?.budgetMin
    ?? body?.minBudget
    ?? body?.price_min
    ?? body?.minPrice
    ?? null;

  let maxRaw = body?.budget_max
    ?? body?.max_budget
    ?? body?.budgetMax
    ?? body?.maxBudget
    ?? body?.price_max
    ?? body?.maxPrice
    ?? null;

  // Nested variants
  const nested = body?.budget ?? body?.priceRange ?? body?.range ?? null;
  if ((minRaw === null && maxRaw === null) && nested && typeof nested === 'object') {
    minRaw = nested.min ?? nested.lower ?? nested.start ?? null;
    maxRaw = nested.max ?? nested.upper ?? nested.end ?? null;
  }

  // Hyphenated string single field like 'budget': '100-200'
  if (minRaw === null && maxRaw === null && typeof body?.budget === 'string') {
    const s = body.budget.trim().replace(/[₺₤$€£]|TL|TRY/gi, '').replace(/\s+/g, '');
    const m = s.match(/^([-0-9.,]+)[–—-]([-0-9.,]+)$/);
    if (m) {
      const a = toNumberLoose(m[1]);
      const b = toNumberLoose(m[2]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        return { min: a, max: b };
      }
    }
  }

  return { min: toNumberLoose(minRaw), max: toNumberLoose(maxRaw) };
}

async function applyBudgetToData(obj, min, max) {
  const cols = await detectColumns();
  if (!cols) return obj;
  if (min !== null && !Number.isNaN(min)) obj[cols.minCol] = min;
  if (max !== null && !Number.isNaN(max)) obj[cols.maxCol] = max;
  return obj;
}

function normalizeBudgetFields(row) {
  if (!row || typeof row !== 'object') return row;
  const min = toNumberLoose(row.budget_min ?? row.min_budget ?? row.budgetMin ?? row.minBudget ?? row.price_min ?? row.minPrice ?? null);
  const max = toNumberLoose(row.budget_max ?? row.max_budget ?? row.budgetMax ?? row.maxBudget ?? row.price_max ?? row.maxPrice ?? null);
  return { ...row, budget_min: min, budget_max: max };
}

module.exports = {
  detectColumns,
  parseBudgetFromBody,
  applyBudgetToData,
  normalizeBudgetFields,
  toNumberLoose,
};
