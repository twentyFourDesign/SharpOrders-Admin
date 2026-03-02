const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Add custom resolver configuration
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx', 'mjs'];
config.resolver.platforms = ['ios', 'android', 'web'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const shims = {
      'react-native-image-crop-picker': 'src/services/firebase/generic-shim.js',
      'react-native-date-picker': 'src/services/firebase/date-picker-shim.js',
      'react-native-audio-recorder-player':
        'src/services/firebase/generic-shim.js',
      'react-native-sound-player': 'src/services/firebase/generic-shim.js',
      'react-native-webrtc': 'src/services/firebase/generic-shim.js',
      'react-native-splash-screen': 'src/services/firebase/splash-shim.js',
      '@react-native-firebase/app': 'src/services/firebase/app-shim.js',
      '@react-native-firebase/auth': 'src/services/firebase/auth-shim.js',
      '@react-native-firebase/firestore':
        'src/services/firebase/firestore-shim.js',
      '@react-native-firebase/storage': 'src/services/firebase/storage-shim.js',
      '@react-native-firebase/database': 'src/services/firebase/auth-shim.js',
      '@react-native-firebase/messaging':
        'src/services/firebase/messaging-shim.js',
    };

    if (shims[moduleName]) {
      return {
        filePath: path.resolve(__dirname, shims[moduleName]),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
