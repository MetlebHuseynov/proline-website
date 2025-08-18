/**
 * Main JavaScript for Admin Panel
 */

// DOM Elements
const sidebarToggle = document.getElementById('sidebar-toggle');
const logoutBtn = document.getElementById('logout-btn');
const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
const userNameElement = document.getElementById('user-name');

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:3000/api'
};

// Use CONFIG for API URL
const AUTH_URL = `${CONFIG.API_URL}/auth`;

// Utility Functions
const showAlert = (message, type = 'danger', container = 'alert-container') => {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 2
    }).format(amount);
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Auth Functions
const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Check if token is expired
const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Token parsing error:', error);
        return true;
    }
};

// Check token validity and show warning if needed
const checkTokenValidity = () => {
    const token = getAuthToken();
    
    if (!token || isTokenExpired(token)) {
        showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
        setTimeout(() => {
            logout();
        }, 3000);
        return false;
    }
    
    return true;
};

const checkAuth = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '/admin/login.html';
        return false;
    }
    
    // Set user name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    
    return true;
};

const logout = () => {
    // Clear tokens and user data
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/admin/login.html';
};

// API Request Helper
// Token refresh function
const refreshToken = async () => {
    try {
        const token = getAuthToken();
        if (!token) return null;
        
        const response = await fetch(`${AUTH_URL}/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const newToken = data.token;
            
            // Update token in storage
            if (localStorage.getItem('token')) {
                localStorage.setItem('token', newToken);
            } else if (sessionStorage.getItem('token')) {
                sessionStorage.setItem('token', newToken);
            }
            
            return newToken;
        }
        
        return null;
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
};

const apiRequest = async (url, method = 'GET', data = null) => {
    // Check token validity before making request
    checkTokenValidity();
    
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        let response = await fetch(url, options);
        
        // If unauthorized, try to refresh token once
        if (response.status === 401) {
            const newToken = await refreshToken();
            
            if (newToken) {
                // Retry request with new token
                options.headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, options);
                
                if (response.ok) {
                    return await response.json();
                }
            }
            
            // If refresh failed or second request failed, logout
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                logout();
            }, 2000);
            return null;
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API sorğusu uğursuz oldu');
        }
        
        return result;
    } catch (error) {
        console.error('API request error:', error);
        
        // Check if it's a token-related error
        if (error.message && error.message.includes('token')) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            showAlert(error.message || 'Məlumatlar alınarkən xəta baş verdi');
        }
        return null;
    }
};

// Event Listeners
const setupEventListeners = () => {
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
        });
    }
    
    // Logout buttons
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
};

// Initialize
const init = () => {
    // Check authentication
    if (!checkAuth()) return;
    
    // Setup event listeners
    setupEventListeners();
};

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);