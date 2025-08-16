/**
 * Admin Authentication JavaScript
 */

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.getElementById('login-btn');
const loginSpinner = document.getElementById('login-spinner');
const loginText = document.getElementById('login-text');
const alertContainer = document.getElementById('alert-container');

// API URLs - Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const AUTH_URL = isProduction ? 'https://proline-website.onrender.com/api/auth' : 'http://localhost:3000/api/auth';

// Utility Functions
const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
};

const setLoading = (isLoading) => {
    if (isLoading) {
        loginBtn.disabled = true;
        loginSpinner.classList.remove('d-none');
        loginText.textContent = 'Daxil olunur...';
    } else {
        loginBtn.disabled = false;
        loginSpinner.classList.add('d-none');
        loginText.textContent = 'Daxil Ol';
    }
};

// Check if user is already logged in
const checkAuthStatus = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard.html';
    }
};

// Handle Login
const handleLogin = async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const remember = rememberCheckbox.checked;
    
    // Validate inputs
    if (!email || !password) {
        showAlert('Zəhmət olmasa email və şifrəni daxil edin');
        return;
    }
    
    // Set loading state
    setLoading(true);
    
    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token based on remember me option
            if (remember) {
                localStorage.setItem('token', data.token);
            } else {
                sessionStorage.setItem('token', data.token);
            }
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            showAlert('Uğurla daxil oldunuz!', 'success');
            
            // Redirect to admin dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/admin/dashboard.html';
            }, 1000);
            
        } else {
            throw new Error(data.message || 'Giriş uğursuz oldu');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Giriş uğursuz oldu. Yenidən cəhd edin.');
        setLoading(false);
    }
};

// Initialize
const init = () => {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Add event listener to login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
};

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);