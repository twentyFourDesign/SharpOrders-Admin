import * as firestore from 'firebase/firestore';
import { db } from './webConfig';

// Named exports for modular API
export * from 'firebase/firestore';

// Shim for getFirestore() modular call
export const getFirestore = () => db;

// Shim for firestore() non-modular call
const firestoreShim = (appInstance) => {
  const mock = {
    collection: (path) => ({
      doc: (docPath) => ({
        set: (data, options) => firestore.setDoc(firestore.doc(db, path, docPath), data, options),
        get: () => firestore.getDoc(firestore.doc(db, path, docPath)),
        update: (data) => firestore.updateDoc(firestore.doc(db, path, docPath), data),
        onSnapshot: (cb) => firestore.onSnapshot(firestore.doc(db, path, docPath), cb),
        collection: (subPath) => firestoreShim().collection(`${path}/${docPath}/${subPath}`),
      }),
      add: (data) => firestore.addDoc(firestore.collection(db, path), data),
      where: (field, op, val) => firestore.query(firestore.collection(db, path), firestore.where(field, op, val)),
      orderBy: (field, dir) => firestore.query(firestore.collection(db, path), firestore.orderBy(field, dir)),
      onSnapshot: (cb) => firestore.onSnapshot(firestore.collection(db, path), cb),
      get: () => firestore.getDocs(firestore.collection(db, path)),
    }),
    batch: () => firestore.writeBatch(db),
    doc: (path) => firestoreShim().collection(path.split('/')[0]).doc(path.split('/').slice(1).join('/')),
  };
  return mock;
};

// FieldValue compatibility
firestoreShim.FieldValue = {
  arrayUnion: firestore.arrayUnion,
  serverTimestamp: firestore.serverTimestamp,
};

export default firestoreShim;
