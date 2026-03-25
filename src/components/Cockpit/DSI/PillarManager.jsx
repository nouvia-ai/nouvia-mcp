import { useState, useEffect } from 'react';
import { subscribeToPillars, updateIVCPillarProgress } from '../../../services/dsiService';

const STATUS_OPTIONS = ['active', 'next', 'staged', 'complete'];

function DonutRing({ progress, size = 80, strokeWidth = 8 }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  const color = progress >= 70 ? '#10B981' : progress >= 40 ? '#F59E0B' : progress > 0 ? '#3B82F6' : '#D1D5DB';
  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        className="text-lg font-semibold" fill="#1F2937">{progress}%</text>
    </svg>
  );
}

function PillarCard({ pillar, onSave }) {
  const [progress, setProgress] = useState(pillar.enablementProgress || 0);
  const [caps, setCaps] = useState(pillar.activeCapabilities || []);
  const [newCap, setNewCap] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAddCap = () => {
    if (newCap.trim() && !caps.includes(newCap.trim())) {
      setCaps(prev => [...prev, newCap.trim()]);
      setNewCap('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateIVCPillarProgress(pillar.id, progress, caps);
    setSaving(false);
    setToast(`${pillar.label} updated — changes live in IVC cockpit`);
    setTimeout(() => setToast(null), 3000);
    onSave?.();
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    next: 'bg-blue-100 text-blue-600',
    staged: 'bg-gray-100 text-gray-500',
    complete: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-medium text-gray-900">{pillar.label}</p>
          <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">{pillar.scorDomain}</span>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${statusColors[pillar.status] || statusColors.staged}`}>{pillar.status}</span>
      </div>

      <div className="my-3">
        <DonutRing progress={progress} />
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1">Progress: {progress}%</label>
        <input type="range" min="0" max="100" step="5" value={progress} onChange={e => setProgress(parseInt(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1">Active capabilities</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {caps.map((c, i) => (
            <span key={i} className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
              {c}
              <button onClick={() => setCaps(prev => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-blue-600">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input value={newCap} onChange={e => setNewCap(e.target.value)} placeholder="Add capability"
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCap(); } }} />
          <button onClick={handleAddCap} className="text-xs text-blue-500 px-2">+</button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-600 ${saving ? 'opacity-50' : ''}`}>
        {saving ? 'Saving...' : 'Save Changes →'}
      </button>

      {toast && <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  );
}

export default function PillarManager() {
  const [pillars, setPillars] = useState([]);

  useEffect(() => {
    const unsub = subscribeToPillars(setPillars);
    return () => unsub();
  }, []);

  const avgProgress = pillars.length > 0 ? Math.round(pillars.reduce((s, p) => s + (p.enablementProgress || 0), 0) / pillars.length) : 0;
  const activeCount = pillars.filter(p => p.status === 'active').length;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">SCOR Pillar Manager</h3>
      <p className="text-xs text-gray-400 mb-4">Changes appear instantly in IVC AI Management System</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-6">
        <span className="text-sm text-gray-600"><span className="font-semibold">{activeCount}</span> of {pillars.length} pillars active</span>
        <span className="text-sm text-gray-600">Overall transformation: <span className="font-semibold">{avgProgress}%</span></span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map(p => <PillarCard key={p.id} pillar={p} />)}
      </div>
    </div>
  );
}
