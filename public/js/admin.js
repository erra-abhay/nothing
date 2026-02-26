// Admin Panel JavaScript — zero localStorage, cookie-only auth

// In-memory cache (never persisted to localStorage)
let _adminUser = null;

// Check authentication via /api/me — backend is source of truth
async function checkAdminAuth() {
    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) {
            window.location.href = '/login.html';
            return false;
        }
        const user = await res.json();
        if (user.role !== 'admin') {
            window.location.href = '/login.html';
            return false;
        }
        _adminUser = user;
        return true;
    } catch (e) {
        window.location.href = '/login.html';
        return false;
    }
}

// Get admin info from in-memory cache
function getAdminInfo() {
    return _adminUser;
}

// Logout — clear cookie via server only
async function adminLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignore */ }
    _adminUser = null;
    window.location.href = '/login.html';
}

// API call with authentication (cookie sent automatically)
async function adminFetch(url, options = {}) {
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
        adminLogout();
        return null;
    }

    if (typeof extendSession === 'function') extendSession();
    return response;
}
