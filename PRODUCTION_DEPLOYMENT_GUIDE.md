# 🚀 Production Deployment Guide - Hostinger

## 📋 Deployment Checklist

### ✅ Hazırlıq Mərhələsi
- [ ] Hostinger Premium/Business hosting planı alın
- [ ] Domain adı seçin və ya bağlayın
- [ ] cPanel-ə giriş əldə edin
- [ ] Node.js dəstəyini yoxlayın

### ✅ Faylların Hazırlanması
- [ ] `.env.production` faylını `.env` adı ilə kopyalayın
- [ ] MySQL məlumatlarını `.env`-də dəyişin
- [ ] SESSION_SECRET-i güclü və unikal edin
- [ ] Domain adınızı CORS_ORIGIN-də təyin edin

### ✅ Hostinger Konfiqurasiyası
- [ ] Node.js application yaradın
- [ ] MySQL database yaradın
- [ ] Database user yaradın və hüquq verin
- [ ] SSL sertifikatını aktivləşdirin

---

## 🔧 Addım-addım Deployment

### 1. Hostinger Hesabı və Hosting

1. **Hostinger.com**-dan Premium və ya Business plan alın
2. Domain adı seçin (məsələn: `oldbridge.com`)
3. cPanel-ə daxil olun

### 2. Node.js Application Yaratma

**cPanel-də:**
1. "Node.js" bölməsinə keçin
2. "Create Application" düyməsini basın
3. Konfiqurasiya:
   - **Node.js Version:** 16.x və ya 18.x
   - **Application root:** `/public_html/`
   - **Application URL:** sizin domain adınız
   - **Application startup file:** `server.js`

### 3. MySQL Database Yaratma

**cPanel-də MySQL Databases:**
1. "MySQL Databases" bölməsinə keçin
2. Database yaradın: `u123456789_oldbridge`
3. MySQL user yaradın: `u123456789_admin`
4. User-ə database üzərində "All Privileges" verin
5. Connection məlumatlarını qeyd edin

### 4. Faylların Yüklənməsi

**File Manager və ya FTP ilə:**
```
/public_html/
├── server.js
├── package.json
├── .env (production konfiqurasiyası)
├── controllers/
├── models/
├── routes/
├── public/
├── data/
├── views/
└── node_modules/ (npm install-dan sonra)
```

### 5. Environment Variables Konfiqurasiyası

**.env faylını redaktə edin:**
```env
# MySQL məlumatlarını cPanel-dən alın
DB_HOST=localhost
DB_NAME=u123456789_oldbridge
DB_USER=u123456789_admin
DB_PASSWORD=actual_mysql_password

# Domain adınızı dəyişin
CORS_ORIGIN=https://yourdomain.com

# Güclü session secret
SESSION_SECRET=very_secure_random_string_here
```

### 6. Dependencies Quraşdırma

**cPanel Terminal və ya SSH:**
```bash
cd /public_html
npm install --production
```

### 7. Database Cədvəllərinin Yaradılması

**phpMyAdmin ilə:**
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

### 8. Application Başlatma

**cPanel Node.js bölməsində:**
1. "Restart" düyməsini basın
2. Application URL-ni yoxlayın
3. Logs-u yoxlayın

### 9. SSL və Təhlükəsizlik

**cPanel-də:**
1. "SSL/TLS" bölməsinə keçin
2. "Force HTTPS Redirect" aktivləşdirin
3. SSL sertifikatının aktiv olduğunu yoxlayın

---

## 🔍 Test və Yoxlama

### Funksiyanların Yoxlanması:
- [ ] Ana səhifə açılır
- [ ] Məhsul səhifələri işləyir
- [ ] Admin panel əlçatandır
- [ ] Database bağlantısı işləyir
- [ ] File upload işləyir
- [ ] SSL sertifikatı aktiv

### Performance Yoxlaması:
- [ ] Səhifə yüklənmə sürəti
- [ ] Database sorğu sürəti
- [ ] Image optimization
- [ ] Caching işləyir

---

## 🆘 Troubleshooting

### Ümumi Problemlər:

**Node.js işləmir:**
- Premium/Business plan olduğunu yoxlayın
- Application startup file düzgün təyin edilib
- Node.js versiyası uyğundur

**Database bağlantı xətası:**
- MySQL məlumatları düzgündür
- Database user hüquqları verilmişdir
- Host adı "localhost" olaraq təyin edilib

**File upload işləmir:**
- Upload directory icazələri (755)
- Disk sahəsi kifayət edir
- File size limits yoxlanılıb

**SSL problemləri:**
- Force HTTPS aktivdir
- Mixed content xətaları yoxdur

---

## 📊 Monitoring

### Logs Yoxlama:
```bash
# Error logs
tail -f /home/username/logs/error.log

# Application logs
tail -f /public_html/logs/app.log
```

### Performance Monitoring:
- cPanel Resource Usage
- Database performance
- SSL certificate expiry
- Backup status

---

## 🔄 Maintenance

### Müntəzəm Yenilənmələr:
- Dependencies update
- Security patches
- Database backup
- Log cleanup

### Backup Strategy:
- Həftəlik avtomatik backup (Hostinger)
- Manual database export
- Code repository sync

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

---

## 📞 Dəstək

- **Hostinger Dəstək:** 24/7 live chat
- **cPanel Dokumentasiya:** Hostinger knowledge base
- **Node.js Logs:** cPanel Error Logs bölməsi

---

## ✅ Final Checklist

- [ ] Domain aktiv və SSL işləyir
- [ ] Node.js application işləyir
- [ ] MySQL database bağlantısı uğurlu
- [ ] Bütün səhifələr açılır
- [ ] Admin panel əlçatan
- [ ] File upload işləyir
- [ ] Email konfiqurasiyası (əgər var)
- [ ] Backup sistemi aktiv
- [ ] Performance optimized
- [ ] Security measures aktiv

**🎉 Təbriklər! Saytınız artıq production-da işləyir!**