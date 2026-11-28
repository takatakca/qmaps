import { useEffect, useRef, useState } from "react";
import {
  directoryResults, DirectoryReadError, DirectorySessionRejected,
  type DirectoryPlace, type SearchContinuation,
} from "@/lib/ownedDirectory";

type Result = {
  requestKey: string;
  items: DirectoryPlace[];
  next: SearchContinuation | null;
  phase: "loading" | "ready" | "more" | "failed";
  moreError?: boolean;
  sessionChanged?: boolean;
};

type Scope = {
  controller: AbortController;
  busy: boolean;
  seen: Set<string>;
};

export function useDirectoryResults(filters: string | null, attempt: number) {
  const requestKey = JSON.stringify([filters, attempt]);
  const [state, setState] = useState<Result | null>(null);
  const active = useRef<Scope | null>(null);
  const result = state?.requestKey === requestKey ? state : null;

  useEffect(() => {
    if (filters === null) return;
    const scope = { controller: new AbortController(), busy: false, seen: new Set<string>() };
    const { signal } = scope.controller;
    active.current = scope;
    setState({ requestKey, items: [], next: null, phase: "loading" });
    void directoryResults(filters, signal).then(value => {
      if (!signal.aborted) setState({ requestKey, ...value, phase: "ready" });
    }).catch(() => {
      if (!signal.aborted) setState({ requestKey, items: [], next: null, phase: "failed" });
    });
    return () => { scope.controller.abort(); };
  }, [filters, requestKey]);

  async function loadMore() {
    const scope = active.current;
    if (filters === null || !scope || scope.busy || !result?.next || result.phase !== "ready") return;
    const continuation = result.next;
    const { signal } = scope.controller;
    if (signal.aborted) return;
    scope.busy = true;
    setState({ ...result, phase: "more", moreError: false });
    try {
      const value = await directoryResults(filters, signal, continuation);
      if (signal.aborted) return;
      if (value.next && (value.next.after === continuation.after || scope.seen.has(value.next.after))) {
        setState({ ...result, next: null, phase: "ready", moreError: true });
        return;
      }
      scope.seen.add(continuation.after);
      const ids = new Set(result.items.map(place => place.id));
      const items = [...result.items];
      for (const place of value.items) {
        if (!ids.has(place.id)) items.push(place);
        ids.add(place.id);
      }
      setState({ requestKey, items, next: value.next, phase: "ready" });
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof DirectorySessionRejected || (error instanceof DirectoryReadError && error.status === 409))
        setState({ requestKey, items: [], next: null, phase: "failed", sessionChanged: true });
      else setState({ ...result, phase: "ready", moreError: true });
    } finally {
      scope.busy = false;
    }
  }

  return {
    items: result?.items ?? [],
    loading: filters !== null && (!result || result.phase === "loading"),
    failed: result?.phase === "failed",
    sessionChanged: result?.sessionChanged ?? false,
    moreError: result?.moreError ?? false,
    hasNext: Boolean(result?.next),
    loadingMore: result?.phase === "more",
    loadMore,
  };
}
