export const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || '',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
    scope: 'openid profile email',
  },
};

