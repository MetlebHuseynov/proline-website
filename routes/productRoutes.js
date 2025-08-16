const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('admin', 'super_admin'), uploadImage, createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin', 'super_admin'), uploadImage, updateProduct)
  .delete(protect, authorize('admin', 'super_admin'), deleteProduct);

module.exports = router;