/*
 * Global configuration for ProLine website
 */

// Check if window.ProLine already exists to avoid redeclaration
if (typeof window.ProLine === 'undefined') {
    window.ProLine = {
        API_URL: 'http://localhost:5000/api',
        PRODUCTS_URL: 'http://localhost:5000/api/products',
        BRANDS_URL: 'http://localhost:5000/api/brands',
        CATEGORIES_URL: 'http://localhost:5000/api/categories',
        USERS_URL: 'http://localhost:5000/api/users',
        AUTH_URL: 'http://localhost:5000/api/auth'
    };
}