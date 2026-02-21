// Admin Panel JavaScript

// Check authentication
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
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
    window.location.href = '/admin-login.html';
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
        adminLogout();
        return null;
    }

    return response;
}
