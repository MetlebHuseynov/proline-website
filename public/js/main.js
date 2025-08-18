/**
 * Main JavaScript file for ProLine website
 */

// DOM Elements
const featuredProductsContainer = document.getElementById('products-container');
const markaContainer = document.getElementById('brands-container');
const homeCategoriesContainer = document.getElementById('home-categories-container');
const featuredCategoriesContainer = document.getElementById('featured-categories-container');
const featuredBrandsContainer = document.getElementById('featured-brands-container');

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

// Dynamic category data - loaded from API
let dynamicCategories = [];

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            const data = await response.json();
            dynamicCategories = data.categories || [];
        } else {
            console.error('Failed to load categories:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Get categories (with fallback to static data if needed)
function getCategories() {
    return dynamicCategories.length > 0 ? dynamicCategories : [];
}

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
                productCard.className = 'col-md-4 col-lg-2 mb-4';
                productCard.innerHTML = `
                    <div class="card product-card h-100">
                        <span class="badge bg-danger text-white">Öne Çıxan</span>
                        <img src="${product.image || '/images/product-placeholder.svg'}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-truncate">${product.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="product-price">${formatCurrency(product.price)}</span>
        
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

// Load Home Categories
const loadHomeCategories = async () => {
    try {
        // Try to fetch from API first
        let categories;
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                categories = await response.json();
                console.log('Categories loaded from API:', categories);
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.warn('API failed, using dynamic categories:', apiError);
            categories = getCategories();
        }
        
        if (homeCategoriesContainer) {
            homeCategoriesContainer.innerHTML = '';
            
            if (!categories || categories.length === 0) {
                homeCategoriesContainer.innerHTML = '<div class="col-12 text-center"><p>Kateqoriya tapılmadı.</p></div>';
                return;
            }
            
            // Show only first 4 categories on home page
            const displayCategories = categories.slice(0, 4);
            
            displayCategories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'col-md-4 col-lg-2 mb-4';
                categoryCard.innerHTML = `
                    <div class="category-card h-100" onclick="window.location.href='/products.html?category=${encodeURIComponent(category.name)}'">
                        <div class="category-image">
                            <img src="${category.image || '/images/category-placeholder.svg'}" alt="${category.name}" class="category-img">
                        </div>
                        <div class="card-body text-center">
                            <h5 class="card-title">${category.name}</h5>
                        </div>
                    </div>
                `;
                homeCategoriesContainer.appendChild(categoryCard);
            });
        }
    } catch (error) {
        console.error('Error loading home categories:', error);
        if (homeCategoriesContainer) {
            homeCategoriesContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Kateqoriyalar yüklənərkən xəta baş verdi.</p></div>';
        }
    }
};

// Static marka data
const staticMarka = [
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

// Load Featured Categories
const loadFeaturedCategories = async () => {
    try {
        // Try to fetch from API first
        let categories;
        try {
            const response = await fetch('/api/featured-categories/public');
            if (response.ok) {
                categories = await response.json();
                console.log('Featured categories loaded from API:', categories);
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.warn('API failed, using dynamic categories:', apiError);
            categories = getCategories().filter(cat => cat.featured);
        }
        
        if (featuredCategoriesContainer) {
            featuredCategoriesContainer.innerHTML = '';
            
            if (!categories || categories.length === 0) {
                featuredCategoriesContainer.innerHTML = '<div class="col-12 text-center"><p>Öne çıxan kateqoriya tapılmadı.</p></div>';
                return;
            }
            
            categories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'col-md-4 col-lg-2 mb-4';
                categoryCard.innerHTML = `
                    <div class="category-card h-100" onclick="window.location.href='/products.html?category=${encodeURIComponent(category.name)}'">
                        <span class="badge bg-success text-white">Öne Çıxan</span>
                        <div class="category-image">
                            <img src="${category.image || '/images/category-placeholder.svg'}" alt="${category.name}" class="category-img">
                        </div>
                        <div class="card-body text-center">
                            <h5 class="card-title">${category.name}</h5>
                        </div>
                    </div>
                `;
                featuredCategoriesContainer.appendChild(categoryCard);
            });
        }
    } catch (error) {
        console.error('Error loading featured categories:', error);
        if (featuredCategoriesContainer) {
            featuredCategoriesContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Öne çıxan kateqoriyalar yüklənərkən xəta baş verdi.</p></div>';
        }
    }
};

// Load Marka
const loadMarka = async () => {
    try {
        // Try to fetch from API first
        let markas;
        try {
            const response = await fetch('/api/markas');
            if (response.ok) {
                markas = await response.json();
                console.log('Markas loaded from API:', markas);
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.warn('API failed, using static data:', apiError);
            markas = { data: staticMarka };
        }
        
        if (markaContainer) {
            markaContainer.innerHTML = '';
            
            const markaData = markas.data || markas;
            if (!markaData || markaData.length === 0) {
                markaContainer.innerHTML = '<div class="col-12 text-center"><p>Marka tapılmadı.</p></div>';
                return;
            }
            
            markaData.forEach(marka => {
                const markaCard = document.createElement('div');
                markaCard.className = 'col-md-4 col-lg-2 mb-4';
                markaCard.innerHTML = `
                    <div class="brand-card text-center">
                        <img src="${marka.logo || '/images/brand-placeholder.svg'}" class="marka-logo" alt="${marka.name}">
                        <h5>${marka.name}</h5>
                        <div class="product-count mb-2">
                            <small class="text-muted">${marka.productCount || 0} məhsul</small>
                        </div>
                        <a href="/marka.html?id=${marka._id || marka.id}" class="btn btn-sm btn-outline-primary mt-2">Məhsulları Gör</a>
                    </div>
                `;
                markaContainer.appendChild(markaCard);
            });
        }
    } catch (error) {
        console.error('Error loading marka:', error);
        if (markaContainer) {
            markaContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Markalar yüklənərkən xəta baş verdi. Zəhmət olmasa daha sonra yenidən cəhd edin.</p></div>';
        }
    }
};

// Load Featured Brands
const loadFeaturedBrands = async () => {
    try {
        // Try to fetch from API first
        let brands;
        try {
            const response = await fetch('/api/featured-brands/public');
            if (response.ok) {
                brands = await response.json();
                console.log('Featured brands loaded from API:', brands);
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.warn('API failed, using static data:', apiError);
            brands = staticMarka.filter(brand => brand.featured);
        }
        
        if (featuredBrandsContainer) {
            featuredBrandsContainer.innerHTML = '';
            
            if (!brands || brands.length === 0) {
                featuredBrandsContainer.innerHTML = '<div class="col-12 text-center"><p>Öne çıxan marka tapılmadı.</p></div>';
                return;
            }
            
            brands.forEach(brand => {
                const brandCard = document.createElement('div');
                brandCard.className = 'col-md-4 col-lg-2 mb-4';
                brandCard.innerHTML = `
                    <div class="brand-card text-center h-100">
                        <span class="badge bg-warning text-dark">Öne Çıxan</span>
                        <img src="${brand.logo || '/images/brand-placeholder.svg'}" class="marka-logo" alt="${brand.name}">
                        <h5>${brand.name}</h5>
                        <div class="product-count mb-2">
                            <small class="text-muted">${brand.productCount || 0} məhsul</small>
                        </div>
                        <a href="/marka.html?id=${brand._id || brand.id}" class="btn btn-sm btn-outline-primary mt-2">Məhsulları Gör</a>
                    </div>
                `;
                featuredBrandsContainer.appendChild(brandCard);
            });
        }
    } catch (error) {
        console.error('Error loading featured brands:', error);
        if (featuredBrandsContainer) {
            featuredBrandsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Öne çıxan markalar yüklənərkən xəta baş verdi.</p></div>';
        }
    }
};

// Initialize
const init = () => {
    // Load categories from API
    loadCategories();
    
    // Load home categories on homepage
    if (homeCategoriesContainer) {
        loadHomeCategories();
    }
    
    // Load featured categories on homepage
    if (featuredCategoriesContainer) {
        loadFeaturedCategories();
    }
    
    // Load featured products on homepage
    if (featuredProductsContainer) {
        loadFeaturedProducts();
    }
    
    // Load marka on homepage  
    if (markaContainer) {
        loadMarka();
    }
    
    // Load featured brands on homepage
    if (featuredBrandsContainer) {
        loadFeaturedBrands();
    }
};

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);