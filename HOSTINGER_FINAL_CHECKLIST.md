# 🚀 Hostinger Production Deployment - Final Checklist

## 📋 Pre-Deployment Checklist

### ✅ Hostinger Account Setup
- [ ] Premium/Business hosting plan aktivdir
- [ ] Domain adı bağlanıb və aktiv
- [ ] cPanel-ə giriş mövcud
- [ ] SSL sertifikatı aktivləşdirilib

### ✅ Local Development Complete
- [ ] Bütün funksiyalar test edilib
- [ ] Database migration hazır
- [ ] Production environment variables konfiqurasiya edilib
- [ ] Dependencies yenilənib

---

## 🔧 Step-by-Step Deployment

### 1. cPanel Node.js Setup

**cPanel-də Node.js bölməsinə keçin:**

```
Application Details:
- Node.js Version: 16.x və ya 18.x
- Application Root: /public_html/
- Application URL: yourdomain.com
- Application Startup File: server.js
- Environment: production
```

### 2. MySQL Database Setup

**cPanel MySQL Databases:**

1. **Database yaradın:**
   - Name: `u123456789_oldbridge`
   - Collation: `utf8mb4_unicode_ci`

2. **User yaradın:**
   - Username: `u123456789_admin`
   - Password: güclü şifrə

3. **Privileges verin:**
   - User-ə database üzərində "All Privileges"

4. **Connection məlumatlarını qeyd edin:**
   ```
   Host: localhost
   Port: 3306
   Database: u123456789_oldbridge
   Username: u123456789_admin
   Password: [your_password]
   ```

### 3. File Upload

**File Manager və ya FTP ilə yükləyin:**

```
/public_html/
├── server.js ✅
├── package.json ✅
├── .env (production konfiqurasiyası) ✅
├── .htaccess ✅
├── controllers/ ✅
├── models/ ✅
├── routes/ ✅
├── public/ ✅
├── data/ ✅
├── views/ ✅
└── deploy.sh ✅
```

### 4. Environment Configuration

**.env faylını redaktə edin:**

```env
# MySQL Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_oldbridge
DB_USER=u123456789_admin
DB_PASSWORD=your_actual_mysql_password

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
SESSION_SECRET=your_very_secure_random_session_secret
CORS_ORIGIN=https://yourdomain.com

# File Upload
UPLOAD_PATH=/public_html/public/uploads
```

### 5. Dependencies Installation

**cPanel Terminal və ya SSH:**

```bash
cd /public_html
npm install --production
```

### 6. Database Tables Creation

**phpMyAdmin ilə SQL çalışdırın:**

```sql
-- Products Table
CREATE TABLE products (
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
);

-- Brands Table
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Featured Products Table
CREATE TABLE featured_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### 7. Application Start

**cPanel Node.js bölməsində:**

1. "Restart" düyməsini basın
2. Application status "Running" olmalı
3. Logs-u yoxlayın

---

## 🧪 Testing & Verification

### Functional Tests

- [ ] **Ana səhifə açılır:** `https://yourdomain.com`
- [ ] **Məhsul səhifələri işləyir:** `/mehsullar`
- [ ] **Admin panel əlçatan:** `/admin`
- [ ] **Database bağlantısı uğurlu**
- [ ] **File upload işləyir**
- [ ] **SSL sertifikatı aktiv**
- [ ] **HTTPS redirect işləyir**

### Performance Tests

- [ ] **Səhifə yüklənmə sürəti < 3 saniyə**
- [ ] **Database sorğu sürəti optimal**
- [ ] **Image optimization aktiv**
- [ ] **Gzip compression işləyir**
- [ ] **Caching headers təyin edilib**

### Security Tests

- [ ] **SSL/TLS sertifikatı keçərli**
- [ ] **Security headers təyin edilib**
- [ ] **File upload restrictions aktiv**
- [ ] **Directory browsing deaktiv**
- [ ] **Sensitive files qorunur**

---

## 🆘 Troubleshooting Guide

### Common Issues

**1. Node.js Application başlamır**
```bash
# Check logs
tail -f /home/username/logs/error.log

# Verify Node.js version
node --version

# Check application status in cPanel
```

**2. Database Connection Error**
```bash
# Test MySQL connection
mysql -h localhost -u u123456789_admin -p u123456789_oldbridge

# Check .env file
cat .env | grep DB_

# Verify user privileges in cPanel
```

**3. File Upload Issues**
```bash
# Check directory permissions
ls -la public/uploads/

# Set correct permissions
chmod 755 public/uploads/

# Check disk space
df -h
```

**4. SSL/HTTPS Issues**
- Force HTTPS in cPanel SSL/TLS section
- Check .htaccess HTTPS redirect rules
- Verify SSL certificate status

**5. Performance Issues**
```bash
# Check server resources
top

# Monitor database queries
# Enable slow query log in MySQL

# Check application logs
tail -f logs/app.log
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Website accessibility
- [ ] SSL certificate status
- [ ] Error logs review
- [ ] Database performance

### Weekly Tasks
- [ ] Backup verification
- [ ] Security updates
- [ ] Performance metrics
- [ ] Log cleanup

### Monthly Tasks
- [ ] Dependencies update
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup strategy review

---

## 📞 Support Resources

### Hostinger Support
- **24/7 Live Chat:** Available in cPanel
- **Knowledge Base:** hpanel.hostinger.com
- **Community Forum:** Hostinger Community

### Technical Documentation
- **Node.js:** nodejs.org/docs
- **MySQL:** dev.mysql.com/doc
- **Express.js:** expressjs.com

### Emergency Contacts
- **Hostinger Technical Support**
- **Domain Registrar Support**
- **SSL Certificate Provider**

---

## ✅ Final Verification

### Pre-Launch Checklist
- [ ] All functionality tested
- [ ] Performance optimized
- [ ] Security measures active
- [ ] Backup system configured
- [ ] Monitoring setup complete
- [ ] Documentation updated
- [ ] Team trained on maintenance

### Launch Day Tasks
- [ ] DNS propagation verified
- [ ] SSL certificate active
- [ ] All redirects working
- [ ] Analytics tracking active
- [ ] Search engine submission
- [ ] Social media updates

---

## 🎉 Post-Launch

### Immediate Actions (First 24 hours)
- Monitor error logs continuously
- Check website performance
- Verify all forms and functionality
- Monitor server resources
- Test from different devices/browsers

### First Week Actions
- Daily performance monitoring
- User feedback collection
- SEO optimization
- Content updates
- Security monitoring

### Ongoing Maintenance
- Regular backups
- Security updates
- Performance optimization
- Content management
- User support

---

**🚀 Təbriklər! Old Bridge saytınız artıq production-da işləyir!**

**Next Steps:**
1. Monitor performance and user feedback
2. Implement additional features as needed
3. Regular maintenance and updates
4. SEO optimization and marketing
5. Scale resources as traffic grows