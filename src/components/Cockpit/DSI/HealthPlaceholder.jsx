export default function HealthPlaceholder() {
  return (
    <div>
      <div className="text-center py-12">
        <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" strokeDasharray="12 8" />
          <circle cx="40" cy="40" r="20" stroke="currentColor" strokeWidth="4" opacity="0.4" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Adoption Intelligence</h3>
        <p className="text-sm text-gray-400">Available in Phase 2 — Sentinel monitoring</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Feature Adoption Rate', sub: 'Available after 60 days' },
          { label: 'Active Users (30-day)', sub: 'Coming in Phase 2' },
          { label: 'Support Incident Rate', sub: 'Coming in Phase 2' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center opacity-50">
            <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">{m.label}</p>
            <p className="text-xs text-gray-400">{m.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 italic text-center mt-6">
        Adoption metrics activate once capabilities have been live for 60 days.
        Sentinel monitoring launches in Phase 2.
      </p>
    </div>
  );
}
