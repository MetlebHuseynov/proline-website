// DOM Elements
const productLoading = document.getElementById('product-loading');
const productNotFound = document.getElementById('product-not-found');
const productDetails = document.getElementById('product-details');
const productNameBreadcrumb = document.getElementById('product-name-breadcrumb');
const productImage = document.getElementById('product-image');
const productName = document.getElementById('product-name');
const productBrand = document.getElementById('product-brand');
const productPrice = document.getElementById('product-price');
const productStock = document.getElementById('product-stock');
const productDescription = document.getElementById('product-description');
const productSKU = document.getElementById('product-sku');
const productCategory = document.getElementById('product-category');
const productMaterial = document.getElementById('product-material');
const productWeight = document.getElementById('product-weight');
const relatedProducts = document.getElementById('related-products');
const inquiryForm = document.getElementById('inquiry-form');
const inquiryProductName = document.getElementById('inquiry-product-name');

// API URLs
const API_URL = window.ProLine.API_URL;
const PRODUCTS_URL = `${API_URL}/products`;

// Get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        id: urlParams.get('id')
    };
}

// Utility functions (using global functions from main.js)
// formatCurrency and showAlert are defined in main.js

// Load product details
async function loadProductDetails() {
    const { id } = getUrlParams();
    
    if (!id) {
        showProductNotFound();
        return;
    }
    
    try {
        const response = await fetch(`${PRODUCTS_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error('Product not found');
        }
        
        const product = await response.json();
        
        // Update document title
        document.title = `${product.name} - ProLine`;
        
        // Update product info
        productNameBreadcrumb.textContent = product.name;
        productName.textContent = product.name;
        
        if (product.image) {
            productImage.src = product.image;
        }
        
        if (product.brand) {
            productBrand.innerHTML = `<a href="/brand.html?id=${product.brand._id}">${product.brand.name}</a>`;
        } else {
            productBrand.textContent = 'N/A';
        }
        
        productPrice.textContent = formatCurrency(product.price);
        
        if (product.stock > 0) {
            productStock.textContent = `Stokda (${product.stock})`;
            productStock.className = 'text-success';
        } else {
            productStock.textContent = 'Stokda Yoxdur';
            productStock.className = 'text-danger';
        }
        
        productDescription.textContent = product.description || 'Təsvir mövcud deyil';
        productSKU.textContent = product.sku || 'N/A';
        
        if (product.category) {
            productCategory.textContent = product.category.name;
        } else {
            productCategory.textContent = 'N/A';
        }
        
        productMaterial.textContent = product.material || 'N/A';
        productWeight.textContent = product.weight ? `${product.weight} kg` : 'N/A';
        
        // Set inquiry form product name
        inquiryProductName.value = product.name;
        
        // Show product details
        productLoading.classList.add('d-none');
        productDetails.classList.remove('d-none');
        
        // Load related products
        await loadRelatedProducts(product);
        
    } catch (error) {
        console.error('Error loading product details:', error);
        showProductNotFound();
    }
}

// Show product not found message
function showProductNotFound() {
    productLoading.classList.add('d-none');
    productNotFound.classList.remove('d-none');
    document.title = 'Məhsul Tapılmadı - ProLine';
}

// Load related products
async function loadRelatedProducts(currentProduct) {
    try {
        let queryParams = '';
        
        if (currentProduct.category) {
            queryParams = `?category=${currentProduct.category._id}`;
        } else if (currentProduct.brand) {
            queryParams = `?brand=${currentProduct.brand._id}`;
        }
        
        const response = await fetch(`${PRODUCTS_URL}${queryParams}`);
        
        if (!response.ok) {
            throw new Error('Failed to load related products');
        }
        
        let products = await response.json();
        
        // Filter out current product and limit to 4 products
        products = products
            .filter(product => product._id !== currentProduct._id)
            .slice(0, 4);
        
        // Clear related products container
        relatedProducts.innerHTML = '';
        
        if (products.length === 0) {
            relatedProducts.innerHTML = '<div class="col-12 text-center"><p>Əlaqəli məhsul tapılmadı.</p></div>';
            return;
        }
        
        // Display related products
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-md-6 col-lg-3 mb-4';
            productCard.innerHTML = `
                <div class="card h-100 product-card">
                    <img src="${product.image || '/images/product-placeholder.svg'}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-truncate">${product.description || 'Təsvir mövcud deyil'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="price">${formatCurrency(product.price)}</span>
                            <a href="/product.html?id=${product._id}" class="btn btn-primary btn-sm">Təfərrüatları Gör</a>
                        </div>
                    </div>
                </div>
            `;
            
            relatedProducts.appendChild(productCard);
        });
        
    } catch (error) {
        console.error('Error loading related products:', error);
        relatedProducts.innerHTML = '<div class="col-12 text-center"><p>Əlaqəli məhsullar yüklənə bilmədi.</p></div>';
    }
}

// Handle inquiry button click
const inquiryBtn = document.getElementById('inquiry-btn');
const sendInquiryBtn = document.getElementById('send-inquiry-btn');
const inquiryModal = new bootstrap.Modal(document.getElementById('inquiryModal'));

inquiryBtn.addEventListener('click', () => {
    inquiryModal.show();
});

// Handle inquiry form submission
sendInquiryBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('inquiry-name').value;
    const email = document.getElementById('inquiry-email').value;
    const phone = document.getElementById('inquiry-phone').value;
    const message = document.getElementById('inquiry-message').value;
    
    if (!name || !email || !message) {
        showAlert('Zəhmət olmasa bütün tələb olunan sahələri doldurun.', 'warning');
        return;
    }
    
    const inquiryData = {
        name,
        email,
        phone,
        product: inquiryProductName.value,
        message
    };
    
    // In a real application, you would send this data to the server
    // For now, we'll just show a success message
    console.log('Inquiry submitted:', inquiryData);
    
    // Show success message
    showAlert('Sorğunuz uğurla göndərildi. Tezliklə sizinlə əlaqə saxlayacağıq.', 'success');
    
    // Reset form
    document.getElementById('inquiry-name').value = '';
    document.getElementById('inquiry-email').value = '';
    document.getElementById('inquiry-phone').value = '';
    document.getElementById('inquiry-message').value = '';
    
    // Close modal
    inquiryModal.hide();
});

// Initialize tabs
document.addEventListener('DOMContentLoaded', () => {
    // Load product details
    loadProductDetails();
    
    // Initialize Bootstrap tabs
    const tabEls = document.querySelectorAll('a[data-bs-toggle="tab"]');
    tabEls.forEach(tabEl => {
        tabEl.addEventListener('shown.bs.tab', () => {
            const target = tabEl.getAttribute('href');
            const activeTab = document.querySelector(target);
            activeTab.classList.add('show', 'active');
        });
    });
});