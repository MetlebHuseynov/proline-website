// DOM Elements
const brandsContainer = document.getElementById('brands-container');
const noBrandsFound = document.getElementById('no-brands-found');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');

// API URLs
const API_URL = window.ProLine.API_URL;
const BRANDS_URL = `${API_URL}/brands`;

// State variables
let allBrands = [];
let filteredBrands = [];
let currentPage = 1;
let brandsPerPage = 12;
let totalPages = 0;
let currentSort = 'name_asc';
let currentSearch = '';

// Utility functions
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
        search: urlParams.get('search')
    };
}

// Load all brands
async function loadBrands() {
    try {
        const response = await fetch(BRANDS_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load brands');
        }
        
        allBrands = await response.json();
        
        // Check for URL parameters
        const params = getUrlParams();
        if (params.search) {
            currentSearch = params.search;
            searchInput.value = currentSearch;
        }
        
        // Apply filters and sort
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading brands:', error);
        showAlert('Markalar yüklənə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.');
    }
}

// Apply filters and sort
function applyFiltersAndSort() {
    // Filter brands
    filteredBrands = allBrands.filter(brand => {
        const matchesSearch = currentSearch === '' || 
            brand.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (brand.description && brand.description.toLowerCase().includes(currentSearch.toLowerCase()));
            
        return matchesSearch;
    });
    
    // Sort brands
    filteredBrands.sort((a, b) => {
        switch (currentSort) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return a.name.localeCompare(b.name);
        }
    });
    
    // Calculate total pages
    totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
    
    // Reset to first page when filters change
    currentPage = 1;
    
    // Display brands and pagination
    displayBrands();
    displayPagination();
    
    // Update brand count
    document.getElementById('brand-count').textContent = filteredBrands.length;
}

// Display brands
function displayBrands() {
    // Clear brands container
    brandsContainer.innerHTML = '';
    
    if (filteredBrands.length === 0) {
        noBrandsFound.classList.remove('d-none');
        pagination.innerHTML = '';
        return;
    }
    
    noBrandsFound.classList.add('d-none');
    
    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * brandsPerPage;
    const endIndex = Math.min(startIndex + brandsPerPage, filteredBrands.length);
    
    // Display brands for current page
    for (let i = startIndex; i < endIndex; i++) {
        const brand = filteredBrands[i];
        
        const brandCard = document.createElement('div');
        brandCard.className = 'col-md-6 col-lg-4 mb-4';
        brandCard.innerHTML = `
            <div class="card h-100 brand-card">
                <img src="${brand.logo || '/images/brand-placeholder.svg'}" class="card-img-top" alt="${brand.name}">
                <div class="card-body text-center">
                    <h5 class="card-title">${brand.name}</h5>
                    <p class="card-text">${brand.description || 'No description available'}</p>
                    <a href="/brand.html?id=${brand._id}" class="btn btn-primary">View Products</a>
                </div>
                <div class="card-footer bg-transparent text-center">
                    <small class="text-muted">
                        ${brand.origin ? `<i class="fas fa-map-marker-alt me-1"></i>${brand.origin}` : ''}
                        ${brand.established ? `<i class="fas fa-calendar-alt ms-2 me-1"></i>Est. ${brand.established}` : ''}
                    </small>
                </div>
            </div>
        `;
        
        brandsContainer.appendChild(brandCard);
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
            displayBrands();
            displayPagination();
            window.scrollTo(0, document.querySelector('.brands-section').offsetTop - 100);
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
            displayBrands();
            displayPagination();
            window.scrollTo(0, document.querySelector('.brands-section').offsetTop - 100);
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
            displayBrands();
            displayPagination();
            window.scrollTo(0, document.querySelector('.brands-section').offsetTop - 100);
        }
    });
    pagination.appendChild(nextLi);
}

// Update URL with current filters
function updateURL() {
    const params = new URLSearchParams();
    
    if (currentSearch) {
        params.set('search', currentSearch);
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newURL);
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBrands();
});