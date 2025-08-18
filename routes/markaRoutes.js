const express = require('express');
const {
  getMarkas,
  getMarka,
  createMarka,
  updateMarka,
  deleteMarka
} = require('../controllers/markaController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(getMarkas)
  .post(protect, authorize('admin'), createMarka);

router
  .route('/:id')
  .get(getMarka)
  .put(protect, authorize('admin'), updateMarka)
  .delete(protect, authorize('admin'), deleteMarka);

module.exports = router;