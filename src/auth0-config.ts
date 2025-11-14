export const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || '',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
    scope: 'openid profile email',
  },
  // Use localStorage to persist auth state across page refreshes (F5)
  // This prevents users from being logged out on hard refresh
  cacheLocation: 'localstorage' as const,
  // Use refresh tokens for better session management
  useRefreshTokens: true,
};

