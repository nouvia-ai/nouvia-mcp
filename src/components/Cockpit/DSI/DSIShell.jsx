import { useState, useEffect } from 'react';
import { getAuditLogUnread, subscribeToRequests } from '../../../services/dsiService';
import ActivityFeed from './ActivityFeed';
import DSIIdeasQueue from './IdeasQueue';
import BacklogManager from './BacklogManager';
import PillarManager from './PillarManager';
import RequestsFeed from './RequestsFeed';
import HealthPlaceholder from './HealthPlaceholder';

const TABS = [
  { id: 'activity', label: 'Activity Feed' },
  { id: 'ideas',    label: 'Ideas Queue' },
  { id: 'backlog',  label: 'Backlog' },
  { id: 'pillars',  label: 'Pillars' },
  { id: 'requests', label: 'Requests' },
  { id: 'health',   label: 'Health' },
];

export default function DSIShell({ onUnreadCount }) {
  const [activeTab, setActiveTab] = useState('activity');
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    getAuditLogUnread().then(items => {
      setUnreadCount(items.length);
      onUnreadCount?.(items.length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = subscribeToRequests(requests => {
      const pending = requests.filter(r => r.stage === 'idea' && !r.acknowledgedByNouvia && !r.dismissedByNouvia);
      setRequestCount(pending.length);
    });
    return () => unsub();
  }, []);

  return (
    <div>
      {/* Sub-navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 pb-px overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.id === 'activity' && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount}</span>
            )}
            {tab.id === 'requests' && requestCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{requestCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'activity' && <ActivityFeed />}
      {activeTab === 'ideas'    && <DSIIdeasQueue />}
      {activeTab === 'backlog'  && <BacklogManager />}
      {activeTab === 'pillars'  && <PillarManager />}
      {activeTab === 'requests' && <RequestsFeed />}
      {activeTab === 'health'   && <HealthPlaceholder />}
    </div>
  );
}
