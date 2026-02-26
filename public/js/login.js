// Login page script — zero localStorage, cookie-only auth
(function () {
    // Check if already logged in by asking the backend
    async function checkExistingSession() {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            if (res.ok) {
                const user = await res.json();
                if (user.role === 'admin') {
                    window.location.href = '/admin-panel.html';
                } else if (user.role === 'faculty') {
                    window.location.href = '/faculty-portal.html';
                }
            }
        } catch (e) { /* not logged in, show form */ }
    }

    checkExistingSession();

    async function handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('errorMessage');

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                // Get identity from backend — single source of truth
                const meRes = await fetch('/api/me', { credentials: 'include' });
                if (!meRes.ok) throw new Error('Failed to verify session');
                const user = await meRes.json();

                initSessionManagement(1800);

                if (user.role === 'admin') {
                    window.location.href = '/admin-panel.html';
                } else if (user.role === 'faculty') {
                    window.location.href = '/faculty-portal.html';
                }
            } else {
                errorDiv.textContent = result.error || 'Login failed';
                errorDiv.className = 'alert alert-error';
                errorDiv.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.className = 'alert alert-error';
            errorDiv.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
})();
