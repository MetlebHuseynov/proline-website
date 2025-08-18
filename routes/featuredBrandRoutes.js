const express = require('express');
const router = express.Router();
const featuredBrandController = require('../controllers/featuredBrandController');
const auth = require('../middleware/auth');

// Public routes (for homepage)
router.get('/public', featuredBrandController.getPublicFeaturedBrands.bind(featuredBrandController));

// Admin routes (require authentication)
router.get('/', auth.protect, featuredBrandController.getFeaturedBrands.bind(featuredBrandController));
router.post('/', auth.protect, featuredBrandController.updateFeaturedBrands.bind(featuredBrandController));
router.delete('/:id', auth.protect, featuredBrandController.deleteFeaturedBrand.bind(featuredBrandController));

module.exports = router;