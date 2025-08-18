// API Configuration - Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';

// Categories Management

class CategoriesManager {
    constructor() {
        this.categories = [];
        this.currentCategory = null;
        this.loggedInUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
    }

    bindEvents() {
        // Modal events
        const modal = document.getElementById('category-modal');
        const addBtn = document.getElementById('add-category-btn');
        const closeBtn = modal ? modal.querySelector('.btn-close') : null;
        const cancelBtn = document.getElementById('cancel-btn');
        const form = document.getElementById('category-form');

        if (addBtn) addBtn.addEventListener('click', () => this.openModal());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Search and filter events
        const searchInput = document.getElementById('table-search-input');
        const statusFilter = document.getElementById('status-filter');
        if (searchInput) searchInput.addEventListener('input', () => this.filterCategories());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterCategories());

        // Image preview events
        this.bindImageEvents();

        // Close modal when clicking outside
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    async getCurrentUser() {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_URL}/auth/me`, {
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

    bindImageEvents() {
        const urlRadio = document.getElementById('category-image-url-radio');
        const fileRadio = document.getElementById('category-image-file-radio');
        const urlInput = document.getElementById('category-image');
        const fileInput = document.getElementById('category-image-file');
        const removeBtn = document.getElementById('category-remove-image-btn');

        if (urlRadio) urlRadio.addEventListener('change', () => this.toggleImageInput());
        if (fileRadio) fileRadio.addEventListener('change', () => this.toggleImageInput());
        if (urlInput) urlInput.addEventListener('input', () => this.showImagePreview());
        if (fileInput) fileInput.addEventListener('change', () => this.showImagePreview());
        if (removeBtn) removeBtn.addEventListener('click', () => this.removeImage());
    }

    toggleImageInput() {
        const urlRadio = document.getElementById('category-image-url-radio');
        const urlInput = document.getElementById('category-image');
        const fileInput = document.getElementById('category-image-file');

        if (urlRadio.checked) {
            urlInput.classList.remove('d-none');
            fileInput.classList.add('d-none');
        } else {
            urlInput.classList.add('d-none');
            fileInput.classList.remove('d-none');
        }
        this.hideImagePreview();
    }

    showImagePreview() {
        const urlRadio = document.getElementById('category-image-url-radio');
        const urlInput = document.getElementById('category-image');
        const fileInput = document.getElementById('category-image-file');
        const preview = document.getElementById('category-image-preview');
        const container = document.getElementById('category-image-preview-container');

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
            this.hideImagePreview();
        }
    }

    hideImagePreview() {
        const preview = document.getElementById('category-image-preview');
        const container = document.getElementById('category-image-preview-container');
        preview.src = '';
        container.style.display = 'none';
    }

    removeImage() {
        const urlInput = document.getElementById('category-image');
        const fileInput = document.getElementById('category-image-file');
        urlInput.value = '';
        fileInput.value = '';
        this.hideImagePreview();
    }

    async loadCategories() {
        console.log('Loading categories...');
        this.showLoading(true);
        try {
            await this.getCurrentUser();
            const token = getAuthToken();
            console.log('Auth token:', token ? 'Found' : 'Not found');
            if (!token) {
                console.error('No auth token found');
                showAlert('Giriş token-i tapılmadı. Yenidən daxil olun.', 'danger');
                return;
            }
            
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['Content-Type'] = 'application/json';
            }
            
            console.log('Making API request to:', `${API_URL}/categories`);
            const result = await apiRequest(`${API_URL}/categories`);
            if (!result) {
                throw new Error('Failed to load categories from API');
            }
            this.categories = result.data || result;
            console.log('Categories loaded:', this.categories.length, 'items');
            this.renderCategories();
            
            // Show/hide add category button based on user role
            const addCategoryBtn = document.getElementById('add-category-btn');
            if (addCategoryBtn && this.loggedInUser) {
                if (this.loggedInUser.role === 'admin' || this.loggedInUser.role === 'super_admin') {
                    addCategoryBtn.style.display = 'block';
                } else {
                    addCategoryBtn.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            showAlert('Kateqoriyalar yüklənərkən xəta baş verdi: ' + error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    renderCategories() {
        const tbody = document.getElementById('categories-table');
        const noData = document.getElementById('no-data');
        
        if (!tbody) {
            console.error('Categories table element not found');
            return;
        }
        
        if (this.categories.length === 0) {
            tbody.innerHTML = '';
            if (noData) noData.classList.remove('d-none');
            return;
        }
        
        if (noData) noData.classList.add('d-none');
        
        tbody.innerHTML = this.categories.map(category => {
            const createdDate = new Date(category.createdAt).toLocaleDateString('az-AZ');
            
            return `
                <tr>
                    <td>${category.id}</td>
                    <td>
                        <img src="${category.image || '/images/brand-placeholder.svg'}" 
                             alt="${category.name}" class="category-image">
                    </td>
                    <td>${category.name}</td>
                    <td>${category.description || '-'}</td>
                    <td>${category.productCount || 0}</td>
                    <td>
                        <span class="status-badge ${category.status}">
                            ${category.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                        </span>
                    </td>
                    <td>${createdDate}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="categoriesManager.editCategory(${category.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="categoriesManager.deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterCategories() {
        const searchInput = document.getElementById('table-search-input');
        const statusFilterElement = document.getElementById('status-filter');
        
        if (!searchInput || !statusFilterElement) {
            console.error('Filter elements not found');
            return;
        }
        
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = statusFilterElement.value;

        const filteredCategories = this.categories.filter(category => {
            const matchesSearch = category.name.toLowerCase().includes(searchTerm) ||
                                (category.description && category.description.toLowerCase().includes(searchTerm));
            const matchesStatus = !statusFilter || category.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Temporarily store filtered categories for rendering
        const originalCategories = this.categories;
        this.categories = filteredCategories;
        this.renderCategories();
        this.categories = originalCategories;
    }

    openModal(category = null) {
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('category-form');
        
        if (!modal || !title || !form) {
            console.error('Modal elements not found');
            return;
        }
        
        this.currentCategory = category;
        
        if (category) {
            title.textContent = 'Kateqoriyanı Redaktə Et';
            this.populateForm(category);
        } else {
            title.textContent = 'Yeni Kateqoriya';
            form.reset();
            this.hideImagePreview();
            // Reset radio buttons to URL option
            const urlRadio = document.getElementById('category-image-url-radio');
            if (urlRadio) urlRadio.checked = true;
            this.toggleImageInput();
        }
        
        // Remove Bootstrap classes and show modal manually
        modal.classList.remove('fade');
        modal.style.display = 'block';
        modal.classList.add('show');
        // Fix accessibility issue: remove aria-hidden when modal is shown
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        // Add backdrop
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop show';
            document.body.appendChild(backdrop);
        }
    }

    closeModal() {
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        
        if (!modal || !form) {
            console.error('Modal elements not found');
            return;
        }
        
        // Hide modal manually
        modal.style.display = 'none';
        modal.classList.remove('show');
        // Restore aria-hidden when modal is closed
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        this.currentCategory = null;
        form.reset();
        this.hideImagePreview();
        // Reset to URL option
        const urlRadio = document.getElementById('category-image-url-radio');
        if (urlRadio) urlRadio.checked = true;
        this.toggleImageInput();
    }

    populateForm(category) {
        document.getElementById('category-name').value = category.name || '';
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-image').value = category.image || '';
        document.getElementById('category-status').value = category.status || 'active';
        
        // Reset to URL input and show image if exists
        document.getElementById('category-image-url-radio').checked = true;
        document.getElementById('category-image-file-radio').checked = false;
        this.toggleImageInput();
        
        if (category.image) {
            this.showImagePreview();
        } else {
            this.hideImagePreview();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        if (!form) {
            console.error('Form element not found');
            return;
        }
        
        const formData = new FormData(form);
        const urlRadio = document.getElementById('category-image-url-radio');
        const fileInput = document.getElementById('category-image-file');
        
        const name = formData.get('name');
        const description = formData.get('description');
        const status = formData.get('status');
        
        if (!name || name.trim() === '') {
            if (typeof showAlert === 'function') {
                showAlert('Kateqoriya adı tələb olunur', 'error');
            } else {
                alert('Kateqoriya adı tələb olunur');
            }
            return;
        }
        
        let categoryData = {
            name: name,
            description: description,
            status: status
        };

        // Handle image upload
        if (urlRadio.checked) {
            categoryData.image = formData.get('image');
        } else if (fileInput.files[0]) {
            // For file upload, we'll send the FormData directly
            formData.append('name', categoryData.name);
            formData.append('description', categoryData.description);
            formData.append('status', categoryData.status);
        } else {
            categoryData.image = '';
        }

        try {
            if (this.currentCategory) {
                if (fileInput.files[0] && !urlRadio.checked) {
                    await this.updateCategoryWithFile(this.currentCategory.id, formData);
                } else {
                    await this.updateCategory(this.currentCategory.id, categoryData);
                }
                showAlert('Kateqoriya uğurla yeniləndi', 'success');
            } else {
                if (fileInput.files[0] && !urlRadio.checked) {
                    await this.createCategoryWithFile(formData);
                } else {
                    await this.createCategory(categoryData);
                }
                showAlert('Kateqoriya uğurla yaradıldı', 'success');
            }
            
            this.closeModal();
            await this.loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            showAlert('Kateqoriya saxlanılarkən xəta baş verdi', 'danger');
        }
    }

    async createCategory(categoryData) {
        const token = getAuthToken();
        
        // Check token validity
        if (!token || isTokenExpired(token)) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                window.location.href = '/admin/login.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            const errorMessage = error.message || 'Failed to create category';
            throw new Error(errorMessage);
        }
        
        return response.json();
    }

    async createCategoryWithFile(formData) {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Giriş token-i tapılmadı');
            }
            
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                const errorMessage = error.message || 'Kateqoriya yaradılarkən xəta baş verdi';
                throw new Error(errorMessage);
            }
            
            return response.json();
        } catch (error) {
            console.error('Error creating category with file:', error);
            const errorMessage = error.message || 'Kateqoriya yaradılarkən xəta baş verdi';
            throw new Error(errorMessage);
        }
    }

    async updateCategory(id, categoryData) {
        const token = getAuthToken();
        
        // Check token validity
        if (!token || isTokenExpired(token)) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                window.location.href = '/admin/login.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update category');
        }
        
        return response.json();
    }

    async updateCategoryWithFile(id, formData) {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update category');
        }
        
        return response.json();
    }

    async editCategory(id) {
        const category = this.categories.find(c => c.id === id);
        if (category) {
            this.openModal(category);
        }
    }

    async deleteCategory(id) {
        if (!id) {
            console.error('Category ID is required for deletion');
            if (typeof showAlert === 'function') {
                showAlert('Kateqoriya ID-si tapılmadı', 'error');
            } else {
                alert('Kateqoriya ID-si tapılmadı');
            }
            return;
        }
        
        if (!confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete category');
            }
            
            if (typeof showAlert === 'function') {
                showAlert('Kateqoriya uğurla silindi', 'success');
            } else {
                alert('Kateqoriya uğurla silindi');
            }
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            const errorMessage = error.message || 'Kateqoriya silinərkən xəta baş verdi';
            if (typeof showAlert === 'function') {
                showAlert(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
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
let categoriesManager;
document.addEventListener('DOMContentLoaded', () => {
    categoriesManager = new CategoriesManager();
});