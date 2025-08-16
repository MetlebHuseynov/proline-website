// Brands Management
class BrandsManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.brands = [];
        this.currentBrand = null;
        this.loggedInUser = null;
        this.init();
    }

    async getCurrentUser() {
        try {
            const token = getAuthToken();
            const response = await fetch(`${this.apiUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                this.loggedInUser = await response.json();
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
    }

    init() {
        this.bindEvents();
        this.loadBrands();
    }

    bindEvents() {
        // Modal events
        const modal = document.getElementById('brand-modal');
        const addBtn = document.getElementById('add-brand-btn');
        const closeBtn = modal ? modal.querySelector('.btn-close') : null;
        const form = document.getElementById('brand-form');

        if (addBtn) addBtn.addEventListener('click', () => this.openModal());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Cancel button event
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

        // Search and filter events
        const searchInput = document.getElementById('table-search-input');
        const statusFilter = document.getElementById('status-filter');
        
        if (searchInput) searchInput.addEventListener('input', () => this.filterBrands());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterBrands());

        // Logo preview events
        this.bindLogoEvents();

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    bindLogoEvents() {
        const urlRadio = document.getElementById('brand-logo-url-radio');
        const fileRadio = document.getElementById('brand-logo-file-radio');
        const urlInput = document.getElementById('brand-logo');
        const fileInput = document.getElementById('brand-logo-file');
        const removeBtn = document.getElementById('brand-remove-logo-btn');

        if (urlRadio) urlRadio.addEventListener('change', () => this.toggleLogoInput());
        if (fileRadio) fileRadio.addEventListener('change', () => this.toggleLogoInput());
        if (urlInput) urlInput.addEventListener('input', () => this.showLogoPreview());
        if (fileInput) fileInput.addEventListener('change', () => this.showLogoPreview());
        if (removeBtn) removeBtn.addEventListener('click', () => this.removeLogo());
    }

    toggleLogoInput() {
        const urlRadio = document.getElementById('brand-logo-url-radio');
        const urlInput = document.getElementById('brand-logo');
        const fileInput = document.getElementById('brand-logo-file');

        if (urlRadio.checked) {
            urlInput.classList.remove('d-none');
            fileInput.classList.add('d-none');
        } else {
            urlInput.classList.add('d-none');
            fileInput.classList.remove('d-none');
        }
        this.hideLogoPreview();
    }

    showLogoPreview() {
        const urlRadio = document.getElementById('brand-logo-url-radio');
        const urlInput = document.getElementById('brand-logo');
        const fileInput = document.getElementById('brand-logo-file');
        const preview = document.getElementById('brand-logo-preview');
        const container = document.getElementById('brand-logo-preview-container');

        if (urlRadio.checked && urlInput.value) {
            preview.src = urlInput.value;
            container.style.display = 'block';
        } else if (!urlRadio.checked && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                container.style.display = 'block';
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            this.hideLogoPreview();
        }
    }

    hideLogoPreview() {
        const preview = document.getElementById('brand-logo-preview');
        const container = document.getElementById('brand-logo-preview-container');
        preview.src = '';
        container.style.display = 'none';
    }

    removeLogo() {
        const urlInput = document.getElementById('brand-logo');
        const fileInput = document.getElementById('brand-logo-file');
        urlInput.value = '';
        fileInput.value = '';
        this.hideLogoPreview();
    }

    async loadBrands() {
        this.showLoading(true);
        try {
            await this.getCurrentUser();
            const token = getAuthToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${this.apiUrl}/brands`, {
                headers: headers
            });
            if (!response.ok) throw new Error('Failed to load brands');
            this.brands = await response.json();
            this.renderBrands();
            
            // Show add brand button for admin and super admin users
            const addBrandBtn = document.getElementById('add-brand-btn');
            if (addBrandBtn && this.loggedInUser && (this.loggedInUser.role === 'admin' || this.loggedInUser.role === 'super_admin')) {
                addBrandBtn.style.display = 'block';
            } else if (addBrandBtn) {
                addBrandBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading brands:', error);
            showAlert('Brendlər yüklənərkən xəta baş verdi', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    renderBrands() {
        const tbody = document.getElementById('brands-table');
        const noData = document.getElementById('no-data');
        
        if (this.brands.length === 0) {
            tbody.innerHTML = '';
            noData.classList.remove('d-none');
            return;
        }
        
        noData.classList.add('d-none');
        
        tbody.innerHTML = this.brands.map(brand => {
            const createdDate = new Date(brand.createdAt).toLocaleDateString('az-AZ');
            
            return `
                <tr>
                    <td>${brand.id}</td>
                    <td>
                        <img src="${brand.logo || '/images/brand-placeholder.svg'}" 
                             alt="${brand.name}" class="brand-logo">
                    </td>
                    <td>${brand.name}</td>
                    <td>${brand.description || '-'}</td>
                    <td>
                        ${brand.website ? `<a href="${brand.website}" target="_blank" class="website-link">
                            <i class="fas fa-external-link-alt"></i> Sayt
                        </a>` : '-'}
                    </td>
                    <td>${brand.productCount || 0}</td>
                    <td>
                        <span class="status-badge ${brand.status}">
                            ${brand.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                        </span>
                    </td>
                    <td>${createdDate}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="brandsManager.editBrand(${brand.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="brandsManager.deleteBrand(${brand.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterBrands() {
        const searchInput = document.getElementById('table-search-input');
        const statusFilterEl = document.getElementById('status-filter');
        
        if (!searchInput || !statusFilterEl) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = statusFilterEl.value;

        const filteredBrands = this.brands.filter(brand => {
            const matchesSearch = brand.name.toLowerCase().includes(searchTerm) ||
                                (brand.description && brand.description.toLowerCase().includes(searchTerm));
            const matchesStatus = !statusFilter || brand.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Temporarily store filtered brands for rendering
        const originalBrands = this.brands;
        this.brands = filteredBrands;
        this.renderBrands();
        this.brands = originalBrands;
    }

    openModal(brand = null) {
        const modal = document.getElementById('brand-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('brand-form');
        
        this.currentBrand = brand;
        
        if (brand) {
            modalTitle.textContent = 'Brendi Redaktə Et';
            this.populateForm(brand);
        } else {
            modalTitle.textContent = 'Yeni Brend';
            form.reset();
            this.hideLogoPreview();
        }
        
        // Show modal with Bootstrap classes
        modal.classList.add('show');
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Add backdrop
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
    }

    closeModal() {
        const modal = document.getElementById('brand-modal');
        const backdrop = document.querySelector('.modal-backdrop');
        
        // Hide modal with Bootstrap classes
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        if (backdrop) {
            backdrop.remove();
        }
        
        this.currentBrand = null;
        
        // Reset form
        const form = document.getElementById('brand-form');
        if (form) {
            form.reset();
            this.hideLogoPreview();
        }
    }

    populateForm(brand) {
        document.getElementById('brand-name').value = brand.name || '';
        document.getElementById('brand-description').value = brand.description || '';
        document.getElementById('brand-logo').value = brand.logo || '';
        document.getElementById('brand-website').value = brand.website || '';
        document.getElementById('brand-status').value = brand.status || 'active';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Check if file input is being used
        const fileRadio = document.getElementById('brand-logo-file-radio');
        const fileInput = document.getElementById('brand-logo-file');
        const urlInput = document.getElementById('brand-logo');
        
        let useFile = fileRadio && fileRadio.checked && fileInput && fileInput.files.length > 0;
        
        try {
            if (this.currentBrand) {
                if (useFile) {
                    await this.updateBrandWithFile(this.currentBrand.id, formData);
                } else {
                    const brandData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        logo: formData.get('logo'),
                        website: formData.get('website'),
                        status: formData.get('status')
                    };
                    await this.updateBrand(this.currentBrand.id, brandData);
                }
                showAlert('Brend uğurla yeniləndi', 'success');
            } else {
                if (useFile) {
                    await this.createBrandWithFile(formData);
                } else {
                    const brandData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        logo: formData.get('logo'),
                        website: formData.get('website'),
                        status: formData.get('status')
                    };
                    await this.createBrand(brandData);
                }
                showAlert('Brend uğurla yaradıldı', 'success');
            }
            
            this.closeModal();
            await this.loadBrands();
        } catch (error) {
            console.error('Error saving brand:', error);
            showAlert('Brend saxlanılarkən xəta baş verdi', 'danger');
        }
    }

    async createBrand(brandData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/brands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(brandData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create brand');
        }
        
        return response.json();
    }

    async createBrandWithFile(formData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/brands`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create brand');
        }
        
        return response.json();
    }

    async updateBrandWithFile(id, formData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/brands/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update brand');
        }
        
        return response.json();
    }

    async updateBrand(id, brandData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/brands/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(brandData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update brand');
        }
        
        return response.json();
    }

    async editBrand(id) {
        const brand = this.brands.find(b => b.id === id);
        if (brand) {
            this.openModal(brand);
        }
    }

    async deleteBrand(id) {
        if (!confirm('Bu brendi silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${this.apiUrl}/brands/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete brand');
            }
            
            showAlert('Brend uğurla silindi', 'success');
            await this.loadBrands();
        } catch (error) {
            console.error('Error deleting brand:', error);
            showAlert('Brend silinərkən xəta baş verdi', 'danger');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('d-none');
        } else {
            loading.classList.add('d-none');
        }
    }
}

// Initialize when DOM is loaded
let brandsManager;
document.addEventListener('DOMContentLoaded', () => {
    brandsManager = new BrandsManager();
});