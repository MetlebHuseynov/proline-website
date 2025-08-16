/*
 * Global configuration for ProLine website
 */

// Check if window.ProLine already exists to avoid redeclaration
if (typeof window.ProLine === 'undefined') {
    // Detect environment and set appropriate API URLs
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const baseURL = isProduction ? 'https://proline-website.onrender.com' : 'http://localhost:3000';
    
    window.ProLine = {
        API_URL: `${baseURL}/api`,
        PRODUCTS_URL: `${baseURL}/api/products`,
        BRANDS_URL: `${baseURL}/api/brands`,
        CATEGORIES_URL: `${baseURL}/api/categories`,
        USERS_URL: `${baseURL}/api/users`,
        AUTH_URL: `${baseURL}/api/auth`
    };
}