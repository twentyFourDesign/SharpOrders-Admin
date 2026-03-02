const messagingMock = () => {
  const mock = () => ({
    requestPermission: async () => 1,
    getToken: async () => 'mock-fcm-token',
    onMessage: cb => () => {},
    onNotificationOpenedApp: cb => () => {},
    getInitialNotification: async () => null,
    onTokenRefresh: cb => () => {}, // Added this
  });
  mock.AuthorizationStatus = {
    AUTHORIZED: 1,
    DENIED: 0,
  };
  return mock;
};

export default messagingMock();
