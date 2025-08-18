/**
 * Admin Dashboard JavaScript
 */

// DOM Elements
const productsCountElement = document.getElementById('products-count');
const categoriesCountElement = document.getElementById('categories-count');
const markasCountElement = document.getElementById('markas-count');
const usersCountElement = document.getElementById('users-count');
const recentProductsTable = document.getElementById('recent-products-table');

// API URLs
// Auto-detect environment for API URL
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';
const PRODUCTS_URL = `${API_BASE_URL}/products`;
const CATEGORIES_URL = `${API_BASE_URL}/categories`;
const MARKAS_URL = `${API_BASE_URL}/markas`;
const USERS_URL = `${API_BASE_URL}/users`;

// Auth token function is available from main.js

// Load Dashboard Data
const loadDashboardData = async () => {
    try {
        // Fetch counts
        await Promise.all([
            loadProductsCount(),
            loadCategoriesCount(),
            loadMarkasCount(),
            loadUsersCount(),
            loadRecentProducts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('İdarə paneli məlumatları yüklənmədi. Yenidən cəhd edin.');
    }
};

// Load Products Count
const loadProductsCount = async () => {
    try {
        const token = getAuthToken();
        const response = await fetch(PRODUCTS_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const products = await response.json();
        if (productsCountElement) {
            productsCountElement.textContent = products.length.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading products count:', error);
        if (productsCountElement) productsCountElement.textContent = '0';
    }
};

// Load Categories Count
const loadCategoriesCount = async () => {
    try {
        const token = getAuthToken();
        const response = await fetch(CATEGORIES_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const categories = await response.json();
        if (categoriesCountElement) {
            categoriesCountElement.textContent = categories.length.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading categories count:', error);
        if (categoriesCountElement) categoriesCountElement.textContent = '0';
    }
};

// Load Markas Count
const loadMarkasCount = async () => {
    try {
        const token = getAuthToken();
        const response = await fetch(MARKAS_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const markas = await response.json();
        if (markasCountElement) {
            markasCountElement.textContent = markas.length.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading markas count:', error);
        if (markasCountElement) markasCountElement.textContent = '0';
    }
};

// Load Users Count
const loadUsersCount = async () => {
    try {
        const token = getAuthToken();
        const response = await fetch(USERS_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const users = await response.json();
        if (usersCountElement) {
            usersCountElement.textContent = users.length.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading users count:', error);
        if (usersCountElement) usersCountElement.textContent = '0';
    }
};

// Load Recent Products
const loadRecentProducts = async () => {
    try {
        if (!recentProductsTable) return;
        
        const token = getAuthToken();
        const response = await fetch(PRODUCTS_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const products = await response.json();
        
        // Show only the first 5 products
        const recentProducts = products.slice(0, 5);
        
        recentProductsTable.innerHTML = '';
        
        recentProducts.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${product.image}" alt="${product.name}" class="table-img">
                </td>
                <td>${product.name}</td>
                <td>${product.category.name}</td>
                <td>${product.marka.name}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>
                    ${product.inStock ? 
                        '<span class="badge bg-success">Stokda</span>' : 
                        '<span class="badge bg-danger">Stokda Yoxdur</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-product" data-id="${product._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            recentProductsTable.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                if (confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
                    await deleteProduct(productId);
                }
            });
        });
    } catch (error) {
        console.error('Error loading recent products:', error);
        if (recentProductsTable) {
            recentProductsTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Məhsullar yüklənərkən xəta baş verdi</td></tr>';
        }
    }
};

// Delete Product
const deleteProduct = async (productId) => {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Məhsul uğurla silindi', 'success');
            loadRecentProducts(); // Reload the products table
            loadProductsCount(); // Update the products count
        } else {
            throw new Error(data.message || 'Məhsul silinərkən xəta baş verdi');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('Məhsul silinərkən xəta baş verdi. Yenidən cəhd edin.', 'error');
    }
};

// Add Product Modal Functions
const initProductModal = () => {
    const addProductModal = document.getElementById('addProductModal');
    const addProductForm = document.getElementById('addProductForm');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const productImageInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (!addProductModal || !addProductForm || !saveProductBtn) return;
    
    // Image preview functionality
    if (productImageInput && imagePreview) {
        productImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.style.display = 'none';
            }
        });
    }
    
    // Save product functionality
    saveProductBtn.addEventListener('click', async () => {
        const formData = new FormData();
        
        // Get form values
        const productName = document.getElementById('productName').value;
        const productPrice = document.getElementById('productPrice').value;
        const productCategory = document.getElementById('productCategory').value;
        const productMarka = document.getElementById('productMarka').value;
        const productDescription = document.getElementById('productDescription').value;
        const productStock = document.getElementById('productStock').value;
        const productStatus = document.getElementById('productStatus').value;
        const productImage = document.getElementById('productImage').files[0];
        
        // Validate required fields
        if (!productName || !productPrice || !productCategory || !productMarka || !productDescription || !productStock) {
            showAlert('Bütün zəruri sahələri doldurun', 'error');
            return;
        }
        
        // Create product object
        const productData = {
            name: productName,
            price: parseFloat(productPrice),
            category: productCategory,
            marka: productMarka,
            description: productDescription,
            stock: parseInt(productStock),
            status: productStatus,
            image: '/images/product-placeholder.svg' // Default image for now
        };
        
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show success message
                showAlert('Məhsul uğurla əlavə edildi!', 'success');
                
                // Reset form
                addProductForm.reset();
                imagePreview.style.display = 'none';
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(addProductModal);
                modal.hide();
                
                // Reload dashboard data
                loadDashboardData();
            } else {
                throw new Error(data.message || 'Məhsul əlavə edilərkən xəta baş verdi');
            }
            
        } catch (error) {
            console.error('Error adding product:', error);
            showAlert(error.message || 'Məhsul əlavə edilərkən xəta baş verdi', 'error');
        }
    });
    
    // Reset form when modal is closed
    addProductModal.addEventListener('hidden.bs.modal', () => {
        addProductForm.reset();
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
    });
};

// Initialize
const initDashboard = () => {
    // Load dashboard data
    loadDashboardData();
    
    // Initialize product modal
    initProductModal();
};

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initDashboard);