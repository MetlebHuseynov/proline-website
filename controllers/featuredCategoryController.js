const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/pool');
const { getDatabase } = require('../config/database');

class FeaturedCategoryController {
    constructor() {
        this.featuredCategoriesPath = path.join(__dirname, '../data/featured-categories.json');
        this.categoriesPath = path.join(__dirname, '../data/categories.json');
    }

    async readFeaturedCategories() {
        try {
            const data = await fs.readFile(this.featuredCategoriesPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Featured categories oxunarkən xəta:', error);
            return [];
        }
    }

    async writeFeaturedCategories(featuredCategories) {
        try {
            await fs.writeFile(this.featuredCategoriesPath, JSON.stringify(featuredCategories, null, 2));
            return true;
        } catch (error) {
            console.error('Featured categories yazılarkən xəta:', error);
            return false;
        }
    }

    async readCategories() {
        try {
            const db = getDatabase();
            return await db.getCategories();
        } catch (error) {
            console.error('Kateqoriyalar oxunarkən xəta:', error);
            return [];
        }
    }

    // Get all featured categories with full category details
    async getFeaturedCategories(req, res) {
        try {
            const featuredCategories = await this.readFeaturedCategories();
            const categories = await this.readCategories();

            // Get full category details for featured categories
            const featuredWithDetails = featuredCategories
                .map(featured => {
                    const category = categories.find(c => parseInt(c.id) === parseInt(featured.categoryId));
                    if (!category) return null;

                    return {
                        ...category,
                        featuredOrder: featured.order,
                        featuredId: featured.id
                    };
                })
                .filter(category => category !== null)
                .sort((a, b) => a.featuredOrder - b.featuredOrder);

            res.json(featuredWithDetails);
        } catch (error) {
            console.error('Featured categories alınarkən xəta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Featured categories alınarkən xəta baş verdi' 
            });
        }
    }

    // Update featured categories order
    async updateFeaturedCategories(req, res) {
        try {
            const { categoryIds } = req.body;
            
            if (!Array.isArray(categoryIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'Kateqoriya ID-ləri array formatında olmalıdır'
                });
            }

            const maxFeaturedCategories = 6;
            if (categoryIds.length > maxFeaturedCategories) {
                return res.status(400).json({
                    success: false,
                    message: `Maksimum ${maxFeaturedCategories} kateqoriya seçə bilərsiniz`
                });
            }

            // Create new featured categories array
            const featuredCategories = categoryIds.map((categoryId, index) => ({
                id: index + 1,
                categoryId: parseInt(categoryId),
                order: index + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            const success = await this.writeFeaturedCategories(featuredCategories);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Featured categories yeniləndi',
                    data: featuredCategories
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Yenilənərkən xəta baş verdi'
                });
            }
        } catch (error) {
            console.error('Featured categories yenilənərkən xəta:', error);
            res.status(500).json({
                success: false,
                message: 'Featured categories yenilənərkən xəta baş verdi'
            });
        }
    }

    // Get public featured categories (for homepage)
    async getPublicFeaturedCategories(req, res) {
        try {
            const featuredCategories = await this.readFeaturedCategories();
            const categories = await this.readCategories();

            // Get only active featured categories with details
            const publicFeatured = featuredCategories
                .map(featured => {
                    const category = categories.find(c => parseInt(c.id) === parseInt(featured.categoryId) && c.status === 'active');
                    if (!category) return null;

                    return {
                        id: category.id,
                        name: category.name,
                        description: category.description,
                        image: category.image
                    };
                })
                .filter(category => category !== null)
                .sort((a, b) => {
                    const orderA = featuredCategories.find(f => parseInt(f.categoryId) === parseInt(a.id))?.order || 999;
                    const orderB = featuredCategories.find(f => parseInt(f.categoryId) === parseInt(b.id))?.order || 999;
                    return orderA - orderB;
                });

            res.json(publicFeatured);
        } catch (error) {
            console.error('Public featured categories alınarkən xəta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Featured categories alınarkən xəta baş verdi' 
            });
        }
    }

    // Delete featured category
    async deleteFeaturedCategory(req, res) {
        try {
            const { id } = req.params;
            const featuredCategories = await this.readFeaturedCategories();
            
            const updatedFeatured = featuredCategories.filter(fc => fc.id !== parseInt(id));
            
            // Reorder remaining categories
            const reorderedFeatured = updatedFeatured.map((fc, index) => ({
                ...fc,
                id: index + 1,
                order: index + 1,
                updatedAt: new Date().toISOString()
            }));

            const success = await this.writeFeaturedCategories(reorderedFeatured);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Featured category silindi',
                    data: reorderedFeatured
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Silinərkən xəta baş verdi'
                });
            }
        } catch (error) {
            console.error('Featured category silinərkən xəta:', error);
            res.status(500).json({
                success: false,
                message: 'Featured category silinərkən xəta baş verdi'
            });
        }
    }
}

module.exports = new FeaturedCategoryController();