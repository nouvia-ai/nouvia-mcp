/**
 * useTrackerEvents — INT-001 TASK-05c
 * Writes behavioral events to tracker_events/{auto_id} (Firestore native path).
 * All field names snake_case (ADR-P02).
 *
 * Schema:
 *   event_type   string   — tab_viewed | item_added | item_removed | status_changed | form_opened
 *   tab          string   — active tab at time of event
 *   entity_type  string?  — client | experiment | decision | trend | coworker | skill | connector
 *   entity_id    string?  — id of affected record (omit for tab events)
 *   metadata     object?  — arbitrary extra context (e.g. { from_status, to_status })
 *   session_id   string   — stable for the browser session, resets on reload
 *   timestamp    Timestamp — server-side Firestore timestamp
 *
 * Usage:
 *   const track = useTrackerEvents();
 *   track('tab_viewed', { tab: 'clients' });
 *   track('item_added', { tab: 'clients', entity_type: 'client', entity_id: id });
 */

import { useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Stable for this browser session — resets on page reload
const SESSION_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function useTrackerEvents() {
  const track = useCallback(async (event_type, payload = {}) => {
    try {
      await addDoc(collection(db, 'tracker_events'), {
        event_type,
        session_id: SESSION_ID,
        timestamp: serverTimestamp(),
        ...payload,
      });
    } catch {
      // Silent — analytics must never block or crash the UI
    }
  }, []);

  return track;
}
