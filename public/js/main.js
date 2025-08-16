/**
 * Main JavaScript file for ProLine website
 */

// DOM Elements
const featuredProductsContainer = document.getElementById('products-container');
const brandsContainer = document.getElementById('brands-container');

// API URLs from global config - using window.ProLine directly to avoid redeclaration

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 2
    }).format(amount);
};

const showAlert = (message, type = 'danger', container = 'alert-container') => {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
};

// Static product data
const staticProducts = [
    {
        _id: '1',
        name: 'Çelik Boru',
        description: 'Yüksek kaliteli çelik boru, endüstriyel kullanım için ideal',
        price: 45.50,
        image: '/images/steel-pipe.svg',
        featured: true
    },
    {
        _id: '2',
        name: 'İnşaat Demiri',
        description: 'Dayanıklı inşaat demiri, yapı güvenliği için',
        price: 32.75,
        image: '/images/rebar.svg',
        featured: true
    },
    {
        _id: '3',
        name: 'Alüminyum Profil',
        description: 'Hafif ve dayanıklı alüminyum profil sistemleri',
        price: 28.90,
        image: '/images/aluminum-profile.svg',
        featured: true
    },
    {
        _id: '4',
        name: 'Kaynak Elektrodu',
        description: 'Profesyonel kaynak işleri için yüksek kalite elektrodu',
        price: 15.25,
        image: '/images/welding-electrode.svg',
        featured: true
    }
];

// Load Featured Products
const loadFeaturedProducts = async () => {
    try {
        // Try to fetch from API first
        let products;
        try {
            const response = await fetch('/api/featured-products/public');
            if (response.ok) {
                products = await response.json();
                console.log('Featured products loaded from API:', products);
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.warn('API failed, using static data:', apiError);
            products = staticProducts;
        }
        
        if (featuredProductsContainer) {
            featuredProductsContainer.innerHTML = '';
            
            if (!products || products.length === 0) {
                featuredProductsContainer.innerHTML = '<div class="col-12 text-center"><p>Öne çıxan məhsul tapılmadı.</p></div>';
                return;
            }
            
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'col-md-6 col-lg-3 mb-4';
                productCard.innerHTML = `
                    <div class="card product-card h-100">
                        <span class="badge bg-danger text-white">Öne Çıxan</span>
                        <img src="${product.image || '/images/product-placeholder.svg'}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-truncate">${product.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="product-price">${formatCurrency(product.price)}</span>
                                <a href="/product.html?id=${product.id}" class="btn btn-sm btn-outline-primary">Təfərrüatları Gör</a>
                            </div>
                        </div>
                    </div>
                `;
                featuredProductsContainer.appendChild(productCard);
            });
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        if (featuredProductsContainer) {
            featuredProductsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Məhsullar yüklənərkən xəta baş verdi. Zəhmət olmasa daha sonra yenidən cəhd edin.</p></div>';
        }
    }
};

// Static brand data
const staticBrands = [
    {
        _id: '1',
        name: 'Bosch',
        logo: '/images/bosch-logo.svg'
    },
    {
        _id: '2',
        name: 'Siemens',
        logo: '/images/siemens-logo.svg'
    },
    {
        _id: '3',
        name: 'Schneider Electric',
        logo: '/images/schneider-logo.svg'
    },
    {
        _id: '4',
        name: 'ABB',
        logo: '/images/abb-logo.svg'
    },
    {
        _id: '5',
        name: 'Danfoss',
        logo: '/images/danfoss-logo.svg'
    },
    {
        _id: '6',
        name: 'Honeywell',
        logo: '/images/honeywell-logo.svg'
    }
];

// Load Brands
const loadBrands = async () => {
    try {
        const brands = { data: staticBrands };
        
        if (brandsContainer) {
            brandsContainer.innerHTML = '';
            
            if (brands.data.length === 0) {
                brandsContainer.innerHTML = '<div class="col-12 text-center"><p>Marka tapılmadı.</p></div>';
                return;
            }
            
            brands.data.forEach(brand => {
                const brandCard = document.createElement('div');
                brandCard.className = 'col-md-4 col-lg-2 mb-4';
                brandCard.innerHTML = `
                    <div class="brand-card">
                        <img src="${brand.logo || '/images/brand-placeholder.svg'}" class="brand-logo" alt="${brand.name}">
                        <h5>${brand.name}</h5>
                        <a href="/brand.html?id=${brand._id}" class="btn btn-sm btn-outline-primary mt-2">Məhsulları Gör</a>
                    </div>
                `;
                brandsContainer.appendChild(brandCard);
            });
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        if (brandsContainer) {
            brandsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Markalar yüklənərkən xəta baş verdi. Zəhmət olmasa daha sonra yenidən cəhd edin.</p></div>';
        }
    }
};

// Initialize
const init = () => {
    // Load featured products on homepage
    if (featuredProductsContainer) {
        loadFeaturedProducts();
    }
    
    // Load brands on homepage  
    if (brandsContainer) {
        loadBrands();
    }
};

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);