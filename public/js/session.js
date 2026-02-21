// Session Management Utility
// Handles 30-minute session timeout and single-device login enforcement

const SESSION_CHECK_INTERVAL = 60000; // Check every minute
const SESSION_WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before expiry
let sessionCheckTimer = null;
let sessionExpiryTime = null;

// Initialize session management
function initSessionManagement(expiresIn) {
    if (!expiresIn) expiresIn = 1800; // Default 30 minutes

    sessionExpiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem('sessionExpiry', sessionExpiryTime);

    // Start session checking
    if (sessionCheckTimer) clearInterval(sessionCheckTimer);
    sessionCheckTimer = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    // Check immediately
    checkSession();
}

// Check session status
function checkSession() {
    const expiry = parseInt(localStorage.getItem('sessionExpiry'));
    if (!expiry) return;

    const timeLeft = expiry - Date.now();

    // Session expired
    if (timeLeft <= 0) {
        handleSessionExpired();
        return;
    }

    // Warn user 5 minutes before expiry
    if (timeLeft <= SESSION_WARNING_TIME && timeLeft > SESSION_WARNING_TIME - SESSION_CHECK_INTERVAL) {
        showSessionWarning(Math.floor(timeLeft / 60000));
    }
}

// Handle session expiry
function handleSessionExpired() {
    if (sessionCheckTimer) clearInterval(sessionCheckTimer);
    localStorage.removeItem('sessionExpiry');

    showError('Your session has expired after 30 minutes of inactivity. Please login again.');

    setTimeout(() => {
        if (window.location.pathname.includes('faculty')) {
            logout();
        } else if (window.location.pathname.includes('admin')) {
            adminLogout();
        }
    }, 2000);
}

// Show session warning
function showSessionWarning(minutesLeft) {
    const warning = document.createElement('div');
    warning.className = 'alert alert-warning session-warning';
    warning.innerHTML = `
        <span>⚠️ Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Any activity will extend your session.</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: auto;">×</button>
    `;
    warning.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1000; max-width: 400px; display: flex; align-items: center;';

    // Remove any existing warnings
    document.querySelectorAll('.session-warning').forEach(el => el.remove());

    document.body.appendChild(warning);

    // Auto-remove after 10 seconds
    setTimeout(() => warning.remove(), 10000);
}

// Extend session on user activity
function extendSession() {
    const expiry = parseInt(localStorage.getItem('sessionExpiry'));
    if (!expiry) return;

    // Extend session by 30 minutes from now
    const newExpiry = Date.now() + (30 * 60 * 1000);
    localStorage.setItem('sessionExpiry', newExpiry);
    sessionExpiryTime = newExpiry;
}

// Handle API errors related to sessions
function handleSessionError(error) {
    if (error.expired) {
        handleSessionExpired();
        return true;
    }

    if (error.loggedOutFromOtherDevice) {
        if (sessionCheckTimer) clearInterval(sessionCheckTimer);
        localStorage.removeItem('sessionExpiry');
        showError(error.error || 'You have been logged out because you logged in from another device.');

        setTimeout(() => {
            if (window.location.pathname.includes('faculty')) {
                logout();
            } else if (window.location.pathname.includes('admin')) {
                adminLogout();
            }
        }, 3000);
        return true;
    }

    return false;
}

// Activity listeners to extend session
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
let activityTimeout = null;

function setupActivityListeners() {
    activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            // Debounce activity - only extend once per minute
            if (activityTimeout) return;

            extendSession();
            activityTimeout = setTimeout(() => {
                activityTimeout = null;
            }, 60000);
        }, { passive: true });
    });
}

// Clean up on logout
function cleanupSession() {
    if (sessionCheckTimer) clearInterval(sessionCheckTimer);
    localStorage.removeItem('sessionExpiry');
    document.querySelectorAll('.session-warning').forEach(el => el.remove());
}

// Auto-initialize if on protected pages
if (window.location.pathname.includes('faculty-portal') || window.location.pathname.includes('admin-panel')) {
    setupActivityListeners();

    // Check if session expiry is stored
    const expiry = parseInt(localStorage.getItem('sessionExpiry'));
    if (expiry) {
        const timeLeft = expiry - Date.now();
        if (timeLeft > 0) {
            initSessionManagement(Math.floor(timeLeft / 1000));
        }
    }
}
