// Faculty Portal JavaScript

// Check authentication — user profile indicates logged-in state (token in httpOnly cookie)
function checkAuth() {
    const userStr = localStorage.getItem('facultyUser');
    if (!userStr) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Get user info
function getUserInfo() {
    const userStr = localStorage.getItem('facultyUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout — clear cookie via server + clear localStorage
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignore */ }
    localStorage.removeItem('facultyUser');
    localStorage.removeItem('sessionExpiry');
    window.location.href = '/login.html';
}

// API call with authentication (cookie sent automatically)
async function authenticatedFetch(url, options = {}) {
    if (!checkAuth()) return null;

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
