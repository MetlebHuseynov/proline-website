# MSSQL Data Bazası Quraşdırılması

## Hazırki Vəziyyət
✅ MSSQL paketi quraşdırıldı
✅ Data bazası konfiqurasiyası əlavə edildi
✅ Cədvəl yaratma funksiyaları hazırlandı
✅ JSON-dan MSSQL-ə data köçürmə funksiyaları hazırlandı
⚠️ MSSQL Server quraşdırılmayıb və ya işləmir

## MSSQL Server Quraşdırılması

### 1. SQL Server Express 2022 Yükləyin

**Addım 1:** Aşağıdakı linkdən SQL Server Express 2022-ni yükləyin:
- https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- "Express" versiyasını seçin və "Download now" düyməsini basın

**Addım 2:** Yüklənən faylı işə salın və quraşdırma prosesini başladın:
- "Basic" quraşdırma növünü seçin
- Lisenziya şərtlərini qəbul edin
- Quraşdırma yerini seçin (default olaraq buraxın)

**Addım 3:** Quraşdırma tamamlandıqdan sonra:
- "Install SSMS" (SQL Server Management Studio) düyməsini basın (isteğe bağlı)
- Və ya "Connect Now" düyməsini basın

### 2. SQL Server Authentication Konfiqurasiyası

**SQL Server Management Studio ilə:**
1. SSMS-i açın və server adı olaraq `localhost\SQLEXPRESS` yazın
2. Windows Authentication ilə bağlanın
3. Server adına sağ klik edin → Properties
4. Security səhifəsinə keçin
5. "SQL Server and Windows Authentication mode" seçin
6. OK düyməsini basın və serveri yenidən başladın

**SA istifadəçisini aktiv edin:**
1. Security → Logins → sa
2. Sağ klik → Properties
3. General səhifəsində güclü şifrə təyin edin
4. Status səhifəsində "Enabled" seçin

### 3. TCP/IP Protokolunu Aktiv Edin

1. **SQL Server Configuration Manager**-i açın:
   - Start menyusunda "SQL Server Configuration Manager" axtarın
   
2. **Network Configuration**:
   - "SQL Server Network Configuration" → "Protocols for SQLEXPRESS"
   - TCP/IP-yə sağ klik edin → Enable
   
3. **Port Konfiqurasiyası**:
   - TCP/IP-yə sağ klik → Properties
   - IP Addresses səhifəsinə keçin
   - IPAll bölməsində TCP Port: 1433 yazın
   - OK düyməsini basın
   
4. **SQL Server Service-ni yenidən başladın**:
   - "SQL Server Services" → "SQL Server (SQLEXPRESS)"
   - Sağ klik → Restart

### 4. .env Faylını Yeniləyin

Quraşdırma tamamlandıqdan sonra .env faylında şifrəni dəyişdirin:
```
DB_SERVER=localhost\\SQLEXPRESS
DB_NAME=OldBridgeDB
DB_USER=sa
DB_PASSWORD=sizin_guclu_sifreniz_buraya
```

### 4. SQL Server Management Studio (İstəyə görə)
- SSMS yükləyin: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
- Data bazasını vizual olaraq idarə edin

## Avtomatik Funksiyalar

Server başladıqda avtomatik olaraq:
1. MSSQL-ə bağlanmağa çalışır
2. Cədvəlləri yaradır (Categories, Brands, Products, Users)
3. JSON fayllarındakı dataları MSSQL-ə köçürür
4. Əgər MSSQL əlçatan deyilsə, JSON fayllardan istifadə edir

## Test Etmək

MSSSQL quraşdırıldıqdan sonra serveri yenidən başladın:
```bash
node server.js
```

Uğurlu bağlantı mesajı görməlisiniz:
```
MSSSQL data bazasına uğurla bağlandı
Data bazası cədvəlləri uğurla yaradıldı
Kateqoriyalar MSSQL-ə köçürüldü
Brendlər MSSQL-ə köçürüldü
Məhsullar MSSQL-ə köçürüldü
İstifadəçilər MSSQL-ə köçürüldü
```