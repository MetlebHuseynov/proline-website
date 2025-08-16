const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sql = require('mssql');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const { handleWebhook, getWebhookStatus } = require('./webhook-handler');
require('dotenv').config();

// Database Configuration - supports MSSQL, MySQL, and PostgreSQL
const dbType = process.env.DB_TYPE || 'mssql';

// MSSQL Configuration
const mssqlConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'OldBridgeDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// MySQL Configuration
const mysqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'oldbridge',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// PostgreSQL Configuration
const postgresConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proline',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
};

// Database connection
let dbPool;
let mysqlPool;
let postgresPool;

const initializeDatabase = async () => {
    try {
        if (dbType === 'mysql') {
            mysqlPool = mysql.createPool(mysqlConfig);
            // Test connection
            const connection = await mysqlPool.getConnection();
            await connection.ping();
            connection.release();
            console.log('MySQL data bazasına uğurla bağlandı');
            
            // Create tables if they don't exist
            await createMySQLTables();
            
            // Migrate data from JSON files if tables are empty
            await migrateMySQLDataFromJSON();
            
        } else if (dbType === 'postgresql') {
            postgresPool = new Pool(postgresConfig);
            // Test connection
            const client = await postgresPool.connect();
            await client.query('SELECT NOW()');
            client.release();
            console.log('PostgreSQL data bazasına uğurla bağlandı');
            
            // Create tables if they don't exist
            await createPostgreSQLTables();
            
            // Migrate data from JSON files if tables are empty
            await migratePostgreSQLDataFromJSON();
            
        } else {
            dbPool = await sql.connect(mssqlConfig);
            console.log('MSSQL data bazasına uğurla bağlandı');
            
            // Create tables if they don't exist
            await createTables();
            
            // Migrate data from JSON files if tables are empty
            await migrateDataFromJSON();
        }
        
    } catch (error) {
        console.error('Data bazası bağlantı xətası:', error);
        console.log('JSON fayllardan istifadə ediləcək...');
    }
};

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

// Database table creation functions
const createTables = async () => {
    try {
        const request = dbPool.request();
        
        // Create Categories table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
            CREATE TABLE Categories (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                description NVARCHAR(MAX),
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            )
        `);
        
        // Create Brands table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Brands' AND xtype='U')
            CREATE TABLE Brands (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                description NVARCHAR(MAX),
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            )
        `);
        
        // Create Products table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
            CREATE TABLE Products (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                description NVARCHAR(MAX),
                price DECIMAL(10,2) NOT NULL,
                categoryId INT,
                brandId INT,
                image NVARCHAR(500),
                stock INT DEFAULT 0,
                status NVARCHAR(50) DEFAULT 'active',
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (categoryId) REFERENCES Categories(id),
                FOREIGN KEY (brandId) REFERENCES Brands(id)
            )
        `);
        
        // Create Users table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                email NVARCHAR(255) UNIQUE NOT NULL,
                password NVARCHAR(255) NOT NULL,
                name NVARCHAR(255),
                role NVARCHAR(50) DEFAULT 'user',
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            )
        `);
        
        console.log('Data bazası cədvəlləri uğurla yaradıldı');
    } catch (error) {
        console.error('Cədvəl yaratma xətası:', error);
    }
};

const migrateDataFromJSON = async () => {
    try {
        const request = dbPool.request();
        
        // Check if tables are empty and migrate data
        const categoriesCount = await request.query('SELECT COUNT(*) as count FROM Categories');
        if (categoriesCount.recordset[0].count === 0) {
            const categories = readJSONFile('categories.json');
            for (const category of categories) {
                await request.query(`
                    INSERT INTO Categories (name, description) 
                    VALUES ('${category.name}', '${category.description || ''}')
                `);
            }
            console.log('Kateqoriyalar MSSQL-ə köçürüldü');
        }
        
        const brandsCount = await request.query('SELECT COUNT(*) as count FROM Brands');
        if (brandsCount.recordset[0].count === 0) {
            const brands = readJSONFile('brands.json');
            for (const brand of brands) {
                await request.query(`
                    INSERT INTO Brands (name, description) 
                    VALUES ('${brand.name}', '${brand.description || ''}')
                `);
            }
            console.log('Brendlər MSSQL-ə köçürüldü');
        }
        
        const productsCount = await request.query('SELECT COUNT(*) as count FROM Products');
        if (productsCount.recordset[0].count === 0) {
            const products = readJSONFile('products.json');
            for (const product of products) {
                await request.query(`
                    INSERT INTO Products (name, description, price, categoryId, brandId, image, stock, status) 
                    VALUES ('${product.name}', '${product.description || ''}', ${product.price}, ${product.categoryId}, ${product.brandId}, '${product.image || ''}', ${product.stock || 0}, '${product.status || 'active'}')
                `);
            }
            console.log('Məhsullar MSSQL-ə köçürüldü');
        }
        
        const usersCount = await request.query('SELECT COUNT(*) as count FROM Users');
        if (usersCount.recordset[0].count === 0) {
            const users = readJSONFile('users.json');
            for (const user of users) {
                await request.query(`
                    INSERT INTO Users (email, password, name, role) 
                    VALUES ('${user.email}', '${user.password}', '${user.name || ''}', '${user.role || 'user'}')
                `);
            }
            console.log('İstifadəçilər MSSQL-ə köçürüldü');
        }
        
    } catch (error) {
        console.error('Data köçürmə xətası:', error);
    }
};

// MySQL table creation functions
const createMySQLTables = async () => {
    try {
        const connection = await mysqlPool.getConnection();
        
        // Create Categories table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Create Brands table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS brands (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                logo VARCHAR(255),
                website VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Create Products table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Create Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Create Featured Products table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS featured_products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        
        connection.release();
        console.log('MySQL cədvəlləri uğurla yaradıldı');
    } catch (error) {
        console.error('MySQL cədvəl yaratma xətası:', error);
    }
};

// MySQL data migration
const migrateMySQLDataFromJSON = async () => {
    try {
        const connection = await mysqlPool.getConnection();
        
        // Check if tables are empty and migrate data
        const [categoriesRows] = await connection.execute('SELECT COUNT(*) as count FROM categories');
        if (categoriesRows[0].count === 0) {
            const categories = readJSONFile('categories.json');
            for (const category of categories) {
                await connection.execute(
                    'INSERT INTO categories (name, description) VALUES (?, ?)',
                    [category.name, category.description || '']
                );
            }
            console.log('Kateqoriyalar MySQL-ə köçürüldü');
        }
        
        const [brandsRows] = await connection.execute('SELECT COUNT(*) as count FROM brands');
        if (brandsRows[0].count === 0) {
            const brands = readJSONFile('brands.json');
            for (const brand of brands) {
                await connection.execute(
                    'INSERT INTO brands (name, description) VALUES (?, ?)',
                    [brand.name, brand.description || '']
                );
            }
            console.log('Brendlər MySQL-ə köçürüldü');
        }
        
        const [productsRows] = await connection.execute('SELECT COUNT(*) as count FROM products');
        if (productsRows[0].count === 0) {
            const products = readJSONFile('products.json');
            for (const product of products) {
                await connection.execute(
                    'INSERT INTO products (name, description, price, category, brand, image, stock, sku, weight, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
            console.log('Məhsullar MySQL-ə köçürüldü');
        }
        
        const [usersRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        if (usersRows[0].count === 0) {
            const users = readJSONFile('users.json');
            for (const user of users) {
                await connection.execute(
                    'INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
                    [user.username || '', user.email, user.password, user.name || '', user.role || 'user']
                );
            }
            console.log('İstifadəçilər MySQL-ə köçürüldü');
        }
        
        connection.release();
    } catch (error) {
        console.error('MySQL data köçürmə xətası:', error);
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
app.get('/api/products', (req, res) => {
  const products = readJSONFile('products.json');
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSONFile('products.json');
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({ message: 'Məhsul tapılmadı' });
  }
  
  res.json(product);
});

app.post('/api/products', authenticateToken, upload.single('imageFile'), (req, res) => {
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
    
    const newProduct = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      name: req.body.name,
      price: parseFloat(req.body.price) || 0,
      description: req.body.description || '',
      stock: parseInt(req.body.stock) || 0,
      categoryId: parseInt(req.body.categoryId) || null,
      brandId: parseInt(req.body.brandId) || null,
      image: imageUrl,
      status: req.body.status || 'active',
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    if (writeJSONFile('products.json', products)) {
      res.status(201).json(newProduct);
    } else {
      res.status(500).json({ message: 'Məhsul əlavə edilərkən xəta baş verdi' });
    }
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.put('/api/products/:id', authenticateToken, upload.single('imageFile'), (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  try {
    console.log('PUT /api/products/:id - Request body:', req.body);
    console.log('PUT /api/products/:id - File:', req.file ? req.file.filename : 'No file');
    
    const products = readJSONFile('products.json');
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    // Handle image - either from URL or uploaded file
    let imageUrl = products[productIndex].image; // Keep existing image by default
    console.log('Current image URL:', imageUrl);
    
    if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
      console.log('Using new image URL:', imageUrl);
    } else if (req.file) {
      console.log('Processing uploaded file:', req.file.filename);
      // Delete old uploaded file if it exists
      const oldImage = products[productIndex].image;
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
    
    // Handle category and brand - convert to IDs and remove old string fields
    let categoryId = products[productIndex].categoryId;
    let brandId = products[productIndex].brandId;
    
    if (req.body.categoryId) {
      categoryId = parseInt(req.body.categoryId);
    }
    if (req.body.brandId) {
      brandId = parseInt(req.body.brandId);
    }
    
    products[productIndex] = {
      ...products[productIndex],
      name: req.body.name || products[productIndex].name,
      price: req.body.price ? parseFloat(req.body.price) : products[productIndex].price,
      description: req.body.description !== undefined ? req.body.description : products[productIndex].description,
      stock: req.body.stock ? parseInt(req.body.stock) : products[productIndex].stock,
      categoryId: categoryId,
      brandId: brandId,
      image: imageUrl,
      status: req.body.status || products[productIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    // Remove old string fields if they exist
    delete products[productIndex].category;
    delete products[productIndex].brand;
    
    if (writeJSONFile('products.json', products)) {
      res.json(products[productIndex]);
    } else {
      res.status(500).json({ message: 'Məhsul yenilənərkən xəta baş verdi' });
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const products = readJSONFile('products.json');
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }
    
    products.splice(productIndex, 1);
    
    if (writeJSONFile('products.json', products)) {
      res.json({ message: 'Məhsul uğurla silindi' });
    } else {
      res.status(500).json({ message: 'Məhsul silinərkən xəta baş verdi' });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Categories Routes
app.get('/api/categories', (req, res) => {
  const categories = readJSONFile('categories.json');
  res.json(categories);
});

app.get('/api/categories/:id', (req, res) => {
  const categories = readJSONFile('categories.json');
  const category = categories.find(c => c.id === parseInt(req.params.id));
  
  if (!category) {
    return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
  }
  
  res.json(category);
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
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    
    let categoryImage = image || '/images/brand-placeholder.svg';
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      categoryImage = `/uploads/${req.file.filename}`;
    }
    
    const newCategory = {
      id: newId,
      name,
      description: description || '',
      image: categoryImage,
      productCount: 0,
      status: status || 'active',
      createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    
    if (writeJSONFile('categories.json', categories)) {
      res.status(201).json(newCategory);
    } else {
      res.status(500).json({ message: 'Kateqoriya yaradılarkən xəta baş verdi' });
    }
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
    const categoryId = parseInt(req.params.id);
    const { name, description, image, status } = req.body;
    
    const categories = readJSONFile('categories.json');
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    let categoryImage = image || categories[categoryIndex].image;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      categoryImage = `/uploads/${req.file.filename}`;
    }
    
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: name || categories[categoryIndex].name,
      description: description || categories[categoryIndex].description,
      image: categoryImage,
      status: status || categories[categoryIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    if (writeJSONFile('categories.json', categories)) {
      res.json(categories[categoryIndex]);
    } else {
      res.status(500).json({ message: 'Kateqoriya yenilənərkən xəta baş verdi' });
    }
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
    const categoryId = parseInt(req.params.id);
    const categories = readJSONFile('categories.json');
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    }
    
    categories.splice(categoryIndex, 1);
    
    if (writeJSONFile('categories.json', categories)) {
      res.json({ message: 'Kateqoriya uğurla silindi' });
    } else {
      res.status(500).json({ message: 'Kateqoriya silinərkən xəta baş verdi' });
    }
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Brands Routes
app.get('/api/brands', (req, res) => {
  const brands = readJSONFile('brands.json');
  res.json(brands);
});

app.get('/api/brands/:id', (req, res) => {
  const brands = readJSONFile('brands.json');
  const brand = brands.find(b => b.id === parseInt(req.params.id));
  
  if (!brand) {
    return res.status(404).json({ message: 'Brend tapılmadı' });
  }
  
  res.json(brand);
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

    const brands = readJSONFile('brands.json');
    const newId = brands.length > 0 ? Math.max(...brands.map(b => b.id)) + 1 : 1;
    
    let brandLogo = logo || '/images/brand-placeholder.svg';
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      brandLogo = `/uploads/${req.file.filename}`;
    }
    
    const newBrand = {
      id: newId,
      name,
      description: description || '',
      logo: brandLogo,
      website: website || '',
      productCount: 0,
      status: status || 'active',
      createdAt: new Date().toISOString()
    };
    
    brands.push(newBrand);
    
    if (writeJSONFile('brands.json', brands)) {
      res.status(201).json(newBrand);
    } else {
      res.status(500).json({ message: 'Brend yaradılarkən xəta baş verdi' });
    }
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
    const brandId = parseInt(req.params.id);
    const { name, description, logo, website, status } = req.body;
    
    const brands = readJSONFile('brands.json');
    const brandIndex = brands.findIndex(b => b.id === brandId);
    
    if (brandIndex === -1) {
      return res.status(404).json({ message: 'Brend tapılmadı' });
    }
    
    let brandLogo = logo || brands[brandIndex].logo;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      brandLogo = `/uploads/${req.file.filename}`;
    }
    
    brands[brandIndex] = {
      ...brands[brandIndex],
      name: name || brands[brandIndex].name,
      description: description || brands[brandIndex].description,
      logo: brandLogo,
      website: website || brands[brandIndex].website,
      status: status || brands[brandIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    if (writeJSONFile('brands.json', brands)) {
      res.json(brands[brandIndex]);
    } else {
      res.status(500).json({ message: 'Brend yenilənərkən xəta baş verdi' });
    }
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
    const brandId = parseInt(req.params.id);
    const brands = readJSONFile('brands.json');
    const brandIndex = brands.findIndex(b => b.id === brandId);
    
    if (brandIndex === -1) {
      return res.status(404).json({ message: 'Brend tapılmadı' });
    }
    
    brands.splice(brandIndex, 1);
    
    if (writeJSONFile('brands.json', brands)) {
      res.json({ message: 'Brend uğurla silindi' });
    } else {
      res.status(500).json({ message: 'Brend silinərkən xəta baş verdi' });
    }
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Users Routes (Admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin icazəsi tələb olunur' });
  }
  
  const users = readJSONFile('users.json');
  
  // Super admin can see all users, admin can only see themselves
  let filteredUsers;
  if (req.user.role === 'super_admin') {
    filteredUsers = users;
  } else {
    // Admin can only see their own profile
    filteredUsers = users.filter(user => user.id === req.user.id);
  }
  
  // Remove passwords from response
  const safeUsers = filteredUsers.map(user => {
    const { password, ...safeUser } = user;
    return safeUser;
  });
  
  res.json(safeUsers);
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const { name, email, password, role, status } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Ad, email və şifrə tələb olunur' });
    }
    
    const users = readJSONFile('users.json');
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email artıq istifadə olunur' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate new ID
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    // Create new user
    const newUser = {
      id: newId,
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      status: status || 'active',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJSONFile('users.json', users);
    
    // Return user without password
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
    
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
    const { name, email, role, status, password } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Ad və email tələb olunur' });
    }
    
    const users = readJSONFile('users.json');
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    
    // Check if email is already used by another user
    const existingUser = users.find(user => user.email === email && user.id !== userId);
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email artıq istifadə olunur' });
    }
    
    // Update user data
    users[userIndex].name = name;
    users[userIndex].email = email;
    users[userIndex].role = role || users[userIndex].role;
    users[userIndex].status = status || users[userIndex].status;
    users[userIndex].updatedAt = new Date().toISOString();
    
    // Update password if provided
    if (password) {
      users[userIndex].password = await bcrypt.hash(password, 10);
    }
    
    writeJSONFile('users.json', users);
    
    // Return user without password
    const { password: _, ...safeUser } = users[userIndex];
    res.json(safeUser);
    
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'İstifadəçi yenilənərkən xəta baş verdi' });
  }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin icazəsi tələb olunur' });
  }
  
  try {
    const userId = parseInt(req.params.id);
    const users = readJSONFile('users.json');
    
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    
    // Prevent deleting yourself
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'Özünüzü silə bilməzsiniz' });
    }
    
    // Remove user from array
    users.splice(userIndex, 1);
    writeJSONFile('users.json', users);
    
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
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const products = readJSONFile('products.json');
    const categories = readJSONFile('categories.json');
    const brands = readJSONFile('brands.json');
    const users = readJSONFile('users.json');
    const featuredProducts = readJSONFile('featured-products.json');
    
    res.json({
      products: products.length,
      categories: categories.length,
      brands: brands.length,
      users: users.length,
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log('ProLine server is running on port', PORT);
  console.log('JSON-based backend initialized successfully!');
  
  // Initialize MSSQL database
  await initializeDatabase();
});