/**
 * Login Page JavaScript
 * Handles user authentication
 */

const API_BASE_URL = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        verifyAndRedirect(token);
    }

    // Setup form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Enter key in password field
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
});

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');

    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';

    // Validate inputs
    if (!username || !password) {
        showError('Kullanıcı adı ve şifre gereklidir');
        return;
    }

    // Disable button and show loading
    loginButton.disabled = true;
    buttonText.style.display = 'none';
    buttonSpinner.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Save token and user info
            localStorage.setItem('authToken', result.data.token);
            localStorage.setItem('userInfo', JSON.stringify(result.data.user));

            // Show success animation
            loginButton.classList.add('success-animation');

            // Redirect based on role
            setTimeout(() => {
                redirectToApp(result.data.user.role);
            }, 500);
        } else {
            showError(result.error || 'Giriş başarısız');
            resetButton();
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        resetButton();
    }
}

async function verifyAndRedirect(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                redirectToApp(result.data.role);
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userInfo');
            }
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
    }
}

function redirectToApp(role) {
    // Redirect based on role
    if (role === 'yönetici') {
        window.location.href = '/admin';
    } else if (role === 'garson') {
        window.location.href = '/waiter';
    } else {
        window.location.href = '/';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function resetButton() {
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');

    loginButton.disabled = false;
    buttonText.style.display = 'inline';
    buttonSpinner.style.display = 'none';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus username field
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('username').focus();
    }
});
