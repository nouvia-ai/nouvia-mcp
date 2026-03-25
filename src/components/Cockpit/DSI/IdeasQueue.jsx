import { useState, useEffect } from 'react';
import { subscribeToIdeas, updateIVCIdeaStatus, quoteIVCIdea } from '../../../services/dsiService';

const STATUS_BADGE = {
  logged:       { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Logged' },
  submitted:    { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Logged' },
  under_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Under Review' },
  quoted:       { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Quoted' },
  approved:     { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  declined:     { bg: 'bg-red-100', text: 'text-red-600', label: 'Declined' },
  rejected:     { bg: 'bg-red-100', text: 'text-red-600', label: 'Declined' },
};

const SOURCE_BADGE = {
  client:    { bg: 'bg-blue-500', label: 'Client' },
  scor_gap:  { bg: 'bg-orange-400', label: 'SCOR Gap' },
  nouvia_ai: { bg: 'bg-green-500', label: 'Nouvia AI' },
};

const FILTERS = [
  { id: 'action', label: 'Action Required' },
  { id: 'all', label: 'All' },
  { id: 'logged', label: 'Logged' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'approved', label: 'Approved' },
  { id: 'declined', label: 'Declined' },
];

function QuoteForm({ idea, onSubmit, onCancel }) {
  const [effort, setEffort] = useState(idea.effortEstimate || '');
  const [timeline, setTimeline] = useState(idea.timelineEstimate || '');
  const [benHours, setBenHours] = useState(idea.benTimeHours || '');
  const [ncc, setNcc] = useState(idea.nccDependencies?.join(', ') || '');
  const [notes, setNotes] = useState(idea.quoteNotes || '');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-3 space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Effort estimate</label>
        <div className="flex gap-1">
          {['S', 'M', 'L', 'XL'].map(s => (
            <button key={s} onClick={() => setEffort(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${effort === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Timeline for client</label>
        <input value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g. 3–4 weeks"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="border-t border-amber-200 pt-3">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Admin only — never shown to IVC</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Ben hours (internal)</label>
            <input type="number" step="0.5" value={benHours} onChange={e => setBenHours(e.target.value)} placeholder="e.g. 8"
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">NCC dependencies</label>
            <input value={ncc} onChange={e => setNcc(e.target.value)} placeholder="e.g. NCC-015, NCC-008"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Response notes for IVC</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What IVC sees when they review"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="text-gray-500 text-sm font-medium">Cancel</button>
        <button onClick={() => onSubmit({
          effortEstimate: effort,
          timelineEstimate: timeline,
          benTimeHours: benHours ? parseFloat(benHours) : null,
          nccDependencies: ncc ? ncc.split(',').map(s => s.trim()).filter(Boolean) : [],
          quoteNotes: notes,
        })} disabled={!effort}
          className={`bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 ${!effort ? 'opacity-50 cursor-not-allowed' : ''}`}>
          Send Quote to Client →
        </button>
      </div>
    </div>
  );
}

export default function DSIIdeasQueue() {
  const [ideas, setIdeas] = useState([]);
  const [filter, setFilter] = useState('action');
  const [quoting, setQuoting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = subscribeToIdeas(setIdeas);
    return () => unsub();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = ideas.filter(idea => {
    if (filter === 'all') return true;
    if (filter === 'action') return ['logged', 'submitted', 'under_review'].includes(idea.status);
    if (filter === 'declined') return ['declined', 'rejected'].includes(idea.status);
    return idea.status === filter;
  });

  const handleMarkReview = async (id) => {
    await updateIVCIdeaStatus(id, 'under_review');
    showToast('Marked under review — IVC sees this status');
  };

  const handleQuoteSubmit = async (id, data) => {
    await quoteIVCIdea(id, data);
    setQuoting(null);
    showToast('Quote sent — IVC can now approve or decline');
  };

  const handleRevoke = async (id) => {
    await updateIVCIdeaStatus(id, 'under_review');
    showToast('Quote revoked — back to under review');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ideas Queue</h3>
        <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{ideas.length}</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No ideas match this filter</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(idea => {
            const status = STATUS_BADGE[idea.status] || STATUS_BADGE.logged;
            const source = SOURCE_BADGE[idea.source] || SOURCE_BADGE.client;
            return (
              <div key={idea.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`${status.bg} ${status.text} text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase`}>{status.label}</span>
                    <span className={`${source.bg} text-white text-[10px] font-medium px-1.5 py-0.5 rounded`}>{source.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{idea.createdAt?.seconds ? new Date(idea.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{idea.title}</p>
                {idea.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{idea.description}</p>}
                {idea.linkedPillars?.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {idea.linkedPillars.map((p, i) => <span key={i} className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded capitalize">{p.replace(/_/g, ' ')}</span>)}
                  </div>
                )}

                {/* Actions by status */}
                {(idea.status === 'logged' || idea.status === 'submitted') && (
                  <button onClick={() => handleMarkReview(idea.id)} className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Mark Under Review</button>
                )}
                {idea.status === 'under_review' && (
                  <button onClick={() => setQuoting(quoting === idea.id ? null : idea.id)} className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600">Quote This Idea</button>
                )}
                {idea.status === 'quoted' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-1 text-xs text-blue-700">
                      <span>Effort: {idea.effortEstimate || '—'}</span>
                      <span>·</span>
                      <span>Timeline: {idea.timelineEstimate || '—'}</span>
                    </div>
                    {idea.quoteNotes && <p className="text-xs text-blue-600 mb-2">{idea.quoteNotes}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => setQuoting(idea.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Revise Quote</button>
                      <button onClick={() => handleRevoke(idea.id)} className="text-xs text-gray-400 hover:text-gray-600">Revoke</button>
                    </div>
                  </div>
                )}
                {idea.status === 'approved' && (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded mt-1">✓ Approved by client</span>
                )}
                {(idea.status === 'declined' || idea.status === 'rejected') && idea.reason && (
                  <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600 mt-2">Decline reason: {idea.reason}</div>
                )}

                {/* Quote form */}
                {quoting === idea.id && <QuoteForm idea={idea} onSubmit={(data) => handleQuoteSubmit(idea.id, data)} onCancel={() => setQuoting(null)} />}
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  );
}
