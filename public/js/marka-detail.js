// DOM Elements
const markaLoading = document.getElementById('marka-loading');
const markaNotFound = document.getElementById('marka-not-found');
const markaInfo = document.getElementById('marka-info');
const markaProductsSection = document.getElementById('marka-products-section');
const markaStorySection = document.getElementById('marka-story-section');
const markaNameBreadcrumb = document.getElementById('marka-name-breadcrumb');
const markaLogo = document.getElementById('marka-logo');
const markaName = document.getElementById('marka-name');
const markaNameTitle = document.getElementById('marka-name-title');
const markaNameAbout = document.getElementById('marka-name-about');
const markaDescription = document.getElementById('marka-description');
const markaWebsite = document.getElementById('marka-website');
const markaOrigin = document.getElementById('marka-origin');
const markaEstablished = document.getElementById('marka-established');
const markaStory = document.getElementById('marka-story');
const markaProducts = document.getElementById('marka-products');
const noProductsFound = document.getElementById('no-products-found');
const otherMarkas = document.getElementById('other-markas');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const categoryFilter = document.getElementById('category-filter');
const pagination = document.getElementById('pagination');

// API URLs
const API_URL = window.ProLine.API_URL;
const MARKAS_URL = `${API_URL}/markas`;
const PRODUCTS_URL = `${API_URL}/products`;
const CATEGORIES_URL = `${API_URL}/categories`;

// State variables
let currentMarka = null;
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

// Load marka details
async function loadMarkaDetails() {
    const { id } = getUrlParams();
    
    if (!id) {
        showMarkaNotFound();
        return;
    }
    
    try {
        const response = await fetch(`${MARKAS_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error('Marka not found');
        }
        
        const marka = await response.json();
        currentMarka = marka;
        
        // Update document title
        document.title = `${marka.name} - ProLine`;
        
        // Update marka info
        markaNameBreadcrumb.textContent = marka.name;
        markaName.textContent = marka.name;
        markaNameTitle.textContent = marka.name;
        markaNameAbout.textContent = marka.name;
        markaDescription.textContent = marka.description || 'No description available';
        
        if (marka.logo) {
            markaLogo.src = marka.logo;
        }
        
        if (marka.website) {
            markaWebsite.textContent = marka.website;
            markaWebsite.href = marka.website.startsWith('http') ? marka.website : `https://${marka.website}`;
        } else {
            markaWebsite.parentElement.classList.add('d-none');
        }
        
        if (marka.origin) {
            markaOrigin.textContent = marka.origin;
        } else {
            markaOrigin.parentElement.classList.add('d-none');
        }
        
        if (marka.established) {
            markaEstablished.textContent = marka.established;
        } else {
            markaEstablished.parentElement.classList.add('d-none');
        }
        
        if (marka.story) {
            markaStory.innerHTML = marka.story;
            markaStorySection.classList.remove('d-none');
        }
        
        // Show marka info
        markaLoading.classList.add('d-none');
        markaInfo.classList.remove('d-none');
        markaProductsSection.classList.remove('d-none');
        
        // Load marka products
        await loadMarkaProducts();
        
        // Load categories for filter
        await loadCategories();
        
        // Load other markas
        await loadOtherMarkas();
        
    } catch (error) {
        console.error('Error loading marka details:', error);
        showMarkaNotFound();
    }
}

// Show marka not found message
function showMarkaNotFound() {
    markaLoading.classList.add('d-none');
    markaNotFound.classList.remove('d-none');
    document.title = 'Marka Tapılmadı - ProLine';
}

// Load marka products
async function loadMarkaProducts() {
    try {
        const response = await fetch(`${PRODUCTS_URL}?marka=${currentMarka._id}`);
        
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        
        allProducts = await response.json();
        
        // Apply filters and sort
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading marka products:', error);
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
    markaProducts.innerHTML = '';
    
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
                    </div>
                </div>
            </div>
        `;
        
        markaProducts.appendChild(productCard);
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
            window.scrollTo(0, markaProductsSection.offsetTop - 100);
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
            window.scrollTo(0, markaProductsSection.offsetTop - 100);
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
            window.scrollTo(0, markaProductsSection.offsetTop - 100);
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

// Load other markas
async function loadOtherMarkas() {
    try {
        const response = await fetch(MARKAS_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load markas');
        }
        
        const markas = await response.json();
        
        // Filter out current marka and limit to 4 markas
        const otherMarkasList = markas
            .filter(marka => marka._id !== currentMarka._id)
            .slice(0, 4);
        
        // Clear other markas container
        otherMarkas.innerHTML = '';
        
        if (otherMarkasList.length === 0) {
            otherMarkas.innerHTML = '<div class="col-12 text-center"><p>No other markas available.</p></div>';
            return;
        }
        
        // Display other markas
        otherMarkasList.forEach(marka => {
            const markaCard = document.createElement('div');
            markaCard.className = 'col-md-6 col-lg-3 mb-4';
            markaCard.innerHTML = `
                <div class="card h-100 marka-card">
                    <img src="${marka.logo || '/images/marka-placeholder.svg'}" class="card-img-top" alt="${marka.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title">${marka.name}</h5>
                        <p class="card-text text-truncate">${marka.description || 'Təsvir mövcud deyil'}</p>
                        <a href="/marka.html?id=${marka._id}" class="btn btn-outline-primary">Məhsulları Gör</a>
                    </div>
                </div>
            `;
            
            otherMarkas.appendChild(markaCard);
        });
        
    } catch (error) {
        console.error('Error loading other markas:', error);
        otherMarkas.innerHTML = '<div class="col-12 text-center"><p>Digər markalar yüklənə bilmədi.</p></div>';
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
    loadMarkaDetails();
});