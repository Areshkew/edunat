/**
 * User inactivity tracker that logs out users after a period of inactivity
 * 
 * @param {number} timeout - The inactivity timeout in milliseconds (default: 20 minutes)
 */
export const DEFAULT_INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes

export function setupInactivityTracker(timeout = DEFAULT_INACTIVITY_TIMEOUT) {
  // Don't run during SSR
  if (typeof window === 'undefined') return;
  
  let inactivityTimer;
  
  // Function to reset the timer
  const resetInactivityTimer = () => {
    // Clear existing timer if any
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    // Check if the user has a token before setting the timer
    // This prevents tracking inactivity for unauthenticated users
    const hasSession = document.cookie.includes("edunat_session=");
    if (!hasSession) return;
    
    // Set new timer
    inactivityTimer = setTimeout(() => {
      // Redirect to logout
      window.location.href = "/logout";
    }, timeout);
  };
  
  // Reset the timer on initial load
  resetInactivityTimer();
  
  // Reset timer when user is active
  const events = [
    'mousedown', 'mousemove', 'keypress', 
    'scroll', 'touchstart', 'click', 
    'keydown', 'wheel'
  ];
  
  // Throttled event handler to prevent performance issues
  let lastActivityTime = Date.now();
  const THROTTLE_DELAY = 5000; // 5 seconds
  
  const handleUserActivity = () => {
    const now = Date.now();
    // Only reset the timer if enough time has passed since last reset
    if (now - lastActivityTime > THROTTLE_DELAY) {
      lastActivityTime = now;
      resetInactivityTimer();
    }
  };
  
  // Add event listeners
  events.forEach(event => {
    document.addEventListener(event, handleUserActivity, { passive: true });
  });
  
  // For SPA navigation which doesn't trigger page reloads
  const originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      resetInactivityTimer();
    };
    
    window.addEventListener('popstate', resetInactivityTimer);
  }
  
  // Cleanup function for React components
  return () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    events.forEach(event => {
      document.removeEventListener(event, handleUserActivity);
    });
    
    if (originalPushState) {
      window.removeEventListener('popstate', resetInactivityTimer);
    }
  };
}
