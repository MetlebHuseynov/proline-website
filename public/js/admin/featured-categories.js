class FeaturedCategoriesManager {
    constructor() {
        this.allCategories = [];
        this.featuredCategories = [];
        this.maxFeaturedCategories = 6;
        this.sortable = null;
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadFeaturedCategories();
        this.setupEventListeners();
        this.setupSortable();
    }

    async loadCategories() {
        try {
            if (!checkTokenValidity()) {
                return;
            }

            const response = await apiRequest('/api/categories');
            if (!response) throw new Error('Kateqoriyalar yüklənə bilmədi');
            
            this.allCategories = response;
            this.renderAvailableCategories();
            this.populateCategoryFilter();
        } catch (error) {
            console.error('Kateqoriyalar yüklənərkən xəta:', error);
            this.showAlert('Kateqoriyalar yüklənərkən xəta baş verdi', 'danger');
        }
    }

    async loadFeaturedCategories() {
        try {
            if (!checkTokenValidity()) {
                return;
            }

            const response = await apiRequest('/api/featured-categories');
            if (response) {
                this.featuredCategories = response;
                this.renderFeaturedCategories();
                this.updateFeaturedCount();
            }
        } catch (error) {
            console.error('Öne çıxan kateqoriyalar yüklənərkən xəta:', error);
        }
    }

    renderAvailableCategories(categories = this.allCategories) {
        const container = document.getElementById('available-categories');
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-tags fa-2x mb-2"></i>
                    <p>Kateqoriya tapılmadı</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(category => {
            const isFeatured = this.featuredCategories.some(fc => parseInt(fc.id) === parseInt(category.id));
            return `
                <div class="category-item ${isFeatured ? 'featured' : ''}" data-category-id="${category.id}">
                    <div class="category-info">
                        <img src="${category.image || '/images/category-placeholder.svg'}" alt="${category.name}" class="category-image">
                        <div class="category-details">
                            <h6 class="category-name">${category.name}</h6>
                            <p class="category-description">${category.description || 'Təsvir yoxdur'}</p>
                            <span class="badge bg-${category.status === 'active' ? 'success' : 'secondary'}">
                                ${category.status === 'active' ? 'Aktiv' : 'Deaktiv'}
                            </span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-primary add-to-featured" ${isFeatured ? 'disabled' : ''} onclick="featuredCategoriesManager.addToFeatured(${category.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    renderFeaturedCategories() {
        const container = document.getElementById('featured-categories');
        
        if (this.featuredCategories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-star fa-2x mb-2"></i>
                    <p>Hələ ki öne çıxan kateqoriya seçilməyib</p>
                    <small>Sol tərəfdən kateqoriya əlavə edin</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.featuredCategories.map(category => `
            <div class="featured-item" data-category-id="${category.id}">
                <div class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="category-info">
                    <img src="${category.image || '/images/category-placeholder.svg'}" alt="${category.name}" class="category-image">
                    <div class="category-details">
                        <h6 class="category-name">${category.name}</h6>
                        <p class="category-description">${category.description || 'Təsvir yoxdur'}</p>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger remove-from-featured" onclick="featuredCategoriesManager.removeFromFeatured(${category.featuredId})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        // Clear existing options except the first one
        categoryFilter.innerHTML = '<option value="">Bütün kateqoriyalar</option>';

        // Add category options
        this.allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-categories');
        searchInput.addEventListener('input', (e) => {
            this.filterCategories(e.target.value);
        });

        // Category filter functionality
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Save button
        const saveButton = document.getElementById('save-featured');
        saveButton.addEventListener('click', () => {
            this.saveFeaturedCategories();
        });
    }

    setupSortable() {
        const featuredContainer = document.getElementById('featured-categories');
        this.sortable = new Sortable(featuredContainer, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: () => {
                this.updateFeaturedOrder();
                this.enableSaveButton();
            }
        });
    }

    filterCategories(searchTerm) {
        const categoryFilter = document.getElementById('category-filter');
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        let filtered = this.allCategories;
        
        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(category => category.id == selectedCategory);
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(category => 
                category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        this.renderAvailableCategories(filtered);
    }

    filterByCategory(categoryId) {
        const searchInput = document.getElementById('search-categories');
        const searchTerm = searchInput ? searchInput.value : '';
        
        let filtered = this.allCategories;
        
        // Apply category filter
        if (categoryId) {
            filtered = filtered.filter(category => category.id == categoryId);
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(category => 
                category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        this.renderAvailableCategories(filtered);
    }

    addToFeatured(categoryId) {
        if (this.featuredCategories.length >= this.maxFeaturedCategories) {
            this.showAlert(`Maksimum ${this.maxFeaturedCategories} kateqoriya seçə bilərsiniz`, 'warning');
            return;
        }

        const category = this.allCategories.find(c => parseInt(c.id) === parseInt(categoryId));
        if (!category) return;

        // Check if already featured
        if (this.featuredCategories.some(fc => parseInt(fc.id) === parseInt(categoryId))) {
            this.showAlert('Bu kateqoriya artıq öne çıxan siyahısındadır', 'warning');
            return;
        }

        // Add to featured with temporary ID
        const featuredCategory = {
            ...category,
            featuredId: Date.now(), // Temporary ID
            featuredOrder: this.featuredCategories.length + 1
        };

        this.featuredCategories.push(featuredCategory);
        this.renderFeaturedCategories();
        this.renderAvailableCategories(); // Re-render to update button states
        this.updateFeaturedCount();
        this.enableSaveButton();
    }

    async removeFromFeatured(featuredId) {
        try {
            if (!checkTokenValidity()) {
                return;
            }

            // If it's a temporary ID (not saved yet), just remove from array
            if (featuredId > 1000000000) { // Temporary IDs are timestamps
                this.featuredCategories = this.featuredCategories.filter(fc => fc.featuredId !== featuredId);
                this.renderFeaturedCategories();
                this.renderAvailableCategories();
                this.updateFeaturedCount();
                this.enableSaveButton();
                return;
            }

            const result = await apiRequest(`/api/featured-categories/${featuredId}`, 'DELETE');

            if (result && result.success) {
                this.showAlert('Kateqoriya öne çıxan siyahısından silindi', 'success');
                await this.loadFeaturedCategories();
                this.renderAvailableCategories();
            } else {
                this.showAlert((result && result.message) || 'Silinərkən xəta baş verdi', 'danger');
            }
        } catch (error) {
            console.error('Kateqoriya silinərkən xəta:', error);
            this.showAlert('Silinərkən xəta baş verdi', 'danger');
        }
    }

    updateFeaturedOrder() {
        const featuredItems = document.querySelectorAll('#featured-categories .featured-item');
        featuredItems.forEach((item, index) => {
            const categoryId = parseInt(item.dataset.categoryId);
            const category = this.featuredCategories.find(fc => parseInt(fc.id) === categoryId);
            if (category) {
                category.featuredOrder = index + 1;
            }
        });
    }

    async saveFeaturedCategories() {
        try {
            if (!checkTokenValidity()) {
                return;
            }

            const categoryIds = this.featuredCategories
                .sort((a, b) => a.featuredOrder - b.featuredOrder)
                .map(fc => fc.id);

            const result = await apiRequest('/api/featured-categories', 'POST', { categoryIds });

            if (result && result.success) {
                this.showAlert('Öne çıxan kateqoriyalar yadda saxlanıldı', 'success');
                await this.loadFeaturedCategories();
                this.renderAvailableCategories();
                this.disableSaveButton();
            } else {
                this.showAlert((result && result.message) || 'Yadda saxlanılarkən xəta baş verdi', 'danger');
            }
        } catch (error) {
            console.error('Yadda saxlanılarkən xəta:', error);
            this.showAlert('Yadda saxlanılarkən xəta baş verdi', 'danger');
        }
    }

    updateFeaturedCount() {
        const countElement = document.getElementById('featured-count');
        countElement.textContent = `${this.featuredCategories.length}/${this.maxFeaturedCategories}`;
        
        if (this.featuredCategories.length >= this.maxFeaturedCategories) {
            countElement.className = 'badge bg-warning';
        } else {
            countElement.className = 'badge bg-primary';
        }
    }

    enableSaveButton() {
        const saveButton = document.getElementById('save-featured');
        saveButton.disabled = false;
    }

    disableSaveButton() {
        const saveButton = document.getElementById('save-featured');
        saveButton.disabled = true;
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();
        
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.featuredCategoriesManager = new FeaturedCategoriesManager();
});