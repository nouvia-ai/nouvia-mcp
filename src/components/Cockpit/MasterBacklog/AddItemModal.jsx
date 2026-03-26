import { useState } from 'react';

const STREAMS = [
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
  { id: 'operate', label: 'Operate' },
  { id: 'manual', label: 'Manual' },
];

const STREAM_NOTES = {
  build: 'Saves to Architecture tracker',
  deliver: 'Saves to IVC backlog queue',
  sales: 'Saves to Nouvia client pipeline',
  marketing: 'Saves to marketing tasks',
  operate: 'Saves to priority queue',
  manual: 'Saved locally — no source system',
};

const CLIENTS = ['None', 'IVC', 'Hockey Prospect'];

export default function AddItemModal({ defaultStream = 'manual', onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [stream, setStream] = useState(defaultStream);
  const [when, setWhen] = useState('this_week');
  const [client, setClient] = useState(defaultStream === 'deliver' ? 'IVC' : 'None');
  const [effort, setEffort] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      stream,
      status: when,
      effortHours: effort ? parseFloat(effort) : null,
      client: client === 'None' ? null : client,
      priority: when === 'this_week' ? 1 : when === 'next_week' ? 2 : 3,
      dueDate: dueDate || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          <h3 className="text-lg font-semibold text-gray-900">Add Item</h3>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" autoFocus />
          </div>

          {/* Stream */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Stream</label>
            <div className="flex flex-wrap gap-1">
              {STREAMS.map(s => (
                <button key={s.id} onClick={() => setStream(s.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${stream === s.id ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 italic mt-1">{STREAM_NOTES[stream]}</p>
          </div>

          {/* When */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">When</label>
            <select value={when} onChange={e => setWhen(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="this_week">This Week</option>
              <option value="next_week">Next Week</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Client</label>
            <select value={client} onChange={e => setClient(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Effort */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Effort hours</label>
            <input type="number" step="0.5" value={effort} onChange={e => setEffort(e.target.value)} placeholder="Optional"
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional context" rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        <div className="border-t border-gray-100 p-4">
          <button onClick={handleSave} disabled={!title.trim()}
            className={`w-full bg-purple-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-purple-700 ${!title.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
            Add to {stream === 'marketing' ? 'Marketing' : stream === 'sales' ? 'Sales' : stream === 'operate' ? 'Operate' : 'Backlog'}
          </button>
        </div>
      </div>
    </>
  );
}
