const noop = () => {};
const asyncNoop = async () => {};

console.log('[Generic Shim] Initialized');

export const openPicker = asyncNoop;
export const openCamera = asyncNoop;
export const openCropper = asyncNoop;
export const clean = asyncNoop;
export const cleanSingle = asyncNoop;

// Audio Recorder Player
export const addRecordBackListener = noop;
export const removeRecordBackListener = noop;
export const addPlayBackListener = noop;
export const removePlayBackListener = noop;
export const startRecorder = asyncNoop;
export const stopRecorder = asyncNoop;
export const startPlayer = asyncNoop;
export const stopPlayer = asyncNoop;
export const pausePlayer = asyncNoop;
export const resumePlayer = asyncNoop;
export const seekToPlayer = asyncNoop;
export const setVolume = asyncNoop;

// Sound Player
export const playSoundFile = noop;
export const playUrl = noop;

// WebRTC
export class RTCPeerConnection {}
export class RTCIceCandidate {}
export class RTCSessionDescription {}
export const RTCView = () => null;
export const DatePicker = () => null;
export class MediaStream {}
export class MediaStreamTrack {}
export const mediaDevices = {
  getUserMedia: asyncNoop,
  enumerateDevices: async () => [],
};

const genericShim = {
  openPicker,
  openCamera,
  openCropper,
  clean,
  cleanSingle,
  addRecordBackListener,
  removeRecordBackListener,
  addPlayBackListener,
  removePlayBackListener,
  startRecorder,
  stopRecorder,
  startPlayer,
  stopPlayer,
  pausePlayer,
  resumePlayer,
  seekToPlayer,
  setVolume,
  playSoundFile,
  playUrl,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
};

export default genericShim;
