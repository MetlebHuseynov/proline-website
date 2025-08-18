// Markas Management
class MarkasManager {
    constructor() {
        // Auto-detect environment for API URL
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.apiUrl = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';
        this.markas = [];
        this.currentMarka = null;
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
        this.loadMarkas();
    }

    bindEvents() {
        // Modal events
        const modal = document.getElementById('marka-modal');
        const addBtn = document.getElementById('add-marka-btn');
        const closeBtn = modal ? modal.querySelector('.btn-close') : null;
        const form = document.getElementById('marka-form');

        if (addBtn) addBtn.addEventListener('click', () => this.openModal());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Cancel button event
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

        // Search and filter events
        const searchInput = document.getElementById('table-search-input');
        const statusFilter = document.getElementById('status-filter');
        
        if (searchInput) searchInput.addEventListener('input', () => this.filterMarkas());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterMarkas());

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
        const urlRadio = document.getElementById('marka-logo-url-radio');
        const fileRadio = document.getElementById('marka-logo-file-radio');
        const urlInput = document.getElementById('marka-logo');
        const fileInput = document.getElementById('marka-logo-file');
        const removeBtn = document.getElementById('marka-remove-logo-btn');

        if (urlRadio) urlRadio.addEventListener('change', () => this.toggleLogoInput());
        if (fileRadio) fileRadio.addEventListener('change', () => this.toggleLogoInput());
        if (urlInput) urlInput.addEventListener('input', () => this.showLogoPreview());
        if (fileInput) fileInput.addEventListener('change', () => this.showLogoPreview());
        if (removeBtn) removeBtn.addEventListener('click', () => this.removeLogo());
    }

    toggleLogoInput() {
        const urlRadio = document.getElementById('marka-logo-url-radio');
        const urlInput = document.getElementById('marka-logo');
        const fileInput = document.getElementById('marka-logo-file');

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
        const urlRadio = document.getElementById('marka-logo-url-radio');
        const urlInput = document.getElementById('marka-logo');
        const fileInput = document.getElementById('marka-logo-file');
        const preview = document.getElementById('marka-logo-preview');
        const container = document.getElementById('marka-logo-preview-container');

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
        const preview = document.getElementById('marka-logo-preview');
        const container = document.getElementById('marka-logo-preview-container');
        preview.src = '';
        container.style.display = 'none';
    }

    removeLogo() {
        const urlInput = document.getElementById('marka-logo');
        const fileInput = document.getElementById('marka-logo-file');
        urlInput.value = '';
        fileInput.value = '';
        this.hideLogoPreview();
    }

    async loadMarkas() {
        this.showLoading(true);
        try {
            await this.getCurrentUser();
            const token = getAuthToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${this.apiUrl}/markas`, {
                headers: headers
            });
            if (!response.ok) throw new Error('Failed to load markas');
            this.markas = await response.json();
            this.renderMarkas();
            
            // Show add marka button for admin and super admin users
            const addMarkaBtn = document.getElementById('add-marka-btn');
            if (addMarkaBtn && this.loggedInUser && (this.loggedInUser.role === 'admin' || this.loggedInUser.role === 'super_admin')) {
                addMarkaBtn.style.display = 'block';
            } else if (addMarkaBtn) {
                addMarkaBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading markas:', error);
            showAlert('Markalar yüklənərkən xəta baş verdi', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    renderMarkas() {
        const tbody = document.getElementById('markas-table');
        const noData = document.getElementById('no-data');
        
        if (this.markas.length === 0) {
            tbody.innerHTML = '';
            noData.classList.remove('d-none');
            return;
        }
        
        noData.classList.add('d-none');
        
        tbody.innerHTML = this.markas.map(marka => {
            const createdDate = new Date(marka.createdAt).toLocaleDateString('az-AZ');
            
            return `
                <tr>
                    <td>${marka.id}</td>
                    <td>
                        <img src="${marka.logo || '/images/marka-placeholder.svg'}" 
                             alt="${marka.name}" class="marka-logo">
                    </td>
                    <td>${marka.name}</td>
                    <td>${marka.description || '-'}</td>
                    <td>
                        ${marka.website ? `<a href="${marka.website}" target="_blank" class="website-link">
                            <i class="fas fa-external-link-alt"></i> Sayt
                        </a>` : '-'}
                    </td>
                    <td>${marka.productCount || 0}</td>
                    <td>
                        <span class="status-badge ${marka.status}">
                            ${marka.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                        </span>
                    </td>
                    <td>${createdDate}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="markasManager.editMarka(${marka.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="markasManager.deleteMarka(${marka.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterMarkas() {
        const searchInput = document.getElementById('table-search-input');
        const statusFilterEl = document.getElementById('status-filter');
        
        if (!searchInput || !statusFilterEl) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = statusFilterEl.value;

        const filteredMarkas = this.markas.filter(marka => {
            const matchesSearch = marka.name.toLowerCase().includes(searchTerm) ||
                                (marka.description && marka.description.toLowerCase().includes(searchTerm));
            const matchesStatus = !statusFilter || marka.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Temporarily store filtered markas for rendering
        const originalMarkas = this.markas;
        this.markas = filteredMarkas;
        this.renderMarkas();
        this.markas = originalMarkas;
    }

    openModal(marka = null) {
        const modal = document.getElementById('marka-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('marka-form');
        
        this.currentMarka = marka;
        
        if (marka) {
            modalTitle.textContent = 'Markanı Redaktə Et';
            this.populateForm(marka);
        } else {
            modalTitle.textContent = 'Yeni Marka';
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
        const modal = document.getElementById('marka-modal');
        const backdrop = document.querySelector('.modal-backdrop');
        
        // Hide modal with Bootstrap classes
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        if (backdrop) {
            backdrop.remove();
        }
        
        this.currentMarka = null;
        
        // Reset form
        const form = document.getElementById('marka-form');
        if (form) {
            form.reset();
            this.hideLogoPreview();
        }
    }

    populateForm(marka) {
        document.getElementById('marka-name').value = marka.name || '';
        document.getElementById('marka-description').value = marka.description || '';
        document.getElementById('marka-logo').value = marka.logo || '';
        document.getElementById('marka-website').value = marka.website || '';
        document.getElementById('marka-status').value = marka.status || 'active';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Check if file input is being used
        const fileRadio = document.getElementById('marka-logo-file-radio');
        const fileInput = document.getElementById('marka-logo-file');
        const urlInput = document.getElementById('marka-logo');
        
        let useFile = fileRadio && fileRadio.checked && fileInput && fileInput.files.length > 0;
        
        try {
            if (this.currentMarka) {
                if (useFile) {
                    await this.updateMarkaWithFile(this.currentMarka.id, formData);
                } else {
                    const markaData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        logo: formData.get('logo'),
                        website: formData.get('website'),
                        status: formData.get('status')
                    };
                    await this.updateMarka(this.currentMarka.id, markaData);
                }
                showAlert('Marka uğurla yeniləndi', 'success');
            } else {
                if (useFile) {
                    await this.createMarkaWithFile(formData);
                } else {
                    const markaData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        logo: formData.get('logo'),
                        website: formData.get('website'),
                        status: formData.get('status')
                    };
                    await this.createMarka(markaData);
                }
                showAlert('Marka uğurla yaradıldı', 'success');
            }
            
            this.closeModal();
            await this.loadMarkas();
        } catch (error) {
            console.error('Error saving marka:', error);
            showAlert('Marka saxlanılarkən xəta baş verdi', 'danger');
        }
    }

    async createMarka(markaData) {
        const token = getAuthToken();
        
        // Check token validity
        if (!token || isTokenExpired(token)) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                window.location.href = '/admin/login.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${this.apiUrl}/markas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(markaData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create marka');
        }
        
        return response.json();
    }

    async createMarkaWithFile(formData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/markas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create marka');
        }
        
        return response.json();
    }

    async updateMarkaWithFile(id, formData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/markas/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update marka');
        }
        
        return response.json();
    }

    async updateMarka(id, markaData) {
        const token = getAuthToken();
        
        // Check token validity
        if (!token || isTokenExpired(token)) {
            showAlert('Sessiya müddəti bitib. Yenidən daxil olun.', 'warning');
            setTimeout(() => {
                window.location.href = '/admin/login.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${this.apiUrl}/markas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(markaData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update marka');
        }
        
        return response.json();
    }

    async editMarka(id) {
        const marka = this.markas.find(m => m.id === id);
        if (marka) {
            this.openModal(marka);
        }
    }

    async deleteMarka(id) {
        if (!confirm('Bu markanı silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${this.apiUrl}/markas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete marka');
            }
            
            showAlert('Marka uğurla silindi', 'success');
            await this.loadMarkas();
        } catch (error) {
            console.error('Error deleting marka:', error);
            showAlert('Marka silinərkən xəta baş verdi', 'danger');
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
let markasManager;
document.addEventListener('DOMContentLoaded', () => {
    markasManager = new MarkasManager();
});