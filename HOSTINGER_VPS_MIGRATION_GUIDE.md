# Hostinger Premium-dan VPS-ə Keçid Təlimatları

## 🚀 VPS Planına Keçid Addımları

### 1. Hostinger Hesabınıza Daxil Olun
- [Hostinger.com](https://hostinger.com) saytına daxil olun
- Hesabınıza login olun
- Dashboard-a keçin

### 2. VPS Planını Seçin
- **Hosting** bölməsindən **VPS Hosting** seçin
- Tövsiyə edilən plan: **KVM1** (aylıq $5.99-dan başlayır)
- Node.js üçün minimum tələblər:
  - 1 vCPU
  - 4GB RAM
  - 50GB NVMe storage
  - Ubuntu 22.04 + Node.js template

### 3. VPS Template Seçimi
**ÇOX VACİB**: VPS sifarişi zamanı:
- Operating System: **Ubuntu 22.04 64bit with Node.js and OpenLiteSpeed**
- Bu template avtomatik olaraq quraşdırır:
  - Node.js (ən son versiya)
  - OpenLiteSpeed web server
  - SSL dəstəyi
  - PM2 process manager

### 4. Domain Konfiqurasiyası
- Mövcud domeninizi VPS-ə yönləndirin:
  - Hostinger DNS panelində A record-u VPS IP-yə yönləndirin
  - Və ya nameserver-ləri dəyişin

### 5. VPS Quraşdırılması (15-30 dəqiqə)
- VPS yaradıldıqdan sonra SSH məlumatlarını alacaqsınız:
  - IP ünvanı
  - SSH istifadəçi adı
  - SSH şifrəsi

## 📋 Keçid Sonrası Addımlar

### 1. SSH Bağlantısı
```bash
ssh root@YOUR_VPS_IP
```

### 2. Layihənizi Upload Edin
```bash
# Git vasitəsilə (tövsiyə edilir)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Və ya FTP/SFTP vasitəsilə faylları köçürün
```

### 3. Dependencies Quraşdırın
```bash
npm install
```

### 4. Environment Variables
```bash
# .env faylını yaradın
cp .env.production .env
nano .env
```

### 5. MySQL Verilənlər Bazası
```bash
# MySQL quraşdırın
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Verilənlər bazası yaradın
sudo mysql -u root -p
CREATE DATABASE your_database_name;
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database_name.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6. Tətbiqi Başladın
```bash
# PM2 ilə başladın
npm install -g pm2
pm2 start server.js --name "your-app"
pm2 startup
pm2 save
```

### 7. OpenLiteSpeed Konfiqurasiyası
- Web Admin Console: `https://YOUR_VPS_IP:7080`
- Default login: admin/123456 (dərhal dəyişin!)
- Virtual Host yaradın
- SSL sertifikatı quraşdırın

## 💰 Qiymət Müqayisəsi

| Plan | Qiymət (aylıq) | vCPU | RAM | Storage | Bandwidth |
|------|----------------|------|-----|---------|----------|
| KVM1 | $5.99 | 1 | 4GB | 50GB NVMe | 4TB |
| KVM2 | $8.99 | 2 | 8GB | 100GB NVMe | 8TB |
| KVM4 | $16.99 | 4 | 16GB | 200GB NVMe | 16TB |

## 🔧 Üstünlüklər

### VPS vs Premium Shared Hosting
- ✅ **Tam root giriş**
- ✅ **Node.js tam dəstəyi**
- ✅ **MySQL/PostgreSQL dəstəyi**
- ✅ **SSL sertifikatları**
- ✅ **Custom konfiqurasiya**
- ✅ **Yüksək performans**
- ✅ **Scalability**

## 🚨 Vacib Qeydlər

1. **Backup**: Keçiddən əvvəl mövcud saytınızın backup-ını alın
2. **DNS**: Domain yönləndirməsi 24-48 saat çəkə bilər
3. **SSL**: Let's Encrypt pulsuz SSL avtomatik quraşdırılır
4. **Monitoring**: VPS resurslarını izləyin
5. **Security**: Firewall və security updates quraşdırın

## 📞 Dəstək

- Hostinger 24/7 dəstək xidməti
- VPS-specific documentation
- Community forum

## 🎯 Növbəti Addım

VPS sifarişi verdikdən sonra mənə bildirin ki, deployment prosesini davam etdirək!