const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper functions for JSON file operations
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

const writeJSONFile = (filename, data) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    return false;
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Export upload middleware
exports.uploadImage = upload.single('imageFile');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = readJSONFile('categories.json');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const categories = readJSONFile('categories.json');
    const category = categories.find(c => c.id == req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    const categories = readJSONFile('categories.json');
    let categoryData = { ...req.body };
    
    // Generate new ID
    const maxId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) : 0;
    categoryData.id = maxId + 1;
    
    // If file was uploaded, set the image path
    if (req.file) {
      categoryData.image = `/uploads/${req.file.filename}`;
    }
    
    // Add timestamps
    categoryData.createdAt = new Date().toISOString();
    categoryData.updatedAt = new Date().toISOString();
    categoryData.productCount = 0;
    categoryData.status = categoryData.status || 'active';

    categories.push(categoryData);
    
    if (!writeJSONFile('categories.json', categories)) {
      throw new Error('Failed to save category');
    }

    res.status(201).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const categories = readJSONFile('categories.json');
    const categoryIndex = categories.findIndex(c => c.id == req.params.id);

    if (categoryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    let updateData = { ...req.body };
    const currentCategory = categories[categoryIndex];
    
    // If file was uploaded, set the image path and delete old image
    if (req.file) {
      // Delete old image file if it exists
      if (currentCategory.image && currentCategory.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '../public', currentCategory.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    // Update timestamp
    updateData.updatedAt = new Date().toISOString();
    
    // Merge with existing data
    categories[categoryIndex] = { ...currentCategory, ...updateData };
    
    if (!writeJSONFile('categories.json', categories)) {
      throw new Error('Failed to update category');
    }

    res.status(200).json({
      success: true,
      data: categories[categoryIndex]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const categories = readJSONFile('categories.json');
    const categoryIndex = categories.findIndex(c => c.id == req.params.id);

    if (categoryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Kateqoriya tapılmadı' });
    }

    const categoryToDelete = categories[categoryIndex];
    
    // Delete associated image file if it exists
    if (categoryToDelete.image && categoryToDelete.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', categoryToDelete.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Remove category from array
    categories.splice(categoryIndex, 1);
    
    if (!writeJSONFile('categories.json', categories)) {
      throw new Error('Failed to delete category');
    }

    res.status(200).json({
      success: true,
      message: 'Kateqoriya uğurla silindi',
      data: {}
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};