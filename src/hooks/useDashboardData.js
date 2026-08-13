import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchPayload,
  isLiveMode,
  isWritebackEnabled,
  localPayload,
  readCache,
  saveProjects as pushProjects,
} from "../data/source";
import { normalizePayload } from "../data/normalize";
import { buildDashboard } from "../data/derive";

/** How often to quietly re-pull the sheet while the tab is open. */
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;

/** Ignore focus-triggered refetches that land within this of the last one. */
const FOCUS_THROTTLE_MS = 30 * 1000;

function build(payload) {
  return buildDashboard(normalizePayload(payload));
}

/**
 * Source of truth for the dashboard.
 *
 * Status values:
 *   loading — first fetch, nothing to show yet
 *   live    — showing data fetched this session
 *   cached  — showing last-good cached data; the newest fetch failed
 *   local   — no endpoint configured, running off the bundled snapshot
 *   error   — fetch failed and there is no cache to fall back on
 */
export function useDashboardData() {
  const [state, setState] = useState(() => {
    // Offline mode: bundled snapshot, no network at all.
    if (!isLiveMode) {
      return {
        dashboard: build(localPayload()),
        status: "local",
        error: null,
        lastSynced: null,
      };
    }

    // Stale-while-revalidate: paint cached data instantly, refresh behind it.
    const cached = readCache();
    if (cached) {
      return {
        dashboard: build(cached.payload),
        status: "cached",
        error: null,
        lastSynced: cached.cachedAt,
      };
    }

    return { dashboard: null, status: "loading", error: null, lastSynced: null };
  });

  const [isFetching, setIsFetching] = useState(false);

  const abortRef = useRef(null);
  const lastFetchRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const refetch = useCallback(async () => {
    if (!isLiveMode) return;

    // A manual refresh supersedes any in-flight poll.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastFetchRef.current = Date.now();

    setIsFetching(true);
    try {
      const payload = await fetchPayload({ signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted) return;

      setState({
        dashboard: build(payload),
        status: "live",
        error: null,
        lastSynced: new Date().toISOString(),
      });
    } catch (err) {
      if (!mountedRef.current || controller.signal.aborted) return;

      // Keep whatever is on screen — a failed refresh must never blank out a
      // dashboard someone is reading.
      setState((prev) => ({
        ...prev,
        status: prev.dashboard ? "cached" : "error",
        error: err.message ?? String(err),
      }));
    } finally {
      if (mountedRef.current && !controller.signal.aborted) setIsFetching(false);
    }
  }, []);

  // Initial load + background polling.
  useEffect(() => {
    if (!isLiveMode) return undefined;
    refetch();
    const id = setInterval(refetch, REFETCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  // Refresh when the user comes back to the tab, throttled so tab-flicking
  // does not hammer the endpoint.
  useEffect(() => {
    if (!isLiveMode) return undefined;

    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchRef.current < FOCUS_THROTTLE_MS) return;
      refetch();
    };

    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch]);

  /**
   * Push project budgets back to the sheet, then re-read so the screen shows
   * what was actually persisted rather than what we hoped we sent.
   */
  const saveProjects = useCallback(
    async (projects) => {
      await pushProjects(projects);
      await refetch();
    },
    [refetch]
  );

  return {
    ...state,
    isFetching,
    refetch,
    isLiveMode,
    canSaveProjects: isWritebackEnabled,
    saveProjects,
  };
}
