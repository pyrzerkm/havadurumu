# Hava Durumu Sistemi

Modern bir hava durumu uygulaması. Gerçek zamanlı meteoroloji verilerini harita üzerinde görüntüleyin, ölçüm verilerini analiz edin ve grafikler oluşturun.

## 🚀 Özellikler

- **Gerçek Zamanlı Harita**: İstasyonları harita üzerinde görüntüleyin
- **Ölçüm Verileri**: Sıcaklık, nem, rüzgar hızı ve basınç verileri
- **Grafik Analizi**: Günlük, haftalık ve aylık grafikler
- **WebSocket Desteği**: Anlık veri güncellemeleri
- **Kullanıcı Yönetimi**: Admin ve normal kullanıcı rolleri
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

## 🛠️ Teknolojiler

### Backend
- **Nest.js** - Node.js framework
- **MongoDB** - NoSQL veritabanı
- **WebSocket** - Gerçek zamanlı iletişim
- **JWT** - Kimlik doğrulama
- **Passport** - Authentication middleware

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Leaflet** - Harita entegrasyonu
- **Recharts** - Grafik kütüphanesi
- **Socket.io** - WebSocket client

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- MongoDB 4.4+
- npm veya yarn

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd hava-durumu-proje
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```

### 3. Frontend Kurulumu
```bash
cd ../frontend
npm install
```

### 4. Environment Ayarları
Frontend klasöründe `.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 Çalıştırma

### 1. MongoDB'yi Başlatın
```bash
mongod
```

### 2. Backend'i Başlatın
```bash
cd backend
npm run start:dev
```
Backend http://localhost:3001 adresinde çalışacak.

### 3. Frontend'i Başlatın
```bash
cd frontend
npm run dev
```
Frontend http://localhost:3000 adresinde çalışacak.

### 4. Örnek Veri Oluşturun
Backend çalıştıktan sonr
```

## 👤 Test Hesapları

### Admin Kullanıcısı
- **E-posta**: admin@weather.com
- **Şifre**: dan

### Normal Kullanıcı
- **E-posta**: user@weather.com
- **Şifre**: user123

## 📱 Kullanım

### Ana Sayfa - Harita
- İstasyonları harita üzerinde görüntüleyin
- Sıcaklık değerlerini renkli işaretçilerle görün
- İstasyonlara tıklayarak detaylı bilgi alın

### Ölçümler
- İstasyon seçin
- Son 30 ölçümü tablo formatında görüntüleyin
- Verileri tarih/saat sırasına göre inceleyin

### Grafikler
- İstasyon ve grafik türü seçin
- Zaman aralığını belirleyin (24h, 7d, 30d)
- Sıcaklık, nem, rüzgar hızı ve basınç grafiklerini görüntüleyin

### Admin Paneli
- Örnek veri oluşturun
- İstasyonları yönetin
- Sistem istatistiklerini görüntüleyin

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/profile` - Profil bilgileri

### Stations
- `GET /stations` - Tüm istasyonlar
- `GET /stations/:id` - İstasyon detayı
- `POST /stations` - Yeni istasyon (Admin)
- `PATCH /stations/:id` - İstasyon güncelle (Admin)
- `DELETE /stations/:id` - İstasyon sil (Admin)

### Measurements
- `GET /measurements` - Tüm ölçümler
- `GET /measurements/latest` - Son ölçümler
- `GET /measurements/station/:id` - İstasyon ölçümleri
- `GET /measurements/station/:id/range` - Tarih aralığı ölçümleri
- `POST /measurements` - Yeni ölçüm (Admin)

### WebSocket Events
- `join_station` - İstasyon dinlemeye başla
- `leave_station` - İstasyon dinlemeyi bırak
- `new_measurement` - Yeni ölçüm bildirimi
- `station_update` - İstasyon güncelleme bildirimi

## 📊 Veri Yapısı

### Station (İstasyon)
```typescript
{
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  country: string;
  isActive: boolean;
  description: string;
}
```

### Measurement (Ölçüm)
```typescript
{
  _id: string;
  stationId: string;
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  timestamp: Date;
  notes?: string;
}
```

### User (Kullanıcı)
```typescript
{
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
}
```

## 🎨 Özelleştirme

### Yeni İstasyon Ekleme
1. Admin paneline gidin
2. "Örnek Veri Oluştur" butonuna tıklayın
3. Veya API ile manuel olarak ekleyin

### Yeni Ölçüm Parametresi
1. `backend/src/measurements/schemas/measurement.schema.ts` dosyasını güncelleyin
2. Frontend bileşenlerini güncelleyin
3. Grafik bileşenlerini genişletin

## 🐛 Sorun Giderme

### MongoDB Bağlantı Hatası
- MongoDB'nin çalıştığından emin olun
- Bağlantı stringini kontrol edin

### WebSocket Bağlantı Hatası
- Backend'in çalıştığından emin olun
- CORS ayarlarını kontrol edin

### Frontend Build Hatası
- Node.js versiyonunu kontrol edin
- `npm install` komutunu tekrar çalıştırın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız için issue açabilirsiniz.
