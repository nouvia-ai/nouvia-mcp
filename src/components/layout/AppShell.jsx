/**
 * AppShell — INT-001 NCC-004
 * Wraps Navigation + scrollable content area.
 * Props: nav (ReactNode), children, wideContent (bool — expands max-width for Canvas tab)
 */
export default function AppShell({ nav, children, wideContent = false }) {
  const shell = {
    minHeight:       "100vh",
    backgroundColor: "var(--color-bg-base)",
    fontFamily:      "var(--font-sans)",
  };

  const content = {
    maxWidth: wideContent ? "var(--layout-max-canvas)" : "var(--layout-max-wide)",
    margin:   "0 auto",
    padding:  "var(--space-6) var(--space-5)",
    transition: `max-width var(--duration-slow) var(--ease-default)`,
  };

  return (
    <div style={shell}>
      {nav}
      <main style={content}>
        {children}
      </main>
    </div>
  );
}
