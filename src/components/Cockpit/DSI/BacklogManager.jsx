import { useState, useEffect } from 'react';
import { subscribeToBacklog, updateIVCBacklogItem } from '../../../services/dsiService';

const STAGE_BADGE = {
  idea:        { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Idea' },
  approved:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Approved' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  done:        { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
  managed:     { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Managed' },
  obsolete:    { bg: 'bg-red-100', text: 'text-red-600', label: 'Obsolete' },
};

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'done', label: 'Done' },
  { id: 'obsolete', label: 'Obsolete' },
];

function AdminPanel({ item, onClose, onSave }) {
  const [benHours, setBenHours] = useState(item.benTimeHours || '');
  const [ncc, setNcc] = useState(item.nccDependencies?.join(', ') || '');
  const [notes, setNotes] = useState(item.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateIVCBacklogItem(item.id, {
      benTimeHours: benHours ? parseFloat(benHours) : null,
      nccDependencies: ncc ? ncc.split(',').map(s => s.trim()).filter(Boolean) : [],
      adminNotes: notes,
    });
    setSaving(false);
    onSave();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Admin Fields</div>
          <h3 className="text-lg font-semibold text-gray-900 mt-1 pr-8">{item.title}</h3>
          <p className="text-xs text-gray-400 mt-1">These fields are never visible to IVC</p>
        </div>
        <div className="p-4 space-y-4 flex-1">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Ben Time (hours)</label>
            <input type="number" step="0.5" value={benHours} onChange={e => setBenHours(e.target.value)}
              placeholder="Your actual hours" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-[10px] text-gray-400 mt-1">Never shown to IVC</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">NCC Dependencies</label>
            <input value={ncc} onChange={e => setNcc(e.target.value)} placeholder="e.g. NCC-015, NCC-008"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Admin Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes — never shown to IVC"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="border-t border-gray-100 p-4">
          <button onClick={handleSave} disabled={saving}
            className={`w-full bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 ${saving ? 'opacity-50' : ''}`}>
            {saving ? 'Saving...' : 'Save Admin Fields'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function BacklogManager() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('active');
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = subscribeToBacklog(setItems);
    return () => unsub();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['in_progress', 'approved'].includes(item.stage);
    if (filter === 'backlog') return ['idea'].includes(item.stage);
    if (filter === 'done') return ['done', 'managed'].includes(item.stage);
    return item.stage === filter;
  });

  const activeItems = items.filter(i => ['in_progress', 'approved'].includes(i.stage));
  const totalBenHours = activeItems.reduce((s, i) => s + (i.benTimeHours || 0), 0);
  const hoursColor = totalBenHours < 20 ? 'text-green-600' : totalBenHours <= 25 ? 'text-amber-600' : 'text-red-600';

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Backlog Manager</h3>

      {/* Capacity bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-6 flex-wrap">
        <span className="text-sm text-gray-600">Total Active: <span className="font-semibold">{activeItems.length}</span> items</span>
        <span className={`text-sm font-semibold ${hoursColor}`}>{totalBenHours}h committed</span>
        {totalBenHours > 25 && <span className="text-xs text-red-600 font-medium">⚠ Over 25h target</span>}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Pillar</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Effort</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-amber-600 uppercase">
                <span className="bg-amber-100 text-amber-700 text-[9px] px-1 py-0.5 rounded mr-1">Admin</span>
                Ben hrs
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">NCC</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const stage = STAGE_BADGE[item.stage] || STAGE_BADGE.idea;
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{item.title}</td>
                  <td className="px-3 py-3"><span className={`${stage.bg} ${stage.text} text-[10px] font-semibold px-1.5 py-0.5 rounded`}>{stage.label}</span></td>
                  <td className="px-3 py-3 text-xs text-gray-500 capitalize">{(item.linkedPillar || '').replace(/_/g, ' ')}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{item.estimatedEffort || '—'}</td>
                  <td className="px-3 py-3 text-xs font-medium text-amber-700">{item.benTimeHours || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">{item.nccDependencies?.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditItem(item)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit Admin Fields</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No items match this filter</div>}
      </div>

      {editItem && <AdminPanel item={editItem} onClose={() => setEditItem(null)} onSave={() => { setEditItem(null); showToast('Admin fields saved'); }} />}
      {toast && <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  );
}
