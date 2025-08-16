/*
 * Global configuration for ProLine website
 */

// Check if window.ProLine already exists to avoid redeclaration
if (typeof window.ProLine === 'undefined') {
    window.ProLine = {
        API_URL: 'https://proline-website.onrender.com/api',
        PRODUCTS_URL: 'https://proline-website.onrender.com/api/products',
        BRANDS_URL: 'https://proline-website.onrender.com/api/brands',
        CATEGORIES_URL: 'https://proline-website.onrender.com/api/categories',
        USERS_URL: 'https://proline-website.onrender.com/api/users',
        AUTH_URL: 'https://proline-website.onrender.com/api/auth'
    };
}