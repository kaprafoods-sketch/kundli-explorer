import BirthForm from "@/components/BirthForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center pt-20 pb-10 px-6 text-center">
        <p
          className="font-display text-xs tracking-[0.35em] uppercase mb-4"
          style={{ color: "var(--brass)", letterSpacing: "0.3em" }}
        >
          Vedic Astrology · Jyotish
        </p>
        <h1
          className="font-display font-semibold leading-tight mb-4"
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "var(--parchment)" }}
        >
          Kundli Explorer
        </h1>
        <p
          className="text-lg max-w-lg leading-relaxed mb-2"
          style={{ color: "var(--muted)" }}
        >
          Learn astrology through your own kundli.
        </p>
        <p
          className="text-sm max-w-md leading-relaxed"
          style={{ color: "var(--faint)" }}
        >
          This is education, not prediction — every screen teaches you to read your own sky.
        </p>

        {/* Decorative rule */}
        <div className="flex items-center gap-4 mt-8 mb-10 w-full max-w-sm">
          <div className="flex-1 h-px" style={{ background: "var(--faint)" }} />
          <span className="text-xl" style={{ color: "var(--brass)" }}>✦</span>
          <div className="flex-1 h-px" style={{ background: "var(--faint)" }} />
        </div>
      </section>

      {/* Form */}
      <section className="flex justify-center px-4 pb-24">
        <div className="w-full max-w-lg">
          <BirthForm />
        </div>
      </section>
    </main>
  );
}
