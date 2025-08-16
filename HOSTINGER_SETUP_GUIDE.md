# Hostinger.com-da Old Bridge Saytının Qurulması

## 📋 Ön Şərtlər

### Hostinger Hosting Planı
- **Premium** və ya **Business** hosting planı (Node.js dəstəyi üçün)
- MySQL database dəstəyi
- SSH access (tövsiyə olunur)
- SSL sertifikatı (pulsuz Let's Encrypt)

### Lokal Hazırlıq
1. Bütün fayllar hazır olmalıdır
2. `.env` faylı konfiqurasiya edilməlidir
3. MySQL migration script hazır olmalıdır

## 🚀 Addım-addım Qurulum

### 1. Hostinger Control Panel-də Hazırlıq

#### 1.1 Node.js Aktivləşdirmə
1. Hostinger hPanel-ə daxil olun
2. **Advanced** → **Node.js** bölməsinə gedin
3. **Create Application** düyməsinə basın
4. Konfiqurasiya:
   - **Application root**: `public_html/oldbridge`
   - **Application URL**: `yourdomain.com` və ya subdomain
   - **Node.js version**: 18.x və ya 20.x (ən son stabil)
   - **Application mode**: Production
   - **Startup file**: `server-production.js`

#### 1.2 MySQL Database Yaratma
1. **Databases** → **MySQL Databases** bölməsinə gedin
2. Yeni database yaradın:
   - **Database name**: `oldbridge_db`
   - **Username**: `oldbridge_user`
   - **Password**: güclü parol yaradın
3. Database məlumatlarını qeyd edin

### 2. Faylların Yüklənməsi

#### 2.1 FTP/SFTP ilə Yükləmə
1. FileZilla və ya digər FTP client istifadə edin
2. Hostinger FTP məlumatları:
   - **Host**: `ftp.yourdomain.com`
   - **Username**: Hostinger username
   - **Password**: Hostinger password
   - **Port**: 21 (FTP) və ya 22 (SFTP)

3. Bütün layihə fayllarını `public_html/oldbridge/` qovluğuna yükləyin:
   ```
   public_html/oldbridge/
   ├── public/
   ├── data/
   ├── config/
   ├── scripts/
   ├── server-production.js
   ├── package.json
   ├── .env
   └── digər fayllar
   ```

#### 2.2 SSH ilə Yükləmə (Tövsiyə)
```bash
# Lokal kompüterdə
scp -r ./oldbridge-project username@yourdomain.com:public_html/oldbridge/

# və ya rsync
rsync -avz --exclude 'node_modules' ./oldbridge-project/ username@yourdomain.com:public_html/oldbridge/
```

### 3. Environment Variables Konfiqurasiyası

#### 3.1 .env Faylının Yaradılması
Hostinger-də `.env` faylı yaradın:

```env
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=oldbridge_user
DB_PASSWORD=your_database_password
DB_NAME=oldbridge_db

# Server Configuration
NODE_ENV=production
PORT=3000
SERVER_URL=https://yourdomain.com

# Session Secret
SESSION_SECRET=your-super-secret-session-key-change-this-immediately

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp

# Security
RATE_LIMIT_MAX=100
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin Settings
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-password
ADMIN_EMAIL=admin@yourdomain.com

# Email Configuration (əgər lazımdırsa)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
```

### 4. Dependencies Qurulması

#### 4.1 SSH ilə
```bash
# Hostinger serverinə bağlanın
ssh username@yourdomain.com

# Layihə qovluğuna gedin
cd public_html/oldbridge

# Node.js versiyasını yoxlayın
node --version
npm --version

# Dependencies quraşdırın
npm install --production
```

#### 4.2 Hostinger hPanel ilə
1. **Node.js** bölməsinə gedin
2. Yaratdığınız application-ı seçin
3. **Run npm install** düyməsinə basın

### 5. Database Migration

#### 5.1 Migration Script İşə Salma
```bash
# SSH ilə
cd public_html/oldbridge
node scripts/migrate-to-mysql.js
```

#### 5.2 Manual Migration (əgər script işləməzsə)
```sql
-- MySQL-ə daxil olun və cədvəlləri yaradın
-- phpMyAdmin və ya MySQL command line istifadə edin

CREATE DATABASE IF NOT EXISTS oldbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oldbridge_db;

-- Cədvəlləri yaratmaq üçün migration script-dəki SQL-ləri istifadə edin
```

### 6. Application Başlatma

#### 6.1 Hostinger hPanel-də
1. **Node.js** bölməsinə gedin
2. Application-ınızı seçin
3. **Start Application** düyməsinə basın
4. Status **Running** olmalıdır

#### 6.2 SSH ilə Test
```bash
# Application-ı test edin
cd public_html/oldbridge
node server-production.js

# Ctrl+C ilə dayandırın və Hostinger-in öz process manager-ini istifadə edin
```

### 7. Domain Konfiqurasiyası

#### 7.1 DNS Ayarları
1. **Domains** bölməsinə gedin
2. Domain-ınızı seçin
3. **DNS Zone** redaktə edin
4. A record-u Hostinger server IP-sinə yönləndirin

#### 7.2 SSL Sertifikatı
1. **SSL** bölməsinə gedin
2. **Let's Encrypt** pulsuz SSL aktivləşdirin
3. **Force HTTPS** aktivləşdirin

### 8. Test və Yoxlama

#### 8.1 Sayt Funksionallığı
1. `https://yourdomain.com` açın
2. Bütün səhifələri yoxlayın:
   - Ana səhifə
   - Məhsullar
   - Brendlər
   - Əlaqə
   - Haqqımızda

#### 8.2 API Endpointləri
```bash
# Health check
curl https://yourdomain.com/api/health

# Məhsullar
curl https://yourdomain.com/api/products

# Brendlər
curl https://yourdomain.com/api/brands
```

#### 8.3 Database Bağlantısı
- phpMyAdmin ilə database-ə baxın
- Cədvəllərin yaradıldığını təsdiqləyin
- Məlumatların köçürüldüyünü yoxlayın

## 🔧 Problemlərin Həlli

### Node.js Application İşləmir
```bash
# Log fayllarını yoxlayın
tail -f ~/logs/nodejs_error.log
tail -f ~/logs/nodejs_access.log

# Application-ı yenidən başladın
# Hostinger hPanel-də Restart düyməsi
```

### Database Bağlantı Problemi
1. `.env` faylındakı database məlumatlarını yoxlayın
2. MySQL user-in icazələrini yoxlayın
3. Database host-un düzgün olduğunu təsdiqləyin

### File Upload Problemi
```bash
# Upload qovluğunun icazələrini yoxlayın
chmod 755 public/images/uploads/
chown username:username public/images/uploads/
```

### Performance Problemləri
1. **Compression** aktivdir
2. **Static file caching** konfiqurasiya edilib
3. **Database indexlər** yaradılıb
4. **Rate limiting** aktiv

## 🔄 Avtomatik Yeniləmələr

### GitHub Actions ilə CI/CD
1. GitHub repository yaradın
2. `.github/workflows/deploy.yml` faylı yaradın:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Hostinger
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOSTINGER_HOST }}
        username: ${{ secrets.HOSTINGER_USERNAME }}
        password: ${{ secrets.HOSTINGER_PASSWORD }}
        script: |
          cd public_html/oldbridge
          git pull origin main
          npm install --production
          # Restart application through hPanel API or manual restart
```

### Manual Yeniləmə
```bash
# SSH ilə
cd public_html/oldbridge
git pull origin main
npm install --production
# Hostinger hPanel-də application-ı restart edin
```

## 📊 Monitoring və Maintenance

### Log Monitoring
```bash
# Error logları
tail -f ~/logs/nodejs_error.log

# Access logları
tail -f ~/logs/nodejs_access.log

# Application logları
tail -f ~/logs/oldbridge.log
```

### Database Backup
```bash
# Avtomatik backup script
mysqldump -u oldbridge_user -p oldbridge_db > backup_$(date +%Y%m%d).sql
```

### Performance Monitoring
1. Hostinger hPanel-də resource istifadəsini izləyin
2. Database performansını yoxlayın
3. Response time-ları ölçün

## 💰 Xərclər

### Hostinger Pricing
- **Premium Plan**: ~$2.99/ay (Node.js dəstəyi)
- **Business Plan**: ~$3.99/ay (daha çox resource)
- **Domain**: ~$8.99/il (əgər yoxdursa)
- **SSL**: Pulsuz (Let's Encrypt)

### Əlavə Xidmətlər
- **Email hosting**: Daxil edilib
- **CDN**: Əlavə ödəniş
- **Backup**: Əlavə ödəniş

## 📞 Dəstək

### Hostinger Dəstək
- 24/7 Live Chat
- Email dəstək
- Knowledge Base

### Texniki Dəstək
- Node.js problemləri
- MySQL konfiqurasiyası
- SSL sertifikat problemləri
- Performance optimizasiyası

---

**Qeyd**: Bu təlimat Hostinger-in cari xidmətlərinə əsaslanır. Hostinger interfeysi dəyişə bilər, ona görə də ən son məlumatlar üçün Hostinger sənədlərinə baxın.

**Uğurlar!** 🚀