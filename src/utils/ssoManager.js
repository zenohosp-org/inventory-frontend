/**
 * SSOCookieManager
 * Manages shared SSO token across all ZenoHosp frontend apps
 * 
 * Cookie: sso_token (shared across *.zenohosp.com or localhost)
 * Domain: zenohosp.com (prod) or localhost (dev)
 * 
 * Usage:
 *   - Login: SSOCookieManager.setToken(jwt)
 *   - Logout: SSOCookieManager.clearToken() + signalLogoutAcrossApps()
 *   - Get: SSOCookieManager.getToken()
 *   - Check: SSOCookieManager.hasToken() / isTokenExpired()
 *   - Decode: SSOCookieManager.decodeToken()
 */

const SSOCookieManager = {
  COOKIE_NAME: 'sso_token',
  TOKEN_EXPIRY_KEY: 'sso_token_expiry',
  
  /**
   * Get cookie domain from environment or detect automatically
   * Dev: localhost
   * Prod: .zenohosp.com
   */
  getCookieDomain() {
    const envDomain = import.meta.env?.VITE_COOKIE_DOMAIN;
    if (envDomain) {
      return envDomain;
    }
    
    // Fallback: auto-detect
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
    return 'zenohosp.com';
  },
  
  /**
   * Check if cookie should be secure
   * Dev: false
   * Prod: true
   */
  isSecure() {
    const envSecure = import.meta.env?.VITE_COOKIE_SECURE;
    if (envSecure !== undefined) {
      return envSecure === 'true' || envSecure === true;
    }
    
    // Fallback: use HTTPS check
    return window.location.protocol === 'https:';
  },
  
  /**
   * Set SSO token in shared cookie
   * @param {string} token - JWT token
   * @param {Object} options - Cookie options (domain, maxAge, etc.)
   */
  setToken(token, options = {}) {
    if (!token) {
      console.warn('setToken: token is empty');
      return;
    }
    
    const domain = options.domain || this.getCookieDomain();
    const secure = options.secure !== undefined ? options.secure : this.isSecure();
    const maxAge = options.maxAge || 86400; // 1 day default
    const sameSite = options.sameSite || 'Lax';

    // Browsers expect Secure as a flag (not secure=true), and localhost should not use Domain.
    const normalizedDomain = (domain || '').trim();
    const isLocalDomain = normalizedDomain === 'localhost' || normalizedDomain === '127.0.0.1';
    const domainAttr = normalizedDomain && !isLocalDomain ? `; domain=${normalizedDomain}` : '';
    const secureAttr = secure ? '; Secure' : '';

    // Set cookie with proper attributes for cross-subdomain SSO.
    document.cookie = `${this.COOKIE_NAME}=${token}${domainAttr}; path=/; max-age=${maxAge}; SameSite=${sameSite}${secureAttr}`;
    
    // Store token expiry in sessionStorage (for checking expiration without decoding)
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp) {
        sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, decoded.exp * 1000); // Convert to ms
      }
    } catch (e) {
      console.warn('Failed to decode token for expiry tracking', e);
    }
  },
  
  /**
   * Get SSO token from cookie
   * @returns {string|null} - Token or null if not present
   */
  getToken() {
    const cookies = document.cookie.split(';');
    console.debug('SSOCookieManager.getToken() - All cookies:', document.cookie);
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(`${this.COOKIE_NAME}=`)) {
        const token = cookie.substring(`${this.COOKIE_NAME}=`.length);
        console.debug('✅ SSOCookieManager: Found SSO token:', token.substring(0, 20) + '...');
        return token;
      }
    }
    console.debug('❌ SSOCookieManager: No SSO token found in cookies');
    return null;
  },
  
  /**
   * Check if SSO token exists
   * @returns {boolean}
   */
  hasToken() {
    return this.getToken() !== null;
  },
  
  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - true if expired, false if valid
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      // exp is in seconds, convert to ms and compare with current time
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      
      // Consider token expired if it expires in less than 1 minute
      return expiryTime < (currentTime + 60000);
    } catch (e) {
      console.warn('Failed to check token expiry', e);
      return true;
    }
  },
  
  /**
   * Decode JWT token payload (without verification)
   * @param {string} token - JWT token
   * @returns {Object|null} - Decoded payload or null if invalid
   */
  decodeToken(token) {
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return null;
      }
      
      // Decode the payload (second part)
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (e) {
      console.warn('Failed to decode token', e);
      return null;
    }
  },
  
  /**
   * Clear SSO token from cookie
   */
  clearToken() {
    const domain = this.getCookieDomain();
    const normalizedDomain = (domain || '').trim();
    const isLocalDomain = normalizedDomain === 'localhost' || normalizedDomain === '127.0.0.1';
    const domainAttr = normalizedDomain && !isLocalDomain ? `; domain=${normalizedDomain}` : '';
    const secureAttr = this.isSecure() ? '; Secure' : '';

    // Clear via cookie (set expiry to past)
    document.cookie = `${this.COOKIE_NAME}=${domainAttr}; path=/; max-age=0; SameSite=Lax${secureAttr}`;
    
    // Clear expiry from sessionStorage
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  },
  
  /**
   * Signal logout across all app tabs/windows
   * Uses sessionStorage + storage event for cross-tab communication
   * 
   * Any tab that listens to 'sso-logout' event will clear local state
   * See: AuthContext useEffect for listener
   */
  signalLogoutAcrossApps() {
    try {
      // Create a unique signal with timestamp to force event fire
      const signal = `logout-${Date.now()}`;
      sessionStorage.setItem('sso-logout', signal);
      
      // Also dispatch a custom event for same-tab listeners
      const logoutEvent = new CustomEvent('sso-logout', { detail: { signal } });
      window.dispatchEvent(logoutEvent);
    } catch (e) {
      console.warn('Failed to signal logout across apps', e);
    }
  },
};

export default SSOCookieManager;
