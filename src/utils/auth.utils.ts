/**
 * Authentication utilities for handling Auth0 tokens and configuration
 */

import { GetTokenSilentlyOptions } from "@auth0/auth0-react";

/**
 * Auth0 configuration for token requests
 */
export const AUTH0_TOKEN_CONFIG: GetTokenSilentlyOptions = {
  authorizationParams: {
    audience:
      process.env.REACT_APP_AUTH0_AUDIENCE ||
      `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
    scope: "openid profile email",
  },
};

/**
 * HTTP Header names used in API requests
 */
export const HTTP_HEADERS = {
  AUTHORIZATION: "Authorization",
  CONTENT_TYPE: "Content-Type",
} as const;

/**
 * Creates an Authorization header value with Bearer token
 * @param token - JWT access token
 * @returns Authorization header value
 */
export const createAuthorizationHeader = (token: string): string => {
  return `Bearer ${token}`;
};

/**
 * Creates standard headers for authenticated API requests
 * @param token - JWT access token
 * @param includeContentType - Whether to include Content-Type header (default: false, useful for FormData)
 * @returns Headers object
 */
export const createAuthHeaders = (
  token: string,
  includeContentType: boolean = false
): Record<string, string> => {
  const headers: Record<string, string> = {
    [HTTP_HEADERS.AUTHORIZATION]: createAuthorizationHeader(token),
  };

  if (includeContentType) {
    headers[HTTP_HEADERS.CONTENT_TYPE] = "application/json";
  }

  return headers;
};

