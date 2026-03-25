/**
 * dsiService.js — DSI Client Intelligence Layer service
 * Phase 0: Closed-loop Firestore sync between Studio and AIMS
 * Reads ivc_* collections in real-time, writes admin-only fields back
 */
import { db } from '../firebase';
import {
  collection, doc, getDocs, getDoc, addDoc,
  updateDoc, onSnapshot, query, orderBy,
  where, serverTimestamp, limit
} from 'firebase/firestore';

// ── READ FUNCTIONS (real-time subscriptions) ──────────────

export function subscribeToAuditLog(callback) {
  return onSnapshot(
    query(
      collection(db, 'ivc_audit_log'),
      where('notifyNouvia', '==', true),
      orderBy('timestamp', 'desc'),
      limit(50)
    ),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function subscribeToIdeas(callback) {
  return onSnapshot(
    query(collection(db, 'ivc_ideas'), orderBy('createdAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function subscribeToBacklog(callback) {
  return onSnapshot(
    query(collection(db, 'ivc_backlog'), orderBy('createdAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function subscribeToPillars(callback) {
  return onSnapshot(
    query(collection(db, 'ivc_pillars'), orderBy('order', 'asc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function subscribeToRequests(callback) {
  return onSnapshot(
    query(
      collection(db, 'ivc_backlog'),
      where('isChangeRequest', '==', true)
    ),
    snap => {
      const changeRequests = snap.docs.map(d =>
        ({ id: d.id, type: 'change', ...d.data() })
      );
      getDocs(
        query(
          collection(db, 'ivc_backlog'),
          where('isPauseRequest', '==', true)
        )
      ).then(pauseSnap => {
        const pauseRequests = pauseSnap.docs.map(d =>
          ({ id: d.id, type: 'pause', ...d.data() })
        );
        callback([...changeRequests, ...pauseRequests]
          .sort((a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          )
        );
      });
    }
  );
}

// ── ONE-TIME READS (for Master Backlog integration) ───────

export async function getIVCBacklogItems() {
  const snap = await getDocs(
    query(collection(db, 'ivc_backlog'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getIVCPillarItems() {
  const snap = await getDocs(
    query(collection(db, 'ivc_pillars'), orderBy('order', 'asc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getIVCIdeasQueue() {
  const snap = await getDocs(
    query(collection(db, 'ivc_ideas'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAuditLogUnread() {
  const snap = await getDocs(
    query(
      collection(db, 'ivc_audit_log'),
      where('notifyNouvia', '==', true)
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.acknowledged);
}

// ── WRITE FUNCTIONS (admin-only) ──────────────────────────

export async function acknowledgeAuditEvent(eventId) {
  await updateDoc(doc(db, 'ivc_audit_log', eventId), {
    acknowledged: true,
    acknowledgedAt: serverTimestamp()
  });
}

export async function quoteIVCIdea(ideaId, quoteData) {
  await updateDoc(doc(db, 'ivc_ideas', ideaId), {
    status: 'quoted',
    ...quoteData,
    quotedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateIVCIdeaStatus(ideaId, status) {
  await updateDoc(doc(db, 'ivc_ideas', ideaId), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function updateIVCPillarProgress(pillarId, progress, capabilities) {
  await updateDoc(doc(db, 'ivc_pillars', pillarId), {
    enablementProgress: progress,
    activeCapabilities: capabilities,
    updatedAt: serverTimestamp()
  });
}

export async function updateIVCBacklogItem(id, updates) {
  await updateDoc(doc(db, 'ivc_backlog', id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function acknowledgeRequest(requestId) {
  await updateDoc(doc(db, 'ivc_backlog', requestId), {
    stage: 'approved',
    acknowledgedByNouvia: true,
    acknowledgedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function dismissRequest(requestId) {
  await updateDoc(doc(db, 'ivc_backlog', requestId), {
    stage: 'obsolete',
    dismissedByNouvia: true,
    updatedAt: serverTimestamp()
  });
}
