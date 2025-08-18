// DOM Elements
const markaContainer = document.getElementById('marka-container');
const noMarkaFound = document.getElementById('no-marka-found');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');

// API URLs
const API_URL = window.ProLine.API_URL;
const MARKA_URL = `${API_URL}/markas`;

// State variables
let allMarka = [];
let filteredMarka = [];
let currentPage = 1;
let markaPerPage = 12;
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

// Load all marka
async function loadMarka() {
    try {
        const response = await fetch(MARKA_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load marka');
        }
        
        allMarka = await response.json();
        
        // Check for URL parameters
        const params = getUrlParams();
        if (params.search) {
            currentSearch = params.search;
            searchInput.value = currentSearch;
        }
        
        // Apply filters and sort
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading marka:', error);
        showAlert('Markalar yüklənə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.');
    }
}

// Apply filters and sort
function applyFiltersAndSort() {
    // Filter marka
    filteredMarka = allMarka.filter(marka => {
        const matchesSearch = currentSearch === '' || 
            marka.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (marka.description && marka.description.toLowerCase().includes(currentSearch.toLowerCase()));
            
        return matchesSearch;
    });
    
    // Sort marka
    filteredMarka.sort((a, b) => {
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
    totalPages = Math.ceil(filteredMarka.length / markaPerPage);
    
    // Reset to first page when filters change
    currentPage = 1;
    
    // Display marka and pagination
    displayMarka();
    displayPagination();
    
    // Update marka count
    document.getElementById('marka-count').textContent = filteredMarka.length;
}

// Display marka
function displayMarka() {
    // Clear marka container
    markaContainer.innerHTML = '';
    
    if (filteredMarka.length === 0) {
        noMarkaFound.classList.remove('d-none');
        pagination.innerHTML = '';
        return;
    }
    
    noMarkaFound.classList.add('d-none');
    
    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * markaPerPage;
    const endIndex = Math.min(startIndex + markaPerPage, filteredMarka.length);
    
    // Display marka for current page
    for (let i = startIndex; i < endIndex; i++) {
        const marka = filteredMarka[i];
        
        const markaCard = document.createElement('div');
        markaCard.className = 'col-md-6 col-lg-4 mb-4';
        markaCard.innerHTML = `
            <div class="card h-100 marka-card">
                <img src="${marka.logo || '/images/marka-placeholder.svg'}" class="card-img-top" alt="${marka.name}">
                <div class="card-body text-center">
                    <h5 class="card-title">${marka.name}</h5>
                    <p class="card-text">${marka.description || 'No description available'}</p>
                    <a href="/marka.html?id=${marka._id}" class="btn btn-primary">View Products</a>
                </div>
                <div class="card-footer bg-transparent text-center">
                    <small class="text-muted">
                        ${marka.origin ? `<i class="fas fa-map-marker-alt me-1"></i>${marka.origin}` : ''}
                        ${marka.established ? `<i class="fas fa-calendar-alt ms-2 me-1"></i>Est. ${marka.established}` : ''}
                    </small>
                </div>
            </div>
        `;
        
        markaContainer.appendChild(markaCard);
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
            displayMarka();
            displayPagination();
            window.scrollTo(0, document.querySelector('.marka-section').offsetTop - 100);
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
            displayMarka();
            displayPagination();
            window.scrollTo(0, document.querySelector('.marka-section').offsetTop - 100);
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
            displayMarka();
            displayPagination();
            window.scrollTo(0, document.querySelector('.marka-section').offsetTop - 100);
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
    loadMarka();
});