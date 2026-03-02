import * as firestore from 'firebase/firestore';
import * as auth from 'firebase/auth';
import { db, auth as webAuth } from './webConfig';

// Firestore Mock
const firestoreMock = () => {
  const mock = {
    collection: (path) => ({
      doc: (docPath) => ({
        set: (data, options) => firestore.setDoc(firestore.doc(db, path, docPath), data, options),
        get: () => firestore.getDoc(firestore.doc(db, path, docPath)),
        update: (data) => firestore.updateDoc(firestore.doc(db, path, docPath), data),
        onSnapshot: (cb) => firestore.onSnapshot(firestore.doc(db, path, docPath), cb),
        collection: (subPath) => firestoreMock().collection(`${path}/${docPath}/${subPath}`),
      }),
      add: (data) => firestore.addDoc(firestore.collection(db, path), data),
      where: (field, op, val) => firestore.query(firestore.collection(db, path), firestore.where(field, op, val)),
      orderBy: (field, dir) => firestore.query(firestore.collection(db, path), firestore.orderBy(field, dir)),
      onSnapshot: (cb) => firestore.onSnapshot(firestore.collection(db, path), cb),
      get: () => firestore.getDocs(firestore.collection(db, path)),
    }),
    batch: () => firestore.writeBatch(db),
    doc: (path) => firestoreMock().collection(path.split('/')[0]).doc(path.split('/').slice(1).join('/')),
  };
  return mock;
};

firestoreMock.FieldValue = {
  arrayUnion: firestore.arrayUnion,
  serverTimestamp: firestore.serverTimestamp,
};

// Auth Mock
const authMock = () => {
  const mock = () => {
    return {
      currentUser: webAuth.currentUser,
      onAuthStateChanged: (cb) => auth.onAuthStateChanged(webAuth, cb),
      signInAnonymously: () => auth.signInAnonymously(webAuth),
      signOut: () => auth.signOut(webAuth),
      signInWithEmailAndPassword: (email, pass) => auth.signInWithEmailAndPassword(webAuth, email, pass),
      createUserWithEmailAndPassword: (email, pass) => auth.createUserWithEmailAndPassword(webAuth, email, pass),
    };
  };
  // Allow calling as auth.currentUser directly if some code does that
  mock.currentUser = webAuth.currentUser;
  mock.onAuthStateChanged = (cb) => auth.onAuthStateChanged(webAuth, cb);
  return mock;
};

// Messaging Mock
const messagingMock = () => {
  const mock = () => ({
    requestPermission: async () => 1,
    getToken: async () => 'mock-fcm-token',
    onMessage: (cb) => () => {},
    onNotificationOpenedApp: (cb) => () => {},
    getInitialNotification: async () => null,
  });
  mock.AuthorizationStatus = {
    AUTHORIZED: 1,
    DENIED: 0,
  };
  return mock;
};

// Export as functions to be used as default imports
const authExport = authMock();
const firestoreExport = firestoreMock;
const messagingExport = messagingMock();

// Export everything for the different firebase modules
export { authExport as auth, firestoreExport as firestore, messagingExport as messaging };

// For splash screen
export const hide = () => {};
export const show = () => {};

// For standard firebase
export const FieldValue = firestoreMock.FieldValue;

// Default export
export default authExport; // Default to auth since it's most common
