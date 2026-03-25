import { useState, useEffect } from 'react';
import { subscribeToAuditLog, acknowledgeAuditEvent } from '../../../services/dsiService';

const EVENT_STYLES = {
  goal_deleted:   { icon: '🎯', border: 'border-l-red-500',    label: 'Goal Deleted' },
  issue_deleted:  { icon: '⚠️', border: 'border-l-orange-400', label: 'Issue Deleted' },
  idea_deleted:   { icon: '💡', border: 'border-l-gray-400',   label: 'Idea Deleted' },
  idea_declined:  { icon: '👎', border: 'border-l-orange-400', label: 'Idea Declined' },
  item_obsoleted: { icon: '🚫', border: 'border-l-red-500',    label: 'Item Obsoleted' },
  backlog_item_deleted: { icon: '🗑', border: 'border-l-gray-400', label: 'Backlog Item Deleted' },
};

function timeAgo(ts) {
  if (!ts?.seconds) return '';
  const diff = Math.floor((Date.now() / 1000) - ts.seconds);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = subscribeToAuditLog(setEvents);
    return () => unsub();
  }, []);

  const handleAck = async (id) => {
    await acknowledgeAuditEvent(id);
    setToast('Acknowledged');
    setTimeout(() => setToast(null), 2000);
  };

  const unacked = events.filter(e => !e.acknowledged);
  const acked = events.filter(e => e.acknowledged);
  const sorted = [...unacked, ...acked];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Client Activity</h3>
        {unacked.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unacked.length}</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-2 opacity-40">✓</div>
          <p className="text-gray-400 text-sm italic">No new client activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(event => {
            const style = EVENT_STYLES[event.type] || { icon: '📋', border: 'border-l-gray-300', label: event.type };
            const isAcked = event.acknowledged;
            return (
              <div key={event.id} className={`bg-white border border-gray-200 rounded-xl p-4 border-l-4 ${style.border} transition-opacity ${isAcked ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">Client</span>
                    <span className="text-xs font-medium text-gray-600">{style.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(event.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-800 mb-1">
                  {event.entityTitle || event.title || 'Unknown item'}
                </p>
                {event.reason && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 italic mb-2 border-l-2 border-gray-200">
                    "{event.reason}"
                  </div>
                )}
                {!isAcked && (
                  <div className="flex justify-end">
                    <button onClick={() => handleAck(event.id)} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                      Acknowledge
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  );
}
