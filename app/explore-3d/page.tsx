/**
 * [STUB] — Phase 2
 * TODO: Implement 3D solar system orbital view using three.js.
 * This is the "dopamine hook" that draws users into the full chart experience.
 * Planned features:
 *   - Real-time sidereal orbital positions rendered as a 3D heliocentric system
 *   - Planet labels (Sanskrit/English) on hover
 *   - Click planet → open Kundli Explorer for that planet's natal placement
 *   - Animated time-scrubber
 */

export default function Explore3D() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <p
        className="font-display text-xs tracking-[0.3em] uppercase mb-4"
        style={{ color: "var(--brass)" }}
      >
        Coming Soon
      </p>
      <h1
        className="font-display font-semibold mb-4"
        style={{ fontSize: "2.5rem", color: "var(--parchment)" }}
      >
        3D Solar System Explorer
      </h1>
      <p className="text-base max-w-md mb-8" style={{ color: "var(--muted)" }}>
        A real-time three.js orbital view of the planets at your birth moment and today.
        Phase 2 — coming soon.
      </p>
      <a
        href="/"
        className="px-6 py-2.5 rounded-lg text-sm font-semibold"
        style={{ background: "var(--brass)", color: "var(--bg)" }}
      >
        ← Explore your Kundli
      </a>
    </main>
  );
}
