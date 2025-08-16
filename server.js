const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');
const { handleWebhook, getWebhookStatus } = require('./webhook-handler');
require('dotenv').config();

// PostgreSQL database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('PostgreSQL bağlantı xətası:', err.stack);
  } else {
    console.log('PostgreSQL database-ə uğurla bağlandı!');
    release();
  }
});

const app = express();

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create Brands table
        await client.query(`
            CREATE TABLE IF NOT EXISTS brands (
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
                brand VARCHAR(100),
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
        
        const brandsResult = await client.query('SELECT COUNT(*) as count FROM brands');
        if (parseInt(brandsResult.rows[0].count) === 0) {
            const brands = readJSONFile('brands.json');
            for (const brand of brands) {
                await client.query(
                    'INSERT INTO brands (name, description) VALUES ($1, $2)',
                    [brand.name, brand.description || '']
                );
            }
            console.log('Brendlər PostgreSQL-ə köçürüldü');
        }
        
        const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
        if (parseInt(productsResult.rows[0].count) === 0) {
            const products = readJSONFile('products.json');
            for (const product of products) {
                await client.query(
                    'INSERT INTO products (name, description, price, category, brand, image, stock, sku, weight, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        product.name,
                        product.description || '',
                        product.price,
                        product.category || '',
                        product.brand || '',
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
const JWT_SECRET = process.env.JWT_SECRET || 'oldbridge_secret_key_2024';

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
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM products ORDER BY created_at DESC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    res.json(result.rows[0]);
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
    // Handle image - either from URL or uploaded file
    let imageUrl = '';
    if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO products (name, description, price, category, brand, image, stock, sku, weight, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        req.body.name,
        req.body.description || '',
        parseFloat(req.body.price) || 0,
        req.body.categoryId ? parseInt(req.body.categoryId).toString() : '',
        req.body.brandId ? parseInt(req.body.brandId).toString() : '',
        imageUrl,
        parseInt(req.body.stock) || 0,
        req.body.sku || '',
        parseFloat(req.body.weight) || 0,
        req.body.status || 'active'
      ]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
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
    
    const client = await pool.connect();
    
    // First, get the current product
    const currentResult = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    
    if (currentResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    const currentProduct = currentResult.rows[0];
    
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
    const result = await client.query(
      'UPDATE products SET name = $1, description = $2, price = $3, category = $4, brand = $5, image = $6, stock = $7, sku = $8, weight = $9, status = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
      [
        req.body.name || currentProduct.name,
        req.body.description !== undefined ? req.body.description : currentProduct.description,
        req.body.price ? parseFloat(req.body.price) : currentProduct.price,
        req.body.categoryId ? parseInt(req.body.categoryId).toString() : currentProduct.category,
        req.body.brandId ? parseInt(req.body.brandId).toString() : currentProduct.brand,
        imageUrl,
        req.body.stock ? parseInt(req.body.stock) : currentProduct.stock,
        req.body.sku || currentProduct.sku,
        req.body.weight ? parseFloat(req.body.weight) : currentProduct.weight,
        req.body.status || currentProduct.status,
        req.params.id
      ]
    );
    
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const client = await pool.connect();
    const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    res.json({ message: 'Məhsul uğurla silindi' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server xətası' });
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
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categories ORDER BY name');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    res.json(result.rows[0]);
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
    
    let categoryImage = image || '/images/brand-placeholder.svg';
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      categoryImage = `/uploads/${req.file.filename}`;
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO categories (name, description, image, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        name,
        description || '',
        categoryImage,
        status || 'active'
      ]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
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
    
    const client = await pool.connect();
    
    // First, get the current category
    const currentResult = await client.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    
    if (currentResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    const currentCategory = currentResult.rows[0];
    let categoryImage = image || currentCategory.image;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      categoryImage = `/uploads/${req.file.filename}`;
    }
    
    // Update the category
    const result = await client.query(
      'UPDATE categories SET name = $1, description = $2, image = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [
        name || currentCategory.name,
        description || currentCategory.description,
        categoryImage,
        status || currentCategory.status,
        req.params.id
      ]
    );
    
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const client = await pool.connect();
    const result = await client.query('DELETE FROM categories WHERE id = $1 RETURNING *', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    res.json({ message: 'Kateqoriya uğurla silindi' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Brands Routes
app.get('/api/brands', async (req, res) => {
  // Prevent caching for real-time data
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM brands ORDER BY name');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Brands fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/brands/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM brands WHERE id = $1', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Brend tapılmadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Brand fetch error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/brands', authenticateToken, upload.single('logoFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, description, logo, website, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Brend adı tələb olunur' });
    }
    
    let brandLogo = logo || '/images/brand-placeholder.svg';
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      brandLogo = `/uploads/${req.file.filename}`;
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO brands (name, description, logo, website, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        name,
        description || '',
        brandLogo,
        website || '',
        status || 'active'
      ]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.put('/api/brands/:id', authenticateToken, upload.single('logoFile'), async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, description, logo, website, status } = req.body;
    
    const client = await pool.connect();
    
    // First, get the current brand
    const currentResult = await client.query('SELECT * FROM brands WHERE id = $1', [req.params.id]);
    
    if (currentResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Brend tapılmadı' });
    }
    
    const currentBrand = currentResult.rows[0];
    let brandLogo = logo || currentBrand.logo;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      brandLogo = `/uploads/${req.file.filename}`;
    }
    
    // Update the brand
    const result = await client.query(
      'UPDATE brands SET name = $1, description = $2, logo = $3, website = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [
        name || currentBrand.name,
        description || currentBrand.description,
        brandLogo,
        website || currentBrand.website,
        status || currentBrand.status,
        req.params.id
      ]
    );
    
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/brands/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const client = await pool.connect();
    const result = await client.query('DELETE FROM brands WHERE id = $1 RETURNING *', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Brend tapılmadı' });
    }
    
    res.json({ message: 'Brend uğurla silindi' });
  } catch (error) {
    console.error('Delete brand error:', error);
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
      query = 'SELECT id, username, email, role, status, created_at, updated_at FROM users ORDER BY id';
    } else {
      // Admin can only see their own profile
      query = 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = $1';
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

// GitHub Webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// Webhook status endpoint
app.get('/api/webhook/status', authenticateToken, (req, res) => {
  try {
    const status = getWebhookStatus();
    res.json({
      message: 'GitHub App webhook status',
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook status error:', error);
    res.status(500).json({ message: 'Webhook status alınarkən xəta baş verdi' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [productsResult, categoriesResult, brandsResult, usersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM brands'),
      pool.query('SELECT COUNT(*) FROM users')
    ]);
    
    // Featured products still from JSON file for now
    const featuredProducts = readJSONFile('featured-products.json');
    
    res.json({
      products: parseInt(productsResult.rows[0].count),
      categories: parseInt(categoriesResult.rows[0].count),
      brands: parseInt(brandsResult.rows[0].count),
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
  await createPostgreSQLTables();
  await migratePostgreSQLDataFromJSON();
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log('ProLine server is running on port', PORT);
  await initializeDatabase();
  console.log('PostgreSQL backend initialized successfully!');
});