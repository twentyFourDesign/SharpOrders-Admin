import * as auth from 'firebase/auth';
import { auth as webAuth } from './webConfig';

// Named exports for modular API
export * from 'firebase/auth';

// Shim for getAuth() modular call
export const getAuth = () => webAuth;

// Shim for auth() non-modular call
const authShim = (appInstance) => {
  return {
    currentUser: webAuth.currentUser,
    onAuthStateChanged: (cb) => auth.onAuthStateChanged(webAuth, cb),
    signInAnonymously: () => auth.signInAnonymously(webAuth),
    signOut: () => auth.signOut(webAuth),
    signInWithEmailAndPassword: (email, pass) => auth.signInWithEmailAndPassword(webAuth, email, pass),
    createUserWithEmailAndPassword: (email, pass) => auth.createUserWithEmailAndPassword(webAuth, email, pass),
    sendPasswordResetEmail: (email) => auth.sendPasswordResetEmail(webAuth, email),
  };
};

// Add properties directly to the function so auth.currentUser works
authShim.currentUser = webAuth.currentUser;
authShim.onAuthStateChanged = (cb) => auth.onAuthStateChanged(webAuth, cb);

export default authShim;
