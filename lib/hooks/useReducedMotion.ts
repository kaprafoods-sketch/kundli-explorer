import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// Subscribe to the OS "reduce motion" preference via useSyncExternalStore — the
// React-idiomatic way to read an external store. Avoids setState-in-effect and is
// SSR-safe (server snapshot is a stable `false`, so no hydration mismatch).
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** `true` when the user has requested reduced motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
