// Login page script — extracted from inline for CSP compliance
(function () {
    // Check if already logged in (user profile in localStorage, token in httpOnly cookie)
    if (localStorage.getItem('adminUser')) {
        window.location.href = '/admin-panel.html';
        return;
    } else if (localStorage.getItem('facultyUser')) {
        window.location.href = '/faculty-portal.html';
        return;
    }

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
                initSessionManagement(result.expiresIn || 1800);

                if (result.role === 'admin') {
                    localStorage.setItem('adminUser', JSON.stringify(result.user));
                    window.location.href = '/admin-panel.html';
                } else if (result.role === 'faculty') {
                    localStorage.setItem('facultyUser', JSON.stringify(result.user));
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
