// DOM Elements
const brandLoading = document.getElementById('brand-loading');
const brandNotFound = document.getElementById('brand-not-found');
const brandInfo = document.getElementById('brand-info');
const brandProductsSection = document.getElementById('brand-products-section');
const brandStorySection = document.getElementById('brand-story-section');
const brandNameBreadcrumb = document.getElementById('brand-name-breadcrumb');
const brandLogo = document.getElementById('brand-logo');
const brandName = document.getElementById('brand-name');
const brandNameTitle = document.getElementById('brand-name-title');
const brandNameAbout = document.getElementById('brand-name-about');
const brandDescription = document.getElementById('brand-description');
const brandWebsite = document.getElementById('brand-website');
const brandOrigin = document.getElementById('brand-origin');
const brandEstablished = document.getElementById('brand-established');
const brandStory = document.getElementById('brand-story');
const brandProducts = document.getElementById('brand-products');
const noProductsFound = document.getElementById('no-products-found');
const otherBrands = document.getElementById('other-brands');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const categoryFilter = document.getElementById('category-filter');
const pagination = document.getElementById('pagination');

// API URLs
const API_URL = window.ProLine.API_URL;
const BRANDS_URL = `${API_URL}/brands`;
const PRODUCTS_URL = `${API_URL}/products`;
const CATEGORIES_URL = `${API_URL}/categories`;

// State variables
let currentBrand = null;
let currentPage = 1;
let productsPerPage = 8;
let totalPages = 0;
let currentSort = 'name_asc';
let currentSearch = '';
let currentCategory = '';
let allProducts = [];
let filteredProducts = [];

// Utility functions (using global functions from main.js)
// formatCurrency is defined in main.js

function showAlert(message, type = 'danger') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.container').prepend(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        id: urlParams.get('id')
    };
}

// Load brand details
async function loadBrandDetails() {
    const { id } = getUrlParams();
    
    if (!id) {
        showBrandNotFound();
        return;
    }
    
    try {
        const response = await fetch(`${BRANDS_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error('Brand not found');
        }
        
        const brand = await response.json();
        currentBrand = brand;
        
        // Update document title
        document.title = `${brand.name} - ProLine`;
        
        // Update brand info
        brandNameBreadcrumb.textContent = brand.name;
        brandName.textContent = brand.name;
        brandNameTitle.textContent = brand.name;
        brandNameAbout.textContent = brand.name;
        brandDescription.textContent = brand.description || 'No description available';
        
        if (brand.logo) {
            brandLogo.src = brand.logo;
        }
        
        if (brand.website) {
            brandWebsite.textContent = brand.website;
            brandWebsite.href = brand.website.startsWith('http') ? brand.website : `https://${brand.website}`;
        } else {
            brandWebsite.parentElement.classList.add('d-none');
        }
        
        if (brand.origin) {
            brandOrigin.textContent = brand.origin;
        } else {
            brandOrigin.parentElement.classList.add('d-none');
        }
        
        if (brand.established) {
            brandEstablished.textContent = brand.established;
        } else {
            brandEstablished.parentElement.classList.add('d-none');
        }
        
        if (brand.story) {
            brandStory.innerHTML = brand.story;
            brandStorySection.classList.remove('d-none');
        }
        
        // Show brand info
        brandLoading.classList.add('d-none');
        brandInfo.classList.remove('d-none');
        brandProductsSection.classList.remove('d-none');
        
        // Load brand products
        await loadBrandProducts();
        
        // Load categories for filter
        await loadCategories();
        
        // Load other brands
        await loadOtherBrands();
        
    } catch (error) {
        console.error('Error loading brand details:', error);
        showBrandNotFound();
    }
}

// Show brand not found message
function showBrandNotFound() {
    brandLoading.classList.add('d-none');
    brandNotFound.classList.remove('d-none');
    document.title = 'Marka Tapılmadı - ProLine';
}

// Load brand products
async function loadBrandProducts() {
    try {
        const response = await fetch(`${PRODUCTS_URL}?brand=${currentBrand._id}`);
        
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        
        allProducts = await response.json();
        
        // Apply filters and sort
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading brand products:', error);
        showAlert('Məhsullar yüklənə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.');
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
            
        return matchesSearch && matchesCategory;
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
}

// Display products
function displayProducts() {
    // Clear products container
    brandProducts.innerHTML = '';
    
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
        productCard.className = 'col-md-6 col-lg-3 mb-4';
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
            </div>
        `;
        
        brandProducts.appendChild(productCard);
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
            window.scrollTo(0, brandProductsSection.offsetTop - 100);
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
            window.scrollTo(0, brandProductsSection.offsetTop - 100);
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
            window.scrollTo(0, brandProductsSection.offsetTop - 100);
        }
    });
    pagination.appendChild(nextLi);
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
            categoryFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load other brands
async function loadOtherBrands() {
    try {
        const response = await fetch(BRANDS_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load brands');
        }
        
        const brands = await response.json();
        
        // Filter out current brand and limit to 4 brands
        const otherBrandsList = brands
            .filter(brand => brand._id !== currentBrand._id)
            .slice(0, 4);
        
        // Clear other brands container
        otherBrands.innerHTML = '';
        
        if (otherBrandsList.length === 0) {
            otherBrands.innerHTML = '<div class="col-12 text-center"><p>No other brands available.</p></div>';
            return;
        }
        
        // Display other brands
        otherBrandsList.forEach(brand => {
            const brandCard = document.createElement('div');
            brandCard.className = 'col-md-6 col-lg-3 mb-4';
            brandCard.innerHTML = `
                <div class="card h-100 brand-card">
                    <img src="${brand.logo || '/images/brand-placeholder.svg'}" class="card-img-top" alt="${brand.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title">${brand.name}</h5>
                        <p class="card-text text-truncate">${brand.description || 'Təsvir mövcud deyil'}</p>
                        <a href="/brand.html?id=${brand._id}" class="btn btn-outline-primary">Məhsulları Gör</a>
                    </div>
                </div>
            `;
            
            otherBrands.appendChild(brandCard);
        });
        
    } catch (error) {
        console.error('Error loading other brands:', error);
        otherBrands.innerHTML = '<div class="col-12 text-center"><p>Digər markalar yüklənə bilmədi.</p></div>';
    }
}

// Event listeners
searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    applyFiltersAndSort();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        applyFiltersAndSort();
    }
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    applyFiltersAndSort();
});

categoryFilter.addEventListener('change', () => {
    currentCategory = categoryFilter.value;
    applyFiltersAndSort();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBrandDetails();
});