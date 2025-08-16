// Users Management
class UsersManager {
    constructor() {
        // Auto-detect environment for API URL
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.apiUrl = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';
        this.users = [];
        this.currentUser = null;
        this.loggedInUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUsers();
    }

    bindEvents() {
        // Modal events
        const modal = document.getElementById('user-modal');
        const addBtn = document.getElementById('add-user-btn');
        const form = document.getElementById('user-form');

        console.log('Binding events...');
        console.log('Modal found:', !!modal);
        console.log('Add button found:', !!addBtn);
        console.log('Form found:', !!form);

        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Add user button clicked');
                this.openModal();
            });
        }
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submit event triggered');
                this.handleSubmit(e);
            });
        }

        // Search and filter events
        const searchInput = document.getElementById('table-search-input');
        const roleFilter = document.getElementById('role-filter');
        const statusFilter = document.getElementById('status-filter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterUsers());
        }
        if (roleFilter) {
            roleFilter.addEventListener('change', () => this.filterUsers());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterUsers());
        }

        // Initialize Bootstrap modal
        if (modal) {
            console.log('Initializing Bootstrap modal...');
            try {
                this.modal = new bootstrap.Modal(modal);
                console.log('Bootstrap modal initialized successfully');
            } catch (error) {
                console.error('Error initializing Bootstrap modal:', error);
            }
        } else {
            console.error('Modal element not found!');
        }
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

    async loadUsers() {
        this.showLoading(true);
        try {
            await this.getCurrentUser();
            const token = getAuthToken();
            const response = await fetch(`${this.apiUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to load users');
            this.users = await response.json();
            this.renderUsers();
            
            // Hide add user button for non-super admin users
            const addUserBtn = document.getElementById('add-user-btn');
            if (addUserBtn && this.loggedInUser && this.loggedInUser.role !== 'super_admin') {
                addUserBtn.style.display = 'none';
            } else if (addUserBtn) {
                addUserBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showAlert('İstifadəçilər yüklənərkən xəta baş verdi', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('users-table');
        const noData = document.getElementById('no-data');
        const tableCard = document.querySelector('.card');
        
        if (this.users.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (noData) noData.classList.remove('d-none');
            if (tableCard) tableCard.classList.add('d-none');
            return;
        }
        
        if (noData) noData.classList.add('d-none');
        if (tableCard) tableCard.classList.remove('d-none');
        
        if (tbody) {
            tbody.innerHTML = this.users.map(user => {
                const createdDate = new Date(user.createdAt).toLocaleDateString('az-AZ');
                const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('az-AZ') : '-';
                
                return `
                    <tr>
                        <td>${user.id}</td>
                        <td>
                            <div class="fw-medium">${user.name}</div>
                        </td>
                        <td>${user.email}</td>
                        <td>
                            <span class="badge ${user.role === 'super_admin' ? 'bg-danger' : user.role === 'admin' ? 'bg-primary' : 'bg-secondary'}">
                                ${user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'İstifadəçi'}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-warning'}">
                                ${user.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                            </span>
                        </td>
                        <td><small class="text-muted">${lastLogin}</small></td>
                        <td><small class="text-muted">${createdDate}</small></td>
                        <td>
                            <div class="btn-group" role="group">
                                ${(this.loggedInUser && this.loggedInUser.role === 'super_admin') || (this.loggedInUser && user.id !== this.loggedInUser.id) ? `<button class="btn btn-sm btn-outline-primary" onclick="usersManager.editUser(${user.id})" title="Redaktə et">
                                    <i class="fas fa-edit"></i>
                                </button>` : ''}
                                ${user.role !== 'super_admin' && (!this.loggedInUser || user.id !== this.loggedInUser.id) ? `<button class="btn btn-sm btn-outline-danger" onclick="usersManager.deleteUser(${user.id})" title="Sil">
                                    <i class="fas fa-trash"></i>
                                </button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    filterUsers() {
        const searchInput = document.getElementById('table-search-input');
        const roleFilterEl = document.getElementById('role-filter');
        const statusFilterEl = document.getElementById('status-filter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const roleFilter = roleFilterEl ? roleFilterEl.value : '';
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';

        const filteredUsers = this.users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                                user.email.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });

        // Temporarily store filtered users for rendering
        const originalUsers = this.users;
        this.users = filteredUsers;
        this.renderUsers();
        this.users = originalUsers;
    }

    openModal(user = null) {
        console.log('Opening modal for user:', user);
        const title = document.getElementById('userModalLabel');
        const form = document.getElementById('user-form');
        const passwordGroup = document.getElementById('password-group');
        const passwordInput = document.getElementById('user-password');
        const roleSelect = document.getElementById('user-role');
        
        console.log('Modal elements found:', {
            title: !!title,
            form: !!form,
            passwordGroup: !!passwordGroup,
            passwordInput: !!passwordInput,
            modal: !!this.modal
        });
        
        this.currentUser = user;
        
        // Hide admin option if current user is not super admin
        if (roleSelect && this.loggedInUser && this.loggedInUser.role !== 'super_admin') {
            const adminOption = roleSelect.querySelector('option[value="admin"]');
            if (adminOption) {
                adminOption.style.display = 'none';
            }
        } else if (roleSelect) {
            // Show admin option if user is super admin
            const adminOption = roleSelect.querySelector('option[value="admin"]');
            if (adminOption) {
                adminOption.style.display = 'block';
            }
        }
        
        if (user) {
            // Edit mode
            if (title) title.textContent = 'İstifadəçini Redaktə Et';
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (passwordInput) passwordInput.removeAttribute('required');
            this.populateForm(user);
        } else {
            // Add mode
            if (title) title.textContent = 'Yeni İstifadəçi Əlavə Et';
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (passwordInput) passwordInput.setAttribute('required', 'required');
            if (form) form.reset();
        }
        
        if (this.modal) {
            console.log('Showing modal...');
            this.modal.show();
        } else {
            console.error('Modal not initialized!');
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.hide();
        }
        this.currentUser = null;
    }

    populateForm(user) {
        document.getElementById('user-name').value = user.name || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-role').value = user.role || 'user';
        document.getElementById('user-status').value = user.status || 'active';
    }

    async handleSubmit(e) {
        console.log('handleSubmit called');
        e.preventDefault();
        
        const form = e.target;
        console.log('Form element:', form);
        
        const formData = new FormData(form);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            status: formData.get('status')
        };

        console.log('Extracted user data:', userData);
        console.log('Current user (editing mode):', this.currentUser);

        // Only include password for new users
        if (!this.currentUser) {
            userData.password = formData.get('password');
            console.log('Adding password for new user');
        }

        // Validate required fields
        if (!userData.name || !userData.email || (!this.currentUser && !userData.password)) {
            console.log('Validation failed - missing required fields');
            showAlert('Zəhmət olmasa bütün tələb olunan sahələri doldurun', 'danger');
            return;
        }

        // Check if non-super admin is trying to create/edit admin role
        if (userData.role === 'admin' && this.loggedInUser && this.loggedInUser.role !== 'super_admin') {
            console.log('Non-super admin trying to create/edit admin role');
            showAlert('Yalnız super admin istifadəçiləri admin yarada bilər', 'danger');
            return;
        }

        try {
            console.log('Attempting to save user...');
            if (this.currentUser) {
                console.log('Updating existing user with ID:', this.currentUser.id);
                await this.updateUser(this.currentUser.id, userData);
                showAlert('İstifadəçi uğurla yeniləndi', 'success');
            } else {
                console.log('Creating new user...');
                await this.createUser(userData);
                showAlert('İstifadəçi uğurla yaradıldı', 'success');
            }
            
            console.log('Operation successful, closing modal and reloading users...');
            this.closeModal();
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            showAlert(error.message || 'İstifadəçi saxlanılarkən xəta baş verdi', 'danger');
        }
    }

    async createUser(userData) {
        console.log('Creating user with data:', userData);
        const token = getAuthToken();
        console.log('Auth token:', token ? 'Present' : 'Missing');
        
        const response = await fetch(`${this.apiUrl}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Error response:', error);
            throw new Error(error.message || `Failed to create user: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('User created successfully:', result);
        return result;
    }

    async updateUser(id, userData) {
        const token = getAuthToken();
        const response = await fetch(`${this.apiUrl}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update user');
        }
        
        return response.json();
    }

    async editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            this.openModal(user);
        }
    }

    async deleteUser(id) {
        if (!confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${this.apiUrl}/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete user');
            }
            
            showAlert('İstifadəçi uğurla silindi', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert('İstifadəçi silinərkən xəta baş verdi', 'danger');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const noData = document.getElementById('no-data');
        const tableCard = document.querySelector('.card');
        
        if (loading) {
            if (show) {
                loading.classList.remove('d-none');
                if (tableCard) tableCard.classList.add('d-none');
                if (noData) noData.classList.add('d-none');
            } else {
                loading.classList.add('d-none');
                if (tableCard) tableCard.classList.remove('d-none');
            }
        }
    }
}

// Initialize when DOM is loaded
let usersManager;
document.addEventListener('DOMContentLoaded', () => {
    usersManager = new UsersManager();
});