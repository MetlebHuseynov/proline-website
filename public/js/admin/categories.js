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
        const closeBtn = modal.querySelector('.btn-close');
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
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async getCurrentUser() {
        try {
            const token = getAuthToken();
            const response = await fetch('http://localhost:5000/api/auth/me', {
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
        this.showLoading(true);
        try {
            await this.getCurrentUser();
            const token = getAuthToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`http://localhost:5000/api/categories`, { headers });
            if (!response.ok) throw new Error('Failed to load categories');
            const result = await response.json();
            this.categories = result.data || result;
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
            showAlert('Kateqoriyalar yüklənərkən xəta baş verdi', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    renderCategories() {
        const tbody = document.getElementById('categories-table');
        const noData = document.getElementById('no-data');
        
        if (this.categories.length === 0) {
            tbody.innerHTML = '';
            noData.classList.remove('d-none');
            return;
        }
        
        noData.classList.add('d-none');
        
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
        const searchTerm = document.getElementById('table-search-input').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;

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
        
        this.currentCategory = category;
        
        if (category) {
            title.textContent = 'Kateqoriyanı Redaktə Et';
            this.populateForm(category);
        } else {
            title.textContent = 'Yeni Kateqoriya';
            form.reset();
            this.hideImagePreview();
            // Reset radio buttons to URL option
            document.getElementById('category-image-url-radio').checked = true;
            this.toggleImageInput();
        }
        
        // Remove Bootstrap classes and show modal manually
        modal.classList.remove('fade');
        modal.style.display = 'block';
        modal.classList.add('show');
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
        
        // Hide modal manually
        modal.style.display = 'none';
        modal.classList.remove('show');
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
        document.getElementById('category-image-url-radio').checked = true;
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
        
        const formData = new FormData(e.target);
        const urlRadio = document.getElementById('category-image-url-radio');
        const fileInput = document.getElementById('category-image-file');
        
        let categoryData = {
            name: formData.get('name'),
            description: formData.get('description'),
            status: formData.get('status')
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
        const response = await fetch(`http://localhost:5000/api/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create category');
        }
        
        return response.json();
    }

    async createCategoryWithFile(formData) {
        const token = getAuthToken();
        const response = await fetch(`http://localhost:5000/api/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create category');
        }
        
        return response.json();
    }

    async updateCategory(id, categoryData) {
        const token = getAuthToken();
        const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
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
        const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
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
        if (!confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete category');
            }
            
            showAlert('Kateqoriya uğurla silindi', 'success');
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showAlert('Kateqoriya silinərkən xəta baş verdi', 'danger');
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