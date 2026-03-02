import * as storage from 'firebase/storage';
import { storage as webStorage } from './webConfig';

// Named exports for modular API
export * from 'firebase/storage';

// Shim for getStorage() modular call
export const getStorage = () => webStorage;

// Shim for storage() non-modular call
const storageShim = (appInstance) => {
  return {
    ref: (path) => {
      const storageRef = storage.ref(webStorage, path);
      return {
        putFile: async (fileUri) => {
          // On Web, putFile doesn't exist, we use uploadBytes
          // This is a simplification, might need more work for full putFile support
          const response = await fetch(fileUri);
          const blob = await response.blob();
          return storage.uploadBytes(storageRef, blob);
        },
        getDownloadURL: () => storage.getDownloadURL(storageRef),
      };
    },
  };
};

export default storageShim;
