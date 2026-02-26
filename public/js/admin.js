// Admin Panel JavaScript

// Check authentication
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return null;
    }
    return token;
}

// Get admin info
function getAdminInfo() {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout
function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login.html';
}

// API call with authentication
async function adminFetch(url, options = {}) {
    const token = checkAdminAuth();
    if (!token) return null;

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (data.expired || data.loggedOutFromOtherDevice) {
            if (typeof handleSessionError === 'function') handleSessionError(data);
        }
        adminLogout();
        return null;
    }

    // Pick up refreshed JWT token from server
    const refreshedToken = response.headers.get('X-Refreshed-Token');
    if (refreshedToken) {
        localStorage.setItem('adminToken', refreshedToken);
        // Also extend session expiry
        if (typeof extendSession === 'function') extendSession();
    }

    return response;
}
