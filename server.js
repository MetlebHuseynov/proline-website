const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const { pool } = require('./config/pool');
const { getDatabase } = require('./config/database');
require('dotenv').config();

const app = express();

// Trust proxy for production (behind reverse proxy like nginx)
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
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
            cb(new Error('Yalnız şəkil faylları qəbul edilir!'), false);
        }
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Çox sayda sorğu göndərildi, zəhmət olmasa bir az gözləyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
}));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        success: false,
        message: isDevelopment ? err.message : 'Daxili server xətası baş verdi',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Helper functions to read/write JSON files
const readJSONFile = (filename) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

const writeJSONFile = (filename, data) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    return false;
  }
};





// PostgreSQL table creation functions
const createPostgreSQLTables = async () => {
    try {
        const client = await pool.connect();
        
        // Create Categories table
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image VARCHAR(255),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create Markas table
        await client.query(`
            CREATE TABLE IF NOT EXISTS markas (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                logo VARCHAR(255),
                website VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create Products table
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                marka VARCHAR(100),
                image VARCHAR(255),
                stock INT DEFAULT 0,
                sku VARCHAR(100),
                weight DECIMAL(8,2),
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create Featured Products table
        await client.query(`
            CREATE TABLE IF NOT EXISTS featured_products (
                id SERIAL PRIMARY KEY,
                product_id INT,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        
        client.release();
        console.log('PostgreSQL cədvəlləri uğurla yaradıldı');
    } catch (error) {
        console.error('PostgreSQL cədvəl yaratma xətası:', error);
    }
};

// PostgreSQL data migration
const migratePostgreSQLDataFromJSON = async () => {
    try {
        const client = await pool.connect();
        
        // Check if tables are empty and migrate data
        const categoriesResult = await client.query('SELECT COUNT(*) as count FROM categories');
        if (parseInt(categoriesResult.rows[0].count) === 0) {
            const categories = readJSONFile('categories.json');
            for (const category of categories) {
                await client.query(
                    'INSERT INTO categories (name, description) VALUES ($1, $2)',
                    [category.name, category.description || '']
                );
            }
            console.log('Kateqoriyalar PostgreSQL-ə köçürüldü');
        }
        
        const markasResult = await client.query('SELECT COUNT(*) as count FROM markas');
        if (parseInt(markasResult.rows[0].count) === 0) {
            const markas = readJSONFile('markas.json');
            for (const marka of markas) {
                await client.query(
                    'INSERT INTO markas (name, description) VALUES ($1, $2)',
                    [marka.name, marka.description || '']
                );
            }
            console.log('Markalar PostgreSQL-ə köçürüldü');
        }
        
        const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
        if (parseInt(productsResult.rows[0].count) === 0) {
            const products = readJSONFile('products.json');
            for (const product of products) {
                await client.query(
                    'INSERT INTO products (name, description, price, category, marka, image, stock, sku, weight, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        product.name,
                        product.description || '',
                        product.price,
                        product.category || '',
                        product.marka || '',
                        product.image || '',
                        product.stock || 0,
                        product.sku || '',
                        product.weight || 0,
                        product.status || 'active'
                    ]
                );
            }
            console.log('Məhsullar PostgreSQL-ə köçürüldü');
        }
        
        const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
        if (parseInt(usersResult.rows[0].count) === 0) {
            const users = readJSONFile('users.json');
            if (users && users.length > 0) {
                for (const user of users) {
                    if (user.username && user.email) {
                        await client.query(
                            'INSERT INTO users (username, email, password, name, role) VALUES ($1, $2, $3, $4, $5)',
                            [user.username, user.email, user.password, user.name || '', user.role || 'user']
                        );
                    }
                }
                console.log('İstifadəçilər PostgreSQL-ə köçürüldü');
            } else {
                // Default admin user yaradılır
                await client.query(
                    'INSERT INTO users (username, email, password, name, role) VALUES ($1, $2, $3, $4, $5)',
                    ['admin', 'admin@proline.com', 'admin123', 'Administrator', 'admin']
                );
                console.log('Default admin user yaradıldı');
            }
        }
        
        client.release();
    } catch (error) {
        console.error('PostgreSQL data köçürmə xətası:', error);
    }
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'proline_secret_key_2024';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email və şifrə tələb olunur' });
    }

    const users = readJSONFile('users.json');
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ message: 'Yanlış email və ya şifrə' });
    }

    // For demo purposes, accept 'admin123' as password
    const isValidPassword = password === 'admin123' || await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Yanlış email və ya şifrə' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date().toISOString();
    writeJSONFile('users.json', users);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const users = readJSONFile('users.json');
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// Products Routes
app.get('/api/products', async (req, res) => {
  // Prevent caching for real-time data
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const db = getDatabase();
    const filters = {
      category: req.query.category,
      marka: req.query.marka,
      search: req.query.search,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
    };
    
    const products = await db.getProducts(filters);
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const products = await db.getProducts();
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/products', authenticateToken, upload.single('imageFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const products = readJSONFile('products.json');
    
    // Handle image - either from URL or uploaded file
    let imageUrl = '';
    if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Generate new ID
    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
    
    const newProduct = {
      id: maxId + 1,
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price) || 0,
      category: req.body.categoryId ? parseInt(req.body.categoryId).toString() : '',
      marka: req.body.markaId ? parseInt(req.body.markaId).toString() : '',
      image: imageUrl,
      stock: parseInt(req.body.stock) || 0,
      sku: req.body.sku || '',
      weight: parseFloat(req.body.weight) || 0,
      status: req.body.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    if (!writeJSONFile('products.json', products)) {
      throw new Error('Failed to save product');
    }
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.put('/api/products/:id', authenticateToken, upload.single('imageFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    console.log('PUT /api/products/:id - Request body:', req.body);
    console.log('PUT /api/products/:id - File:', req.file ? req.file.filename : 'No file');
    
    const products = readJSONFile('products.json');
    const productIndex = products.findIndex(p => p.id == req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    const currentProduct = products[productIndex];
    
    // Handle image - either from URL or uploaded file
    let imageUrl = currentProduct.image; // Keep existing image by default
    console.log('Current image URL:', imageUrl);
    
    if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
      console.log('Using new image URL:', imageUrl);
    } else if (req.file) {
      console.log('Processing uploaded file:', req.file.filename);
      // Delete old uploaded file if it exists
      const oldImage = currentProduct.image;
      if (oldImage && oldImage.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, 'public', oldImage);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Deleted old image file:', oldFilePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('New image URL from file:', imageUrl);
    } else {
      console.log('Keeping existing image:', imageUrl);
    }
    
    // Update the product
    products[productIndex] = {
      ...currentProduct,
      name: req.body.name || currentProduct.name,
      description: req.body.description !== undefined ? req.body.description : currentProduct.description,
      price: req.body.price ? parseFloat(req.body.price) : currentProduct.price,
      category: req.body.categoryId ? parseInt(req.body.categoryId).toString() : currentProduct.category,
      marka: req.body.markaId ? parseInt(req.body.markaId).toString() : currentProduct.marka,
      image: imageUrl,
      stock: req.body.stock ? parseInt(req.body.stock) : currentProduct.stock,
      sku: req.body.sku || currentProduct.sku,
      weight: req.body.weight ? parseFloat(req.body.weight) : currentProduct.weight,
      status: req.body.status || currentProduct.status,
      updatedAt: new Date().toISOString()
    };
    
    if (!writeJSONFile('products.json', products)) {
      throw new Error('Failed to update product');
    }
    
    res.json(products[productIndex]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  console.log('Delete product request:', {
    productId: req.params.id,
    userRole: req.user.role,
    userId: req.user.id
  });
  
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    console.log('Access denied - user role:', req.user.role);
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const products = readJSONFile('products.json');
    const productIndex = products.findIndex(p => p.id == req.params.id);
    
    console.log('Product search result:', productIndex);
    
    if (productIndex === -1) {
      console.log('Product not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    const deletedProduct = products[productIndex];
    
    // Delete associated image file if it exists
    if (deletedProduct.image && deletedProduct.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', deletedProduct.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted image file:', imagePath);
      }
    }
    
    // Remove product from array
    products.splice(productIndex, 1);
    
    if (!writeJSONFile('products.json', products)) {
      throw new Error('Failed to delete product');
    }
    
    console.log('Product deleted successfully:', deletedProduct);
    res.json({ message: 'Məhsul uğurla silindi' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server xətası: ' + error.message });
  }
});

// Categories Routes
app.get('/api/categories', async (req, res) => {
  // Prevent caching for real-time data
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const db = getDatabase();
    const categories = await db.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const categories = await db.getCategories();
    const category = categories.find(c => c.id == req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Category fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/categories', authenticateToken, upload.single('imageFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, description, image, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Kateqoriya adı tələb olunur' });
    }
    
    const categories = readJSONFile('categories.json');
    
    let categoryImage = image || '/images/brand-placeholder.svg';
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      categoryImage = `/uploads/${req.file.filename}`;
    }
    
    // Generate new ID
    const maxId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) : 0;
    
    const newCategory = {
      id: maxId + 1,
      name,
      description: description || '',
      image: categoryImage,
      status: status || 'active',
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    
    if (!writeJSONFile('categories.json', categories)) {
      throw new Error('Failed to save category');
    }
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.put('/api/categories/:id', authenticateToken, upload.single('imageFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, description, image, status } = req.body;
    
    const categories = readJSONFile('categories.json');
    const categoryIndex = categories.findIndex(c => c.id == req.params.id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    const currentCategory = categories[categoryIndex];
    let categoryImage = image || currentCategory.image;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      categoryImage = `/uploads/${req.file.filename}`;
      
      // Delete old image if it exists and is not the default
      if (currentCategory.image && currentCategory.image !== '/images/brand-placeholder.svg' && currentCategory.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, 'public', currentCategory.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    // Update the category
    categories[categoryIndex] = {
      ...currentCategory,
      name: name || currentCategory.name,
      description: description || currentCategory.description,
      image: categoryImage,
      status: status || currentCategory.status,
      updatedAt: new Date().toISOString()
    };
    
    if (!writeJSONFile('categories.json', categories)) {
      throw new Error('Failed to update category');
    }
    
    res.json(categories[categoryIndex]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const categories = readJSONFile('categories.json');
    const categoryIndex = categories.findIndex(c => c.id == req.params.id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    const categoryToDelete = categories[categoryIndex];
    
    // Delete associated image file if it exists and is not the default
    if (categoryToDelete.image && categoryToDelete.image !== '/images/brand-placeholder.svg' && categoryToDelete.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', categoryToDelete.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Remove category from array
    categories.splice(categoryIndex, 1);
    
    if (!writeJSONFile('categories.json', categories)) {
      throw new Error('Failed to delete category');
    }
    
    res.json({ message: 'Kateqoriya uğurla silindi' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Markas Routes
app.get('/api/markas', async (req, res) => {
  // Prevent caching for real-time data
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const db = getDatabase();
    const markas = await db.getMarkas();
    res.json(markas);
  } catch (error) {
    console.error('Markas fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/markas/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const markas = await db.getMarkas();
    const marka = markas.find(b => b.id === parseInt(req.params.id));
    
    if (!marka) {
      return res.status(404).json({ message: 'Marka tapılmadı' });
    }
    
    res.json(marka);
  } catch (error) {
    console.error('Marka fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/markas', authenticateToken, upload.single('logoFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, description, logo, website, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Marka adı tələb olunur' });
    }
    
    let markaLogo = logo || '/images/marka-placeholder.svg';
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      markaLogo = `/uploads/${req.file.filename}`;
    }
    
    const db = getDatabase();
    const markas = await db.getMarkas();
    
    // Generate new ID
    const newId = markas.length > 0 ? Math.max(...markas.map(b => b.id)) + 1 : 1;
    
    const newMarka = {
      id: newId,
      name,
      description: description || '',
      logo: markaLogo,
      website: website || '',
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    markas.push(newMarka);
    await db.writeJSONFile('markas.json', markas);
    
    res.status(201).json(newMarka);
  } catch (error) {
    console.error('Create marka error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.put('/api/markas/:id', authenticateToken, upload.single('logoFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, description, logo, website, status } = req.body;
    const markaId = parseInt(req.params.id);
    
    const db = getDatabase();
    const markas = await db.getMarkas();
    
    // Find the current marka
    const markaIndex = markas.findIndex(b => b.id === markaId);
    
    if (markaIndex === -1) {
      return res.status(404).json({ message: 'Marka tapılmadı' });
    }
    
    const currentMarka = markas[markaIndex];
    let markaLogo = logo || currentMarka.logo;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      markaLogo = `/uploads/${req.file.filename}`;
    }
    
    // Update the marka
    const updatedMarka = {
      ...currentMarka,
      name: name || currentMarka.name,
      description: description || currentMarka.description,
      logo: markaLogo,
      website: website || currentMarka.website,
      status: status || currentMarka.status,
      updatedAt: new Date().toISOString()
    };
    
    markas[markaIndex] = updatedMarka;
    await db.writeJSONFile('markas.json', markas);
    
    res.json(updatedMarka);
  } catch (error) {
    console.error('Update marka error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/markas/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const markaId = parseInt(req.params.id);
    const db = getDatabase();
    const markas = await db.getMarkas();
    
    const markaIndex = markas.findIndex(b => b.id === markaId);
    
    if (markaIndex === -1) {
      return res.status(404).json({ message: 'Marka tapılmadı' });
    }
    
    markas.splice(markaIndex, 1);
    await db.writeJSONFile('markas.json', markas);
    
    res.json({ message: 'Marka uğurla silindi' });
  } catch (error) {
    console.error('Delete marka error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Users Routes (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    let query;
    let params = [];
    
    // Super admin can see all users, admin can only see themselves
    if (req.user.role === 'super_admin') {
      query = 'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY id';
    } else {
      // Admin can only see their own profile
      query = 'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1';
      params = [req.user.id];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const { username, email, password, role, status } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'İstifadəçi adı, email və şifrə tələb olunur' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Bu email və ya istifadəçi adı artıq istifadə olunur' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, status, created_at, updated_at',
      [username, email, hashedPassword, role || 'user', status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'İstifadəçi yaradılarkən xəta baş verdi' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const userId = parseInt(req.params.id);
    const { username, email, role, status, password } = req.body;
    
    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ message: 'İstifadəçi adı və email tələb olunur' });
    }
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    
    // Check if email or username is already used by another user
    const existingUser = await pool.query('SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3', [email, username, userId]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Bu email və ya istifadəçi adı artıq istifadə olunur' });
    }
    
    let query, params;
    
    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET username = $1, email = $2, role = $3, status = $4, password = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING id, username, email, role, status, created_at, updated_at';
      params = [username, email, role, status, hashedPassword, userId];
    } else {
      query = 'UPDATE users SET username = $1, email = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, email, role, status, created_at, updated_at';
      params = [username, email, role, status, userId];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'İstifadəçi yenilənərkən xəta baş verdi' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    
    // Prevent deleting yourself
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'Özünüzü silə bilməzsiniz' });
    }
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ message: 'İstifadəçi uğurla silindi' });
    
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'İstifadəçi silinərkən xəta baş verdi' });
  }
});

// Featured Products Routes
const featuredProductRoutes = require('./routes/featuredProductRoutes');
app.use('/api/featured-products', featuredProductRoutes);

const featuredCategoryRoutes = require('./routes/featuredCategoryRoutes');
app.use('/api/featured-categories', featuredCategoryRoutes);

const featuredBrandRoutes = require('./routes/featuredBrandRoutes');
app.use('/api/featured-brands', featuredBrandRoutes);



// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [productsResult, categoriesResult, markasResult, usersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM markas'),
      pool.query('SELECT COUNT(*) FROM users')
    ]);
    
    // Featured products still from JSON file for now
    const featuredProducts = readJSONFile('featured-products.json');
    
    res.json({
      products: parseInt(productsResult.rows[0].count),
      categories: parseInt(categoriesResult.rows[0].count),
      markas: parseInt(markasResult.rows[0].count),
      users: parseInt(usersResult.rows[0].count),
      featuredProducts: featuredProducts.length
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize PostgreSQL tables and migrate data
const initializeDatabase = async () => {
    if (process.env.DB_TYPE === 'postgresql') {
        await createPostgreSQLTables();
        await migratePostgreSQLDataFromJSON();
        console.log('PostgreSQL backend initialized successfully!');
    } else {
        console.log('Using JSON files for data storage');
    }
};

// Start server
const PORT = process.env.PORT || 5000;

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

const server = app.listen(PORT, async () => {
    console.log(`🚀 ProLine Server ${PORT} portunda işləyir`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database Type: ${process.env.DB_TYPE}`);
    await initializeDatabase();
});