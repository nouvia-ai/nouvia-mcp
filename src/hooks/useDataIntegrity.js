import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function useDataIntegrity() {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'data_integrity_reports'), orderBy('date', 'desc'), limit(1));
    const unsub = onSnapshot(
      q,
      snap => {
        setReport(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
        setLoading(false);
      },
      err => {
        console.error('[useDataIntegrity]', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { report, loading, error };
}
