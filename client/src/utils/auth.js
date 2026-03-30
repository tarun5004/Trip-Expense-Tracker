/**
 * @module auth
 * @description Local token management abstraction. Manages credentials strictly in-memory 
 *              away from persistent attacks.
 * @usedBy apiClient, authStore
 */

let accessToken = null;

export const auth = {
  /**
   * Secure getter preventing object mutation leaks.
   */
  getAccessToken: () => accessToken,

  /**
   * Sets the volatile access token upon successful Auth flows.
   */
  setAccessToken: (token) => {
    accessToken = token;
  },

  /**
   * Wipes the memory state. Call this during Logout or failed Refresh.
   */
  clearAccessToken: () => {
    accessToken = null;
  },
};

export default auth;
