import * as app from 'firebase/app';

const appShim = {
  ...app,
  get apps() {
    return app.getApps();
  },
  initializeApp: (config, name) => {
    const existingApps = app.getApps();
    if (name) {
      const existingApp = existingApps.find(a => a.name === name);
      if (existingApp) return existingApp;
    } else {
      const defaultApp = existingApps.find(a => a.name === '[DEFAULT]');
      if (defaultApp) return defaultApp;
    }
    return app.initializeApp(config, name);
  },
};

export * from 'firebase/app';
export const apps = app.getApps();
export default appShim;
