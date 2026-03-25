import { useState, useEffect } from 'react';
import { getGoals, addGoal } from '../../services/clientCockpit';

const PILLAR_OPTIONS = [
  'Engineering & Design', 'Estimation & Quoting', 'Procurement & Sourcing',
  'Production Planning', 'Quality & Compliance', 'Delivery & Logistics',
];
const OWNER_OPTIONS = ['CFO', 'COO', 'CEO', 'CTO', 'VP Engineering', 'VP Operations', 'Other'];

export default function BusinessObjectives({ clientId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showTooltip, setShowTooltip] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formMetric, setFormMetric] = useState('');
  const [formFactorInput, setFormFactorInput] = useState('');
  const [formFactors, setFormFactors] = useState([]);
  const [formPillars, setFormPillars] = useState([]);

  useEffect(() => {
    const handleClickOutside = () => setShowTooltip(null);
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTooltip]);

  const loadGoals = () => {
    setLoading(true);
    getGoals(clientId).then(g => { setGoals(g); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadGoals(); }, [clientId]);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setFormTitle(''); setFormOwner(''); setFormMetric('');
    setFormFactorInput(''); setFormFactors([]); setFormPillars([]);
  };

  const handleAddFactor = () => {
    if (formFactorInput.trim()) {
      setFormFactors(prev => [...prev, formFactorInput.trim()]);
      setFormFactorInput('');
    }
  };

  const handleSubmitObjective = async () => {
    if (!formTitle.trim() || !formOwner || !formMetric.trim()) return;
    await addGoal(clientId, {
      title: formTitle.trim(),
      owner: formOwner, ownerName: formOwner,
      targetMetric: formMetric.trim(),
      contributingFactors: formFactors,
      linkedPillars: formPillars,
      enablementProgress: 0, outcomeProgress: 0, status: 'active',
    });
    setShowAddModal(false);
    resetForm();
    loadGoals();
    showToastMsg('Objective added');
  };

  const canSubmit = formTitle.trim() && formOwner && formMetric.trim();

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Objectives</h2>
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-200 rounded-xl h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Business Objectives
        <span className="text-xs text-gray-400 font-normal ml-2">
          Owned by client — Nouvia tracks AI enablement only
        </span>
      </h2>

      {goals.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-gray-400 text-sm">No objectives defined yet</p>
          <button onClick={() => setShowAddModal(true)} className="text-blue-500 text-sm font-medium">Add Objective</button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {goals.map(goal => (
              <div key={goal.id} className="bg-gray-100 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <span className="text-base font-semibold text-gray-900">{goal.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {goal.ownerName || goal.owner}
                    </span>
                    {/* ⓘ Tooltip — WS1 legal language */}
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowTooltip(showTooltip === goal.id ? null : goal.id); }}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium border border-gray-300"
                        aria-label="About these metrics"
                      >
                        ⓘ
                      </button>
                      {showTooltip === goal.id && (
                        <div className="absolute right-0 top-6 z-50 w-80 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl leading-relaxed">
                          <p className="font-semibold text-white mb-2">About These Metrics</p>
                          <p className="text-gray-300 mb-3">
                            <span className="text-white font-medium">AI Enablement</span>{' '}
                            tracks capabilities delivered by Nouvia under the agreed Statement of Work. This is Nouvia's area of accountability.
                          </p>
                          <p className="text-gray-300 mb-3">
                            <span className="text-white font-medium">Business Outcome</span>{' '}
                            tracks progress toward your stated business goal. Achieving this objective depends on multiple factors including platform adoption, internal process changes, data quality, and market conditions — many of which are outside Nouvia's control.
                          </p>
                          <p className="text-gray-400 text-[10px] border-t border-gray-700 pt-3 mt-1">
                            Nouvia is responsible for AI capability delivery as defined in the SOW. Business outcomes are tracked for alignment purposes only and do not constitute a guarantee or commitment by Nouvia.
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(null); }}
                            className="mt-3 text-gray-400 hover:text-white text-xs flex items-center gap-1"
                          >
                            Close ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target metric */}
                <p className="text-sm text-gray-500">{goal.targetMetric}</p>

                {/* Progress bars */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">AI Enablement</span>
                      <span className="text-blue-500 font-semibold">{goal.enablementProgress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${goal.enablementProgress || 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Business Outcome</span>
                      <span className="text-green-500 font-semibold">{goal.outcomeProgress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${goal.outcomeProgress || 0}%` }} />
                    </div>
                  </div>
                </div>

                {/* Contributing Factors */}
                {goal.contributingFactors?.length > 0 && (
                  <div>
                    <button onClick={() => setExpanded(prev => ({ ...prev, [goal.id]: !prev[goal.id] }))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1">
                      Contributing Factors
                      <svg className={`w-3 h-3 transition-transform ${expanded[goal.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {expanded[goal.id] && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {goal.contributingFactors.map((f, i) => (
                          <span key={i} className="bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setShowAddModal(true)} className="text-blue-500 text-sm font-medium hover:text-blue-600 flex items-center gap-1 mt-2">
            + Add Objective
          </button>
        </>
      )}

      {/* ══════ ADD OBJECTIVE MODAL — WS2 ══════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Business Objective</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Objective Title *</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Reduce delivery cycle from 12 to 8 weeks"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Owner */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Owner *</label>
                <select value={formOwner} onChange={e => setFormOwner(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select owner...</option>
                  {OWNER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Target Metric */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Target Metric *</label>
                <input value={formMetric} onChange={e => setFormMetric(e.target.value)}
                  placeholder="e.g. Delivery cycle: 12 weeks → 8 weeks"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Contributing Factors */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Contributing Factors</label>
                <div className="flex gap-2">
                  <input value={formFactorInput} onChange={e => setFormFactorInput(e.target.value)}
                    placeholder="e.g. Data cleanliness"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFactor(); } }} />
                  <button onClick={handleAddFactor} className="bg-gray-100 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-200">Add</button>
                </div>
                {formFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formFactors.map((f, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        {f}
                        <button onClick={() => setFormFactors(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-gray-600">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Pillars */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Linked SCOR Pillars</label>
                <div className="grid grid-cols-2 gap-2">
                  {PILLAR_OPTIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={formPillars.includes(p)}
                        onChange={e => setFormPillars(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
              <button onClick={handleSubmitObjective} disabled={!canSubmit}
                className={`bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Add Objective
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
