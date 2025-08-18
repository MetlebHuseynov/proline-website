class FeaturedBrandsManager {
    constructor() {
        this.allBrands = [];
        this.featuredBrands = [];
        this.maxFeaturedBrands = 6;
        this.sortable = null;
        this.init();
    }

    async init() {
        await this.loadBrands();
        await this.loadFeaturedBrands();
        this.setupEventListeners();
        this.setupSortable();
    }

    async loadBrands() {
        try {
            console.log('Token yoxlanılır...');
            if (!checkTokenValidity()) {
                console.log('Token etibarsızdır, markalar yüklənə bilməz');
                this.showAlert('Sessiya müddəti bitib. Səhifəni yeniləyin.', 'warning');
                return;
            }

            console.log('API çağırısı başladı: /api/markas');
            const data = await apiRequest('/api/markas');
            
            if (!data) {
                console.error('API cavabı alınmadı (data null/undefined)');
                throw new Error('Markalar yüklənə bilmədi: Server cavab vermədi');
            }
            
            console.log('Yüklənən markalar:', data);
            this.allBrands = data;
            this.renderAvailableBrands();
        } catch (error) {
            console.error('Markalar yüklənərkən xəta:', error);
            this.showAlert('Markalar yüklənərkən xəta baş verdi', 'danger');
        }
    }

    async loadFeaturedBrands() {
        try {
            if (!checkTokenValidity()) {
                return;
            }

            const response = await apiRequest('/api/featured-brands');
            if (response.ok) {
                this.featuredBrands = await response.json();
                this.renderFeaturedBrands();
                this.updateFeaturedCount();
            }
        } catch (error) {
            console.error('Öne çıxan markalar yüklənərkən xəta:', error);
        }
    }

    renderAvailableBrands(brands = this.allBrands) {
        const container = document.getElementById('available-brands');
        
        if (brands.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-building fa-2x mb-2"></i>
                    <p>Marka tapılmadı</p>
                </div>
            `;
            return;
        }

        container.innerHTML = brands.map(brand => {
            const isFeatured = this.featuredBrands.some(fb => parseInt(fb.id) === parseInt(brand.id));
            return `
                <div class="brand-item ${isFeatured ? 'featured' : ''}" data-brand-id="${brand.id}">
                    <div class="brand-info">
                        <img src="${brand.logo || '/images/brand-placeholder.svg'}" alt="${brand.name}" class="brand-logo">
                        <div class="brand-details">
                            <h6 class="brand-name">${brand.name}</h6>
                            <p class="brand-description">${brand.description || 'Təsvir yoxdur'}</p>
                            <span class="badge bg-${brand.status === 'active' ? 'success' : 'secondary'}">
                                ${brand.status === 'active' ? 'Aktiv' : 'Deaktiv'}
                            </span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-primary add-to-featured" ${isFeatured ? 'disabled' : ''} onclick="featuredBrandsManager.addToFeatured(${brand.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    renderFeaturedBrands() {
        const container = document.getElementById('featured-brands');
        
        if (this.featuredBrands.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-star fa-2x mb-2"></i>
                    <p>Hələ ki öne çıxan marka seçilməyib</p>
                    <small>Sol tərəfdən marka əlavə edin</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.featuredBrands.map(brand => `
            <div class="featured-item" data-brand-id="${brand.id}">
                <div class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="brand-info">
                    <img src="${brand.logo || '/images/brand-placeholder.svg'}" alt="${brand.name}" class="brand-logo">
                    <div class="brand-details">
                        <h6 class="brand-name">${brand.name}</h6>
                        <p class="brand-description">${brand.description || 'Təsvir yoxdur'}</p>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger remove-from-featured" onclick="featuredBrandsManager.removeFromFeatured(${brand.featuredId})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-brands');
        searchInput.addEventListener('input', (e) => {
            this.filterBrands(e.target.value);
        });

        // Save button
        const saveButton = document.getElementById('save-featured');
        saveButton.addEventListener('click', () => {
            this.saveFeaturedBrands();
        });
    }

    setupSortable() {
        const featuredContainer = document.getElementById('featured-brands');
        this.sortable = new Sortable(featuredContainer, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: () => {
                this.updateFeaturedOrder();
                this.enableSaveButton();
            }
        });
    }

    filterBrands(searchTerm) {
        const filtered = this.allBrands.filter(brand => 
            brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderAvailableBrands(filtered);
    }

    addToFeatured(brandId) {
        if (this.featuredBrands.length >= this.maxFeaturedBrands) {
            this.showAlert(`Maksimum ${this.maxFeaturedBrands} marka seçə bilərsiniz`, 'warning');
            return;
        }

        const brand = this.allBrands.find(b => parseInt(b.id) === parseInt(brandId));
        if (!brand) return;

        // Check if already featured
        if (this.featuredBrands.some(fb => parseInt(fb.id) === parseInt(brandId))) {
            this.showAlert('Bu marka artıq öne çıxan siyahısındadır', 'warning');
            return;
        }

        // Add to featured with temporary ID
        const featuredBrand = {
            ...brand,
            featuredId: Date.now(), // Temporary ID
            featuredOrder: this.featuredBrands.length + 1
        };

        this.featuredBrands.push(featuredBrand);
        this.renderFeaturedBrands();
        this.renderAvailableBrands(); // Re-render to update button states
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
                this.featuredBrands = this.featuredBrands.filter(fb => fb.featuredId !== featuredId);
                this.renderFeaturedBrands();
                this.renderAvailableBrands();
                this.updateFeaturedCount();
                this.enableSaveButton();
                return;
            }

            const response = await apiRequest(`/api/featured-brands/${featuredId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Marka öne çıxan siyahısından silindi', 'success');
                await this.loadFeaturedBrands();
                this.renderAvailableBrands();
            } else {
                this.showAlert(result.message || 'Silinərkən xəta baş verdi', 'danger');
            }
        } catch (error) {
            console.error('Marka silinərkən xəta:', error);
            this.showAlert('Silinərkən xəta baş verdi', 'danger');
        }
    }

    updateFeaturedOrder() {
        const featuredItems = document.querySelectorAll('#featured-brands .featured-item');
        featuredItems.forEach((item, index) => {
            const brandId = parseInt(item.dataset.brandId);
            const brand = this.featuredBrands.find(fb => parseInt(fb.id) === brandId);
            if (brand) {
                brand.featuredOrder = index + 1;
            }
        });
    }

    async saveFeaturedBrands() {
        try {
            if (!checkTokenValidity()) {
                return;
            }

            const brandIds = this.featuredBrands
                .sort((a, b) => a.featuredOrder - b.featuredOrder)
                .map(fb => fb.id);

            const result = await apiRequest('/api/featured-brands', 'POST', { brandIds });

            if (result.success) {
                this.showAlert('Öne çıxan markalar yadda saxlanıldı', 'success');
                await this.loadFeaturedBrands();
                this.renderAvailableBrands();
                this.disableSaveButton();
            } else {
                this.showAlert(result.message || 'Yadda saxlanılarkən xəta baş verdi', 'danger');
            }
        } catch (error) {
            console.error('Yadda saxlanılarkən xəta:', error);
            this.showAlert('Yadda saxlanılarkən xəta baş verdi', 'danger');
        }
    }

    updateFeaturedCount() {
        const countElement = document.getElementById('featured-count');
        countElement.textContent = `${this.featuredBrands.length}/${this.maxFeaturedBrands}`;
        
        if (this.featuredBrands.length >= this.maxFeaturedBrands) {
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
    window.featuredBrandsManager = new FeaturedBrandsManager();
    window.featuredBrandsManager.init();
});