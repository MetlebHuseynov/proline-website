# 🚀 GitHub App Son Quraşdırma Təlimatı

## 📋 Hazır olan fayllar:
- ✅ `webhook-handler.js` - Webhook işləyicisi
- ✅ `server.js` - Webhook endpoint-ləri əlavə edilib
- ✅ `.env` - Environment variables konfiqurasiya edilib
- ✅ `package.json` - Lazımi paketlər quraşdırılıb
- ✅ `setup-github-app.js` - Avtomatik quraşdırma skripti

## 🔑 GitHub App yaratmaq üçün addımlar:

### 1. GitHub Developer Settings-ə gedin
```
https://github.com/settings/apps
```

### 2. "New GitHub App" düyməsinə basın

### 3. App məlumatlarını doldurun:
- **GitHub App name**: `ProlineGe-Deployment`
- **Description**: `Avtomatik deployment və CI/CD sistemi ProlineGe layihəsi üçün`
- **Homepage URL**: `https://github.com/MetlebHuseynov/ProlineGe`
- **Webhook URL**: `https://your-domain.com/webhook` (Hostinger domain-inizi yazın)
- **Webhook secret**: `Iv23liw7hNvMUncWiNXq`

### 4. İcazələri təyin edin:
**Repository permissions:**
- Contents: Read & Write
- Metadata: Read
- Pull requests: Read & Write
- Issues: Read & Write
- Actions: Read & Write

**Account permissions:**
- Email addresses: Read

### 5. Event-lərə abunə olun:
- [x] Push
- [x] Pull request
- [x] Issues
- [x] Release

### 6. "Create GitHub App" düyməsinə basın

## 🔐 Private Key əldə etmək:

### 1. Yaradılan app səhifəsində "Generate a private key" düyməsinə basın
### 2. Yüklənən `.pem` faylını layihə qovluğuna kopyalayın
### 3. Faylı `private-key.pem` adı ilə saxlayın

## 📱 App-i Repository-yə quraşdırmaq:

### 1. App səhifəsində "Install App" düyməsinə basın
### 2. "MetlebHuseynov/ProlineGe" repository-ni seçin
### 3. "Install" düyməsinə basın

## ⚙️ Son konfiqurasiya:

### 1. App ID-ni əldə edin:
- GitHub App səhifəsində "App ID" rəqəmini kopyalayın
- `.env` faylında `GITHUB_APP_ID=1791092` sətirini yeni ID ilə əvəz edin

### 2. Installation ID əldə etmək üçün skripti işə salın:
```bash
node get-installation-id.js
```

### 3. Və ya avtomatik quraşdırma skriptini işə salın:
```bash
node setup-github-app.js
```

## 🧪 Test etmək:

### 1. Server-i işə salın:
```bash
npm start
```

### 2. Repository-də test commit edin:
```bash
git add .
git commit -m "Test GitHub App webhook"
git push
```

### 3. Webhook-ların işlədiyini yoxlayın:
- GitHub App səhifəsində "Advanced" > "Recent Deliveries" bölməsinə baxın
- Server console-da webhook mesajlarını izləyin

## 🔗 Faydalı linklər:
- **GitHub Apps**: https://github.com/settings/apps
- **Repository**: https://github.com/MetlebHuseynov/ProlineGe
- **Webhook Testing**: https://smee.io (local test üçün)

## 📁 Yaradılan fayllar:
```
├── webhook-handler.js          # Webhook işləyicisi
├── server.js                   # Webhook endpoint-ləri
├── .env                        # Environment variables
├── private-key.pem             # GitHub App private key (siz əlavə edəcəksiniz)
├── setup-github-app.js         # Avtomatik quraşdırma
├── get-installation-id.js      # Installation ID skripti
├── GITHUB_APP_SETUP.md         # Ətraflı təlimat
└── GITHUB_INSTALLATION_GUIDE.md # Installation təlimatı
```

## 🎯 Nəticə:
Bu quraşdırmadan sonra:
- Hər `git push` zamanı avtomatik deployment işə düşəcək
- Pull request-lər avtomatik test ediləcək
- Issue-lar avtomatik idarə ediləcək
- Real-time webhook event-ləri alınacaq

---

**Qeyd**: Həqiqi GitHub App yaratdıqdan sonra `.env` faylındakı `GITHUB_APP_ID` və `private-key.pem` faylını yeniləməyi unutmayın!