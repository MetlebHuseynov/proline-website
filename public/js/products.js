// DOM Elements
const productsContainer = document.getElementById('products-container');
const noProductsFound = document.getElementById('no-products-found');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const categoriesFilter = document.getElementById('categories-filter');
const brandsFilter = document.getElementById('brands-filter');
const priceRangeMin = document.getElementById('min-price');
const priceRangeMax = document.getElementById('max-price');
const priceFilterBtn = document.getElementById('price-filter-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

// API URLs
const API_URL = window.ProLine.API_URL;
const PRODUCTS_URL = `${API_URL}/products`;
const CATEGORIES_URL = `${API_URL}/categories`;
const BRANDS_URL = `${API_URL}/brands`;

// State variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 12;
let totalPages = 0;
let currentSort = 'name_asc';
let currentSearch = '';
let currentCategory = '';
let currentBrand = '';
let currentPriceMin = '';
let currentPriceMax = '';

// Utility functions (using global functions from main.js)
// formatCurrency and showAlert are defined in main.js

// Auto dismiss after 5 seconds for alerts
function dismissAlert(alertDiv) {
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        category: urlParams.get('category'),
        brand: urlParams.get('brand'),
        search: urlParams.get('search')
    };
}

// Load all products
async function loadProducts() {
    try {
        console.log('Loading products from:', PRODUCTS_URL);
        const response = await fetch(PRODUCTS_URL, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        
        allProducts = await response.json();
        console.log('Loaded products count:', allProducts.length);
        console.log('Products data:', allProducts);
        
        // Check for URL parameters
        const params = getUrlParams();
        if (params.category) {
            currentCategory = params.category;
            categoriesFilter.value = currentCategory;
        }
        
        if (params.brand) {
            currentBrand = params.brand;
            brandsFilter.value = currentBrand;
        }
        
        if (params.search) {
            currentSearch = params.search;
            searchInput.value = currentSearch;
        }
        
        // Apply filters and sort
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Məhsullar yüklənə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.');
    }
}

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch(CATEGORIES_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load categories');
        }
        
        const categories = await response.json();
        
        // Populate category filter
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            categoriesFilter.appendChild(option);
        });
        
        // Set selected category if in URL params
        const params = getUrlParams();
        if (params.category) {
            categoriesFilter.value = params.category;
        }
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load brands for filter
async function loadBrandsForFilter() {
    try {
        const response = await fetch(BRANDS_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load brands');
        }
        
        const brands = await response.json();
        
        // Populate brand filter
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand._id;
            option.textContent = brand.name;
            brandsFilter.appendChild(option);
        });
        
        // Set selected brand if in URL params
        const params = getUrlParams();
        if (params.brand) {
            brandsFilter.value = params.brand;
        }
        
    } catch (error) {
        console.error('Error loading brands:', error);
    }
}

// Apply filters and sort
function applyFiltersAndSort() {
    // Filter products
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = currentSearch === '' || 
            product.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(currentSearch.toLowerCase()));
            
        const matchesCategory = currentCategory === '' || 
            (product.category && product.category._id === currentCategory);
            
        const matchesBrand = currentBrand === '' || 
            (product.brand && product.brand._id === currentBrand);
            
        const matchesPriceMin = currentPriceMin === '' || 
            product.price >= parseFloat(currentPriceMin);
            
        const matchesPriceMax = currentPriceMax === '' || 
            product.price <= parseFloat(currentPriceMax);
            
        return matchesSearch && matchesCategory && matchesBrand && matchesPriceMin && matchesPriceMax;
    });
    
    // Sort products
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return a.name.localeCompare(b.name);
        }
    });
    
    // Calculate total pages
    totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    // Reset to first page when filters change
    currentPage = 1;
    
    // Display products and pagination
    displayProducts();
    displayPagination();
    
    // Update product count
    document.getElementById('product-count').textContent = filteredProducts.length;
}

// Display products
function displayProducts() {
    // Clear products container
    productsContainer.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        noProductsFound.classList.remove('d-none');
        pagination.innerHTML = '';
        return;
    }
    
    noProductsFound.classList.add('d-none');
    
    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, filteredProducts.length);
    
    // Display products for current page
    for (let i = startIndex; i < endIndex; i++) {
        const product = filteredProducts[i];
        
        const productCard = document.createElement('div');
        productCard.className = 'col-md-6 col-lg-4 mb-4';
        productCard.innerHTML = `
            <div class="card h-100 product-card">
                <img src="${product.image || '/images/product-placeholder.svg'}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text text-truncate">${product.description || 'No description available'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="price">${formatCurrency(product.price)}</span>
                        <a href="/product.html?id=${product._id}" class="btn btn-primary btn-sm">Təfərrüatları Gör</a>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <small class="text-muted">
                        ${product.brand ? `<a href="/brand.html?id=${product.brand._id}">${product.brand.name}</a>` : 'No brand'} | 
                        ${product.category ? product.category.name : 'No category'}
                    </small>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    }
}

// Display pagination
function displayPagination() {
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayProducts();
            displayPagination();
            window.scrollTo(0, document.querySelector('.products-section').offsetTop - 100);
        }
    });
    pagination.appendChild(prevLi);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            displayProducts();
            displayPagination();
            window.scrollTo(0, document.querySelector('.products-section').offsetTop - 100);
        });
        pagination.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayProducts();
            displayPagination();
            window.scrollTo(0, document.querySelector('.products-section').offsetTop - 100);
        }
    });
    pagination.appendChild(nextLi);
}

// Update URL with current filters
function updateURL() {
    const params = new URLSearchParams();
    
    if (currentCategory) {
        params.set('category', currentCategory);
    }
    
    if (currentBrand) {
        params.set('brand', currentBrand);
    }
    
    if (currentSearch) {
        params.set('search', currentSearch);
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newURL);
}

// Reset filters
function resetFilters() {
    currentCategory = '';
    currentBrand = '';
    currentPriceMin = '';
    currentPriceMax = '';
    currentSearch = '';
    currentSort = 'name_asc';
    
    // Reset form elements
    categoryFilter.value = '';
    brandFilter.value = '';
    priceRangeMin.value = '';
    priceRangeMax.value = '';
    searchInput.value = '';
    sortSelect.value = 'name_asc';
    
    // Apply filters and update URL
    applyFiltersAndSort();
    updateURL();
}

// Event listeners
searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    applyFiltersAndSort();
    updateURL();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        applyFiltersAndSort();
        updateURL();
    }
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    applyFiltersAndSort();
});

priceFilterBtn.addEventListener('click', () => {
    currentCategory = categoriesFilter.value;
    currentBrand = brandsFilter.value;
    currentPriceMin = minPrice.value;
    currentPriceMax = maxPrice.value;
    
    applyFiltersAndSort();
    updateURL();
});

clearFiltersBtn.addEventListener('click', resetFilters);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load filter options
    await Promise.all([loadCategories(), loadBrandsForFilter()]);
    
    // Load products
    await loadProducts();
});