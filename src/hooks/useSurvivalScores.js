import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function useSurvivalScores() {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'survival_scores'), orderBy('date', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error('[useSurvivalScores]', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Most recent score (first item since ordered desc)
  const latest = scores.length > 0 ? scores[0] : null;
  // Chronological order for charting
  const history = [...scores].reverse();

  return { scores, history, latest, loading, error };
}
