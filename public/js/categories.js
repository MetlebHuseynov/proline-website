// Categories page functionality
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const categoriesContainer = document.getElementById('categories-container');
const loadingSpinner = document.getElementById('loading-spinner');

// State
let categories = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
});

// Load categories from API
async function loadCategories() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/categories`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Kateqoriyalar yüklənərkən xəta baş verdi');
    } finally {
        showLoading(false);
    }
}

// Display categories
function displayCategories(categories) {
    if (!categories || categories.length === 0) {
        categoriesContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Hal-hazırda heç bir kateqoriya mövcud deyil.
                </div>
            </div>
        `;
        return;
    }

    const categoriesHTML = categories.map(category => {
        const imageUrl = category.image ? category.image : '/images/product-placeholder.svg';
        
        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card category-card h-100 shadow-sm" data-category-id="${category.id}">
                    <div class="card-body text-center">
                        <div class="category-icon mb-3">
                            <img src="${imageUrl}" alt="${category.name}" class="category-image mb-3" 
                                 style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;"
                                 onerror="this.src='/images/product-placeholder.svg'">
                        </div>
                        <h5 class="card-title">${category.name}</h5>
                        <p class="card-text text-muted">${category.description || 'Kateqoriya təsviri mövcud deyil'}</p>
                        <a href="/products.html?category=${category.id}" class="btn btn-primary">Məhsulları Gör</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    categoriesContainer.innerHTML = categoriesHTML;
}

// Show loading state
function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    
    if (show) {
        categoriesContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yüklənir...</span>
                </div>
                <p class="mt-3 text-muted">Kateqoriyalar yüklənir...</p>
            </div>
        `;
    }
}

// Show error message
function showError(message) {
    categoriesContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <br>
                <button class="btn btn-outline-danger btn-sm mt-2" onclick="loadCategories()">
                    <i class="fas fa-redo me-1"></i>Yenidən Cəhd Et
                </button>
            </div>
        </div>
    `;
}

// Add category click event listener
document.addEventListener('click', function(e) {
    const categoryCard = e.target.closest('.category-card');
    if (categoryCard && !e.target.closest('a')) {
        const categoryId = categoryCard.dataset.categoryId;
        if (categoryId) {
            window.location.href = `/products.html?category=${categoryId}`;
        }
    }
});