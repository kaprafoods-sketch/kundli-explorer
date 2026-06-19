import BirthForm from "@/components/BirthForm";
import ClientSolarSystem from "@/components/ClientSolarSystem";

export default function Home() {
  return (
    <main className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Full-screen 3D solar system — decorative background */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0,
          pointerEvents: "auto",
        }}
      >
        <ClientSolarSystem />
      </div>

      {/* Content overlay — sits above the canvas */}
      <div
        className="relative flex flex-col min-h-screen"
        style={{ zIndex: 10, pointerEvents: "none" }}
      >
        {/* Hero text */}
        <section
          className="flex flex-col items-center justify-center pt-16 pb-6 px-6 text-center"
          style={{ pointerEvents: "none" }}
        >
          <p
            className="font-display text-xs tracking-[0.35em] uppercase mb-3"
            style={{ color: "var(--brass)", letterSpacing: "0.3em" }}
          >
            Vedic Astrology · Jyotish
          </p>
          <h1
            className="font-display font-semibold leading-tight mb-3"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              color: "var(--parchment)",
              textShadow: "0 2px 24px rgba(10,15,36,0.8)",
            }}
          >
            Kundli Explorer
          </h1>
          <p
            className="text-lg max-w-lg leading-relaxed mb-1"
            style={{
              color: "var(--muted)",
              textShadow: "0 1px 12px rgba(10,15,36,0.9)",
            }}
          >
            Learn astrology through your own kundli.
          </p>
          <p
            className="text-sm max-w-md leading-relaxed"
            style={{
              color: "var(--faint)",
              textShadow: "0 1px 8px rgba(10,15,36,0.9)",
            }}
          >
            This is education, not prediction — click any planet to explore its cosmic role.
          </p>
        </section>

        {/* Birth form — glass card */}
        <section
          className="flex justify-center px-4 pb-20"
          style={{ pointerEvents: "auto" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl"
            style={{
              background: "rgba(11,16,38,0.82)",
              border: "1px solid rgba(200,162,74,0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,162,74,0.08)",
              padding: "2rem",
            }}
          >
            <BirthForm />
          </div>
        </section>
      </div>
    </main>
  );
}
