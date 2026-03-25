import { useState, useEffect } from 'react';
import { getIssues, addIssue } from '../../services/clientCockpit';

const SEV = {
  high: { dot: 'bg-red-500', text: 'text-red-500', label: 'High' },
  medium: { dot: 'bg-orange-400', text: 'text-orange-400', label: 'Medium' },
  low: { dot: 'bg-green-500', text: 'text-green-500', label: 'Low' },
};

const STATUS = {
  open: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Open' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-600', label: 'Resolved' },
};

const PILLAR_OPTIONS = [
  'Engineering & Design', 'Estimation & Quoting', 'Procurement & Sourcing',
  'Production Planning', 'Quality & Compliance', 'Delivery & Logistics',
];

export default function IssuesBlockers({ clientId }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fSeverity, setFSeverity] = useState('');
  const [fPillars, setFPillars] = useState([]);
  const [fRaisedBy, setFRaisedBy] = useState('client');

  const loadIssues = () => {
    setLoading(true);
    getIssues(clientId).then(i => { setIssues(i); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadIssues(); }, [clientId]);

  const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const resetForm = () => { setFTitle(''); setFDesc(''); setFSeverity(''); setFPillars([]); setFRaisedBy('client'); };

  const handleSubmit = async () => {
    if (!fTitle.trim() || !fSeverity) return;
    await addIssue(clientId, {
      title: fTitle.trim(), description: fDesc.trim(),
      severity: fSeverity, linkedPillars: fPillars,
      raisedBy: fRaisedBy, status: 'open',
    });
    setShowModal(false); resetForm(); loadIssues();
    showToastMsg('Issue logged');
  };

  const canSubmit = fTitle.trim() && fSeverity;

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues & Blockers</h2>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues & Blockers</h2>

      {issues.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="text-3xl">✓</div>
          <p className="text-gray-400 text-sm">No open issues</p>
          <button onClick={() => setShowModal(true)} className="text-blue-500 text-sm font-medium">Log Issue</button>
        </div>
      ) : (
        <>
          <div>
            {issues.map(issue => {
              const sev = SEV[issue.severity] || SEV.low;
              const status = STATUS[issue.status] || STATUS.open;
              return (
                <div key={issue.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-1.5 w-20 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${sev.dot}`} />
                    <span className={`${sev.text} text-xs font-medium`}>{sev.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{issue.title}</div>
                    {issue.linkedPillars?.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {issue.linkedPillars.map((p, i) => (
                          <span key={i} className="bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full capitalize">{p.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>{status.label}</span>
                    <span className="text-xs text-gray-400 capitalize">{issue.raisedBy}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => setShowModal(true)} className="text-blue-500 text-sm font-medium hover:text-blue-600 flex items-center gap-1 mt-2">
            + Log Issue
          </button>
        </>
      )}

      {/* ══════ LOG ISSUE MODAL — WS3 ══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Log Issue or Blocker</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Issue Title *</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)}
                  placeholder="e.g. Historical job data quality"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)}
                  placeholder="Describe the issue and its impact..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Severity — segmented control */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Severity *</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  {[
                    { val: 'high', label: 'High', active: 'bg-red-500 text-white', inactive: 'bg-transparent text-gray-500 hover:bg-gray-50' },
                    { val: 'medium', label: 'Medium', active: 'bg-orange-400 text-white', inactive: 'bg-transparent text-gray-500 hover:bg-gray-50' },
                    { val: 'low', label: 'Low', active: 'bg-green-500 text-white', inactive: 'bg-transparent text-gray-500 hover:bg-gray-50' },
                  ].map(s => (
                    <button key={s.val} onClick={() => setFSeverity(s.val)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${fSeverity === s.val ? s.active : s.inactive}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Pillars */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Linked Pillars</label>
                <div className="grid grid-cols-2 gap-2">
                  {PILLAR_OPTIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={fPillars.includes(p)}
                        onChange={e => setFPillars(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Raised By */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Raised By</label>
                <div className="flex gap-4">
                  {['client', 'nouvia'].map(r => (
                    <label key={r} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="radio" name="raisedBy" checked={fRaisedBy === r}
                        onChange={() => setFRaisedBy(r)}
                        className="text-blue-500 focus:ring-blue-500" />
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
              <button onClick={handleSubmit} disabled={!canSubmit}
                className={`bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Log Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}
