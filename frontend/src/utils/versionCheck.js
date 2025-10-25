/**
 * Version Check Utility
 * Forces logout on new deployment by clearing localStorage when version changes
 */

// Update this version on each deployment (or use build timestamp)
export const APP_VERSION = '1.0.1'; // Increment on each deployment

/**
 * Check if app version has changed
 * If changed, clear localStorage and reload
 * This ensures users get fresh data and prevents issues with cached state
 */
export const checkVersion = () => {
  const storedVersion = localStorage.getItem('APP_VERSION');

  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log(`Version changed from ${storedVersion} to ${APP_VERSION}. Clearing cache...`);

    // Clear all localStorage
    localStorage.clear();

    // Store new version
    localStorage.setItem('APP_VERSION', APP_VERSION);

    // Reload page to get fresh state
    window.location.reload();

    return true; // Version changed
  }

  // Store version if not present
  if (!storedVersion) {
    localStorage.setItem('APP_VERSION', APP_VERSION);
  }

  return false; // Version unchanged
};

/**
 * Get current app version
 */
export const getAppVersion = () => APP_VERSION;
