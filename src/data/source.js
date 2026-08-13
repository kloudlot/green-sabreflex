/* ------------------------------------------------------------------ */
/*  Transport. The ONLY module that knows where data physically comes   */
/*  from — everything downstream sees a plain payload object. Pointing  */
/*  the app at a different backend is a URL change in .env, nothing more.*/
/* ------------------------------------------------------------------ */

import { rawPayload } from "./raw";

const env = import.meta.env ?? {};

const ENDPOINT = (env.VITE_SHEET_ENDPOINT ?? "").trim();
const TOKEN = (env.VITE_SHEET_TOKEN ?? "").trim();

const CACHE_KEY = "fsgreen:payload:v1";
const TIMEOUT_MS = 60_000;

/**
 * With no endpoint configured the app runs off the bundled snapshot, exactly
 * as it did in Phase 1. Setting VITE_SHEET_ENDPOINT is the only step needed
 * to go live.
 */
export const isLiveMode = ENDPOINT.length > 0;

/**
 * Write-back is opt-in and off by default. It also requires ALLOW_WRITES on
 * the deployed Apps Script — this flag only decides whether the UI offers the
 * button. See the security note in apps-script/Code.gs before enabling.
 */
export const isWritebackEnabled =
  isLiveMode && String(env.VITE_ENABLE_WRITEBACK ?? "") === "true";

/** The bundled snapshot — used when no endpoint is configured. */
export function localPayload() {
  return rawPayload;
}

/* ------------------------------------------------------------------ */
/*  Cache — lets a failed refresh fall back to last-good data instead   */
/*  of an empty dashboard.                                             */
/* ------------------------------------------------------------------ */

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    // Safari in private mode throws on access rather than returning null.
    return null;
  }
}

export function readCache() {
  const store = storage();
  if (!store) return null;
  try {
    const entry = JSON.parse(store.getItem(CACHE_KEY) ?? "null");
    if (!entry?.payload || !entry?.cachedAt) return null;
    return entry;
  } catch {
    return null;
  }
}

export function writeCache(payload) {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(
      CACHE_KEY,
      JSON.stringify({ payload, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Quota exceeded or private mode — caching is an optimisation, not a
    // requirement, so a failure here must never break the fetch.
  }
}

export function clearCache() {
  storage()?.removeItem(CACHE_KEY);
}

/* ------------------------------------------------------------------ */
/*  Fetch                                                              */
/* ------------------------------------------------------------------ */

/**
 * Fetch the payload from the Apps Script web app.
 *
 * Deliberately a *simple* request: plain GET, no custom headers, token in the
 * query string. Anything else triggers a CORS preflight that Apps Script
 * cannot answer. See apps-script/Code.gs for the full explanation.
 */
export async function fetchPayload({ signal } = {}) {
  if (!isLiveMode) return localPayload();

  const url = new URL(ENDPOINT);
  if (TOKEN) url.searchParams.set("token", TOKEN);

  // Compose the caller's signal with our own timeout so either can abort.
  const timer = new AbortController();
  const timeoutId = setTimeout(() => timer.abort(), TIMEOUT_MS);
  const onAbort = () => timer.abort();
  signal?.addEventListener("abort", onAbort);

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: timer.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (err.name === "AbortError") {
      throw new Error(`Sheet did not respond within ${TIMEOUT_MS / 1000}s.`);
    }
    throw new Error(
      "Could not reach the sheet. Check your connection and that the Apps Script deployment is still live."
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }

  if (!response.ok) {
    throw new Error(`Sheet request failed (HTTP ${response.status}).`);
  }

  // Read as text first: a misconfigured deployment returns a Google sign-in
  // HTML page with a 200, which would otherwise blow up as a JSON parse error
  // with no indication of the actual cause.
  const body = await response.text();

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(
      "The endpoint returned HTML instead of JSON — the deployment is most likely set to a restricted audience. Redeploy with access set to “Anyone”."
    );
  }

  if (payload?.error) {
    if (payload.error === "unauthorized") {
      throw new Error("Rejected by the sheet: VITE_SHEET_TOKEN does not match the deployed token.");
    }
    throw new Error(`Sheet error: ${payload.error}`);
  }

  if (!Array.isArray(payload?.investments)) {
    throw new Error(
      "Endpoint response is missing an `investments` array — check the tab names in apps-script/Code.gs."
    );
  }

  writeCache(payload);
  return payload;
}

/* ------------------------------------------------------------------ */
/*  Write-back                                                          */
/* ------------------------------------------------------------------ */

/**
 * Replace the `projects` tab with the given rows.
 *
 * Sent as Content-Type: text/plain on purpose — it is CORS-safelisted, so the
 * request stays "simple" and avoids a preflight OPTIONS that Apps Script
 * cannot answer. The body is JSON regardless.
 *
 * Only project name/budget/status are sent. The ledger and cash tabs are not
 * writable by the endpoint at any setting.
 */
export async function saveProjects(projects) {
  if (!isWritebackEnabled) {
    throw new Error("Write-back is disabled. Set VITE_ENABLE_WRITEBACK=true to enable it.");
  }

  const url = new URL(ENDPOINT);
  if (TOKEN) url.searchParams.set("token", TOKEN);

  const rows = projects.map((p) => ({
    name: p.name,
    budget: Number(p.budget) || 0,
    status: p.status ?? "planned",
  }));

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tab: "projects", rows }),
      redirect: "follow",
    });
  } catch {
    throw new Error("Could not reach the sheet to save. Your edits are still on screen.");
  }

  if (!response.ok) {
    throw new Error(`Save failed (HTTP ${response.status}).`);
  }

  const body = await response.text();
  let result;
  try {
    result = JSON.parse(body);
  } catch {
    throw new Error("The endpoint returned HTML instead of JSON — check the deployment access setting.");
  }

  if (result?.error) {
    if (result.error === "unauthorized") {
      throw new Error("Rejected by the sheet: VITE_SHEET_TOKEN does not match the deployed token.");
    }
    throw new Error(`Save failed: ${result.error}`);
  }

  clearCache();
  return result;
}
