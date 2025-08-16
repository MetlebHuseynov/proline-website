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

// Auto-detect environment for API URL
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';
const AUTH_URL = `${API_URL}/auth`;

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
const apiRequest = async (url, method = 'GET', data = null) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
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
        const response = await fetch(url, options);
        
        // If unauthorized, redirect to login
        if (response.status === 401) {
            logout();
            return null;
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API sorğusu uğursuz oldu');
        }
        
        return result;
    } catch (error) {
        console.error('API request error:', error);
        showAlert(error.message || 'Məlumatlar alınarkən xəta baş verdi');
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