import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Station, StationDocument } from '../stations/schemas/station.schema';
import { Measurement, MeasurementDocument } from '../measurements/schemas/measurement.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Station.name) private stationModel: Model<StationDocument>,
    @InjectModel(Measurement.name) private measurementModel: Model<MeasurementDocument>,
  ) {}

  async seed() {
    // Veritabanını temizle
    await this.userModel.deleteMany({});
    await this.stationModel.deleteMany({});
    await this.measurementModel.deleteMany({});

    // Admin kullanıcısı oluştur
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await this.userModel.create({
      email: 'admin@weather.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    });

    // Normal kullanıcılar oluştur
    const userPassword = await bcrypt.hash('user123', 10);
    const users = await this.userModel.create([
      {
        email: 'user@weather.com',
        password: userPassword,
        name: 'Test User',
        role: 'user',
      },
      {
        email: 'meteorolog@weather.com',
        password: userPassword,
        name: 'Meteorolog Ahmet',
        role: 'user',
      },
      {
        email: 'analist@weather.com',
        password: userPassword,
        name: 'Veri Analisti Zeynep',
        role: 'user',
      },
      {
        email: 'teknisyen@weather.com',
        password: userPassword,
        name: 'Teknisyen Mehmet',
        role: 'user',
      },
    ]);

    // İstasyonlar oluştur (20 dünya merkezi)
    const stations = await this.stationModel.create([
      {
        name: 'New York Central',
        location: { latitude: 40.7128, longitude: -74.0060 },
        city: 'New York',
        country: 'USA',
        description: 'New York merkez hava durumu istasyonu',
      },
      {
        name: 'London Heathrow',
        location: { latitude: 51.4700, longitude: -0.4543 },
        city: 'London',
        country: 'UK',
        description: 'Londra merkez hava durumu istasyonu',
      },
      {
        name: 'Tokyo Central',
        location: { latitude: 35.6762, longitude: 139.6503 },
        city: 'Tokyo',
        country: 'Japan',
        description: 'Tokyo merkez hava durumu istasyonu',
      },
      {
        name: 'Paris Charles de Gaulle',
        location: { latitude: 48.8566, longitude: 2.3522 },
        city: 'Paris',
        country: 'France',
        description: 'Paris merkez hava durumu istasyonu',
      },
      {
        name: 'Sydney Central',
        location: { latitude: -33.8688, longitude: 151.2093 },
        city: 'Sydney',
        country: 'Australia',
        description: 'Sydney merkez hava durumu istasyonu',
      },
      {
        name: 'Dubai International',
        location: { latitude: 25.2048, longitude: 55.2708 },
        city: 'Dubai',
        country: 'UAE',
        description: 'Dubai merkez hava durumu istasyonu',
      },
      {
        name: 'Mumbai Central',
        location: { latitude: 19.0760, longitude: 72.8777 },
        city: 'Mumbai',
        country: 'India',
        description: 'Mumbai merkez hava durumu istasyonu',
      },
      {
        name: 'São Paulo Central',
        location: { latitude: -23.5505, longitude: -46.6333 },
        city: 'São Paulo',
        country: 'Brazil',
        description: 'São Paulo merkez hava durumu istasyonu',
      },
      {
        name: 'Moscow Central',
        location: { latitude: 55.7558, longitude: 37.6176 },
        city: 'Moscow',
        country: 'Russia',
        description: 'Moskova merkez hava durumu istasyonu',
      },
      {
        name: 'Berlin Central',
        location: { latitude: 52.5200, longitude: 13.4050 },
        city: 'Berlin',
        country: 'Germany',
        description: 'Berlin merkez hava durumu istasyonu',
      },
      {
        name: 'Los Angeles Central',
        location: { latitude: 34.0522, longitude: -118.2437 },
        city: 'Los Angeles',
        country: 'USA',
        description: 'Los Angeles merkez hava durumu istasyonu',
      },
      {
        name: 'Toronto Central',
        location: { latitude: 43.6532, longitude: -79.3832 },
        city: 'Toronto',
        country: 'Canada',
        description: 'Toronto merkez hava durumu istasyonu',
      },
      {
        name: 'Singapore Central',
        location: { latitude: 1.3521, longitude: 103.8198 },
        city: 'Singapore',
        country: 'Singapore',
        description: 'Singapur merkez hava durumu istasyonu',
      },
      {
        name: 'Hong Kong Central',
        location: { latitude: 22.3193, longitude: 114.1694 },
        city: 'Hong Kong',
        country: 'Hong Kong',
        description: 'Hong Kong merkez hava durumu istasyonu',
      },
      {
        name: 'Amsterdam Central',
        location: { latitude: 52.3676, longitude: 4.9041 },
        city: 'Amsterdam',
        country: 'Netherlands',
        description: 'Amsterdam merkez hava durumu istasyonu',
      },
      {
        name: 'Rome Central',
        location: { latitude: 41.9028, longitude: 12.4964 },
        city: 'Rome',
        country: 'Italy',
        description: 'Roma merkez hava durumu istasyonu',
      },
      {
        name: 'Madrid Central',
        location: { latitude: 40.4168, longitude: -3.7038 },
        city: 'Madrid',
        country: 'Spain',
        description: 'Madrid merkez hava durumu istasyonu',
      },
      {
        name: 'Barcelona Central',
        location: { latitude: 41.3851, longitude: 2.1734 },
        city: 'Barcelona',
        country: 'Spain',
        description: 'Barselona merkez hava durumu istasyonu',
      },
      {
        name: 'Vienna Central',
        location: { latitude: 48.2082, longitude: 16.3738 },
        city: 'Vienna',
        country: 'Austria',
        description: 'Viyana merkez hava durumu istasyonu',
      },
      {
        name: 'Prague Central',
        location: { latitude: 50.0755, longitude: 14.4378 },
        city: 'Prague',
        country: 'Czech Republic',
        description: 'Prag merkez hava durumu istasyonu',
      },
    ]);

    // Her istasyon için son 30 günlük ölçüm verileri oluştur
    const measurements: any[] = [];
    const now = new Date();

    for (const station of stations) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Her gün için 24 saatlik veri (her saat için bir ölçüm)
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(date);
          timestamp.setHours(hour, 0, 0, 0);

          // Gerçekçi hava durumu verileri oluştur
          const baseTemp = this.getBaseTemperature(station.city, hour);
          const temperature = baseTemp + (Math.random() - 0.5) * 4; // ±2°C varyasyon
          const humidity = 40 + Math.random() * 40; // 40-80% nem
          const windSpeed = Math.random() * 20; // 0-20 km/h rüzgar
          const windDirection = Math.random() * 360; // 0-360 derece
          const pressure = 1010 + (Math.random() - 0.5) * 20; // 1000-1020 hPa
          const uvIndex = Math.random() * 11; // 0-11 UV indeksi
          const precipitation = Math.random() * 50; // 0-50mm yağış
          const visibility = 1 + Math.random() * 49; // 1-50km görüş

          measurements.push({
            stationId: station._id,
            temperature: Math.round(temperature * 10) / 10,
            humidity: Math.round(humidity * 10) / 10,
            windSpeed: Math.round(windSpeed * 10) / 10,
            windDirection: Math.round(windDirection),
            pressure: Math.round(pressure * 10) / 10,
            uvIndex: Math.round(uvIndex * 10) / 10,
            precipitation: Math.round(precipitation * 10) / 10,
            visibility: Math.round(visibility * 10) / 10,
            timestamp,
          });
        }
      }
    }

    await this.measurementModel.insertMany(measurements);

    console.log('Seed data created successfully!');
    console.log('Admin user: admin@weather.com / admin123');
    console.log('Test user: user@weather.com / user123');
    console.log(`Created ${stations.length} stations and ${measurements.length} measurements`);

    return {
      users: [admin, ...users],
      stations,
      measurements: measurements.length,
    };
  }

  private getBaseTemperature(city: string, hour: number): number {
    const cityTemps = {
      'New York': { min: 2, max: 15 },
      'London': { min: 5, max: 18 },
      'Tokyo': { min: 8, max: 22 },
      'Paris': { min: 4, max: 17 },
      'Sydney': { min: 12, max: 25 },
      'Dubai': { min: 20, max: 35 },
      'Mumbai': { min: 22, max: 32 },
      'São Paulo': { min: 15, max: 28 },
      'Moscow': { min: -5, max: 8 },
      'Berlin': { min: 2, max: 16 },
      'Los Angeles': { min: 12, max: 24 },
      'Toronto': { min: -2, max: 12 },
      'Singapore': { min: 24, max: 32 },
      'Hong Kong': { min: 18, max: 28 },
      'Amsterdam': { min: 3, max: 16 },
      'Rome': { min: 8, max: 20 },
      'Madrid': { min: 6, max: 22 },
      'Barcelona': { min: 10, max: 24 },
      'Vienna': { min: 1, max: 15 },
      'Prague': { min: 0, max: 14 },
    };

    const temp = cityTemps[city] || { min: 10, max: 20 };
    
    // Günlük sıcaklık döngüsü (gece daha soğuk, öğle daha sıcak)
    const dailyCycle = Math.sin((hour - 6) * Math.PI / 12) * 0.5 + 0.5;
    
    return temp.min + (temp.max - temp.min) * dailyCycle;
  }
}
