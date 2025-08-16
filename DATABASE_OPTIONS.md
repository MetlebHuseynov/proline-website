# Data Bazası Seçimləri və Konfiqurasiya

## Mövcud Data Bazası Variantları

### 1. 🗂️ JSON Fayllar (Hazırda aktiv)
**Xüsusiyyətlər:**
- ✅ Sadə və sürətli quraşdırma
- ✅ Xarici asılılıq yoxdur
- ✅ Kiçik layihələr üçün ideal
- ❌ Böyük data üçün yavaş
- ❌ Concurrent əməliyyatlar üçün məhdud

**Konfiqurasiya:** Hazırda aktiv, əlavə konfiqurasiya tələb olunmur.

---

### 2. 🏢 Microsoft SQL Server (MSSQL)
**Xüsusiyyətlər:**
- ✅ Yüksək performans
- ✅ Enterprise səviyyəli xüsusiyyətlər
- ✅ Windows mühiti ilə yaxşı inteqrasiya
- ❌ Quraşdırma tələb edir
- ❌ Lisenziya məhdudiyyətləri (Express pulsuz)

**Quraşdırma:**
```bash
# Artıq quraşdırılıb, yalnız SQL Server Express lazımdır
# MSSQL_SETUP.md faylına baxın
```

---

### 3. 🐘 PostgreSQL
**Xüsusiyyətlər:**
- ✅ Açıq mənbə və pulsuz
- ✅ Güclü SQL dəstəyi
- ✅ JSON dəstəyi
- ✅ Cross-platform
- ❌ Quraşdırma tələb edir

**Quraşdırma:**
```bash
npm install pg
# PostgreSQL server quraşdırın
```

**Konfiqurasiya (.env):**
```
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oldbridge
DB_USER=postgres
DB_PASSWORD=your_password
```

---

### 4. 🍃 MongoDB
**Xüsusiyyətlər:**
- ✅ NoSQL, JSON-native
- ✅ Sürətli development
- ✅ Horizontal scaling
- ✅ Cloud dəstəyi (MongoDB Atlas)
- ❌ SQL bilgisi tələb etmir

**Quraşdırma:**
```bash
npm install mongoose
# MongoDB server quraşdırın və ya MongoDB Atlas istifadə edin
```

**Konfiqurasiya (.env):**
```
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/oldbridge
# və ya MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/oldbridge
```

---

### 5. 🪶 SQLite
**Xüsusiyyətlər:**
- ✅ Serverless, fayl əsaslı
- ✅ Sıfır konfiqurasiya
- ✅ Kiçik və sürətli
- ✅ Portativ
- ❌ Concurrent yazma məhdud

**Quraşdırma:**
```bash
npm install sqlite3
```

**Konfiqurasiya (.env):**
```
DB_TYPE=sqlite
DB_PATH=./data/database.sqlite
```

---

### 6. 🔥 Firebase Firestore
**Xüsusiyyətlər:**
- ✅ Real-time updates
- ✅ Cloud-native
- ✅ Automatic scaling
- ✅ Offline support
- ❌ Google Cloud asılılığı
- ❌ Pricing model

**Quraşdırma:**
```bash
npm install firebase-admin
```

---

### 7. ☁️ Supabase (PostgreSQL + API)
**Xüsusiyyətlər:**
- ✅ PostgreSQL + REST API
- ✅ Real-time subscriptions
- ✅ Built-in authentication
- ✅ Dashboard interface
- ❌ Internet bağlantısı tələb edir

**Quraşdırma:**
```bash
npm install @supabase/supabase-js
```

---

## Tövsiyələr

### Kiçik Layihələr üçün:
1. **JSON fayllar** (hazırda aktiv)
2. **SQLite**

### Orta Layihələr üçün:
1. **PostgreSQL**
2. **MSSQL Express**

### Böyük/Enterprise Layihələr üçün:
1. **MSSQL**
2. **PostgreSQL**
3. **MongoDB**

### Cloud/SaaS üçün:
1. **Supabase**
2. **Firebase**
3. **MongoDB Atlas**

---

## Hazırda Dəstəklənən

✅ **JSON Files** - Aktiv
✅ **MSSQL** - Kod hazır, server quraşdırılmalı

## Əlavə Edilə Bilər

İstədiyiniz data bazası növünü bildirin və mən həmin konfiqurasiyaları əlavə edəcəyəm:
- PostgreSQL
- MongoDB
- SQLite
- Firebase
- Supabase

---

## Seçim Etmək üçün

Hansi data bazasını istifadə etmək istədiyinizi bildirin və mən həmin konfiqurasiyaları layihəyə əlavə edəcəyəm.