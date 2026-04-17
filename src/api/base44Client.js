import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68959b55e8df62b2777a4530", 
  requiresAuth: true // Ensure authentication is required for all operations
});
