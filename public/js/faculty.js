// Faculty Portal JavaScript

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('facultyToken');
    if (!token) {
        window.location.href = '/faculty-login.html';
        return null;
    }
    return token;
}

// Get user info
function getUserInfo() {
    const userStr = localStorage.getItem('facultyUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout
function logout() {
    localStorage.removeItem('facultyToken');
    localStorage.removeItem('facultyUser');
    window.location.href = '/faculty-login.html';
}

// API call with authentication
async function authenticatedFetch(url, options = {}) {
    const token = checkAuth();
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
        logout();
        return null;
    }

    // Pick up refreshed JWT token from server
    const refreshedToken = response.headers.get('X-Refreshed-Token');
    if (refreshedToken) {
        localStorage.setItem('facultyToken', refreshedToken);
        // Also extend session expiry
        if (typeof extendSession === 'function') extendSession();
    }

    return response;
}
