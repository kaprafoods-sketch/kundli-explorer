import { cookies } from "next/headers";
import Link from "next/link";
import BirthForm from "@/components/BirthForm";
import ClientSolarSystem from "@/components/ClientSolarSystem";
import AnimatedKundliHero from "@/components/AnimatedKundliHero";
import ProfilesGrid from "@/components/ProfilesGrid";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { listMyProfiles } from "@/app/actions/profiles";
import type { ChartRow } from "@/lib/supabase";

export default async function Home() {
  // Read owner token to surface saved profiles
  const jar = await cookies();
  const hasToken = !!jar.get("kx_owner")?.value;
  const profiles: ChartRow[] = hasToken ? await listMyProfiles() : [];

  return (
    <main className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ── Layer 0: Full-screen 3D solar system ───────────────────── */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "auto" }}
      >
        <ClientSolarSystem />
      </div>

      {/* ── Layer 1: Animated kundli — decorative background motif ─── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <AnimatedKundliHero
          size={340}
          style={{ opacity: 0.22 }}
        />
      </div>

      {/* ── Layer 2: Content overlay ────────────────────────────────── */}
      <div
        className="relative min-h-screen flex flex-col"
        style={{ zIndex: 10 }}
      >
        {/* Language switcher — top-right, reachable before any chart exists */}
        <div
          style={{
            position: "absolute",
            top: "calc(10px + var(--safe-top))",
            right: "max(12px, var(--safe-right))",
            zIndex: 20,
            pointerEvents: "auto",
          }}
        >
          <LanguageSwitcher withLabel={false} compact />
        </div>

        {/* Welcome back banner — only when profiles exist */}
        {profiles.length > 0 && (
          <div
            className="flex items-center justify-between px-6 py-2.5"
            style={{
              background: "rgba(11,16,38,0.75)",
              borderBottom: "1px solid rgba(200,162,74,0.18)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              <span style={{ color: "var(--brass)" }}>✦ Welcome back</span>
              {" — "}
              {profiles.length === 1 ? "1 saved kundli" : `${profiles.length} saved kundlis`}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {profiles.slice(0, 3).map((p) => (
                <a
                  key={p.id}
                  href={`/chart/${p.id}`}
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--parchment)",
                    textDecoration: "none",
                    background: "rgba(200,162,74,0.1)",
                    border: "1px solid rgba(200,162,74,0.22)",
                    borderRadius: 5,
                    padding: "3px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </a>
              ))}
              {profiles.length > 3 && (
                <a
                  href="#my-kundlis"
                  style={{ fontSize: "0.78rem", color: "var(--brass)", textDecoration: "none", padding: "3px 6px" }}
                >
                  +{profiles.length - 3} more
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Hero section ─────────────────────────────────────────── */}
        <section
          className="flex-1 flex items-center justify-center px-4 py-10 lg:py-16"
          style={{ minHeight: profiles.length > 0 ? "calc(100vh - 44px)" : "100vh" }}
        >
          {/*
            Two-column on lg+: branding/kundli on left, form on right.
            Stacked on mobile: form first (above fold), kundli below.
          */}
          <div
            className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16"
          >
            {/* ── Right col on desktop / First on mobile: Form ──────── */}
            <div
              className="w-full max-w-lg order-1 lg:order-2"
              style={{ pointerEvents: "auto" }}
            >
              {/* Form glass card */}
              <div
                className="w-full rounded-2xl"
                style={{
                  background: "rgba(11,16,38,0.88)",
                  border: "1px solid rgba(200,162,74,0.28)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,162,74,0.08)",
                  maxHeight: "calc(100vh - 120px)",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                }}
              >
                <BirthForm />
              </div>

              {/* Sample kundli link — below form */}
              <p
                className="text-center mt-4"
                style={{ fontSize: "0.82rem", pointerEvents: "auto" }}
              >
                <span style={{ color: "var(--faint)" }}>Curious how it looks? </span>
                <Link
                  href="/chart/sample"
                  style={{ color: "var(--brass)", textDecoration: "none", fontWeight: 500 }}
                >
                  See a sample kundli →
                </Link>
              </p>
            </div>

            {/* ── Left col on desktop / Second on mobile: Branding ──── */}
            <div
              className="w-full lg:max-w-sm order-2 lg:order-1 flex flex-col items-center lg:items-start gap-6 text-center lg:text-left"
              style={{ pointerEvents: "none" }}
            >
              {/* Label */}
              <p
                className="text-xs tracking-[0.25em] uppercase"
                style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
              >
                Vedic Astrology · Jyotish
              </p>

              {/* Headline / lockup */}
              <div>
                <Logo
                  variant="lockup"
                  size={96}
                  animated
                  style={{ filter: "drop-shadow(0 2px 24px rgba(6,11,24,0.95))" }}
                />
              </div>

              {/* Animated kundli — visible on desktop, hidden on mobile (decorative duplicate of the background) */}
              <div
                className="hidden lg:block"
                style={{
                  background: "rgba(11,16,38,0.45)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: 16,
                  padding: "1.25rem",
                  border: "1px solid rgba(200,162,74,0.15)",
                }}
              >
                <AnimatedKundliHero
                  size={260}
                  style={{ opacity: 0.9 }}
                />
                <p
                  style={{
                    marginTop: 12,
                    fontSize: "0.72rem",
                    textAlign: "center",
                    color: "var(--faint)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Sample birth chart · Mesha lagna
                </p>
              </div>

              {/* Value props */}
              <ul
                className="flex flex-col gap-2"
                style={{ listStyle: "none", padding: 0, margin: 0 }}
              >
                {[
                  "Your chart computed with Swiss Ephemeris accuracy",
                  "Explore every planet, house, and yoga",
                  "Education, not fortune-telling",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      fontSize: "0.83rem",
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      textShadow: "0 1px 8px rgba(10,15,36,0.9)",
                    }}
                  >
                    <span style={{ color: "var(--brass)", flexShrink: 0, marginTop: 1 }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── My kundlis section (below fold) ──────────────────────── */}
        {profiles.length > 0 && (
          <section
            id="my-kundlis"
            className="px-4 pb-16"
            style={{
              background: "rgba(10,15,36,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              pointerEvents: "auto",
            }}
          >
            <div className="max-w-5xl mx-auto">
              <ProfilesGrid initialProfiles={profiles} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
