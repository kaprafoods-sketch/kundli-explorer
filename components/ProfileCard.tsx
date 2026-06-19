"use client";

import { useState, useTransition } from "react";
import type { ChartRow } from "@/lib/supabase";
import type { NatalChart } from "@/lib/astro/computeChart";
import { GRAHA_GLYPHS } from "@/lib/kb";
import { renameProfile, deleteProfile } from "@/app/actions/profiles";

const RELATION_OPTIONS = ["Self", "Mother", "Father", "Partner", "Child", "Sibling", "Friend", "Other"];

interface Props {
  profile: ChartRow;
  onDeleted?: (id: string) => void;
  onRenamed?: (id: string, name: string, relation: string) => void;
}

export default function ProfileCard({ profile, onDeleted, onRenamed }: Props) {
  const chart = profile.data as NatalChart;
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(profile.name);
  const [relationVal, setRelationVal] = useState(profile.relation ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const lagnaSign = chart.lagnaSign;
  const moonPlacement = chart.placements.find((p) => p.body === "moon");

  // Sign name lookup by number (1–12)
  const SIGN_NAMES = [
    "", "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
  ];
  const SIGN_EN = [
    "", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];

  const lagnaName = SIGN_NAMES[lagnaSign] ?? "—";
  const lagnaEn = SIGN_EN[lagnaSign] ?? "";
  const moonSignName = moonPlacement ? SIGN_NAMES[moonPlacement.signNum] : "";

  function handleSave() {
    if (!nameVal.trim()) { setError("Name is required"); return; }
    setError("");
    startTransition(async () => {
      try {
        await renameProfile(profile.id, nameVal, relationVal);
        onRenamed?.(profile.id, nameVal.trim(), relationVal);
        setEditing(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProfile(profile.id);
        onDeleted?.(profile.id);
      } catch (e) {
        setError((e as Error).message);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--faint)",
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(200,162,74,0.4)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--faint)")}
    >
      {/* Top row: name + relation badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="input-field"
              style={{ fontSize: "0.95rem", padding: "6px 10px" }}
              autoFocus
            />
          ) : (
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--parchment)", fontWeight: 600, marginBottom: 2 }}>
              {profile.name}
            </p>
          )}
          {editing ? (
            <select
              value={relationVal}
              onChange={(e) => setRelationVal(e.target.value)}
              className="input-field"
              style={{ fontSize: "0.8rem", padding: "5px 10px", marginTop: 6 }}
            >
              <option value="">No label</option>
              {RELATION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          ) : (
            profile.relation && (
              <span style={{
                fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--brass)", background: "rgba(200,162,74,0.1)",
                border: "1px solid rgba(200,162,74,0.25)", borderRadius: 4,
                padding: "1px 7px",
              }}>
                {profile.relation}
              </span>
            )
          )}
        </div>
      </div>

      {/* Chart details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          {profile.dob.split("T")[0]}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--parchment)" }}>
            <span style={{ color: "var(--brass)", marginRight: 4 }}>Asc</span>
            {lagnaName} <span style={{ color: "var(--faint)" }}>({lagnaEn})</span>
          </span>
          {moonPlacement && (
            <span style={{ fontSize: "0.8rem", color: "var(--parchment)" }}>
              <span style={{ color: "var(--brass)", marginRight: 4 }}>{GRAHA_GLYPHS.moon}</span>
              {moonSignName}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <p style={{ fontSize: "0.78rem", color: "var(--error)" }}>{error}</p>}

      {/* Actions */}
      {confirmDelete ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--weak)", flex: 1 }}>
            Delete this kundli?
          </span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{ fontSize: "0.75rem", color: "var(--error)", background: "rgba(224,112,112,0.1)", border: "1px solid rgba(224,112,112,0.3)", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}
          >
            {isPending ? "…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ fontSize: "0.75rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      ) : editing ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{ flex: 1, fontSize: "0.8rem", padding: "6px 12px", borderRadius: 6, background: "var(--brass)", color: "var(--bg)", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setEditing(false); setNameVal(profile.name); setRelationVal(profile.relation ?? ""); }}
            style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: 6, background: "none", color: "var(--muted)", border: "1px solid var(--faint)", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href={`/chart/${profile.id}`}
            style={{
              flex: 1, textAlign: "center", fontSize: "0.82rem", fontWeight: 600,
              padding: "7px 12px", borderRadius: 6,
              background: "rgba(200,162,74,0.1)", color: "var(--brass)",
              border: "1px solid rgba(200,162,74,0.3)", textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,162,74,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(200,162,74,0.1)")}
          >
            Open kundli →
          </a>
          <button
            onClick={() => setEditing(true)}
            title="Rename"
            style={{ fontSize: "0.8rem", padding: "7px 10px", borderRadius: 6, background: "none", color: "var(--faint)", border: "1px solid var(--faint)", cursor: "pointer" }}
          >
            ✎
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete"
            style={{ fontSize: "0.8rem", padding: "7px 10px", borderRadius: 6, background: "none", color: "var(--faint)", border: "1px solid var(--faint)", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
