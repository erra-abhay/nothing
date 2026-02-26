// Admin Panel JavaScript

// Check authentication — user profile indicates logged-in state (token in httpOnly cookie)
function checkAdminAuth() {
    const userStr = localStorage.getItem('adminUser');
    if (!userStr) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Get admin info
function getAdminInfo() {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout — clear cookie via server + clear localStorage
async function adminLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignore */ }
    localStorage.removeItem('adminUser');
    localStorage.removeItem('sessionExpiry');
    window.location.href = '/login.html';
}

// API call with authentication (cookie sent automatically)
async function adminFetch(url, options = {}) {
    if (!checkAdminAuth()) return null;

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
