# Render-də Pulsuz Node.js Deployment Təlimatı

## 🚀 Render Platformunda Pulsuz Hosting

Bu təlimat sizə Render platformunda Node.js layihənizi pulsuz olaraq deploy etməyi göstərir.

## 📋 Tələblər

- GitHub hesabı
- Render hesabı (pulsuz)
- Node.js layihəsi
- Hostinger domeniniz

## 🔧 1. Addım: GitHub Repository Hazırlamaq

### 1.1 GitHub-da yeni repository yaradın
```bash
# Terminal-da layihə qovluğunda
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/your-repo.git
git push -u origin main
```

### 1.2 .gitignore faylını yoxlayın
```
node_modules/
.env
.env.local
.env.production
.env.render
logs/
*.log
.DS_Store
Thumbs.db
```

## 🌐 2. Addım: Render Hesabı Yaratmaq

1. [render.com](https://render.com) saytına daxil olun
2. "Get Started for Free" düyməsini basın
3. GitHub hesabınızla qeydiyyatdan keçin
4. Email təsdiqini tamamlayın

## 🗄️ 3. Addım: PostgreSQL Database Yaratmaq

### 3.1 Database yaradın
1. Render Dashboard-da "New +" düyməsini basın
2. "PostgreSQL" seçin
3. Məlumatları doldurun:
   - **Name**: `proline-database`
   - **Database**: `proline`
   - **User**: `proline_user`
   - **Region**: `Frankfurt (EU Central)`
   - **Plan**: `Free` seçin

### 3.2 Database məlumatlarını kopyalayın
Database yaradıldıqdan sonra bu məlumatları saxlayın:
- **Hostname**
- **Port**: 5432
- **Database**: proline
- **Username**: proline_user
- **Password**: avtomatik yaranmış parol
- **Connection String**: tam PostgreSQL URL

## 🚀 4. Addım: Web Service Yaratmaq

### 4.1 Yeni Web Service
1. "New +" → "Web Service" seçin
2. GitHub repository-nizi seçin
3. Məlumatları doldurun:
   - **Name**: `proline-website`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 4.2 Environment Variables əlavə edin
"Environment" bölməsində bu dəyişənləri əlavə edin:

```
NODE_ENV=production
PORT=10000
DB_TYPE=postgresql
DB_HOST=your-postgres-hostname
DB_PORT=5432
DB_NAME=proline
DB_USER=proline_user
DB_PASSWORD=your-postgres-password
DATABASE_URL=your-full-postgres-connection-string
SESSION_SECRET=your-32-character-secret-key
JWT_SECRET=your-32-character-jwt-secret
CORS_ORIGIN=https://yourdomain.com,https://your-app.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 5. Addım: Kodu Render üçün Hazırlamaq

### 5.1 Database connection-u yoxlayın
Server.js və ya database config faylınızda PostgreSQL dəstəyi olduğundan əmin olun:

```javascript
// PostgreSQL üçün
const mysql = require('mysql2'); // Bu MySQL2-dir, PostgreSQL üçün pg istifadə edin
// və ya
const { Pool } = require('pg');
```

### 5.2 Port konfiqurasiyasını yoxlayın
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT} portunda işləyir`);
});
```

## 🌍 6. Addım: Hostinger Domenini Bağlamaq

### 6.1 Render URL-ni əldə edin
Deployment tamamlandıqdan sonra sizə verilən URL:
`https://your-app-name.onrender.com`

### 6.2 Hostinger DNS ayarları
1. Hostinger cPanel-ə daxil olun
2. "Zone Editor" və ya "DNS Zone Editor" bölməsinə gedin
3. Yeni CNAME record əlavə edin:
   - **Type**: CNAME
   - **Name**: www (və ya subdomain)
   - **Value**: your-app-name.onrender.com

### 6.3 Root domain üçün (optional)
A record əlavə edin:
- **Type**: A
- **Name**: @ (root domain)
- **Value**: Render-in IP ünvanı

## ✅ 7. Addım: Deployment Yoxlamaq

### 7.1 Render Dashboard-da yoxlayın
- Build logs-u yoxlayın
- Service status "Live" olmalıdır
- URL-ə daxil olub saytın işlədiyini yoxlayın

### 7.2 Database connection test edin
- Logs-da database connection error-ları yoxlayın
- Test endpoint yaradıb database-ə qoşulmanı yoxlayın

## 🔄 8. Addım: Avtomatik Deployment

GitHub-a hər push etdiyinizdə Render avtomatik olaraq yenidən deploy edəcək.

```bash
# Dəyişiklik etdikdən sonra
git add .
git commit -m "Update: your changes"
git push origin main
```

## 🎯 Pulsuz Plan Məhdudiyyətləri

- **750 saat/ay** pulsuz istifadə
- **512 MB RAM**
- **1 GB disk space**
- **100 GB bandwidth/ay**
- **PostgreSQL database**: 1 GB storage
- **Sleep after 15 minutes** inactivity

## 🔧 Troubleshooting

### Build uğursuz olarsa:
1. `package.json`-da `engines` field əlavə edin:
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### Database connection problemi:
1. Environment variables-ları yoxlayın
2. PostgreSQL connection string-i düzgün olduğundan əmin olun
3. SSL connection istifadə edin

### Domain bağlanmır:
1. DNS propagation gözləyin (24 saata qədər)
2. CNAME record-un düzgün olduğunu yoxlayın
3. Render-də custom domain əlavə edin

## 📞 Dəstək

Problem yaşadığınız halda:
- Render Documentation: [docs.render.com](https://docs.render.com)
- Render Community: [community.render.com](https://community.render.com)
- GitHub Issues: Repository-nizdə issue yaradın

---

**Qeyd**: Bu təlimat Render-in pulsuz planı üçündür. Production environment üçün ödənişli plan tövsiyə olunur.