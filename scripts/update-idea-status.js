import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'nouvia-os' });
const db = getFirestore();

async function main() {
  const snap = await db.collection('ivc_ideas').where('clientId', '==', 'ivc').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.title === 'Automated RFQ Generation' && data.status !== 'quoted') {
      await doc.ref.update({ status: 'quoted' });
      console.log(`Updated "${data.title}" to status: quoted`);
    } else {
      console.log(`"${data.title}" — status: ${data.status} (no change)`);
    }
  }
  console.log('Done.');
}

main().catch(console.error);
