# Hostinger.com üzərində Deployment Təlimatları

## 🌐 Hostinger Xüsusiyyətləri

**Hostinger Web Hosting Planları:**
- ✅ Node.js dəstəyi (Premium və Business planlarda)
- ✅ MySQL/MariaDB verilənlər bazası
- ✅ SSL sertifikatı (pulsuz)
- ✅ cPanel idarəetmə paneli
- ✅ FTP/SFTP dəstəyi
- ✅ Custom domain

---

## 📋 Tələblər

### Hostinger Plan Tələbləri:
- **Premium Hosting** və ya **Business Hosting** (Node.js üçün)
- **Single Hosting** Node.js dəstəkləmir

### Texniki Tələblər:
- Node.js 14+ dəstəyi
- MySQL/MariaDB verilənlər bazası
- SSL sertifikatı

---

## 🚀 Deployment Addımları

### 1. Hostinger Hesabı və Hosting

```bash
# 1. Hostinger.com saytından Premium və ya Business plan alın
# 2. Domain adı seçin və ya mövcud domain bağlayın
# 3. cPanel-ə daxil olun
```

### 2. Node.js Aktivləşdirmə

**cPanel-də:**
1. "Node.js" bölməsinə keçin
2. "Create Application" düyməsini basın
3. Node.js versiyasını seçin (16.x tövsiyə edilir)
4. Application root: `/public_html/`
5. Application URL: sizin domain adınız
6. Application startup file: `server.js`

### 3. Faylların Yüklənməsi

**FileManager və ya FTP ilə:**
```bash
# Bütün layihə fayllarını /public_html/ qovluğuna yükləyin
# Struktur:
/public_html/
├── server.js
├── package.json
├── controllers/
├── models/
├── routes/
├── public/
├── data/
└── .env
```

### 4. Dependencies Quraşdırma

**cPanel Terminal və ya SSH ilə:**
```bash
# public_html qovluğuna keçin
cd /public_html

# Dependencies quraşdırın
npm install

# Production dependencies
npm install --production
```

### 5. Environment Variables

**.env faylı yaradın:**
```env
# Hostinger MySQL məlumatları
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_oldbridge
DB_USER=u123456789_admin
DB_PASSWORD=your_mysql_password

# Server konfiqurasiyası
PORT=3000
NODE_ENV=production

# Session secret
SESSION_SECRET=your_very_secure_secret_key_here

# Upload path
UPLOAD_PATH=/public_html/public/uploads
```

### 6. MySQL Verilənlər Bazası

**cPanel-də MySQL Databases:**
1. "MySQL Databases" bölməsinə keçin
2. Yeni database yaradın: `u123456789_oldbridge`
3. MySQL user yaradın: `u123456789_admin`
4. User-ə database üzərində tam hüquq verin
5. phpMyAdmin ilə cədvəlləri yaradın

**Cədvəl strukturları:**
```sql
-- Products cədvəli
CREATE TABLE products (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Brands cədvəli
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories cədvəli
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users cədvəli
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Featured Products cədvəli
CREATE TABLE featured_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 7. Application Başlatma

**cPanel Node.js bölməsində:**
1. "Restart" düyməsini basın
2. Application URL-ni yoxlayın
3. Logs-u yoxlayın

---

## 🔧 Konfiqurasiya Faylları

### package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "production": "NODE_ENV=production node server.js"
  }
}
```

### server.js Modifikasiyası
```javascript
// Port konfiqurasiyası
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Upload directory
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, 'public', 'uploads');
```

---

## 🔒 Təhlükəsizlik

### SSL Sertifikatı
- Hostinger avtomatik SSL təmin edir
- "Force HTTPS" aktivləşdirin

### .htaccess Faylı
```apache
# /public_html/.htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Node.js app üçün
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /server.js [L]
```

---

## 📊 Monitoring və Logs

### Error Logs
```bash
# cPanel Error Logs bölməsində
# və ya SSH ilə
tail -f /home/username/logs/error.log
```

### Application Logs
```javascript
// server.js-də
console.log('Server started on port:', PORT);
console.log('Environment:', process.env.NODE_ENV);
console.log('Database connected successfully');
```

---

## 🔄 Avtomatik Yenilənmə

### Git Integration
```bash
# SSH ilə
cd /public_html
git pull origin main
npm install
# cPanel-də Node.js app restart edin
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh
cd /public_html
git pull origin main
npm install --production
# Restart application via cPanel API
```

---

## 🆘 Troubleshooting

### Ümumi Problemlər:

**1. Node.js işləmir**
- Premium/Business plan olduğunu yoxlayın
- Node.js versiyasını yoxlayın
- Application startup file düzgün təyin edilib

**2. Database bağlantı xətası**
- MySQL məlumatlarını yoxlayın
- Database user hüquqlarını yoxlayın
- Host adını localhost olaraq təyin edin

**3. File upload işləmir**
- Upload directory icazələrini yoxlayın (755)
- Disk sahəsi kifayət edirmi
- File size limits

**4. SSL problemləri**
- Force HTTPS aktivdir
- Mixed content xətaları

---

## 📞 Dəstək

- **Hostinger Dəstək:** 24/7 live chat
- **cPanel Dokumentasiya:** Hostinger knowledge base
- **Node.js Logs:** cPanel Error Logs bölməsi

---

## 💰 Xərclər

**Hostinger Premium Hosting:**
- İllik: ~$35-50
- 2 illik: ~$60-80 (endirim)
- Domain: İlk il pulsuz

**Əlavə xidmətlər:**
- SSL: Pulsuz
- Email: Daxildir
- Backup: Həftəlik avtomatik

Bu təlimatları izləyərək saytınızı Hostinger üzərində uğurla yayımlaya bilərsiniz!