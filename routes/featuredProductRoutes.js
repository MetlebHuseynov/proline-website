const express = require('express');
const router = express.Router();
const featuredProductController = require('../controllers/featuredProductController');
const auth = require('../middleware/auth');

// Public routes (for homepage)
router.get('/public', featuredProductController.getPublicFeaturedProducts.bind(featuredProductController));

// Admin routes (require authentication)
router.get('/', auth.protect, featuredProductController.getFeaturedProducts.bind(featuredProductController));
router.post('/', auth.protect, featuredProductController.updateFeaturedProducts.bind(featuredProductController));
router.delete('/:id', auth.protect, featuredProductController.deleteFeaturedProduct.bind(featuredProductController));

module.exports = router;