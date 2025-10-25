/**
 * Version Check Utility
 * Forces logout on new deployment by clearing localStorage when version changes
 */

// Update this version on each deployment (or use build timestamp)
export const APP_VERSION = '2.0.0';

/**
 * Check if app version has changed
 * If changed, clear localStorage and reload
 * This ensures users get fresh data and prevents issues with cached state
 */
export const checkVersion = () => {
  const storedVersion = localStorage.getItem('APP_VERSION');

  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log(`Version changed from ${storedVersion} to ${APP_VERSION}. Logging out all users...`);
    
    // Clear all localStorage (logs out user)
    localStorage.clear();
    
    // Store new version
    localStorage.setItem('APP_VERSION', APP_VERSION);
    
    // Force reload to get fresh state
    window.location.href = '/login';
    
    return true;
  }

  if (!storedVersion) {
    localStorage.setItem('APP_VERSION', APP_VERSION);
  }

  return false;
};

/**
 * Get current app version
 */
export const getAppVersion = () => APP_VERSION;
