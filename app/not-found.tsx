export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <p className="font-display text-6xl mb-4" style={{ color: "var(--faint)" }}>☽</p>
      <h1 className="font-display text-3xl font-semibold mb-3" style={{ color: "var(--parchment)" }}>
        Chart not found
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        This chart may have been deleted, or the link is incorrect.
      </p>
      <a
        href="/"
        className="px-6 py-2.5 rounded-lg text-sm font-semibold"
        style={{ background: "var(--brass)", color: "var(--bg)" }}
      >
        Compute a new chart
      </a>
    </main>
  );
}
