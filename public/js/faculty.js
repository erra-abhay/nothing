// Faculty Portal JavaScript — zero localStorage, cookie-only auth

// In-memory cache (never persisted to localStorage)
let _facultyUser = null;

// Check authentication via /api/me — backend is source of truth
async function checkAuth() {
    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) {
            window.location.href = '/login.html';
            return false;
        }
        const user = await res.json();
        if (user.role !== 'faculty') {
            window.location.href = '/login.html';
            return false;
        }
        _facultyUser = user;
        return true;
    } catch (e) {
        window.location.href = '/login.html';
        return false;
    }
}

// Get user info from in-memory cache
function getUserInfo() {
    return _facultyUser;
}

// Logout — clear cookie via server only
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignore */ }
    _facultyUser = null;
    window.location.href = '/login.html';
}

// API call with authentication (cookie sent automatically)
async function authenticatedFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: { ...options.headers }
    });

    if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (data.expired || data.loggedOutFromOtherDevice) {
            if (typeof handleSessionError === 'function') handleSessionError(data);
        }
        logout();
        return null;
    }

    if (typeof extendSession === 'function') extendSession();
    return response;
}
