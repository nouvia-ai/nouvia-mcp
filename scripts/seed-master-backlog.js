import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'nouvia-os' });
const db = getFirestore();

async function seed() {
  // Check if already seeded
  const mktSnap = await db.collection('marketing_tasks').get();
  if (mktSnap.size > 0) {
    console.log(`Already seeded — ${mktSnap.size} marketing tasks exist. Skipping.`);
    process.exit(0);
  }

  console.log('Seeding Master Backlog data...');

  // Marketing tasks
  const mktItems = [
    { title: 'Update nouvia.ai website — canvas has evolved', status: 'this_week', effort_hours: 2, client: null, priority: 1, due_date: '2026-04-07', category: 'Website', notes: 'AI adoption guarantee, NIP three-layer architecture, self-evolving delivery not reflected. Last updated March 10.', week_target: '2026-03-30' },
    { title: 'Ben Melchionno — professional profile document', status: 'this_week', effort_hours: 1, client: null, priority: 1, due_date: '2026-03-26', category: 'Collateral', notes: 'Paul (Hockey Prospect) requested. Send by March 26.', week_target: '2026-03-23' },
    { title: 'Nouvia one-pager — AI transformation platform', status: 'this_week', effort_hours: 2, client: null, priority: 1, due_date: '2026-03-26', category: 'Collateral', notes: 'Paul (Hockey Prospect) requested alongside profile. Core value prop + NIP two pillars + IVC case study teaser.', week_target: '2026-03-23' },
    { title: 'IVC case study — Phase 1 delivery results', status: 'backlog', effort_hours: 3, client: 'IVC', priority: 3, due_date: '2026-05-01', category: 'Content', notes: 'After SOW signed. Document Phase 1: estimation platform, 84% accuracy, delivery timeline.', week_target: '2026-04-27' },
  ];

  for (const item of mktItems) {
    await db.collection('marketing_tasks').add({
      ...item,
      created_at: FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ Marketing: ${item.title}`);
  }

  // Manual backlog items
  const manualItems = [
    { title: 'IVC Friday meeting — confirm $30k + $15k/month', stream: 'manual', status: 'this_week', effort_hours: 1, client: 'IVC', priority: 1, due_date: '2026-03-28', notes: 'Open cockpit. Present pricing model. Hold firm on Phase 1. Non-negotiable.', week_target: '2026-03-23' },
  ];

  for (const item of manualItems) {
    await db.collection('master_backlog').add({
      ...item,
      created_at: FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ Manual: ${item.title}`);
  }

  console.log(`\n✅ Seed complete: ${mktItems.length} marketing tasks + ${manualItems.length} manual items`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
