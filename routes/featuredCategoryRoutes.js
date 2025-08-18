const express = require('express');
const router = express.Router();
const featuredCategoryController = require('../controllers/featuredCategoryController');
const auth = require('../middleware/auth');

// Public routes (for homepage)
router.get('/public', featuredCategoryController.getPublicFeaturedCategories.bind(featuredCategoryController));

// Admin routes (require authentication)
router.get('/', auth.protect, featuredCategoryController.getFeaturedCategories.bind(featuredCategoryController));
router.post('/', auth.protect, featuredCategoryController.updateFeaturedCategories.bind(featuredCategoryController));
router.delete('/:id', auth.protect, featuredCategoryController.deleteFeaturedCategory.bind(featuredCategoryController));

module.exports = router;