import { useState, useEffect } from 'react';
import { getIdeas, addIdea, updateIdeaStatus, addBacklogItem, deleteIdea, addIdeaNote } from '../../services/clientCockpit';

const SOURCE_BADGE = {
  client: { bg: 'bg-blue-500', label: 'Client' },
  nouvia_ai: { bg: 'bg-green-500', label: 'Nouvia AI' },
  scor_gap: { bg: 'bg-orange-400', label: 'SCOR Gap' },
};

const STATUS_BADGE = {
  logged: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Logged' },
  submitted: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Logged' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Under Review' },
  quoted: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Quoted' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  declined: { bg: 'bg-red-100', text: 'text-red-600', label: 'Declined' },
};

const PILLAR_OPTIONS = ['Engineering & Design', 'Estimation & Quoting', 'Procurement & Sourcing', 'Production Planning', 'Quality & Compliance', 'Delivery & Logistics'];

function Toast({ message, color = 'bg-green-500' }) {
  return <div className={`fixed bottom-4 right-4 ${color} text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse`}>{message}</div>;
}

/* ── Idea Detail Panel ── */
function IdeaDetailPanel({ idea, onClose, onAction, onNoteAdded }) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const source = SOURCE_BADGE[idea.source] || SOURCE_BADGE.client;
  const status = STATUS_BADGE[idea.status] || STATUS_BADGE.logged;
  const notes = idea.notes || [];

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    await addIdeaNote(idea.id, noteText.trim());
    setNoteText(''); setSaving(false);
    onNoteAdded(idea.id, { text: noteText.trim(), addedBy: 'client', timestamp: new Date().toISOString() });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          <div className="flex items-center gap-2 mb-2">
            <span className={`${source.bg} text-white text-xs px-2 py-0.5 rounded-full`}>{source.label}</span>
            <span className={`${status.bg} ${status.text} text-xs font-medium px-2 py-0.5 rounded-full`}>{status.label}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 pr-8">{idea.title}</h2>
          {idea.aiGenerated && <span className="text-xs text-purple-500 mt-1 block">AI Generated</span>}
        </div>

        <div className="p-4 space-y-5 flex-1">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{idea.description || <span className="italic text-gray-400">No description provided</span>}</div>
          </div>

          {idea.linkedPillars?.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Linked Pillars</div>
              <div className="flex flex-wrap gap-1">{idea.linkedPillars.map((p, i) => <span key={i} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full capitalize">{p.replace(/_/g, ' ')}</span>)}</div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</div>
            {notes.length > 0 && (
              <div className="space-y-2 mb-3">{notes.map((n, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-700">{n.text}</div>
                  <div className="text-xs text-gray-400 mt-1">{n.addedBy} · {new Date(n.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              ))}</div>
            )}
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex justify-end mt-2">
              <button onClick={handleSaveNote} disabled={!noteText.trim() || saving}
                className={`bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-600 ${!noteText.trim() || saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-100 p-4 space-y-2">
          {(idea.status === 'logged' || idea.status === 'submitted') && (
            <button onClick={() => { onAction('review', idea); onClose(); }} className="bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 w-full">Request Review</button>
          )}
          {idea.status === 'under_review' && (
            <button disabled className="bg-gray-200 text-gray-500 text-sm font-medium px-4 py-2 rounded-lg w-full cursor-not-allowed">Waiting for Nouvia</button>
          )}
          {idea.status === 'quoted' && (
            <>
              <button onClick={() => { onAction('approve', idea); onClose(); }} className="bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 w-full">Approve → Backlog</button>
              {!showDecline ? (
                <button onClick={() => setShowDecline(true)} className="border border-red-300 text-red-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 w-full">Decline</button>
              ) : (
                <div className="space-y-2">
                  <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="Reason for declining (optional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button onClick={() => { onAction('decline', idea, declineReason); onClose(); }} className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-600 w-full">Confirm Decline</button>
                </div>
              )}
            </>
          )}

          {/* Delete — all statuses */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="text-red-400 text-sm hover:text-red-600 w-full text-center">Delete Idea</button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">This permanently removes the idea.</p>
                <input value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Reason (optional)"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <button onClick={() => { onAction('delete', idea, deleteReason); onClose(); }} className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 w-full">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main Export ── */
export default function IdeasQueue({ clientId }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailIdea, setDetailIdea] = useState(null);
  const [toast, setToast] = useState(null);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPillars, setFPillars] = useState([]);

  const loadIdeas = () => {
    setLoading(true);
    getIdeas(clientId, null).then(i => { setIdeas(i); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadIdeas(); }, [clientId]);
  const showToastMsg = (msg, color = 'bg-green-500') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  const resetForm = () => { setFTitle(''); setFDesc(''); setFPillars([]); };

  const handleSubmit = async () => {
    if (!fTitle.trim()) return;
    await addIdea(clientId, { title: fTitle.trim(), description: fDesc.trim(), linkedPillars: fPillars, source: 'client', status: 'logged', aiGenerated: false });
    setShowModal(false); resetForm(); loadIdeas();
    showToastMsg('Idea submitted');
  };

  const handleAction = async (action, idea, reason) => {
    if (action === 'review') {
      await updateIdeaStatus(idea.id, 'under_review');
      showToastMsg('Sent for review');
    } else if (action === 'approve') {
      await updateIdeaStatus(idea.id, 'approved');
      await addBacklogItem(clientId, {
        title: idea.title, description: idea.description || '',
        stage: 'idea', linkedPillar: idea.linkedPillars?.[0] || 'engineering',
        estimatedEffort: 'M', priority: 99,
      });
      showToastMsg('Added to backlog');
    } else if (action === 'decline') {
      await updateIdeaStatus(idea.id, 'declined');
      showToastMsg('Idea declined', 'bg-red-500');
    } else if (action === 'delete') {
      await deleteIdea(idea.id, 'client', reason || '');
      showToastMsg('Idea deleted', 'bg-red-500');
    }
    loadIdeas();
  };

  const handleNoteAdded = (ideaId, note) => {
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, notes: [...(i.notes || []), note] } : i));
    if (detailIdea?.id === ideaId) setDetailIdea(prev => ({ ...prev, notes: [...(prev.notes || []), note] }));
  };

  if (loading) return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Ideas & Suggestions</h2>
      <div className="animate-pulse bg-gray-200 rounded-xl h-24 w-full" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Ideas & Suggestions</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">Submit Idea</button>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="text-3xl">💡</div>
          <p className="text-gray-400 text-sm">No ideas submitted yet</p>
          <button onClick={() => setShowModal(true)} className="text-blue-500 text-sm font-medium">Submit Idea</button>
        </div>
      ) : (
        ideas.map(idea => {
          const source = SOURCE_BADGE[idea.source] || SOURCE_BADGE.client;
          const status = STATUS_BADGE[idea.status] || STATUS_BADGE.logged;
          return (
            <div key={idea.id} className="bg-gray-100 rounded-xl p-3 space-y-2 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetailIdea(idea)}>
              <div className="flex justify-between items-start">
                <span className={`${source.bg} text-white text-xs px-2 py-0.5 rounded-full`}>{source.label}</span>
                <span className={`${status.bg} ${status.text} text-xs font-medium px-2 py-0.5 rounded-full`}>{status.label}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{idea.title}</p>
              {idea.description && <p className="text-xs text-gray-500 line-clamp-2">{idea.description}</p>}
              {idea.linkedPillars?.length > 0 && (
                <div className="flex flex-wrap gap-1">{idea.linkedPillars.map((p, i) => <span key={i} className="bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full capitalize">{p.replace(/_/g, ' ')}</span>)}</div>
              )}
              {/* Minimal card action */}
              <div className="flex gap-2 pt-1">
                {(idea.status === 'logged' || idea.status === 'submitted') && (
                  <button onClick={e => { e.stopPropagation(); handleAction('review', idea); }} className="text-blue-500 text-xs font-medium hover:text-blue-600">Request Review</button>
                )}
                {idea.status === 'under_review' && (
                  <span className="text-gray-400 text-xs py-1">Waiting for Nouvia</span>
                )}
                {idea.status === 'quoted' && (
                  <button onClick={e => { e.stopPropagation(); handleAction('approve', idea); }} className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-lg hover:bg-blue-600">Approve → Backlog</button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Detail Panel */}
      {detailIdea && <IdeaDetailPanel idea={detailIdea} onClose={() => setDetailIdea(null)} onAction={handleAction} onNoteAdded={handleNoteAdded} />}

      {/* Submit Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Submit an Idea</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Idea Title *</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Automated RFQ Generation"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Describe the idea and why it matters..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Linked SCOR Pillars</label>
                <div className="grid grid-cols-2 gap-2">
                  {PILLAR_OPTIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={fPillars.includes(p)} onChange={e => setFPillars(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))} className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />{p}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
              <button onClick={handleSubmit} disabled={!fTitle.trim()}
                className={`bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 ${!fTitle.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>Submit Idea</button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.msg} color={toast.color} />}
    </div>
  );
}
