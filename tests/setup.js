import '@testing-library/jest-dom';

// ── Firebase mocks ──────────────────────────────────────────────────────────
// Prevent real SDK from initializing in test environment
vi.mock('../src/firebase', () => ({
  db:   {},
  auth: { currentUser: { uid: 'test-uid', email: 'benmelchionno@nouvia.ai' } },
}));

vi.mock('firebase/firestore', () => ({
  collection:      vi.fn(() => ({})),
  onSnapshot:      vi.fn((_q, cb) => { cb({ docs: [] }); return () => {}; }),
  addDoc:          vi.fn(() => Promise.resolve({ id: 'new-id' })),
  updateDoc:       vi.fn(() => Promise.resolve()),
  deleteDoc:       vi.fn(() => Promise.resolve()),
  doc:             vi.fn(() => ({})),
  setDoc:          vi.fn(() => Promise.resolve()),
  getDoc:          vi.fn(() => Promise.resolve({ exists: () => false })),
  query:           vi.fn(q => q),
  orderBy:         vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => new Date()),
  where:           vi.fn(() => ({})),
  limit:           vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth:         vi.fn(),
  onAuthStateChanged: vi.fn((_auth, cb) => { cb(null); return () => {}; }),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

// ── Storage mock ────────────────────────────────────────────────────────────
vi.mock('../src/storage', () => ({
  getData: vi.fn(() => Promise.resolve([])),
  setData: vi.fn(() => Promise.resolve()),
  deleteData: vi.fn(() => Promise.resolve()),
}));

// ── CSS custom properties: jsdom doesn't resolve var(--token) ─────────────
// Suppress "could not parse CSS" noise
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('var(--')) return;
  originalWarn(...args);
};
