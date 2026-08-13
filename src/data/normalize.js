/* ------------------------------------------------------------------ */
/*  Raw sheet rows -> typed domain objects.                            */
/*                                                                     */
/*  Google Sheets is loose about types: a currency cell may arrive as   */
/*  the number 50000000 or as the string "₦50,000,000.00" depending on  */
/*  cell formatting, and a blank cell may be "", null or undefined.     */
/*  Everything crossing this boundary gets coerced once, here.          */
/*                                                                     */
/*  Rows that fail coercion are SKIPPED and recorded in `issues` — a    */
/*  financial dashboard must never silently drop a deposit, so the UI   */
/*  surfaces the count.                                                 */
/* ------------------------------------------------------------------ */

/**
 * Coerce a sheet cell to a number.
 * Handles: plain numbers, currency symbols, thousands separators,
 * whitespace, and accountancy-style parenthesised negatives "(1,234)".
 * Returns null for anything blank or unparseable.
 */
export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value == null) return null;

  let text = String(value).trim();
  if (text === "" || text === "-" || text === "—") return null;

  // Accountancy negatives: (1,234) === -1234
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }

  // Strip currency symbols, thousands separators and any whitespace
  // (including the non-breaking spaces Sheets likes to emit).
  text = text.replace(/[₦$£€,\s ]/g, "");
  if (text === "" || !/^\d*\.?\d*$/.test(text)) return null;

  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/**
 * Coerce a sheet cell to an ISO `YYYY-MM-DD` date string.
 * Accepts Date objects (what the Apps Script reader emits for date cells),
 * ISO strings, and `DD/MM/YYYY` — the Nigerian locale order Sheets uses when
 * a date cell is stored as text. Returns null if unparseable.
 */
export function parseDate(value) {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toISODate(value);
  }

  const text = String(value).trim();
  if (text === "") return null;

  // Already ISO (possibly with a time component)
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31)
      return null;
    return `${y}-${mm}-${dd}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : toISODate(parsed);
}

function toISODate(date) {
  // Use UTC parts so a date cell never drifts a day across timezones.
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function parseBool(value) {
  if (typeof value === "boolean") return value;
  const text = parseText(value).toLowerCase();
  return text === "true" || text === "yes" || text === "y" || text === "1";
}

/** True when a row is entirely blank — trailing sheet rows, ignored silently. */
function isBlankRow(row) {
  return Object.values(row ?? {}).every(
    (v) => v == null || String(v).trim() === "",
  );
}

/* ------------------------------------------------------------------ */
/*  Per-tab normalizers                                                */
/*  Each returns { rows, issues }. `issues` entries carry the 1-based   */
/*  sheet row number so a user can go fix the actual cell.              */
/* ------------------------------------------------------------------ */

export function normalizeInvestments(raw = []) {
  const rows = [];
  const issues = [];

  raw.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const sheetRow = i + 2; // +1 for zero-index, +1 for the header row

    const customer = parseText(row.customer);
    const realtor = parseText(row.realtor) || "UNASSIGNED";
    const invested = parseNumber(row.invested);
    const atMaturity = parseNumber(row.at_maturity);
    const maturityDate = parseDate(row.maturity_date);

    if (!customer) {
      issues.push({
        tab: "investments",
        row: sheetRow,
        reason: "missing customer name",
      });
      return;
    }
    if (invested == null) {
      issues.push({
        tab: "investments",
        row: sheetRow,
        reason: `invested is not a number ("${row.invested ?? ""}")`,
      });
      return;
    }
    if (maturityDate == null) {
      issues.push({
        tab: "investments",
        row: sheetRow,
        reason: `maturity_date is not a date ("${row.maturity_date ?? ""}")`,
      });
      return;
    }

    rows.push({
      id: `${sheetRow}-${customer}`,
      customer,
      realtor,
      invested,
      // Fall back to principal so a missing ROI cell understates rather than
      // NaNs the payable total.
      atMaturity: atMaturity ?? invested,
      startDate: parseDate(row.start_date),
      maturityDate,
      status: parseText(row.status) || "active",
    });
  });

  return { rows, issues };
}

export function normalizeCash(raw = []) {
  const rows = [];
  const issues = [];

  raw.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const sheetRow = i + 2;

    const account = parseText(row.account);
    const balance = parseNumber(row.balance);

    if (!account) {
      issues.push({
        tab: "cash",
        row: sheetRow,
        reason: "missing account name",
      });
      return;
    }
    if (balance == null) {
      issues.push({
        tab: "cash",
        row: sheetRow,
        reason: `balance is not a number ("${row.balance ?? ""}")`,
      });
      return;
    }

    rows.push({
      id: `${sheetRow}-${account}`,
      account,
      type: parseText(row.type) || "Bank",
      balance,
      estimated: parseBool(row.estimated),
    });
  });

  return { rows, issues };
}

export function normalizeProjects(raw = []) {
  const rows = [];
  const issues = [];

  raw.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const sheetRow = i + 2;

    const name = parseText(row.name);
    if (!name) {
      issues.push({
        tab: "projects",
        row: sheetRow,
        reason: "missing project name",
      });
      return;
    }

    rows.push({
      id: `sheet-${sheetRow}`,
      name,
      budget: parseNumber(row.budget) ?? 0,
      status: parseText(row.status) || "planned",
    });
  });

  return { rows, issues };
}

export function normalizeMeta(raw = {}) {
  return {
    asOf: parseDate(raw.as_of) ?? toISODate(new Date()),
    currency: parseText(raw.currency) || "NGN",
    depositCount: parseNumber(raw.deposit_count),
  };
}

function normalizeAggregates(raw) {
  if (!raw) return null;
  return {
    buckets: (raw.buckets ?? []).map((b) => ({
      key: parseText(b.key),
      payable: parseNumber(b.payable) ?? 0,
      principal: parseNumber(b.principal) ?? 0,
      count: parseNumber(b.count) ?? 0,
    })),
    realtors: (raw.realtors ?? []).map((r) => ({
      name: parseText(r.name),
      deposits: parseNumber(r.deposits),
      invested: parseNumber(r.invested) ?? 0,
      atMaturity: parseNumber(r.at_maturity),
      estimated: parseBool(r.estimated),
    })),
  };
}

/**
 * Normalize a whole payload — the single entry point used by both the local
 * stand-in and (in Phase 2) the fetched endpoint response.
 */
export function normalizePayload(payload = {}) {
  const investments = normalizeInvestments(payload.investments);
  const cash = normalizeCash(payload.cash);
  const projects = normalizeProjects(payload.projects);

  return {
    meta: normalizeMeta(payload.meta),
    investments: investments.rows,
    cash: cash.rows,
    projects: projects.rows,
    aggregates: normalizeAggregates(payload.aggregates),
    issues: [...investments.issues, ...cash.issues, ...projects.issues],
  };
}
