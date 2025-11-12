# Yeni Özellikler / New Features

## 🔐 Kullanıcı Girişi ve Rol Yönetimi

### Özellikler
- **İki Kullanıcı Rolü:**
  - **Garson:** Sipariş alma, masa yönetimi, mutfak görüntüleme
  - **Yönetici:** Tüm yetkiler + Raporlama, stok yönetimi, kullanıcı yönetimi

### Varsayılan Kullanıcılar
```
Yönetici:
  Kullanıcı Adı: yonetici
  Şifre: admin123

Garsonlar:
  garson1 / garson123 (Ahmet Yılmaz)
  garson2 / garson123 (Ayşe Demir)
  garson3 / garson123 (Mehmet Kaya)
```

### API Endpoints

#### Giriş Yapma
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "yonetici",
  "password": "admin123"
}

# Response
{
  "success": true,
  "data": {
    "token": "session_xxx",
    "user": {
      "id": "user_xxx",
      "username": "yonetici",
      "fullName": "Yönetici",
      "role": "yönetici"
    },
    "expiresIn": 28800
  }
}
```

#### Mevcut Kullanıcı Bilgisi
```bash
GET /api/auth/me
Authorization: Bearer {token}
```

#### Çıkış Yapma
```bash
POST /api/auth/logout
Authorization: Bearer {token}
```

### Yetki Kontrolü

**Garson Erişebilir:**
- Menu okuma
- Sipariş oluşturma ve görüntüleme
- Mutfak durumu görüntüleme
- Masa yönetimi

**Sadece Yönetici Erişebilir:**
- Raporlama ve Analiz
- Stok yönetimi
- Envanter işlemleri
- Kullanıcı yönetimi

---

## 🪑 Masa Yönetimi (Table Management)

### Özellikler
- **26 Masa:**
  - Main (Ana Salon): 15 masa
  - Outdoor (Bahçe): 8 masa
  - VIP: 3 masa
- **Masa Durumları:**
  - `available` - Müsait
  - `occupied` - Dolu
  - `reserved` - Rezerve
  - `cleaning` - Temizleniyor

### API Endpoints

#### Tüm Masaları Getir
```bash
GET /api/tables
Authorization: Bearer {token}
```

#### Masa Düzeni (Bölümlere Göre)
```bash
GET /api/tables/layout
Authorization: Bearer {token}

# Response
{
  "success": true,
  "data": {
    "main": [ /* 15 masa */ ],
    "outdoor": [ /* 8 masa */ ],
    "vip": [ /* 3 masa */ ]
  }
}
```

#### Müsait Masalar
```bash
GET /api/tables/available
Authorization: Bearer {token}
```

#### Masayı Doldur (Sipariş Başlat)
```bash
POST /api/tables/{tableId}/occupy
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "ord_xxx"
}
```

#### Masayı Boşalt (Temizlik Başlat)
```bash
POST /api/tables/{tableId}/free
Authorization: Bearer {token}
```

#### Masayı Temizle (Müsait Yap)
```bash
POST /api/tables/{tableId}/clean
Authorization: Bearer {token}
```

#### Masa İstatistikleri
```bash
GET /api/tables/stats
Authorization: Bearer {token}

# Response
{
  "success": true,
  "data": {
    "total": 26,
    "available": 15,
    "occupied": 8,
    "reserved": 2,
    "cleaning": 1,
    "occupancyRate": "42.3%",
    "bySection": {
      "main": { "total": 15, "available": 8, ... },
      "outdoor": { "total": 8, "available": 5, ... },
      "vip": { "total": 3, "available": 2, ... }
    }
  }
}
```

#### Garson Masalarım
```bash
GET /api/tables/my-tables
Authorization: Bearer {token}
```

---

## 🖨️ Sunlux RP8020 Termal Yazıcı Entegrasyonu

### Özellikler
- **Termal Yazıcı:** Sunlux RP8020 için özel formatlanmış fişler
- **ESC/POS Komutları:** Kalın yazı, büyük font, buzzer desteği
- **Otomatik Yazdırma:**
  - Sipariş oluşturulduğunda mutfak fişi otomatik yazdırılır
  - Sipariş tamamlandığında müşteri fişi otomatik yazdırılır
- **Türkçe Karakter Desteği:** UTF-8 encoding
- **80mm Kağıt:** Standart termal kağıt boyutu

### Fiş Formatları

#### Mutfak Fişi
```
*** MUTFAK ***
=======================================
SİPARİŞ: 20241112001
Saat: 14:35:22
MASA: 5
Tip: Salonda
Garson: Ahmet Yılmaz
=======================================

2x Izgara Somon
   >> SARIMSAKSIZ <<

1x Sezar Salata

=======================================
ÖZEL TALİMAT:
MÜŞTERİ ACI YİYEMİYOR
=======================================
```

#### Müşteri Fişi
```
        RESTAURANT POS
    Adres: İstanbul Cad. No:123
     Tel: (0212) 555 12 34
=======================================

SİPARİŞ NO: 20241112001
Tarih: 12/11/2024 14:35
MASA: 5
Garson: Ahmet Yılmaz
Sipariş Türü: Salonda

---------------------------------------
ÜRÜN              ADET   FİYAT   TUTAR
---------------------------------------
Izgara Somon         2   24.99   49.98
Sezar Salata         1    8.99    8.99
---------------------------------------

                    Ara Toplam: 58.97
                    KDV (%10):   5.90
---------------------------------------
                   TOPLAM: 64.87 TL

=======================================
         AFİYET OLSUN!
    BİZİ TERCİH ETTİĞİNİZ İÇİN
        TEŞEKKÜR EDERİZ
=======================================
```

### API Endpoints

#### Sipariş Fişi Yazdır (Müşteri)
```bash
POST /api/hardware/sunlux/print-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderNumber": "20241112001",
  "tableNumber": "5",
  "waiterName": "Ahmet Yılmaz",
  "orderType": "dine-in",
  "items": [
    {
      "name": "Izgara Somon",
      "quantity": 2,
      "price": 24.99
    }
  ],
  "specialInstructions": "Müşteri acı yiyemiyor"
}
```

#### Mutfak Fişi Yazdır
```bash
POST /api/hardware/sunlux/print-kitchen
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderNumber": "20241112001",
  "tableNumber": "5",
  "waiterName": "Ahmet Yılmaz",
  "items": [
    {
      "name": "Izgara Somon",
      "quantity": 2,
      "modifications": ["Sarımsaklı sos yok"]
    }
  ],
  "specialInstructions": "Müşteri acı yiyemiyor"
}
```

#### Test Yazdırma
```bash
POST /api/hardware/sunlux/test-print
Authorization: Bearer {token}
```

### Otomatik Yazdırma

Sipariş oluştururken otomatik olarak mutfak fişi yazdırılır:

```bash
POST /api/kitchen/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "name": "Izgara Somon",
      "quantity": 2,
      "price": 24.99,
      "modifications": ["Sarımsaklı sos yok"]
    }
  ],
  "orderType": "dine-in",
  "tableNumber": "5",
  "specialInstructions": "Müşteri acı yiyemiyor"
}

# Otomatik olarak mutfak fişi yazdırılır
```

Sipariş tamamlanırken otomatik olarak müşteri fişi yazdırılır:

```bash
POST /api/kitchen/orders/{orderId}/complete
Authorization: Bearer {token}

# Otomatik olarak müşteri fişi yazdırılır
```

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Garson Sipariş Alıyor

```bash
# 1. Giriş yap
POST /api/auth/login
{ "username": "garson1", "password": "garson123" }

# 2. Müsait masaları görüntüle
GET /api/tables/available

# 3. Masayı rezerve et
POST /api/tables/{tableId}/reserve

# 4. Menüyü görüntüle
GET /api/menu

# 5. Sipariş oluştur (otomatik mutfak fişi yazdırılır)
POST /api/kitchen/orders
{
  "items": [...],
  "tableNumber": "5",
  "orderType": "dine-in"
}

# 6. Masayı doldur
POST /api/tables/{tableId}/occupy
{ "orderId": "ord_xxx" }
```

### Senaryo 2: Mutfak Sipariş Hazırlıyor

```bash
# 1. Mutfak ekranı görüntüle
GET /api/kitchen/display

# 2. Sipariş hazırlamaya başla
POST /api/kitchen/orders/{orderId}/start

# 3. Sipariş hazır
POST /api/kitchen/orders/{orderId}/ready
```

### Senaryo 3: Sipariş Tamamlama

```bash
# 1. Siparişi tamamla (otomatik müşteri fişi yazdırılır)
POST /api/kitchen/orders/{orderId}/complete

# 2. Masayı boşalt
POST /api/tables/{tableId}/free

# 3. Masayı temizle
POST /api/tables/{tableId}/clean
```

### Senaryo 4: Yönetici Raporları İnceler

```bash
# 1. Yönetici girişi
POST /api/auth/login
{ "username": "yonetici", "password": "admin123" }

# 2. Günlük özet
GET /api/reports/daily-summary

# 3. Satış raporu
GET /api/reports/sales?period=weekly

# 4. Stok durumu
GET /api/inventory

# 5. Stok uyarıları
GET /api/inventory/alerts
```

---

## 💻 Frontend Uygulamaları

### Login (Giriş Sayfası)
- **URL:** `http://localhost:3000/login`
- **Özellikler:**
  - Kullanıcı adı ve şifre ile giriş
  - Rol bazlı yönlendirme
  - Demo hesap bilgileri
  - Responsive tasarım

### Digital Menu (Dijital Menü)
- **URL:** `http://localhost:3000/menu`
- **Erişim:** Herkese açık
- **Özellikler:**
  - Kategorilere göre menü gösterimi
  - QR kod ile erişim
  - Offline çalışma desteği

### Waiter Interface (Garson Arayüzü)
- **URL:** `http://localhost:3000/waiter`
- **Erişim:** Sadece garsonlar
- **Özellikler:**
  - Masa yönetimi
  - Sipariş alma
  - Mutfak durumu görüntüleme

### Admin Console (Yönetici Paneli)
- **URL:** `http://localhost:3000/admin`
- **Erişim:** Sadece yöneticiler
- **Özellikler:**
  - Raporlama ve analiz
  - Stok yönetimi
  - Kullanıcı yönetimi
  - Sistem ayarları

---

## 🔧 Teknik Detaylar

### Authentication (Kimlik Doğrulama)
- **Yöntem:** Session token tabanlı
- **Token Süresi:** 8 saat
- **Storage:** localStorage
- **Header Format:** `Authorization: Bearer {token}`

### Permission System (Yetki Sistemi)
```javascript
// Garson yetkileri
'menu:read',
'orders:create',
'orders:read',
'kitchen:read',
'tables:read',
'tables:update'

// Yönetici yetkileri
'menu:write',
'inventory:read',
'inventory:write',
'reports:read',
'reports:write',
'users:read',
'users:write'
+ Tüm garson yetkileri
```

### Database Structure (Veri Yapısı)

#### User Model
```javascript
{
  id: 'user_xxx',
  username: 'garson1',
  password: 'garson123', // Production'da hashed olmalı
  fullName: 'Ahmet Yılmaz',
  role: 'garson', // 'garson' veya 'yönetici'
  active: true,
  createdAt: Date,
  lastLogin: Date
}
```

#### Table Model
```javascript
{
  id: 'table_xxx',
  tableNumber: 5,
  capacity: 4,
  status: 'available', // available, occupied, reserved, cleaning
  currentOrder: 'ord_xxx',
  assignedWaiter: 'user_xxx',
  section: 'main', // main, outdoor, vip
  lastUpdated: Date,
  createdAt: Date
}
```

---

## 📝 Migration Guide

### Mevcut Sistemden Yeni Sisteme Geçiş

1. **Kullanıcıları Oluştur:**
```bash
# Yönetici ile giriş yap
POST /api/auth/login
{ "username": "yonetici", "password": "admin123" }

# Yeni kullanıcı ekle
POST /api/auth/users
Authorization: Bearer {token}
{
  "username": "garson4",
  "password": "garson123",
  "fullName": "Fatma Kaya",
  "role": "garson"
}
```

2. **Masaları Düzenle (gerekirse):**
```bash
PUT /api/tables/{tableId}
{
  "capacity": 6,
  "section": "vip"
}
```

3. **Sunlux Yazıcı Testi:**
```bash
POST /api/hardware/sunlux/test-print
Authorization: Bearer {token}
```

---

## 🚀 Başlangıç

```bash
cd restaurant-pos
npm install
npm start

# Tarayıcıda aç:
http://localhost:3000/login

# Demo hesaplardan biriyle giriş yap
```

---

## 📞 Destek

Sorunlar için GitHub Issues kullanın veya sistem yöneticisine başvurun.
