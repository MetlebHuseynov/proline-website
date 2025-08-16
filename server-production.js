// Hostinger üçün Production Server
const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;

// Environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL bağlantı konfiqurasiyası
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// MySQL bağlantı pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Session store üçün MySQL
const sessionStore = new MySQLStore({
    ...dbConfig,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
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
    },
    crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dəqiqə
    max: process.env.RATE_LIMIT_MAX || 100,
    message: 'Çox sayda sorğu göndərdiniz, zəhmət olmasa bir az gözləyin.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
    key: 'oldbridge_session',
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 saat
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true
}));

// File upload konfiqurasiyası
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'images', 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp').split(',');
        const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
        
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Bu fayl növü dəstəklənmir'));
        }
    }
});

// Database helper functions
class DatabaseHelper {
    static async query(sql, params = []) {
        try {
            const [rows] = await pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database sorğu xətası:', error);
            throw error;
        }
    }

    // Məhsullar
    static async getProducts(limit = null, offset = 0) {
        let sql = 'SELECT * FROM products ORDER BY created_at DESC';
        const params = [];
        
        if (limit) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }
        
        return await this.query(sql, params);
    }

    static async getProductById(id) {
        const products = await this.query('SELECT * FROM products WHERE id = ?', [id]);
        return products[0] || null;
    }

    static async getProductsByCategory(category, limit = null) {
        let sql = 'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC';
        const params = [category];
        
        if (limit) {
            sql += ' LIMIT ?';
            params.push(limit);
        }
        
        return await this.query(sql, params);
    }

    static async getProductsByBrand(brand, limit = null) {
        let sql = 'SELECT * FROM products WHERE brand = ? ORDER BY created_at DESC';
        const params = [brand];
        
        if (limit) {
            sql += ' LIMIT ?';
            params.push(limit);
        }
        
        return await this.query(sql, params);
    }

    // Brendlər
    static async getBrands() {
        return await this.query('SELECT * FROM brands ORDER BY name');
    }

    static async getBrandByName(name) {
        const brands = await this.query('SELECT * FROM brands WHERE name = ?', [name]);
        return brands[0] || null;
    }

    // Kateqoriyalar
    static async getCategories() {
        return await this.query('SELECT * FROM categories ORDER BY name');
    }

    // Seçilmiş məhsullar
    static async getFeaturedProducts() {
        return await this.query(`
            SELECT p.* FROM products p 
            INNER JOIN featured_products fp ON p.id = fp.product_id 
            ORDER BY fp.order_index, p.created_at DESC
        `);
    }

    // İstifadəçilər
    static async getUserByUsername(username) {
        const users = await this.query('SELECT * FROM users WHERE username = ?', [username]);
        return users[0] || null;
    }

    static async getUserByEmail(email) {
        const users = await this.query('SELECT * FROM users WHERE email = ?', [email]);
        return users[0] || null;
    }

    // Axtarış
    static async searchProducts(query, limit = 20) {
        const searchTerm = `%${query}%`;
        return await this.query(`
            SELECT * FROM products 
            WHERE name LIKE ? OR description LIKE ? OR category LIKE ? OR brand LIKE ?
            ORDER BY 
                CASE 
                    WHEN name LIKE ? THEN 1
                    WHEN category LIKE ? THEN 2
                    WHEN brand LIKE ? THEN 3
                    ELSE 4
                END,
                created_at DESC
            LIMIT ?
        `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]);
    }
}

// API Routes

// Məhsullar API
app.get('/api/products', async (req, res) => {
    try {
        const { limit, offset, category, brand, search } = req.query;
        let products;
        
        if (search) {
            products = await DatabaseHelper.searchProducts(search, parseInt(limit) || 20);
        } else if (category) {
            products = await DatabaseHelper.getProductsByCategory(category, parseInt(limit));
        } else if (brand) {
            products = await DatabaseHelper.getProductsByBrand(brand, parseInt(limit));
        } else {
            products = await DatabaseHelper.getProducts(parseInt(limit), parseInt(offset) || 0);
        }
        
        res.json(products);
    } catch (error) {
        console.error('Məhsullar API xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await DatabaseHelper.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Məhsul tapılmadı' });
        }
        res.json(product);
    } catch (error) {
        console.error('Məhsul API xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Brendlər API
app.get('/api/brands', async (req, res) => {
    try {
        const brands = await DatabaseHelper.getBrands();
        res.json(brands);
    } catch (error) {
        console.error('Brendlər API xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Kateqoriyalar API
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await DatabaseHelper.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Kateqoriyalar API xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Seçilmiş məhsullar API
app.get('/api/featured-products', async (req, res) => {
    try {
        const products = await DatabaseHelper.getFeaturedProducts();
        res.json(products);
    } catch (error) {
        console.error('Seçilmiş məhsullar API xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Əlaqə formu
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        // Validasiya
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Bütün sahələr tələb olunur' });
        }
        
        // Məlumatları saxlama (əgər lazımdırsa)
        // await DatabaseHelper.query(
        //     'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
        //     [name, email, phone, message]
        // );
        
        console.log('Yeni əlaqə mesajı:', { name, email, phone, message });
        
        res.json({ success: true, message: 'Mesajınız göndərildi' });
    } catch (error) {
        console.error('Əlaqə formu xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Sorğu formu
app.post('/api/inquiry', async (req, res) => {
    try {
        const { productName, name, email, phone, message } = req.body;
        
        // Validasiya
        if (!productName || !name || !email || !message) {
            return res.status(400).json({ error: 'Bütün sahələr tələb olunur' });
        }
        
        console.log('Yeni məhsul sorğusu:', { productName, name, email, phone, message });
        
        res.json({ success: true, message: 'Sorğunuz göndərildi' });
    } catch (error) {
        console.error('Sorğu formu xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Database bağlantısını yoxla
        await pool.execute('SELECT 1');
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            database: 'Disconnected',
            error: error.message
        });
    }
});

// HTML səhifələri
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/brands', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'brands.html'));
});

app.get('/brand', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'brand.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server xətası:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fayl çox böyükdür' });
        }
    }
    
    res.status(500).json({ error: 'Daxili server xətası' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM alındı, server bağlanır...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT alındı, server bağlanır...');
    await pool.end();
    process.exit(0);
});

// Server başlatma
app.listen(PORT, () => {
    console.log(`🚀 Old Bridge server ${PORT} portunda işləyir`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: MySQL (${process.env.DB_HOST})`);
    console.log(`🔒 Security: Helmet, CORS, Rate Limiting aktiv`);
});

module.exports = app;