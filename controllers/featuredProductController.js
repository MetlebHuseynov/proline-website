const fs = require('fs').promises;
const path = require('path');

class FeaturedProductController {
    constructor() {
        this.featuredProductsPath = path.join(__dirname, '../data/featured-products.json');
        this.productsPath = path.join(__dirname, '../data/products.json');
        this.categoriesPath = path.join(__dirname, '../data/categories.json');
        this.brandsPath = path.join(__dirname, '../data/brands.json');
    }

    async readFeaturedProducts() {
        try {
            const data = await fs.readFile(this.featuredProductsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Featured products oxunarkən xəta:', error);
            return [];
        }
    }

    async writeFeaturedProducts(featuredProducts) {
        try {
            await fs.writeFile(this.featuredProductsPath, JSON.stringify(featuredProducts, null, 2));
            return true;
        } catch (error) {
            console.error('Featured products yazılarkən xəta:', error);
            return false;
        }
    }

    async readProducts() {
        try {
            const data = await fs.readFile(this.productsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Məhsullar oxunarkən xəta:', error);
            return [];
        }
    }

    async readCategories() {
        try {
            const data = await fs.readFile(this.categoriesPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Kateqoriyalar oxunarkən xəta:', error);
            return [];
        }
    }

    async readBrands() {
        try {
            const data = await fs.readFile(this.brandsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Markalar oxunarkən xəta:', error);
            return [];
        }
    }

    // Get all featured products with full product details
    async getFeaturedProducts(req, res) {
        try {
            const featuredProducts = await this.readFeaturedProducts();
            const products = await this.readProducts();
            const categories = await this.readCategories();
            const brands = await this.readBrands();

            // Create lookup maps for better performance
            const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
            const brandMap = new Map(brands.map(brand => [brand.id, brand.name]));

            // Get full product details for featured products
            const featuredWithDetails = featuredProducts
                .map(featured => {
                    const product = products.find(p => parseInt(p.id) === parseInt(featured.productId));
                    if (!product) return null;

                    return {
                        ...product,
                        category: categoryMap.get(product.categoryId) || 'Naməlum',
                        brand: brandMap.get(product.brandId) || 'Naməlum',
                        featuredOrder: featured.order,
                        featuredId: featured.id
                    };
                })
                .filter(product => product !== null)
                .sort((a, b) => a.featuredOrder - b.featuredOrder);

            res.json(featuredWithDetails);
        } catch (error) {
            console.error('Featured products alınarkən xəta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Featured products alınarkən xəta baş verdi' 
            });
        }
    }

    // Update featured products
    async updateFeaturedProducts(req, res) {
        try {
            const { products } = req.body;

            if (!Array.isArray(products)) {
                return res.status(400).json({
                    success: false,
                    message: 'Məhsullar massiv formatında olmalıdır'
                });
            }

            if (products.length > 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Maksimum 8 məhsul seçə bilərsiniz'
                });
            }

            // Validate that all product IDs exist
            const allProducts = await this.readProducts();
            const productIds = allProducts.map(p => parseInt(p.id));
            
            for (const product of products) {
                if (!productIds.includes(parseInt(product.id))) {
                    return res.status(400).json({
                        success: false,
                        message: `Məhsul tapılmadı: ${product.id}`
                    });
                }
            }

            // Create new featured products array
            const newFeaturedProducts = products.map((product, index) => ({
                id: index + 1,
                productId: parseInt(product.id),
                order: parseInt(product.order),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));
            
            console.log('Creating new featured products:', newFeaturedProducts);

            // Save to file
            const success = await this.writeFeaturedProducts(newFeaturedProducts);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Öndə olan məhsullar uğurla yeniləndi',
                    data: newFeaturedProducts
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Məhsullar saxlanılarkən xəta baş verdi'
                });
            }
        } catch (error) {
            console.error('Featured products yenilənərkən xəta - Detallı məlumat:', {
                error: error.message,
                stack: error.stack,
                requestBody: req.body,
                timestamp: new Date().toISOString()
            });
            res.status(500).json({
                success: false,
                message: `Featured products yenilənərkən xəta baş verdi: ${error.message}`
            });
        }
    }

    // Get featured products for public display (homepage)
    async getPublicFeaturedProducts(req, res) {
        try {
            const featuredProducts = await this.readFeaturedProducts();
            const products = await this.readProducts();
            const categories = await this.readCategories();
            const brands = await this.readBrands();

            // Create lookup maps
            const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
            const brandMap = new Map(brands.map(brand => [brand.id, brand.name]));

            // Get only active featured products with details
            const publicFeatured = featuredProducts
                .map(featured => {
                    const product = products.find(p => parseInt(p.id) === parseInt(featured.productId) && p.status === 'active');
                    if (!product) return null;

                    return {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        image: product.image,
                        category: categoryMap.get(product.categoryId) || 'Naməlum',
                        brand: brandMap.get(product.brandId) || 'Naməlum',
                        stock: product.stock
                    };
                })
                .filter(product => product !== null)
                .sort((a, b) => {
                    const orderA = featuredProducts.find(f => parseInt(f.productId) === parseInt(a.id))?.order || 999;
                    const orderB = featuredProducts.find(f => parseInt(f.productId) === parseInt(b.id))?.order || 999;
                    return orderA - orderB;
                });

            res.json(publicFeatured);
        } catch (error) {
            console.error('Public featured products alınarkən xəta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Featured products alınarkən xəta baş verdi' 
            });
        }
    }

    // Delete a featured product
    async deleteFeaturedProduct(req, res) {
        try {
            const { id } = req.params;
            const featuredProducts = await this.readFeaturedProducts();
            
            const updatedFeatured = featuredProducts.filter(fp => fp.id !== parseInt(id));
            
            // Reorder remaining products
            const reorderedFeatured = updatedFeatured.map((fp, index) => ({
                ...fp,
                id: index + 1,
                order: index + 1,
                updatedAt: new Date().toISOString()
            }));

            const success = await this.writeFeaturedProducts(reorderedFeatured);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Featured product silindi',
                    data: reorderedFeatured
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Silinərkən xəta baş verdi'
                });
            }
        } catch (error) {
            console.error('Featured product silinərkən xəta:', error);
            res.status(500).json({
                success: false,
                message: 'Featured product silinərkən xəta baş verdi'
            });
        }
    }
}

module.exports = new FeaturedProductController();