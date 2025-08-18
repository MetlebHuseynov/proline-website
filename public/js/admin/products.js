// Products Management
class ProductsManager {
    constructor() {
        // API Configuration - Auto-detect environment
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.apiUrl = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';
        this.products = [];
        this.categories = [];
        this.markas = [];
        this.currentProduct = null;
        this.modal = null;
        this.loggedInUser = null;
        this.init();
    }

    init() {
        this.modal = new bootstrap.Modal(document.getElementById('product-modal'));
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Modal events
        const addBtn = document.getElementById('add-product-btn');
        const form = document.getElementById('product-form');
        const cancelBtn = document.getElementById('cancel-btn');

        if (addBtn) addBtn.addEventListener('click', () => this.openModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Image upload events
        const imageUrlRadio = document.getElementById('image-url-radio');
        const imageFileRadio = document.getElementById('image-file-radio');
        const imageUrlInput = document.getElementById('product-image-url');
        const imageFileInput = document.getElementById('product-image-file');
        const removeImageBtn = document.getElementById('remove-image-btn');

        if (imageUrlRadio) imageUrlRadio.addEventListener('change', () => this.toggleImageInput());
        if (imageFileRadio) imageFileRadio.addEventListener('change', () => this.toggleImageInput());
        if (imageUrlInput) imageUrlInput.addEventListener('input', () => this.previewImageFromUrl());
        if (imageFileInput) imageFileInput.addEventListener('change', () => this.previewImageFromFile());
        if (removeImageBtn) removeImageBtn.addEventListener('click', () => this.removeImage());

        // Search and filter events
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const markaFilter = document.getElementById('marka-filter');
        const statusFilter = document.getElementById('status-filter');
        const clearFiltersBtn = document.getElementById('clear-filters');
        
        if (searchInput) searchInput.addEventListener('input', () => this.filterProducts());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.filterProducts());
        if (markaFilter) markaFilter.addEventListener('change', () => this.filterProducts());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterProducts());
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => this.clearFilters());
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

    async loadData() {
        this.showLoading(true);
        try {
            await this.getCurrentUser();
            await Promise.all([
                this.loadProducts(),
                this.loadCategories(),
                this.loadMarkas()
            ]);
            this.populateFilters();
            this.renderProducts();
            
            // Show add product button for admin and super admin users
            const addProductBtn = document.getElementById('add-product-btn');
            if (addProductBtn && this.loggedInUser && (this.loggedInUser.role === 'admin' || this.loggedInUser.role === 'super_admin')) {
                addProductBtn.style.display = 'block';
            } else if (addProductBtn) {
                addProductBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showAlert('Məlumatlar yüklənərkən xəta baş verdi', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    async loadProducts() {
        try {
            const token = getAuthToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.apiUrl}/products`, { headers });
            if (!response.ok) throw new Error('Failed to load products');
            this.products = await response.json();
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    async loadCategories() {
        try {
            const token = getAuthToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.apiUrl}/categories`, { headers });
            if (!response.ok) throw new Error('Failed to load categories');
            this.categories = await response.json();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    async loadMarkas() {
        try {
            const token = getAuthToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.apiUrl}/markas`, { headers });
            if (!response.ok) throw new Error('Failed to load markas');
            this.markas = await response.json();
        } catch (error) {
            console.error('Error loading markas:', error);
            this.markas = [];
        }
    }

    populateFilters() {
        // Populate category filters
        const categorySelect = document.getElementById('product-category');
        const categoryFilter = document.getElementById('category-filter');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Kateqoriya seçin</option>';
            this.categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Bütün kateqoriyalar</option>';
            this.categories.forEach(category => {
                categoryFilter.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }

        // Populate marka filters
        const markaSelect = document.getElementById('product-marka');
        const markaFilter = document.getElementById('marka-filter');
        
        if (markaSelect) {
            markaSelect.innerHTML = '<option value="">Marka seçin</option>';
            this.markas.forEach(marka => {
                markaSelect.innerHTML += `<option value="${marka.id}">${marka.name}</option>`;
            });
        }
        
        if (markaFilter) {
            markaFilter.innerHTML = '<option value="">Bütün markalar</option>';
            this.markas.forEach(marka => {
                markaFilter.innerHTML += `<option value="${marka.id}">${marka.name}</option>`;
            });
        }
    }

    renderProducts() {
        const tbody = document.getElementById('products-table');
        const noData = document.getElementById('no-data');
        
        if (!tbody) {
            console.error('products-table element not found!');
            return;
        }
        
        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Heç bir məhsul tapılmadı</td></tr>';
            if (noData) noData.classList.remove('d-none');
            return;
        }
        
        if (noData) noData.classList.add('d-none');
        
        tbody.innerHTML = this.products.map(product => {
            // API artıq kateqoriya və brend məlumatlarını obyekt şəklində qaytarır
            const categoryName = product.category && typeof product.category === 'object' ? product.category.name : '-';
            const markaName = product.marka && typeof product.marka === 'object' ? product.marka.name : '-';
            
            return `
                <tr>
                    <td>${product.id}</td>
                    <td>
                        <img src="${product.image || '/images/product-placeholder.svg'}" 
                             alt="${product.name}" class="product-image">
                    </td>
                    <td>${product.name}</td>
                    <td>${categoryName}</td>
                    <td>${markaName}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <span class="status-badge ${product.status}">
                            ${product.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="productsManager.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="productsManager.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const markaFilter = document.getElementById('marka-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        const filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                (product.description && product.description.toLowerCase().includes(searchTerm));
            
            // API artıq kateqoriya və brend məlumatlarını obyekt şəklində qaytarır
            const productCategoryId = product.category && typeof product.category === 'object' ? product.category.id : product.categoryId;
            const productMarkaId = product.marka && typeof product.marka === 'object' ? product.marka.id : product.markaId;
            
            const matchesCategory = !categoryFilter || productCategoryId == categoryFilter;
            const matchesMarka = !markaFilter || productMarkaId == markaFilter;
            const matchesStatus = !statusFilter || product.status === statusFilter;

            return matchesSearch && matchesCategory && matchesMarka && matchesStatus;
        });

        // Temporarily store filtered products for rendering
        const originalProducts = this.products;
        this.products = filteredProducts;
        this.renderProducts();
        this.products = originalProducts;
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('marka-filter').value = '';
        document.getElementById('status-filter').value = '';
        this.renderProducts();
    }

    toggleImageInput() {
        const imageUrlRadio = document.getElementById('image-url-radio');
        const imageFileRadio = document.getElementById('image-file-radio');
        const imageUrlInput = document.getElementById('product-image-url');
        const imageFileInput = document.getElementById('product-image-file');
        
        console.log('Toggle image input - URL radio:', imageUrlRadio?.checked, 'File radio:', imageFileRadio?.checked);
        
        if (imageUrlRadio.checked) {
            imageUrlInput.classList.remove('d-none');
            imageFileInput.classList.add('d-none');
            console.log('Showing URL input, hiding file input');
        } else {
            imageUrlInput.classList.add('d-none');
            imageFileInput.classList.remove('d-none');
            console.log('Showing file input, hiding URL input');
        }
        
        this.hideImagePreview();
    }

    previewImageFromUrl() {
        const imageUrlInput = document.getElementById('product-image-url');
        const imageUrl = imageUrlInput.value.trim();
        
        if (imageUrl) {
            this.showImagePreview(imageUrl);
        } else {
            this.hideImagePreview();
        }
    }

    previewImageFromFile() {
        const fileInput = document.getElementById('product-image-file');
        const file = fileInput.files[0];
        
        console.log('File input changed:', file ? file.name : 'No file selected');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('File preview loaded successfully');
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected, hiding preview');
            this.hideImagePreview();
        }
    }

    showImagePreview(src) {
        const previewContainer = document.getElementById('image-preview-container');
        const previewImage = document.getElementById('image-preview');
        
        if (previewImage && previewContainer) {
            previewImage.src = src;
            previewContainer.style.display = 'block';
        }
    }

    hideImagePreview() {
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }

    removeImage() {
        const imageUrlInput = document.getElementById('product-image-url');
        const imageFileInput = document.getElementById('product-image-file');
        
        if (imageUrlInput) imageUrlInput.value = '';
        if (imageFileInput) imageFileInput.value = '';
        
        this.hideImagePreview();
    }

    openModal(product = null) {
        const title = document.getElementById('modal-title');
        const form = document.getElementById('product-form');
        
        this.currentProduct = product;
        this.editingProductId = product ? product.id : null;
        
        console.log('openModal called with product:', product);
        console.log('editingProductId set to:', this.editingProductId);
        
        // Populate dropdowns before showing modal
        this.populateFilters();
        
        if (product) {
            title.textContent = 'Məhsulu Redaktə Et';
            this.populateForm(product);
        } else {
            title.textContent = 'Yeni Məhsul Əlavə Et';
            form.reset();
            // Reset image inputs
            const imageUrlRadio = document.getElementById('image-url-radio');
            if (imageUrlRadio) imageUrlRadio.checked = true;
            this.toggleImageInput();
        }
        
        this.modal.show();
    }

    closeModal() {
        this.modal.hide();
        this.editingProductId = null;
        
        // Reset form and image inputs
        const form = document.getElementById('product-form');
        if (form) form.reset();
        
        // Reset radio buttons to default state (URL selected)
        const imageUrlRadio = document.getElementById('image-url-radio');
        const imageFileRadio = document.getElementById('image-file-radio');
        if (imageUrlRadio) imageUrlRadio.checked = true;
        if (imageFileRadio) imageFileRadio.checked = false;
        
        // Clear file input explicitly
        const imageFileInput = document.getElementById('product-image-file');
        if (imageFileInput) imageFileInput.value = '';
        
        this.toggleImageInput();
        this.hideImagePreview();
    }

    populateForm(product) {
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-stock').value = product.stock || '';
        
        // API artıq kateqoriya və marka məlumatlarını obyekt şəklində qaytarır
        const categoryId = product.category && typeof product.category === 'object' ? product.category.id : (product.categoryId || '');
        const markaId = product.marka && typeof product.marka === 'object' ? product.marka.id : (product.markaId || '');
        
        document.getElementById('product-category').value = categoryId;
        document.getElementById('product-marka').value = markaId;
        document.getElementById('product-status').value = product.status || 'active';
        
        // Handle image field
        const imageUrlInput = document.getElementById('product-image-url');
        const imageUrlRadio = document.getElementById('image-url-radio');
        const imageFileRadio = document.getElementById('image-file-radio');
        const imageFileInput = document.getElementById('product-image-file');
        
        if (product.image) {
            imageUrlInput.value = product.image;
            imageUrlRadio.checked = true;
            imageFileRadio.checked = false;
            // Clear file input to avoid conflicts
            if (imageFileInput) imageFileInput.value = '';
            this.toggleImageInput();
            this.showImagePreview(product.image);
        } else {
            imageUrlInput.value = '';
            imageUrlRadio.checked = true;
            imageFileRadio.checked = false;
            if (imageFileInput) imageFileInput.value = '';
            this.toggleImageInput();
            this.hideImagePreview();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData();
        
        // Get form values
        formData.append('name', form.name.value);
        formData.append('price', form.price.value);
        formData.append('description', form.description.value);
        formData.append('stock', form.stock.value);
        formData.append('categoryId', form.categoryId.value);
        formData.append('markaId', form.markaId.value);
        formData.append('status', form.status.value);
        
        // Handle image based on selected type
        const imageUrlRadio = document.getElementById('image-url-radio');
        const imageFileRadio = document.getElementById('image-file-radio');
        const imageUrlInput = document.getElementById('product-image-url');
        const imageFileInput = document.getElementById('product-image-file');
        
        // Debug: Log current state
        console.log('=== IMAGE HANDLING DEBUG ===');
        console.log('Image URL radio checked:', imageUrlRadio?.checked);
        console.log('Image FILE radio checked:', imageFileRadio?.checked);
        console.log('Image URL input value:', imageUrlInput?.value);
        console.log('File input files count:', imageFileInput?.files?.length || 0);
        if (imageFileInput?.files?.length > 0) {
            console.log('Selected file:', imageFileInput.files[0].name, 'Size:', imageFileInput.files[0].size);
        }
        
        // Check which image input is active and has a value
        if (imageUrlRadio.checked && imageUrlInput.value.trim()) {
            // URL input is active and has a value
            formData.append('imageUrl', imageUrlInput.value.trim());
            console.log('✓ Using image URL:', imageUrlInput.value.trim());
        } else if (imageFileRadio.checked && imageFileInput.files && imageFileInput.files.length > 0) {
            // File input is active and has a file selected
            formData.append('imageFile', imageFileInput.files[0]);
            console.log('✓ Using image file:', imageFileInput.files[0].name);
        } else if (this.editingProductId) {
            // When editing and no new image is selected, find the current product to get its image
            const currentProduct = this.products.find(p => p.id === this.editingProductId);
            if (currentProduct && currentProduct.image) {
                formData.append('imageUrl', currentProduct.image);
                console.log('✓ Keeping existing image:', currentProduct.image);
            }
        } else {
            console.log('⚠ No image data provided');
        }
        
        // Debug: Log FormData contents
        console.log('=== FORMDATA CONTENTS ===');
        console.log('Form submission - editingProductId:', this.editingProductId);
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: File - ${value.name} (${value.size} bytes, type: ${value.type})`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
        console.log('========================');

        try {
            if (this.editingProductId) {
                console.log('Updating product with ID:', this.editingProductId);
                await this.updateProduct(this.editingProductId, formData);
            } else {
                console.log('Creating new product');
                await this.createProduct(formData);
            }
            
            this.closeModal();
            await this.loadProducts();
            this.renderProducts();
        } catch (error) {
            console.error('Form submission error:', error);
            showAlert(error.message || 'Xəta baş verdi', 'error');
        }
    }

    async createProduct(formData) {
        const token = getAuthToken();
        
        // Check token validity
        if (!token || isTokenExpired(token)) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                window.location.href = '/admin/login.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${this.apiUrl}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Məhsul yaradılarkən xəta baş verdi');
        }
        
        showAlert('Məhsul uğurla yaradıldı', 'success');
        await this.loadData();
        this.closeModal();
    }

    async updateProduct(id, formData) {
        const token = getAuthToken();
        
        // Check token validity
        if (!token || isTokenExpired(token)) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                window.location.href = '/admin/login.html';
            }, 2000);
            return;
        }
        
        console.log('Sending PUT request to:', `${this.apiUrl}/products/${id}`);
        
        const response = await fetch(`${this.apiUrl}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Update error:', error);
            throw new Error(error.message || 'Məhsul yenilənərkən xəta baş verdi');
        }
        
        const result = await response.json();
        console.log('Update successful:', result);
        
        showAlert('Məhsul uğurla yeniləndi', 'success');
        await this.loadData();
        this.closeModal();
    }

    async editProduct(id) {
        console.log('editProduct called with id:', id);
        console.log('Current products array:', this.products);
        
        const product = this.products.find(p => p.id === id);
        console.log('Found product:', product);
        
        if (product) {
            this.openModal(product);
        } else {
            console.error('Product not found with id:', id);
        }
    }

    async deleteProduct(id) {
        if (!confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${this.apiUrl}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete product');
            }
            
            showAlert('Məhsul uğurla silindi', 'success');
            await this.loadProducts();
            this.renderProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showAlert('Məhsul silinərkən xəta baş verdi', 'danger');
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
let productsManager;
document.addEventListener('DOMContentLoaded', () => {
    productsManager = new ProductsManager();
});