// Database konfiqurasiya faylı
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Environment variables
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class DatabaseManager {
    constructor() {
        this.connection = null;
        this.dbType = process.env.DB_TYPE || 'json';
        this.dataPath = path.join(__dirname, '..', 'data');
    }

    // MySQL bağlantısı
    async connectMySQL() {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                charset: 'utf8mb4'
            });
            
            console.log('✅ MySQL verilənlər bazasına bağlantı uğurlu');
            return this.connection;
        } catch (error) {
            console.error('❌ MySQL bağlantı xətası:', error.message);
            throw error;
        }
    }

    // JSON fayllarından məlumat oxuma
    async readJSONFile(filename) {
        try {
            const filePath = path.join(this.dataPath, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`JSON fayl oxuma xətası (${filename}):`, error.message);
            return [];
        }
    }

    // JSON faylına məlumat yazma
    async writeJSONFile(filename, data) {
        try {
            const filePath = path.join(this.dataPath, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`JSON fayl yazma xətası (${filename}):`, error.message);
            return false;
        }
    }

    // Məhsullar
    async getProducts(filters = {}) {
        if (this.dbType === 'mysql') {
            return await this.getProductsMySQL(filters);
        } else {
            return await this.getProductsJSON(filters);
        }
    }

    async getProductsMySQL(filters = {}) {
        try {
            let query = 'SELECT * FROM products WHERE 1=1';
            const params = [];

            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.marka) {
                query += ' AND marka = ?';
                params.push(filters.marka);
            }

            if (filters.search) {
                query += ' AND (name LIKE ? OR description LIKE ?)';
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            if (filters.minPrice) {
                query += ' AND price >= ?';
                params.push(filters.minPrice);
            }

            if (filters.maxPrice) {
                query += ' AND price <= ?';
                params.push(filters.maxPrice);
            }

            query += ' ORDER BY created_at DESC';

            const [rows] = await this.connection.execute(query, params);
            return rows;
        } catch (error) {
            console.error('MySQL məhsul sorğusu xətası:', error.message);
            return [];
        }
    }

    async getProductsJSON(filters = {}) {
        const products = await this.readJSONFile('products.json');
        const categories = await this.readJSONFile('categories.json');
        const markas = await this.readJSONFile('markas.json');
        
        let filtered = products;

        if (filters.category) {
            filtered = filtered.filter(p => p.category == filters.category || p.categoryId == filters.category);
        }

        if (filters.marka) {
            filtered = filtered.filter(p => p.marka == filters.marka || p.markaId == filters.marka);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(search) || 
                (p.description && p.description.toLowerCase().includes(search))
            );
        }

        if (filters.minPrice) {
            filtered = filtered.filter(p => p.price >= filters.minPrice);
        }

        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.price <= filters.maxPrice);
        }

        // Kateqoriya və marka məlumatlarını obyekt şəklində əlavə et
        const enrichedProducts = filtered.map(product => {
            const category = categories.find(c => c.id == product.category || c.id == product.categoryId);
            const marka = markas.find(b => b.id == product.marka || b.id == product.markaId);
            
            return {
                ...product,
                category: category || null,
                marka: marka || null
            };
        });

        return enrichedProducts;
    }

    // Tək məhsul
    async getProductById(id) {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute(
                    'SELECT * FROM products WHERE id = ?', 
                    [id]
                );
                return rows[0] || null;
            } catch (error) {
                console.error('MySQL məhsul sorğusu xətası:', error.message);
                return null;
            }
        } else {
            const products = await this.readJSONFile('products.json');
            return products.find(p => p._id === id || p.id === id) || null;
        }
    }

    // Markalar
    async getMarkas() {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute(`
                    SELECT m.*, 
                           COALESCE(COUNT(p.id), 0) as productCount
                    FROM markas m 
                    LEFT JOIN products p ON p.marka = m.id::text
                    GROUP BY m.id, m.name, m.description, m.logo, m.website, m.status, m.created_at, m.updated_at
                    ORDER BY m.name
                `);
                return rows;
            } catch (error) {
                console.error('MySQL marka sorğusu xətası:', error.message);
                return [];
            }
        } else {
            const markas = await this.readJSONFile('markas.json');
            const products = await this.readJSONFile('products.json');
            
            // Hər marka üçün məhsul sayını hesabla
            return markas.map(marka => {
                const productCount = products.filter(product => 
                    product.marka == marka.id || product.marka == marka.id.toString()
                ).length;
                
                return {
                    ...marka,
                    productCount
                };
            });
        }
    }

    // Kateqoriyalar
    async getCategories() {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute(`
                    SELECT c.*, 
                           COALESCE(COUNT(p.id), 0) as productCount
                    FROM categories c 
                    LEFT JOIN products p ON p.categoryId = c.id::text
                    GROUP BY c.id, c.name, c.description, c.icon, c.status, c.created_at, c.updated_at
                    ORDER BY c.name
                `);
                return rows;
            } catch (error) {
                console.error('MySQL kateqoriya sorğusu xətası:', error.message);
                return [];
            }
        } else {
            const categories = await this.readJSONFile('categories.json');
            const products = await this.readJSONFile('products.json');
            
            // Hər kateqoriya üçün məhsul sayını hesabla
            return categories.map(category => {
                const productCount = products.filter(product => 
                    product.categoryId == category.id || product.categoryId == category.id.toString() ||
                    product.category == category.id || product.category == category.id.toString()
                ).length;
                
                return {
                    ...category,
                    productCount
                };
            });
        }
    }

    // Seçilmiş məhsullar
    async getFeaturedProducts() {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute(`
                    SELECT p.*, fp.order_index 
                    FROM featured_products fp 
                    JOIN products p ON fp.product_id = p.id 
                    ORDER BY fp.order_index
                `);
                return rows;
            } catch (error) {
                console.error('MySQL seçilmiş məhsul sorğusu xətası:', error.message);
                return [];
            }
        } else {
            const featuredProducts = await this.readJSONFile('featured-products.json');
            const products = await this.readJSONFile('products.json');
            
            return featuredProducts.map(fp => {
                const product = products.find(p => p._id === fp.productId || p.id === fp.productId);
                return product ? { ...product, order: fp.order } : null;
            }).filter(Boolean);
        }
    }

    // İstifadəçilər
    async getUserByUsername(username) {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute(
                    'SELECT * FROM users WHERE username = ?', 
                    [username]
                );
                return rows[0] || null;
            } catch (error) {
                console.error('MySQL istifadəçi sorğusu xətası:', error.message);
                return null;
            }
        } else {
            const users = await this.readJSONFile('users.json');
            return users.find(u => u.username === username) || null;
        }
    }

    // Verilənlər bazası inicializasiyası
    async initialize() {
        if (this.dbType === 'mysql') {
            await this.connectMySQL();
            console.log('🔄 MySQL verilənlər bazası hazırdır');
        } else {
            console.log('🔄 JSON fayllar istifadə edilir');
        }
    }

    // Bağlantını bağlama
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('✅ Verilənlər bazası bağlantısı bağlandı');
        }
    }
}

// Singleton pattern
let dbInstance = null;

function getDatabase() {
    if (!dbInstance) {
        dbInstance = new DatabaseManager();
    }
    return dbInstance;
}

module.exports = {
    getDatabase,
    DatabaseManager,
    pool
};