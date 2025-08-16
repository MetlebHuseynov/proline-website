// JSON məlumatlarını MySQL-ə köçürmək üçün migration script
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

// Environment variables
require('dotenv').config();

class MySQLMigration {
    constructor() {
        this.connection = null;
        this.dataPath = path.join(__dirname, '..', 'data');
    }

    // MySQL bağlantısı
    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                charset: 'utf8mb4'
            });
            
            console.log('✅ MySQL bağlantısı uğurlu');
            return true;
        } catch (error) {
            console.error('❌ MySQL bağlantı xətası:', error.message);
            return false;
        }
    }

    // JSON fayl oxuma
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

    // Cədvəlləri yaratma
    async createTables() {
        try {
            console.log('🔄 Cədvəllər yaradılır...');

            // Products cədvəli
            await this.connection.execute(`
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2),
                    category VARCHAR(100),
                    brand VARCHAR(100),
                    image VARCHAR(255),
                    stock INT DEFAULT 0,
                    sku VARCHAR(100),
                    weight DECIMAL(8,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_category (category),
                    INDEX idx_brand (brand),
                    INDEX idx_price (price)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Brands cədvəli
            await this.connection.execute(`
                CREATE TABLE IF NOT EXISTS brands (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    logo VARCHAR(255),
                    website VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_name (name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Categories cədvəli
            await this.connection.execute(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_name (name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Users cədvəli
            await this.connection.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Featured Products cədvəli
            await this.connection.execute(`
                CREATE TABLE IF NOT EXISTS featured_products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT,
                    order_index INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    INDEX idx_order (order_index)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            console.log('✅ Bütün cədvəllər yaradıldı');
            return true;
        } catch (error) {
            console.error('❌ Cədvəl yaratma xətası:', error.message);
            return false;
        }
    }

    // Brendləri köçürmə
    async migrateBrands() {
        try {
            console.log('🔄 Brendlər köçürülür...');
            const brands = await this.readJSONFile('brands.json');
            
            for (const brand of brands) {
                await this.connection.execute(
                    'INSERT IGNORE INTO brands (name, description, logo, website) VALUES (?, ?, ?, ?)',
                    [brand.name, brand.description || null, brand.logo || null, brand.website || null]
                );
            }
            
            console.log(`✅ ${brands.length} brend köçürüldü`);
            return true;
        } catch (error) {
            console.error('❌ Brend köçürmə xətası:', error.message);
            return false;
        }
    }

    // Kateqoriyaları köçürmə
    async migrateCategories() {
        try {
            console.log('🔄 Kateqoriyalar köçürülür...');
            const categories = await this.readJSONFile('categories.json');
            
            for (const category of categories) {
                await this.connection.execute(
                    'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
                    [category.name, category.description || null]
                );
            }
            
            console.log(`✅ ${categories.length} kateqoriya köçürüldü`);
            return true;
        } catch (error) {
            console.error('❌ Kateqoriya köçürmə xətası:', error.message);
            return false;
        }
    }

    // Məhsulları köçürmə
    async migrateProducts() {
        try {
            console.log('🔄 Məhsullar köçürülür...');
            const products = await this.readJSONFile('products.json');
            
            for (const product of products) {
                await this.connection.execute(`
                    INSERT IGNORE INTO products 
                    (name, description, price, category, brand, image, stock, sku, weight) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    product.name,
                    product.description || null,
                    product.price || 0,
                    product.category || null,
                    product.brand || null,
                    product.image || null,
                    product.stock || 0,
                    product.sku || null,
                    product.weight || null
                ]);
            }
            
            console.log(`✅ ${products.length} məhsul köçürüldü`);
            return true;
        } catch (error) {
            console.error('❌ Məhsul köçürmə xətası:', error.message);
            return false;
        }
    }

    // İstifadəçiləri köçürmə
    async migrateUsers() {
        try {
            console.log('🔄 İstifadəçilər köçürülür...');
            const users = await this.readJSONFile('users.json');
            
            for (const user of users) {
                // Şifrəni hash-lə (əgər artıq hash-lənməyibsə)
                let hashedPassword = user.password;
                if (!user.password.startsWith('$2')) {
                    hashedPassword = await bcrypt.hash(user.password, 12);
                }
                
                await this.connection.execute(
                    'INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                    [user.username, user.email, hashedPassword, user.role || 'user']
                );
            }
            
            console.log(`✅ ${users.length} istifadəçi köçürüldü`);
            return true;
        } catch (error) {
            console.error('❌ İstifadəçi köçürmə xətası:', error.message);
            return false;
        }
    }

    // Seçilmiş məhsulları köçürmə
    async migrateFeaturedProducts() {
        try {
            console.log('🔄 Seçilmiş məhsullar köçürülür...');
            const featuredProducts = await this.readJSONFile('featured-products.json');
            const products = await this.readJSONFile('products.json');
            
            for (const fp of featuredProducts) {
                // JSON-da productId ilə MySQL-də id tapırıq
                const product = products.find(p => p._id === fp.productId || p.id === fp.productId);
                if (product) {
                    // MySQL-də həmin məhsulun ID-sini tapırıq
                    const [rows] = await this.connection.execute(
                        'SELECT id FROM products WHERE name = ? LIMIT 1',
                        [product.name]
                    );
                    
                    if (rows.length > 0) {
                        await this.connection.execute(
                            'INSERT IGNORE INTO featured_products (product_id, order_index) VALUES (?, ?)',
                            [rows[0].id, fp.order || 0]
                        );
                    }
                }
            }
            
            console.log(`✅ ${featuredProducts.length} seçilmiş məhsul köçürüldü`);
            return true;
        } catch (error) {
            console.error('❌ Seçilmiş məhsul köçürmə xətası:', error.message);
            return false;
        }
    }

    // Default admin istifadəçisi yaratma
    async createDefaultAdmin() {
        try {
            console.log('🔄 Default admin yaradılır...');
            
            const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@oldbridge.az';
            
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            
            await this.connection.execute(`
                INSERT IGNORE INTO users (username, email, password, role) 
                VALUES (?, ?, ?, 'admin')
            `, [adminUsername, adminEmail, hashedPassword]);
            
            console.log(`✅ Default admin yaradıldı: ${adminUsername}`);
            return true;
        } catch (error) {
            console.error('❌ Default admin yaratma xətası:', error.message);
            return false;
        }
    }

    // Bütün migration prosesi
    async runMigration() {
        console.log('🚀 MySQL Migration başlayır...');
        console.log('=' .repeat(50));
        
        // Bağlantı
        if (!(await this.connect())) {
            return false;
        }
        
        // Cədvəlləri yarat
        if (!(await this.createTables())) {
            return false;
        }
        
        // Məlumatları köçür
        await this.migrateBrands();
        await this.migrateCategories();
        await this.migrateProducts();
        await this.migrateUsers();
        await this.migrateFeaturedProducts();
        await this.createDefaultAdmin();
        
        console.log('=' .repeat(50));
        console.log('🎉 Migration tamamlandı!');
        console.log('✅ Artıq .env faylında DB_TYPE=mysql təyin edə bilərsiniz');
        
        return true;
    }

    // Bağlantını bağlama
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('✅ MySQL bağlantısı bağlandı');
        }
    }
}

// Script işə salma
async function main() {
    const migration = new MySQLMigration();
    
    try {
        await migration.runMigration();
    } catch (error) {
        console.error('❌ Migration xətası:', error.message);
    } finally {
        await migration.close();
        process.exit(0);
    }
}

// Əgər bu fayl birbaşa işə salınırsa
if (require.main === module) {
    main();
}

module.exports = MySQLMigration;