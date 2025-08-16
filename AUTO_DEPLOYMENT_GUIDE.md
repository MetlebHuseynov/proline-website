# Avtomatik Deployment və Real-Time Yeniləmə Təlimatları

## 🚀 Avtomatik Deployment Variantları

### 1. GitHub Actions + Hostinger (FTP)

#### Qurulum:
1. **GitHub Repository yaradın:**
   ```bash
   git init
   git add .
   git commit -m "İlk commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```

2. **GitHub Secrets əlavə edin:**
   - Repository Settings > Secrets and variables > Actions
   - Aşağıdakı secrets əlavə edin:
     - `FTP_SERVER`: Hostinger FTP server ünvanı
     - `FTP_USERNAME`: FTP istifadəçi adı
     - `FTP_PASSWORD`: FTP şifrəsi

3. **Avtomatik deployment:**
   - Hər commit-dən sonra avtomatik olaraq Hostinger-ə yüklənir
   - `.github/workflows/deploy.yml` faylı artıq hazırdır

#### İstifadə:
```bash
# Dəyişiklik edin
git add .
git commit -m "Yeni dəyişikliklər"
git push origin main
# 2-3 dəqiqə sonra saytda görünəcək
```

---

### 2. Vercel Deployment (Tövsiyə edilir)

#### Qurulum:
1. **Vercel hesabı yaradın:** https://vercel.com
2. **GitHub repository-ni Vercel-ə bağlayın**
3. **Environment variables əlavə edin:**
   - Vercel Dashboard > Project Settings > Environment Variables
   - `.env.example` faylındakı dəyişənləri əlavə edin

#### Üstünlükləri:
- ✅ **Dərhal yeniləmə** (30 saniyə)
- ✅ Pulsuz SSL sertifikatı
- ✅ Global CDN
- ✅ Avtomatik HTTPS
- ✅ Preview URL-lər

#### İstifadə:
```bash
# Dəyişiklik edin
git add .
git commit -m "Yeni dəyişikliklər"
git push origin main
# 30 saniyə sonra saytda görünəcək
```

---

### 3. Firebase Hosting + Firestore

#### Qurulum:
1. **Firebase CLI quraşdırın:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Firebase konfiqurasiyası:**
   - `firebase.json` faylı artıq hazırdır
   - `firestore.rules` və `firestore.indexes.json` faylları hazırdır

3. **Firebase Console-da layihə yaradın:**
   - https://console.firebase.google.com
   - Firestore Database aktivləşdirin
   - Authentication quraşdırın

4. **Firebase konfiqurasiyasını yeniləyin:**
   - `public/js/firebase-config.js` faylında API açarlarını dəyişin

#### Deployment:
```bash
firebase deploy
```

#### Üstünlükləri:
- ✅ **Real-time database** yeniləmələri
- ✅ Offline dəstəyi
- ✅ Avtomatik sinxronlaşma
- ✅ Pulsuz SSL və CDN

---

## 🔄 Real-Time Yeniləmə Konfiqurasiyası

### Firebase Real-Time Updates

1. **HTML fayllarına Firebase SDK əlavə edin:**
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js"></script>
   
   <!-- Firebase konfiqurasiyası -->
   <script src="js/firebase-config.js"></script>
   ```

2. **Real-time dinləyicilər:**
   - Məhsullar avtomatik yenilənir
   - Brendlər avtomatik yenilənir
   - Kateqoriyalar avtomatik yenilənir
   - Admin panelindən dəyişikliklər dərhal əks olunur

### WebSocket Alternativ

Əgər Firebase istifadə etmək istəmirsinizsə:

```javascript
// WebSocket əlaqəsi
const ws = new WebSocket('wss://your-domain.com/ws');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'product_update') {
        // Məhsulları yenilə
        loadProducts();
    }
};
```

---

## 📋 Tövsiyə olunan İş Axını

### Ən Yaxşı Variant: Vercel + Firebase

1. **Frontend:** Vercel-də host edilir
2. **Database:** Firebase Firestore
3. **Real-time:** Firebase real-time listeners
4. **Deployment:** GitHub push → Vercel avtomatik deployment

#### Qurulum addımları:

1. **GitHub repository yaradın**
2. **Vercel-ə bağlayın**
3. **Firebase layihəsi yaradın**
4. **Firebase konfiqurasiyasını yeniləyin**
5. **İlk deployment edin**

```bash
# Lokal test
npm start

# Production deployment
git add .
git commit -m "Production ready"
git push origin main
```

#### Nəticə:
- ✅ **30 saniyə** deployment vaxtı
- ✅ **Real-time** verilənlər yeniləmələri
- ✅ **Pulsuz** hosting və database
- ✅ **SSL** və **CDN** daxil
- ✅ **Offline** dəstəyi

---

## 🛠️ Troubleshooting

### GitHub Actions Problemləri:
- FTP məlumatlarını yoxlayın
- Secrets düzgün əlavə edilib?
- Workflow faylı düzgün formatdadır?

### Vercel Problemləri:
- Environment variables əlavə edilib?
- Build komandası düzgündür?
- Domain konfiqurasiyası düzgündür?

### Firebase Problemləri:
- API açarları düzgündür?
- Firestore rules konfiqurasiya edilib?
- Authentication quraşdırılıb?

---

## 📞 Dəstək

**GitHub Actions:** https://docs.github.com/en/actions
**Vercel:** https://vercel.com/docs
**Firebase:** https://firebase.google.com/docs

**Sürətli başlama üçün Vercel + Firebase kombinasiyasını tövsiyə edirik!**