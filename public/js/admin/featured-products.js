// Featured Products Management
class FeaturedProductsManager {
    constructor() {
        this.allProducts = [];
        this.featuredProducts = [];
        this.maxFeaturedProducts = 8;
        this.sortable = null;
        this.init();
    }

    async init() {
        await this.loadProducts();
        await this.loadCategories();
        await this.loadFeaturedProducts();
        this.setupEventListeners();
        this.setupSortable();
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Məhsullar yüklənə bilmədi');
            
            this.allProducts = await response.json();
            this.renderAvailableProducts();
        } catch (error) {
            console.error('Məhsullar yüklənərkən xəta:', error);
            this.showAlert('Məhsullar yüklənərkən xəta baş verdi', 'danger');
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('Kateqoriyalar yüklənə bilmədi');
            
            this.categories = await response.json();
            this.renderCategoryFilter(this.categories);
        } catch (error) {
            console.error('Kateqoriyalar yüklənərkən xəta:', error);
        }
    }

    async loadFeaturedProducts() {
        try {
            const response = await fetch('/api/featured-products');
            if (response.ok) {
                this.featuredProducts = await response.json();
                this.renderFeaturedProducts();
                this.updateFeaturedCount();
            }
        } catch (error) {
            console.error('Öne çıxan məhsullar yüklənərkən xəta:', error);
        }
    }

    renderAvailableProducts(products = this.allProducts) {
        const container = document.getElementById('available-products');
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-box-open fa-2x mb-2"></i>
                    <p>Məhsul tapılmadı</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => {
            const isFeatured = this.featuredProducts.some(fp => parseInt(fp.id) === parseInt(product.id));
            return `
                <div class="product-item ${isFeatured ? 'featured' : ''}" data-product-id="${product.id}">
                    <div class="d-flex align-items-center p-3 border rounded mb-2 ${isFeatured ? 'bg-light' : 'bg-white'}">
                        <img src="${product.image || '/images/no-image.png'}" alt="${product.name}" 
                             class="product-thumb me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${product.name}</h6>
                            <small class="text-muted">${product.category} • ${product.brand}</small>
                            <div class="text-primary fw-bold">₼${product.price}</div>
                        </div>
                        <button class="btn btn-sm ${isFeatured ? 'btn-outline-danger remove-featured' : 'btn-outline-primary add-featured'}" 
                                ${isFeatured ? 'disabled' : ''}>
                            <i class="fas ${isFeatured ? 'fa-check' : 'fa-plus'}"></i>
                            ${isFeatured ? 'Seçilib' : 'Seç'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderFeaturedProducts() {
        const container = document.getElementById('featured-products');
        
        if (this.featuredProducts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-star fa-3x mb-3"></i>
                    <p>Hələ heç bir məhsul seçilməyib</p>
                    <small>Sol tərəfdən məhsulları seçin</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.featuredProducts.map((product, index) => `
            <div class="featured-product-item" data-product-id="${product.id}">
                <div class="d-flex align-items-center p-3 border rounded mb-2 bg-success bg-opacity-10">
                    <div class="drag-handle me-2" style="cursor: move;">
                        <i class="fas fa-grip-vertical text-muted"></i>
                    </div>
                    <span class="badge bg-success me-2">${index + 1}</span>
                    <img src="${product.image || '/images/no-image.png'}" alt="${product.name}" 
                         class="product-thumb me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${product.name}</h6>
                        <small class="text-muted">${product.category} • ${product.brand}</small>
                        <div class="text-primary fw-bold">₼${product.price}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger remove-featured" data-product-id="${product.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCategoryFilter(categories) {
        const select = document.getElementById('category-filter');
        select.innerHTML = '<option value="">Bütün kateqoriyalar</option>' +
            categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    }

    setupEventListeners() {
        // Product search
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Category filter
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterProducts(document.getElementById('product-search').value, e.target.value);
        });

        // Add/Remove featured products
        document.getElementById('available-products').addEventListener('click', (e) => {
            if (e.target.closest('.add-featured')) {
                const productId = e.target.closest('.product-item').dataset.productId;
                this.addToFeatured(productId);
            }
        });

        document.getElementById('featured-products').addEventListener('click', (e) => {
            if (e.target.closest('.remove-featured')) {
                const productId = e.target.closest('.remove-featured').dataset.productId;
                this.removeFromFeatured(productId);
            }
        });

        // Clear all featured
        document.getElementById('clear-featured-btn').addEventListener('click', () => {
            if (confirm('Bütün öne çıxan məhsulları silmək istədiyinizə əminsiniz?')) {
                this.clearAllFeatured();
            }
        });

        // Save changes
        document.getElementById('save-featured-btn').addEventListener('click', () => {
            this.saveFeaturedProducts();
        });
    }

    setupSortable() {
        const container = document.getElementById('featured-products');
        this.sortable = new Sortable(container, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: async (evt) => {
                // Show saving indicator
                const saveBtn = document.getElementById('save-featured-btn');
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sıralama saxlanılır...';
                saveBtn.disabled = true;
                
                try {
                    await this.reorderFeaturedProducts(evt.oldIndex, evt.newIndex);
                    this.showAlert('Sıralama uğurla saxlanıldı', 'success');
                } catch (error) {
                    this.showAlert('Sıralama saxlanılarkən xəta baş verdi', 'danger');
                    console.error('Sıralama saxlama xətası:', error);
                } finally {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = this.featuredProducts.length === 0;
                }
            }
        });
    }

    filterProducts(searchTerm = '', category = '') {
        let filtered = this.allProducts;

        if (searchTerm) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (category) {
            // Find category ID by name
            const categoryObj = this.categories?.find(cat => cat.name === category);
            const categoryId = categoryObj ? categoryObj.id.toString() : category;
            filtered = filtered.filter(product => 
                product.category === categoryId || 
                product.categoryId === parseInt(categoryId)
            );
        }

        this.renderAvailableProducts(filtered);
    }

    addToFeatured(productId) {
        if (this.featuredProducts.length >= this.maxFeaturedProducts) {
            this.showAlert(`Maksimum ${this.maxFeaturedProducts} məhsul seçə bilərsiniz`, 'warning');
            return;
        }

        // Convert productId to number for comparison
        const numericProductId = parseInt(productId);
        const product = this.allProducts.find(p => parseInt(p.id) === numericProductId);
        if (product && !this.featuredProducts.some(fp => parseInt(fp.id) === numericProductId)) {
            // Always insert at position 4 (5th position, 0-indexed) if there are at least 4 products
            // Otherwise add to the end
            let insertPosition;
            if (this.featuredProducts.length >= 4) {
                insertPosition = 4; // 5th position
            } else {
                insertPosition = this.featuredProducts.length; // Add to end if less than 5 positions
            }
            
            this.featuredProducts.splice(insertPosition, 0, product);
            this.renderFeaturedProducts();
            this.renderAvailableProducts();
            this.updateFeaturedCount();
        }
    }

    removeFromFeatured(productId) {
        // Convert productId to number for comparison
        const numericProductId = parseInt(productId);
        this.featuredProducts = this.featuredProducts.filter(p => parseInt(p.id) !== numericProductId);
        this.renderFeaturedProducts();
        this.renderAvailableProducts();
        this.updateFeaturedCount();
    }

    clearAllFeatured() {
        this.featuredProducts = [];
        this.renderFeaturedProducts();
        this.renderAvailableProducts();
        this.updateFeaturedCount();
    }

    async reorderFeaturedProducts(oldIndex, newIndex) {
        const item = this.featuredProducts.splice(oldIndex, 1)[0];
        this.featuredProducts.splice(newIndex, 0, item);
        this.renderFeaturedProducts();
        
        // Automatically save the new order
        await this.saveFeaturedProducts();
    }

    updateFeaturedCount() {
        const countElement = document.getElementById('featured-count');
        countElement.textContent = `${this.featuredProducts.length} məhsul seçilib`;
        
        const saveBtn = document.getElementById('save-featured-btn');
        saveBtn.disabled = this.featuredProducts.length === 0;
    }

    async saveFeaturedProducts() {
        try {
            const saveBtn = document.getElementById('save-featured-btn');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saxlanılır...';
            saveBtn.disabled = true;

            const response = await fetch('/api/featured-products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    products: this.featuredProducts.map((product, index) => ({
                        id: product.id,
                        order: index + 1
                    }))
                })
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: Saxlama zamanı xəta baş verdi`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                    console.log('Server xəta cavabı:', errorData);
                } catch (parseError) {
                    console.error('Xəta cavabını parse etmək mümkün olmadı:', parseError);
                }
                throw new Error(errorMessage);
            }

            this.showAlert('Öndə olan məhsullar uğurla saxlanıldı', 'success');
            
        } catch (error) {
            console.error('Saxlama xətası - Detallı məlumat:', {
                error: error.message,
                stack: error.stack,
                featuredProducts: this.featuredProducts,
                requestBody: {
                    products: this.featuredProducts.map((product, index) => ({
                        id: product.id,
                        order: index + 1
                    }))
                }
            });
            this.showAlert(`Saxlama zamanı xəta baş verdi: ${error.message}`, 'danger');
        } finally {
            const saveBtn = document.getElementById('save-featured-btn');
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Dəyişiklikləri Saxla';
            saveBtn.disabled = this.featuredProducts.length === 0;
        }
    }

    showAlert(message, type = 'info') {
        const container = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FeaturedProductsManager();
});

// Add custom CSS for sortable
const style = document.createElement('style');
style.textContent = `
    .sortable-ghost {
        opacity: 0.4;
    }
    
    .sortable-chosen {
        background-color: #e3f2fd !important;
    }
    
    .sortable-drag {
        transform: rotate(5deg);
    }
    
    .product-item.featured {
        opacity: 0.6;
    }
    
    .drag-handle:hover {
        color: #007bff !important;
    }
`;
document.head.appendChild(style);