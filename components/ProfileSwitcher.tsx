"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { ChartRow } from "@/lib/supabase";

interface Props {
  currentId: string;
  profiles: ChartRow[];
}

export default function ProfileSwitcher({ currentId, profiles }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (profiles.length === 0) {
    return (
      <Link
        href="/"
        style={{ fontSize: "0.78rem", color: "var(--brass)", textDecoration: "none" }}
      >
        + Add profile
      </Link>
    );
  }

  const current = profiles.find((p) => p.id === currentId);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(200,162,74,0.08)",
          border: "1px solid rgba(200,162,74,0.25)",
          borderRadius: 6,
          padding: "5px 10px",
          cursor: "pointer",
          color: "var(--parchment)",
          fontSize: "0.82rem",
          fontFamily: "var(--font-ui), system-ui",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: "var(--brass)" }}>✦</span>
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.name ?? "Profiles"}
        </span>
        <span style={{ color: "var(--faint)", fontSize: "0.7rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 200,
            background: "var(--panel)",
            border: "1px solid rgba(200,162,74,0.25)",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
          }}
        >
          {profiles.map((p) => (
            <a
              key={p.id}
              href={`/chart/${p.id}`}
              role="option"
              aria-selected={p.id === currentId}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "9px 14px",
                fontSize: "0.84rem",
                color: p.id === currentId ? "var(--brass)" : "var(--parchment)",
                textDecoration: "none",
                background: p.id === currentId ? "rgba(200,162,74,0.08)" : "transparent",
                borderLeft: p.id === currentId ? "2px solid var(--brass)" : "2px solid transparent",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                if (p.id !== currentId) e.currentTarget.style.background = "rgba(200,162,74,0.06)";
              }}
              onMouseLeave={(e) => {
                if (p.id !== currentId) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ display: "block", fontWeight: p.id === currentId ? 600 : 400 }}>
                {p.name}
              </span>
              {p.relation && (
                <span style={{ fontSize: "0.7rem", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {p.relation}
                </span>
              )}
              <span style={{ display: "block", fontSize: "0.72rem", color: "var(--faint)", marginTop: 1 }}>
                {p.dob.split("T")[0]}
              </span>
            </a>
          ))}
          <div style={{ borderTop: "1px solid var(--faint)" }}>
            <Link
              href="/"
              style={{
                display: "block",
                padding: "9px 14px",
                fontSize: "0.8rem",
                color: "var(--brass)",
                textDecoration: "none",
              }}
            >
              + Add new profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
