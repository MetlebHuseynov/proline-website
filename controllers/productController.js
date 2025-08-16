const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Yalnız şəkil faylları qəbul edilir'), false);
    }
  }
});

// Export upload middleware
exports.uploadImage = upload.single('imageFile');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Product.find(JSON.parse(queryStr)).populate('category').populate('brand');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').populate('brand');

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    console.log('Uploaded file:', req.file);
    
    const productData = { ...req.body };
    
    // Handle image
    if (req.file) {
      // File was uploaded
      productData.image = `/uploads/${req.file.filename}`;
      console.log('Using uploaded file:', productData.image);
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // URL was provided
      productData.image = req.body.imageUrl.trim();
      console.log('Using image URL:', productData.image);
    }
    
    // Remove imageUrl from productData as it's not part of the schema
    delete productData.imageUrl;
    
    console.log('Final product data:', productData);
    
    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Məhsul uğurla yaradıldı'
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Məhsul yaradılarkən xəta baş verdi'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res) => {
  try {
    console.log('Updating product with ID:', req.params.id);
    console.log('Update data:', req.body);
    console.log('Uploaded file:', req.file);
    
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Məhsul tapılmadı' });
    }
    
    const updateData = { ...req.body };
    
    // Handle image update
    if (req.file) {
      // New file was uploaded
      updateData.image = `/uploads/${req.file.filename}`;
      console.log('Using new uploaded file:', updateData.image);
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // New URL was provided
      updateData.image = req.body.imageUrl.trim();
      console.log('Using new image URL:', updateData.image);
    }
    // If neither file nor URL provided, keep existing image
    
    // Remove imageUrl from updateData as it's not part of the schema
    delete updateData.imageUrl;
    
    console.log('Final update data:', updateData);

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product,
      message: 'Məhsul uğurla yeniləndi'
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Məhsul yenilənərkən xəta baş verdi'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await product.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};