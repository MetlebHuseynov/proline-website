const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(getCategories)
  .post(protect, authorize('admin'), uploadImage, createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin'), uploadImage, updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;