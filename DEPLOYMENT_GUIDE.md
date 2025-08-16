# Vebsaytı Dostlarınızla Paylaşmaq - Deployment Təlimatları

## 🌐 Vebsaytı İnternetə Çıxarmaq Üsulları

### 1. 🚀 Pulsuz Hosting Platformaları

#### A) Vercel (Tövsiyə edilir)
**Xüsusiyyətlər:**
- ✅ Pulsuz
- ✅ Avtomatik HTTPS
- ✅ Sürətli deployment
- ✅ Custom domain dəstəyi

**Quraşdırma:**
```bash
# 1. Vercel CLI quraşdırın
npm install -g vercel

# 2. Layihə qovluğunda
vercel

# 3. Təlimatları izləyin
```

**URL nümunəsi:** `https://your-project-name.vercel.app`

---

#### B) Netlify
**Xüsusiyyətlər:**
- ✅ Pulsuz
- ✅ Drag & drop deployment
- ✅ Form handling
- ✅ Custom domain

**Quraşdırma:**
1. https://netlify.com saytına daxil olun
2. "New site from Git" seçin
3. GitHub/GitLab repo bağlayın
4. Build settings: `npm run build`
5. Publish directory: `public`

---

#### C) GitHub Pages
**Xüsusiyyətlər:**
- ✅ Pulsuz
- ✅ GitHub inteqrasiyası
- ❌ Yalnız static saytlar

**Quraşdırma:**
1. GitHub-da repo yaradın
2. Settings > Pages
3. Source: Deploy from branch
4. Branch: main, folder: /public

---

### 2. 💰 Ödənişli Hosting

#### A) DigitalOcean
**Qiymət:** $5/ay
- VPS server
- Tam nəzarət
- Node.js dəstəyi

#### B) AWS EC2
**Qiymət:** $3-10/ay
- Amazon cloud
- Scalable
- Professional

#### C) Heroku
**Qiymət:** $7/ay
- Sadə deployment
- Database dəstəyi
- Add-ons

---

### 3. 🏠 Lokal Şəbəkədə Paylaşmaq

#### A) Ngrok (Ən sadə)
```bash
# 1. Ngrok yükləyin: https://ngrok.com
# 2. Serveri işə salın (port 5000)
node server.js

# 3. Yeni terminalda
ngrok http 5000

# 4. Alınan URL-i dostlarınızla paylaşın
# Nümunə: https://abc123.ngrok.io
```

#### B) LocalTunnel
```bash
# 1. Quraşdırın
npm install -g localtunnel

# 2. Serveri işə salın
node server.js

# 3. Tunnel yaradın
lt --port 5000 --subdomain mywebsite

# URL: https://mywebsite.loca.lt
```

---

### 4. 📱 Mobil Dostlar üçün

#### A) QR Code Generator
```bash
# 1. QR code generator quraşdırın
npm install -g qrcode-terminal

# 2. IP ünvanınızı tapın
ipconfig

# 3. QR code yaradın
qrcode-terminal "http://192.168.1.100:5000"
```

#### B) Lokal IP ilə
1. Kompüterinizin IP ünvanını tapın: `ipconfig`
2. Router-də port forwarding aktiv edin
3. Dostlarınıza IP + port verin: `http://192.168.1.100:5000`

---

## 🎯 Tövsiyələr

### Sürətli Test üçün:
1. **Ngrok** - 5 dəqiqədə hazır
2. **LocalTunnel** - Pulsuz və sürətli

### Daimi sayt üçün:
1. **Vercel** - Ən yaxşı pulsuz seçim
2. **Netlify** - Sadə və güclü
3. **GitHub Pages** - Static saytlar üçün

### Professional üçün:
1. **DigitalOcean** - VPS server
2. **AWS** - Enterprise səviyyə
3. **Heroku** - Developer-friendly

---

## 🔧 Hazırlıq Addımları

### 1. Production üçün Hazırlıq
```bash
# package.json-a əlavə edin
"scripts": {
  "start": "node server.js",
  "build": "echo 'Build completed'"
}
```

### 2. Environment Variables
```bash
# .env faylını production serverə köçürün
# Və ya hosting platformasında environment variables təyin edin
```

### 3. Database
- **JSON fayllar:** Hosting ilə birlikdə yüklənir
- **MSSQL:** Cloud database lazım (Azure SQL)
- **MongoDB:** MongoDB Atlas istifadə edin

---

## 🚀 Sürətli Başlama (5 dəqiqə)

### Ngrok ilə:
```bash
# 1. Serveri işə salın
node server.js

# 2. Yeni terminal açın
ngrok http 5000

# 3. Alınan URL-i dostlarınızla paylaşın
```

### Vercel ilə:
```bash
# 1. Vercel hesabı yaradın
# 2. CLI quraşdırın
npm install -g vercel

# 3. Deploy edin
vercel

# 4. Alınan URL-i paylaşın
```

---

## 📞 Dəstək

Hansi üsulu seçdiyinizi bildirin və mən həmin platformada deployment prosesini addım-addım izah edəcəyəm.

**Sürətli seçimlər:**
- "ngrok" - 2 dəqiqədə hazır
- "vercel" - 5 dəqiqədə daimi URL
- "netlify" - Drag & drop ilə