const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/pool');
const { getDatabase } = require('../config/database');

class FeaturedBrandController {
    constructor() {
        this.featuredBrandsPath = path.join(__dirname, '../data/featured-brands.json');
        this.markasPath = path.join(__dirname, '../data/markas.json');
    }

    async readFeaturedBrands() {
        try {
            const data = await fs.readFile(this.featuredBrandsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Featured brands oxunarkən xəta:', error);
            return [];
        }
    }

    async writeFeaturedBrands(featuredBrands) {
        try {
            await fs.writeFile(this.featuredBrandsPath, JSON.stringify(featuredBrands, null, 2));
            return true;
        } catch (error) {
            console.error('Featured brands yazılarkən xəta:', error);
            return false;
        }
    }

    async readMarkas() {
        try {
            const db = getDatabase();
            return await db.getMarkas();
        } catch (error) {
            console.error('Markalar oxunarkən xəta:', error);
            return [];
        }
    }

    // Get all featured brands with full brand details
    async getFeaturedBrands(req, res) {
        try {
            const featuredBrands = await this.readFeaturedBrands();
            const markas = await this.readMarkas();

            // Get full brand details for featured brands
            const featuredWithDetails = featuredBrands
                .map(featured => {
                    const marka = markas.find(m => parseInt(m.id) === parseInt(featured.brandId));
                    if (!marka) return null;

                    return {
                        ...marka,
                        featuredOrder: featured.order,
                        featuredId: featured.id
                    };
                })
                .filter(marka => marka !== null)
                .sort((a, b) => a.featuredOrder - b.featuredOrder);

            res.json(featuredWithDetails);
        } catch (error) {
            console.error('Featured brands alınarkən xəta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Featured brands alınarkən xəta baş verdi' 
            });
        }
    }

    // Update featured brands order
    async updateFeaturedBrands(req, res) {
        try {
            const { brandIds } = req.body;
            
            if (!Array.isArray(brandIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'Marka ID-ləri array formatında olmalıdır'
                });
            }

            const maxFeaturedBrands = 6;
            if (brandIds.length > maxFeaturedBrands) {
                return res.status(400).json({
                    success: false,
                    message: `Maksimum ${maxFeaturedBrands} marka seçə bilərsiniz`
                });
            }

            // Create new featured brands array
            const featuredBrands = brandIds.map((brandId, index) => ({
                id: index + 1,
                brandId: parseInt(brandId),
                order: index + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            const success = await this.writeFeaturedBrands(featuredBrands);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Featured brands yeniləndi',
                    data: featuredBrands
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Yenilənərkən xəta baş verdi'
                });
            }
        } catch (error) {
            console.error('Featured brands yenilənərkən xəta:', error);
            res.status(500).json({
                success: false,
                message: 'Featured brands yenilənərkən xəta baş verdi'
            });
        }
    }

    // Get public featured brands (for homepage)
    async getPublicFeaturedBrands(req, res) {
        try {
            const featuredBrands = await this.readFeaturedBrands();
            const markas = await this.readMarkas();

            // Get only active featured brands with details
            const publicFeatured = featuredBrands
                .map(featured => {
                    const marka = markas.find(m => parseInt(m.id) === parseInt(featured.brandId) && m.status === 'active');
                    if (!marka) return null;

                    return {
                        id: marka.id,
                        name: marka.name,
                        description: marka.description,
                        logo: marka.logo
                    };
                })
                .filter(marka => marka !== null)
                .sort((a, b) => {
                    const orderA = featuredBrands.find(f => parseInt(f.brandId) === parseInt(a.id))?.order || 999;
                    const orderB = featuredBrands.find(f => parseInt(f.brandId) === parseInt(b.id))?.order || 999;
                    return orderA - orderB;
                });

            res.json(publicFeatured);
        } catch (error) {
            console.error('Public featured brands alınarkən xəta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Featured brands alınarkən xəta baş verdi' 
            });
        }
    }

    // Delete featured brand
    async deleteFeaturedBrand(req, res) {
        try {
            const { id } = req.params;
            const featuredBrands = await this.readFeaturedBrands();
            
            const updatedFeatured = featuredBrands.filter(fb => fb.id !== parseInt(id));
            
            // Reorder remaining brands
            const reorderedFeatured = updatedFeatured.map((fb, index) => ({
                ...fb,
                id: index + 1,
                order: index + 1,
                updatedAt: new Date().toISOString()
            }));

            const success = await this.writeFeaturedBrands(reorderedFeatured);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Featured brand silindi',
                    data: reorderedFeatured
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Silinərkən xəta baş verdi'
                });
            }
        } catch (error) {
            console.error('Featured brand silinərkən xəta:', error);
            res.status(500).json({
                success: false,
                message: 'Featured brand silinərkən xəta baş verdi'
            });
        }
    }
}

module.exports = new FeaturedBrandController();