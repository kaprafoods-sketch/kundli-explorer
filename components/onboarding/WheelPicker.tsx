"use client";

import { useRef, useEffect, useCallback } from "react";

export interface WheelItem {
  value: string | number;
  label: string;
}

interface Props {
  items: WheelItem[];
  value: string | number;
  onChange: (value: string | number) => void;
  width?: number;
}

const ITEM_H = 52;
const VISIBLE = 5; // always odd

export default function WheelPicker({ items, value, onChange, width = 88 }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isScrollingRef = useRef(false);

  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Sync scroll position when value changes externally
  useEffect(() => {
    const idx = items.findIndex((i) => String(i.value) === String(value));
    if (idx >= 0) scrollToIndex(idx, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount — after that the wheel drives onChange

  function onScroll() {
    if (isScrollingRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const raw = el.scrollTop / ITEM_H;
      const idx = Math.max(0, Math.min(Math.round(raw), items.length - 1));
      const item = items[idx];
      if (!item) return;
      // Snap to nearest item
      isScrollingRef.current = true;
      scrollToIndex(idx);
      setTimeout(() => { isScrollingRef.current = false; }, 200);
      if (String(item.value) !== String(value)) {
        try { navigator.vibrate?.(6); } catch {}
        onChange(item.value);
      }
    }, 60);
  }

  const containerH = ITEM_H * VISIBLE;
  const pad = ITEM_H * Math.floor(VISIBLE / 2); // 2 items worth of padding

  return (
    <div
      style={{ position: "relative", width, height: containerH, flexShrink: 0 }}
      role="listbox"
      aria-label="wheel picker"
    >
      {/* Top + bottom fade */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `linear-gradient(
            to bottom,
            var(--panel-overlay, rgba(11,16,38,0.95)) 0%,
            transparent 28%,
            transparent 72%,
            var(--panel-overlay, rgba(11,16,38,0.95)) 100%
          )`,
          borderRadius: 16,
        }}
      />

      {/* Centre selection band */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: 4,
          right: 4,
          height: ITEM_H,
          transform: "translateY(-50%)",
          background: "rgba(200,162,74,0.08)",
          border: "1px solid rgba(200,162,74,0.22)",
          borderRadius: 12,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Scrollable list */}
      <div
        ref={listRef}
        onScroll={onScroll}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "scroll",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          paddingTop: pad,
          paddingBottom: pad,
          scrollbarWidth: "none",
        }}
        // Hide webkit scrollbar
        className="hide-scrollbar"
      >
        {items.map((item) => {
          const sel = String(item.value) === String(value);
          return (
            <div
              key={item.value}
              role="option"
              aria-selected={sel}
              style={{
                height: ITEM_H,
                scrollSnapAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: sel ? 22 : 17,
                fontWeight: sel ? 700 : 400,
                letterSpacing: sel ? "-0.01em" : "0",
                color: sel ? "var(--parchment)" : "rgba(142,151,184,0.45)",
                fontFamily: "var(--font-ui, system-ui)",
                transition: "font-size 0.12s ease, color 0.12s ease, font-weight 0.12s ease",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              onClick={() => {
                const idx = items.findIndex((i) => i.value === item.value);
                scrollToIndex(idx);
                setTimeout(() => {
                  if (String(item.value) !== String(value)) {
                    try { navigator.vibrate?.(6); } catch {}
                    onChange(item.value);
                  }
                }, 120);
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
