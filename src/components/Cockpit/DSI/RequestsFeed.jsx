import { useState, useEffect } from 'react';
import { subscribeToRequests, acknowledgeRequest, dismissRequest } from '../../../services/dsiService';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'change', label: 'Change Requests' },
  { id: 'pause', label: 'Pause Requests' },
];

export default function RequestsFeed() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [confirmDismiss, setConfirmDismiss] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = subscribeToRequests(setRequests);
    return () => unsub();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = requests.filter(r => {
    if (filter === 'all') return true;
    return r.type === filter;
  });

  const pending = filtered.filter(r => r.stage === 'idea' && !r.acknowledgedByNouvia && !r.dismissedByNouvia);
  const acknowledged = filtered.filter(r => r.acknowledgedByNouvia);

  const handleAck = async (id) => {
    await acknowledgeRequest(id);
    showToast('Request acknowledged');
  };

  const handleDismiss = async (id) => {
    await dismissRequest(id);
    setConfirmDismiss(null);
    showToast('Request dismissed');
  };

  function timeAgo(ts) {
    if (!ts?.seconds) return '';
    const diff = Math.floor((Date.now() / 1000) - ts.seconds);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Client Requests</h3>
        {pending.length > 0 && (
          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
        )}
      </div>

      <div className="flex gap-1 mb-4">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {pending.length === 0 && acknowledged.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm italic">No pending requests from IVC</div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map(req => (
                <div key={req.id} className={`bg-white border border-gray-200 rounded-xl p-4 border-l-4 ${req.type === 'change' ? 'border-l-amber-400' : 'border-l-blue-400'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${req.type === 'change' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {req.type === 'change' ? 'Change Request' : 'Pause Request'}
                      </span>
                      <span className="text-[10px] text-gray-400">pending</span>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{req.title}</p>
                  {req.description && <p className="text-xs text-gray-500 mb-2">{req.description}</p>}
                  {req.linkedOriginalId && (
                    <p className="text-xs text-gray-400 mb-3">Original item: {req.linkedOriginalId}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleAck(req.id)} className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600">Acknowledge →</button>
                    <button onClick={() => setConfirmDismiss(req.id)} className="text-xs font-medium text-gray-400 hover:text-red-500">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {acknowledged.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Acknowledged</p>
              <div className="space-y-2">
                {acknowledged.map(req => (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-3 opacity-50">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${req.type === 'change' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {req.type === 'change' ? 'Change' : 'Pause'}
                      </span>
                      <span className="text-sm text-gray-600">{req.title}</span>
                      <span className="text-[10px] text-green-600 ml-auto">✓ Acknowledged</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dismiss confirmation */}
      {confirmDismiss && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setConfirmDismiss(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dismiss Request?</h3>
            <p className="text-sm text-gray-500 mb-4">Are you sure? IVC will see this as dismissed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDismiss(null)} className="text-gray-500 text-sm font-medium">Cancel</button>
              <button onClick={() => handleDismiss(confirmDismiss)} className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-600">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  );
}
