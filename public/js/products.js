// DOM Elements
const productsContainer = document.getElementById('products-container');
const categoriesContainer = document.getElementById('categories-container');
const filterSection = document.getElementById('filter-section');
const pageTitle = document.getElementById('page-title');
const pageDescription = document.getElementById('page-description');
const backToCategoriesBtn = document.getElementById('back-to-categories-btn');
const noProductsFound = document.getElementById('no-products-found');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const categoriesFilter = document.getElementById('categories-filter');
const markaFilter = document.getElementById('marka-filter');
const priceRangeMin = document.getElementById('min-price');
const priceRangeMax = document.getElementById('max-price');
const priceFilterBtn = document.getElementById('price-filter-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

// API URLs
const API_URL = window.ProLine.API_URL;
const PRODUCTS_URL = `${API_URL}/products`;
const CATEGORIES_URL = `${API_URL}/categories`;
const MARKA_URL = `${API_URL}/markas`;

// State variables
let allProducts = [];
let allCategories = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 12;
let totalPages = 0;
let currentSort = 'name_asc';
let currentSearch = '';
let currentCategory = '';
let currentMarka = '';
let currentPriceMin = '';
let currentPriceMax = '';
let showingCategories = false;

// Utility functions
function localShowAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        console.error('Alert container not found');
        return;
    }

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
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// formatCurrency is defined in main.js

// Auto dismiss after 5 seconds for alerts
function dismissAlert(alertDiv) {
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Show/hide sections based on current view
function toggleSections() {
    const categoriesSection = document.getElementById('categories-section');
    const filterSection = document.getElementById('filter-section');
    const productsContainer = document.getElementById('products-container');
    const noProductsFound = document.getElementById('no-products-found');
    const pagination = document.getElementById('pagination');
    
    if (showingCategories) {
        categoriesSection.style.display = 'block';
        filterSection.style.display = 'none';
        productsContainer.style.display = 'none';
        if (noProductsFound) noProductsFound.style.display = 'none';
        if (pagination) pagination.style.display = 'none';
    } else {
        categoriesSection.style.display = 'none';
        filterSection.style.display = 'block';
        productsContainer.style.display = 'block';
    }
}

// Get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        category: urlParams.get('category'),
        marka: urlParams.get('brand'),
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
            // If category parameter exists, show products for that category
            currentCategory = params.category;
            showingCategories = false;
            
            // Find category name
            const category = allCategories.find(cat => cat.id === params.category);
            if (category) {
                selectCategory(params.category, category.name);
            } else {
                // If category not found, just apply filters
                applyFiltersAndSort();
            }
        } else {
            // Show all products by default
            showingCategories = false;
        }
        
        if (params.marka) {
            currentMarka = params.marka;
            if (markaFilter) markaFilter.value = currentMarka;
        }
        
        if (params.search) {
            currentSearch = params.search;
            if (searchInput) searchInput.value = currentSearch;
        }
        
        // Apply filters and sort only if showing products
        if (!showingCategories) {
            applyFiltersAndSort();
        } else {
            // Show categories if no specific category is selected
            displayCategories();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        if (typeof showAlert === 'function') {
            showAlert('Məhsullar yüklənə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.');
        } else {
            localShowAlert('Məhsullar yüklənə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.');
        }
    }
}

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch(CATEGORIES_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load categories');
        }
        
        allCategories = await response.json();
        
        // Populate category filter
        if (categoriesFilter) {
            categoriesFilter.innerHTML = '<option value="">Bütün Kateqoriyalar</option>';
        }
        if (categoriesFilter) {
            allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoriesFilter.appendChild(option);
            });
        }
        
        // Set selected category if in URL params
        const params = getUrlParams();
        if (params.category) {
            categoriesFilter.value = params.category;
        }
        
        // Display categories if showing categories
        if (showingCategories) {
            displayCategories();
        }
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display categories
function displayCategories() {
    if (!categoriesContainer) {
        console.error('Categories container not found!');
        return;
    }
    
    categoriesContainer.innerHTML = '';
    
    if (allCategories.length === 0) {
        categoriesContainer.innerHTML = '<div class="col-12 text-center py-5"><p>Kateqoriya tapılmadı.</p></div>';
        return;
    }
    
    // Dynamic category icons mapping - covers more categories
    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            'Alüminium Profil': 'fas fa-window-maximize',
            'Armatur və Metal': 'fas fa-hammer',
            'Çimento və Beton': 'fas fa-cube',
            'İzolyasiya': 'fas fa-shield-alt',
            'Kafel və Keramika': 'fas fa-th',
            'Kərpic və Blok': 'fas fa-building',
            'Qaynaq Materialları': 'fas fa-fire',
            'Çelik Məhsulları': 'fas fa-industry',
            'Tikinti Materialları': 'fas fa-hammer',
            'Elektrik Avadanlıqları': 'fas fa-bolt',
            'Mexaniki Hissələr': 'fas fa-cogs'
        };
        
        // Return specific icon or default based on category name keywords
        if (iconMap[categoryName]) {
            return iconMap[categoryName];
        }
        
        // Fallback based on keywords in category name
        const name = categoryName.toLowerCase();
        if (name.includes('çelik') || name.includes('metal')) return 'fas fa-industry';
        if (name.includes('elektrik') || name.includes('kabel')) return 'fas fa-bolt';
        if (name.includes('tikinti') || name.includes('inşaat')) return 'fas fa-hammer';
        if (name.includes('beton') || name.includes('çimento')) return 'fas fa-cube';
        if (name.includes('qaynaq') || name.includes('kaynak')) return 'fas fa-fire';
        
        return 'fas fa-cube'; // Default icon
    };
    
    allCategories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'col-lg-4 col-md-6 mb-4';
        
        // Use image if available, otherwise use dynamic icon
        const iconHtml = category.image 
            ? `<img src="${category.image}" alt="${category.name}" class="category-image mb-3" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;">` 
            : `<i class="${getCategoryIcon(category.name)}" fa-3x text-primary"></i>`;
        
        categoryCard.innerHTML = `
            <div class="card category-card h-100 shadow-sm" data-category-id="${category.id}">
                <div class="card-body text-center">
                    <div class="category-icon mb-3">
                        ${iconHtml}
                    </div>
                    <h5 class="card-title">${category.name}</h5>
                    <p class="card-text text-muted">${category.description || ''}</p>
                    <a href="#" class="btn btn-primary">Məhsulları Gör</a>
                </div>
            </div>
        `;
        
        // Add click event to category card
        categoryCard.addEventListener('click', (e) => {
            e.preventDefault();
            selectCategory(category.id, category.name);
        });
        
        categoriesContainer.appendChild(categoryCard);
    });
}

// Select category and show products
function selectCategory(categoryId, categoryName) {
    console.log('Selecting category:', categoryId, categoryName);
    
    // Update page title and description
    if (pageTitle && categoryName) {
        pageTitle.textContent = categoryName;
    }
    if (pageDescription && categoryName) {
        pageDescription.textContent = `${categoryName} kateqoriyasındakı məhsullar`;
    }
    
    // Show filter section and product container, hide categories
    if (filterSection) {
        filterSection.style.display = 'block';
    }
    if (productsContainer) {
        productsContainer.style.display = 'block';
    }
    if (categoriesContainer) {
        categoriesContainer.style.display = 'none';
    }
    
    // Set category filter and update state
    currentCategory = categoryId;
    showingCategories = false;
    currentPage = 1; // Reset to first page
    
    if (categoriesFilter) {
        categoriesFilter.value = categoryId;
    }
    
    // Update URL
    updateURL();
    
    // Load products for this category
    applyFiltersAndSort();
}

// Go back to categories
function goBackToCategories() {
    // Redirect to categories page
    window.location.href = '/categories.html';
}

// Load marka for filter
async function loadMarkaForFilter() {
    try {
        const response = await fetch(MARKA_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load marka');
        }
        
        const markas = await response.json();
        
        // Populate marka filter
        if (markaFilter) {
            markas.forEach(marka => {
                const option = document.createElement('option');
                option.value = marka._id;
                option.textContent = marka.name;
                markaFilter.appendChild(option);
            });
        }
        
        // Set selected marka if in URL params
        const params = getUrlParams();
        if (params.marka) {
            markaFilter.value = params.marka;
        }
        
    } catch (error) {
        console.error('Error loading marka:', error);
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
            (product.category && (product.category.id == currentCategory || product.category._id == currentCategory));
            
        const matchesMarka = currentMarka === '' || 
            (product.brand && (product.brand.id == currentMarka || product.brand._id == currentMarka));
            
        const matchesPriceMin = currentPriceMin === '' || 
            product.price >= parseFloat(currentPriceMin);
            
        const matchesPriceMax = currentPriceMax === '' || 
            product.price <= parseFloat(currentPriceMax);
            
        return matchesSearch && matchesCategory && matchesMarka && matchesPriceMin && matchesPriceMax;
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
    const productCountElement = document.getElementById('product-count');
    if (productCountElement) {
        productCountElement.textContent = filteredProducts.length;
    }
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
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <small class="text-muted">
                        ${product.brand ? `<a href="/brand.html?id=${product.brand.id || product.brand._id}">${product.brand.name}</a>` : 'No brand'} | 
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
    currentMarka = '';
    currentPriceMin = '';
    currentPriceMax = '';
    currentSearch = '';
    currentSort = 'name_asc';
    
    // Reset form elements
    categoryFilter.value = '';
    markaFilter.value = '';
    priceRangeMin.value = '';
    priceRangeMax.value = '';
    searchInput.value = '';
    sortSelect.value = 'name_asc';
    
    // Apply filters and update URL
    applyFiltersAndSort();
    updateURL();
}

// Event listeners - only add if elements exist
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        applyFiltersAndSort();
        updateURL();
    });
}

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value.trim();
            applyFiltersAndSort();
            updateURL();
        }
    });
}

if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        applyFiltersAndSort();
    });
}

if (priceFilterBtn) {
    priceFilterBtn.addEventListener('click', () => {
        currentCategory = categoriesFilter.value;
        currentMarka = markaFilter.value;
        currentPriceMin = priceRangeMin.value;
        currentPriceMax = priceRangeMax.value;
        
        applyFiltersAndSort();
        updateURL();
    });
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', resetFilters);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = getUrlParams();
    
    // Always load products and filters
    await loadProducts();
    await loadCategories();
    await loadMarkaForFilter();
    
    if (urlParams.category) {
        // If category is specified, show products for that category
        const category = allCategories.find(cat => cat.id === urlParams.category);
        if (category) {
            selectCategory(urlParams.category, category.name);
        } else {
            // If category not found, show all products
            showingCategories = false;
            toggleSections();
            applyFiltersAndSort();
        }
    } else {
        // Show all products by default
        showingCategories = false;
        toggleSections();
        applyFiltersAndSort();
        displayProducts();
        displayPagination();
    }
    
    // Back to categories button
    if (backToCategoriesBtn) {
        backToCategoriesBtn.addEventListener('click', goBackToCategories);
    }
});