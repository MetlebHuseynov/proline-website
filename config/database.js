// Database konfiqurasiya faylı
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Environment variables
require('dotenv').config();

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

            if (filters.brand) {
                query += ' AND brand = ?';
                params.push(filters.brand);
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
        let filtered = products;

        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        if (filters.brand) {
            filtered = filtered.filter(p => p.brand === filters.brand);
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

        return filtered;
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

    // Brendlər
    async getBrands() {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute('SELECT * FROM brands ORDER BY name');
                return rows;
            } catch (error) {
                console.error('MySQL brend sorğusu xətası:', error.message);
                return [];
            }
        } else {
            return await this.readJSONFile('brands.json');
        }
    }

    // Kateqoriyalar
    async getCategories() {
        if (this.dbType === 'mysql') {
            try {
                const [rows] = await this.connection.execute('SELECT * FROM categories ORDER BY name');
                return rows;
            } catch (error) {
                console.error('MySQL kateqoriya sorğusu xətası:', error.message);
                return [];
            }
        } else {
            return await this.readJSONFile('categories.json');
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
    DatabaseManager
};