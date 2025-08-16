# GitHub Repository Setup və Deployment Təlimatları

## 1. GitHub Repository-ni Hazırlamaq

### Addım 1: Local Git Repository Yaratmaq
```bash
# Terminal-da proyekt qovluğunda
git init
git add .
git commit -m "İlk commit: Proyekt faylları əlavə edildi"
```

### Addım 2: GitHub Repository ilə Əlaqə Qurmaq
```bash
# GitHub repository URL-ni əlavə edin
git remote add origin https://github.com/SIZIN_USERNAME/SIZIN_REPO_ADI.git

# Main branch yaradın və push edin
git branch -M main
git push -u origin main
```

## 2. Environment Variables Konfiqurasiyası

### GitHub Secrets Əlavə Etmək
1. GitHub repository-də **Settings** > **Secrets and variables** > **Actions**
2. Aşağıdakı secrets əlavə edin:

#### Hostinger üçün:
```
HOSTINGER_FTP_SERVER=your-domain.com
HOSTINGER_FTP_USERNAME=your-username
HOSTINGER_FTP_PASSWORD=your-password
```

#### Firebase üçün:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

#### Database üçün:
```
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
JWT_SECRET=your-jwt-secret
```

## 3. Avtomatik Deployment Seçimləri

### Seçim 1: Vercel Deployment (Tövsiyə edilən)

#### Addım 1: Vercel hesabı yaradın
1. [vercel.com](https://vercel.com) saytına daxil olun
2. GitHub hesabınızla qeydiyyatdan keçin

#### Addım 2: Repository import edin
1. Vercel dashboard-da **"New Project"** düyməsinə basın
2. GitHub repository-nizi seçin
3. **Deploy** düyməsinə basın

#### Addım 3: Environment Variables əlavə edin
1. Vercel project settings-də **Environment Variables** bölümünə keçin
2. Aşağıdakı dəyişənləri əlavə edin:
```
NODE_ENV=production
JWT_SECRET=your-jwt-secret
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

### Seçim 2: Firebase Hosting

#### Addım 1: Firebase CLI quraşdırın
```bash
npm install -g firebase-tools
firebase login
```

#### Addım 2: Firebase proyekti yaradın
```bash
firebase init hosting
# Public directory: public
# Single-page app: No
# Automatic builds: Yes
```

#### Addım 3: Deploy edin
```bash
firebase deploy
```

### Seçim 3: GitHub Actions + Hostinger

#### Addım 1: FTP məlumatlarını yoxlayın
Hostinger Control Panel-da:
1. **File Manager** > **FTP Accounts**
2. FTP məlumatlarını kopyalayın

#### Addım 2: GitHub Secrets əlavə edin
```
HOSTINGER_FTP_SERVER=ftp.your-domain.com
HOSTINGER_FTP_USERNAME=your-ftp-username
HOSTINGER_FTP_PASSWORD=your-ftp-password
```

#### Addım 3: Deployment test edin
```bash
git add .
git commit -m "Deployment test"
git push origin main
```

## 4. Real-time Updates Konfiqurasiyası

### Firebase Real-time Database

#### Addım 1: Firebase proyekti yaradın
1. [console.firebase.google.com](https://console.firebase.google.com)
2. **Create a project** düyməsinə basın
3. Proyekt adını daxil edin

#### Addım 2: Firestore Database yaradın
1. **Firestore Database** > **Create database**
2. **Start in test mode** seçin
3. Location seçin (europe-west1 tövsiyə edilir)

#### Addım 3: Web app əlavə edin
1. **Project settings** > **General**
2. **Add app** > **Web**
3. App adını daxil edin
4. Firebase config məlumatlarını kopyalayın

#### Addım 4: Firebase config yeniləyin
`public/js/firebase-config.js` faylında:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 5. Domain və SSL Konfiqurasiyası

### Vercel üçün:
1. **Settings** > **Domains**
2. Custom domain əlavə edin
3. DNS records yeniləyin

### Hostinger üçün:
1. **Domains** > **DNS Zone Editor**
2. A record əlavə edin
3. SSL sertifikatını aktivləşdirin

### Firebase üçün:
1. **Hosting** > **Add custom domain**
2. Domain verification
3. DNS records konfiqurasiyası

## 6. Monitoring və Analytics

### Google Analytics əlavə etmək
```html
<!-- public/index.html head bölümünə əlavə edin -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Monitoring (Sentry)
```bash
npm install @sentry/browser
```

```javascript
// public/js/main.js-ə əlavə edin
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
});
```

## 7. Performance Optimization

### Image Optimization
```html
<!-- Lazy loading əlavə edin -->
<img src="image.jpg" loading="lazy" alt="Description">
```

### CSS/JS Minification
```bash
# Build script əlavə edin
npm install --save-dev terser clean-css-cli
```

`package.json`-a əlavə edin:
```json
{
  "scripts": {
    "build": "terser public/js/*.js -o public/js/bundle.min.js && cleancss public/css/*.css -o public/css/bundle.min.css"
  }
}
```

## 8. Backup və Recovery

### Avtomatik Backup
```bash
# GitHub Actions ilə həftəlik backup
name: Weekly Backup
on:
  schedule:
    - cron: '0 0 * * 0'
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Create backup
        run: |
          tar -czf backup-$(date +%Y%m%d).tar.gz .
          # Upload to cloud storage
```

## 9. Testing və Quality Assurance

### Automated Testing
```bash
npm install --save-dev jest puppeteer
```

### Lighthouse CI
```bash
npm install --save-dev @lhci/cli
```

## 10. Troubleshooting

### Ümumi Problemlər:

1. **Build uğursuzluğu**
   - `package.json` dependencies yoxlayın
   - Node.js versiyasını yoxlayın

2. **Environment variables işləmir**
   - GitHub Secrets düzgün əlavə edilib?
   - Variable adları düzgündür?

3. **Database əlaqə problemi**
   - Database credentials düzgündür?
   - Firewall settings yoxlayın

4. **SSL sertifikat problemi**
   - DNS propagation gözləyin (24-48 saat)
   - Domain verification yoxlayın

### Kömək üçün:
- GitHub Issues yaradın
- Vercel Support ilə əlaqə saxlayın
- Firebase Documentation oxuyun

## Növbəti Addımlar

1. ✅ GitHub repository yaradıldı
2. 🔄 Deployment seçimi edin
3. 🔄 Environment variables konfiqurasiya edin
4. 🔄 Domain və SSL quraşdırın
5. 🔄 Monitoring əlavə edin
6. 🔄 Performance optimize edin

**Tövsiyə**: Vercel + Firebase kombinasiyası ən sürətli və etibarlı həlldir.