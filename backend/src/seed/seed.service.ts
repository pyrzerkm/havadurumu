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

    // Normal kullanıcı oluştur
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await this.userModel.create({
      email: 'user@weather.com',
      password: userPassword,
      name: 'Test User',
      role: 'user',
    });

    // İstasyonlar oluştur
    const stations = await this.stationModel.create([
      {
        name: 'İstanbul Merkez',
        location: { latitude: 41.0082, longitude: 28.9784 },
        city: 'İstanbul',
        country: 'Türkiye',
        description: 'İstanbul merkez hava durumu istasyonu',
      },
      {
        name: 'Ankara Merkez',
        location: { latitude: 39.9334, longitude: 32.8597 },
        city: 'Ankara',
        country: 'Türkiye',
        description: 'Ankara merkez hava durumu istasyonu',
      },
      {
        name: 'İzmir Merkez',
        location: { latitude: 38.4192, longitude: 27.1287 },
        city: 'İzmir',
        country: 'Türkiye',
        description: 'İzmir merkez hava durumu istasyonu',
      },
      {
        name: 'Antalya Merkez',
        location: { latitude: 36.8969, longitude: 30.7133 },
        city: 'Antalya',
        country: 'Türkiye',
        description: 'Antalya merkez hava durumu istasyonu',
      },
      {
        name: 'Bursa Merkez',
        location: { latitude: 40.1826, longitude: 29.0665 },
        city: 'Bursa',
        country: 'Türkiye',
        description: 'Bursa merkez hava durumu istasyonu',
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

          measurements.push({
            stationId: station._id,
            temperature: Math.round(temperature * 10) / 10,
            humidity: Math.round(humidity * 10) / 10,
            windSpeed: Math.round(windSpeed * 10) / 10,
            windDirection: Math.round(windDirection),
            pressure: Math.round(pressure * 10) / 10,
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
      users: [admin, user],
      stations,
      measurements: measurements.length,
    };
  }

  private getBaseTemperature(city: string, hour: number): number {
    const cityTemps = {
      'İstanbul': { min: 8, max: 18 },
      'Ankara': { min: 2, max: 15 },
      'İzmir': { min: 10, max: 20 },
      'Antalya': { min: 12, max: 22 },
      'Bursa': { min: 6, max: 16 },
    };

    const temp = cityTemps[city] || { min: 10, max: 20 };
    
    // Günlük sıcaklık döngüsü (gece daha soğuk, öğle daha sıcak)
    const dailyCycle = Math.sin((hour - 6) * Math.PI / 12) * 0.5 + 0.5;
    
    return temp.min + (temp.max - temp.min) * dailyCycle;
  }
}
