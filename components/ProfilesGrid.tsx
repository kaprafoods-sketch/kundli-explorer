"use client";

import { useState } from "react";
import type { ChartRow } from "@/lib/supabase";
import ProfileCard from "./ProfileCard";

interface Props {
  initialProfiles: ChartRow[];
}

export default function ProfilesGrid({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState<ChartRow[]>(initialProfiles);

  function handleDeleted(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  function handleRenamed(id: string, name: string, relation: string) {
    setProfiles((prev) =>
      prev.map((p) => p.id === id ? { ...p, name, relation } : p)
    );
  }

  if (profiles.length === 0) return null;

  return (
    <section
      style={{
        borderTop: "1px solid var(--faint)",
        paddingTop: "2rem",
        marginTop: "1rem",
      }}
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--brass)",
            marginBottom: 6,
          }}
        >
          ✦ My Kundlis
        </p>
        <p style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
          {profiles.length === 1
            ? "1 saved profile"
            : `${profiles.length} saved profiles`}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {profiles.map((p) => (
          <ProfileCard
            key={p.id}
            profile={p}
            onDeleted={handleDeleted}
            onRenamed={handleRenamed}
          />
        ))}
      </div>
    </section>
  );
}
