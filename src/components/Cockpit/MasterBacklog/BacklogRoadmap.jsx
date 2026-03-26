const STREAM_COLORS = {
  build:     { bg: 'bg-purple-100', text: 'text-purple-700' },
  deliver:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  sales:     { bg: 'bg-green-100',  text: 'text-green-700' },
  marketing: { bg: 'bg-teal-100',   text: 'text-teal-700' },
  operate:   { bg: 'bg-amber-100',  text: 'text-amber-700' },
  manual:    { bg: 'bg-gray-100',   text: 'text-gray-600' },
};

function getMonday(d) {
  const dt = new Date(d); dt.setHours(0,0,0,0);
  const day = dt.getDay(); const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(dt.setDate(diff));
}

function getWeeks(count = 8) {
  const weeks = [];
  const today = getMonday(new Date());
  for (let i = 0; i < count; i++) {
    const w = new Date(today); w.setDate(w.getDate() + i * 7);
    weeks.push(w);
  }
  return weeks;
}

function weekKey(d) { return d.toISOString().split('T')[0]; }

function itemToWeekKey(item) {
  if (item.targetWeek) {
    const d = typeof item.targetWeek === 'string' ? new Date(item.targetWeek) : item.targetWeek.seconds ? new Date(item.targetWeek.seconds * 1000) : new Date(item.targetWeek);
    return weekKey(getMonday(d));
  }
  if (item.dueDate) {
    const d = typeof item.dueDate === 'string' ? new Date(item.dueDate) : item.dueDate.seconds ? new Date(item.dueDate.seconds * 1000) : new Date(item.dueDate);
    return weekKey(getMonday(d));
  }
  return null;
}

export default function BacklogRoadmap({ items }) {
  const weeks = getWeeks(8);
  const todayWeek = weekKey(getMonday(new Date()));
  const streams = ['build', 'deliver', 'sales', 'marketing', 'operate'];
  const labels = { build: '🏗 Build', deliver: '📦 Deliver', sales: '🌱 Sales', marketing: '📣 Marketing', operate: '🧠 Operate' };

  // Map items to weeks
  const allItems = Object.values(items).flat().filter(i => i.status !== 'done');

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Week headers */}
        <div className="flex">
          <div className="w-32 flex-shrink-0" />
          {weeks.map((w, i) => {
            const key = weekKey(w);
            const isThisWeek = key === todayWeek;
            return (
              <div key={key} className={`flex-1 text-center text-xs font-medium py-2 border-b border-gray-200 ${isThisWeek ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-400'}`}>
                {i === 0 ? 'This week' : i === 1 ? 'Next week' : w.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            );
          })}
        </div>

        {/* Stream rows */}
        {streams.map(stream => {
          const streamItems = allItems.filter(i => i.stream === stream);
          const colors = STREAM_COLORS[stream] || STREAM_COLORS.manual;
          return (
            <div key={stream} className="flex border-b border-gray-100">
              <div className="w-32 flex-shrink-0 flex items-center justify-end pr-3 py-2 border-r border-gray-200">
                <span className="text-xs font-medium text-gray-500">{labels[stream]}</span>
              </div>
              {weeks.map(w => {
                const key = weekKey(w);
                const isThisWeek = key === todayWeek;
                const weekItems = streamItems.filter(i => {
                  const iKey = itemToWeekKey(i);
                  if (iKey === key) return true;
                  if (!iKey && i.status === 'this_week' && key === todayWeek) return true;
                  if (!iKey && i.status === 'next_week' && weeks[1] && key === weekKey(weeks[1])) return true;
                  return false;
                });
                return (
                  <div key={key} className={`flex-1 p-1 min-h-[40px] ${isThisWeek ? 'bg-purple-50/30' : ''}`}>
                    {weekItems.slice(0, 2).map(item => (
                      <div key={item.uid} className={`${colors.bg} ${colors.text} text-[10px] font-medium rounded px-1.5 py-0.5 mb-0.5 truncate`} title={item.title}>
                        {item.title}
                      </div>
                    ))}
                    {weekItems.length > 2 && (
                      <div className="bg-gray-100 text-gray-500 text-[10px] rounded px-1.5 py-0.5 text-center">+{weekItems.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Total effort row */}
        <div className="flex border-t border-gray-200">
          <div className="w-32 flex-shrink-0 flex items-center justify-end pr-3 py-2 border-r border-gray-200">
            <span className="text-xs font-medium text-gray-400">Total effort</span>
          </div>
          {weeks.map(w => {
            const key = weekKey(w);
            const weekItems = allItems.filter(i => {
              const iKey = itemToWeekKey(i);
              if (iKey === key) return true;
              if (!iKey && i.status === 'this_week' && key === todayWeek) return true;
              return false;
            });
            const total = weekItems.reduce((s, i) => s + (i.effortHours || 0), 0);
            const color = total === 0 ? 'text-gray-300' : total < 10 ? 'text-green-600' : total <= 20 ? 'text-amber-600' : 'text-red-600';
            return (
              <div key={key} className="flex-1 text-center py-2">
                <span className={`text-xs font-semibold ${color}`}>{total > 0 ? `${total}h` : '—'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
