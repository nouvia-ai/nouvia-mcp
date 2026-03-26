import { useState, useEffect, useRef } from 'react';

const SOURCE_CHIPS = {
  architecture:    { bg: 'bg-purple-100', text: 'text-purple-600', label: 'arch' },
  ivc_backlog:     { bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'IVC' },
  priority_queue:  { bg: 'bg-amber-100',  text: 'text-amber-600',  label: 'pq' },
  experiments:     { bg: 'bg-orange-100', text: 'text-orange-600', label: 'exp' },
  weekly_todos:    { bg: 'bg-green-100',  text: 'text-green-600',  label: 'todo' },
  client_backlog:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'sales' },
  marketing_tasks: { bg: 'bg-teal-100',   text: 'text-teal-700',   label: 'mkt' },
};

const STATUS_DOTS = {
  this_week: 'bg-amber-400',
  next_week: 'bg-blue-400',
  backlog:   'bg-gray-300',
  done:      'bg-green-500',
};

const DELETEABLE = ['marketing_tasks', 'master_backlog', 'priority_queue'];

function getDueDateInfo(dueDate) {
  if (!dueDate) return null;
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate.seconds ? new Date(dueDate.seconds * 1000) : new Date(dueDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((d - today) / 86400000);
  if (diff < 0) return { label: 'Overdue', cls: 'text-red-500 font-medium' };
  if (diff === 0) return { label: 'Today', cls: 'text-amber-600 font-medium' };
  if (diff <= 3) return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'text-amber-500' };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'text-gray-400' };
}

export default function BacklogItemCard({ item, onStatusChange, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const source = SOURCE_CHIPS[item.source];
  const statusDot = STATUS_DOTS[item.status] || 'bg-gray-300';
  const isDone = item.status === 'done';
  const due = getDueDateInfo(item.dueDate);
  const canDelete = DELETEABLE.includes(item.source);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all relative ${isDone ? 'opacity-50' : ''}`}>
      {/* Row 1: dot + chips + effort */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${statusDot} ${item.status === 'this_week' ? 'animate-pulse' : ''}`} />
        {item.client && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.client === 'IVC' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>{item.client}</span>
        )}
        {source && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${source.bg} ${source.text}`}>{source.label}</span>
        )}
        <span className="flex-1" />
        {item.effortHours > 0 && (
          <span className="bg-gray-100 text-gray-600 text-[10px] font-medium rounded px-1.5 py-0.5">{item.effortHours}h</span>
        )}
      </div>

      {/* Title */}
      <p className={`text-sm font-medium text-gray-900 line-clamp-2 mb-1.5 ${isDone ? 'line-through' : ''}`}>{item.title}</p>

      {/* Row 3: section + due + menu */}
      <div className="flex items-center justify-between">
        {item.sourceSection && (
          <span className="text-[10px] text-gray-400 italic truncate max-w-[150px]">{item.sourceSection}</span>
        )}
        <span className="flex-1" />
        {due && <span className={`text-[10px] mr-2 ${due.cls}`}>{due.label}</span>}

        {/* Overflow menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="text-gray-300 hover:text-gray-500 text-sm px-1">···</button>
          {showMenu && (
            <div className="absolute right-0 top-5 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-44">
              {['this_week', 'next_week', 'backlog'].filter(s => s !== item.status).map(s => (
                <button key={s} onClick={() => { onStatusChange(item, s); setShowMenu(false); }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                  Move to {s === 'this_week' ? 'This Week' : s === 'next_week' ? 'Next Week' : 'Backlog'}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { onStatusChange(item, 'done'); setShowMenu(false); }}
                className="block w-full text-left px-3 py-1.5 text-xs text-green-600 hover:bg-green-50">
                Mark Done ✓
              </button>
              {canDelete && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={() => { onDelete(item); setShowMenu(false); }}
                    className="block w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                </>
              )}
              {!canDelete && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <span className="block px-3 py-1.5 text-[10px] text-gray-400 italic">Managed by source</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
