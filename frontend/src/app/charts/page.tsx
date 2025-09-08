'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import { Station, Measurement } from '@/types';
import { stationsApi, measurementsApi } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

type ChartType = 'temperature' | 'humidity' | 'windSpeed' | 'pressure' | 'windDirection' | 'feelsLike' | 'uvIndex' | 'precipitation' | 'visibility';
type TimeRange = '24h' | '7d' | '30d';

export default function ChartsPage() {
  const { user, logout, loading } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [chartType, setChartType] = useState<ChartType>('temperature');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await stationsApi.getAll();
        setStations(data);
        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    if (user) {
      fetchStations();
    }
  }, [user]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedStation) return;
      
      setChartLoading(true);
      try {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;
        
        switch (timeRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Gelecek 24 saat de dahil
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Gelecek 7 gün de dahil
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Gelecek 30 gün de dahil
            break;
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }

        console.log('Charts: Veri yükleme başlıyor...', {
          stationId: selectedStation._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timeRange
        });

        const measurements = await measurementsApi.getByDateRange(
          selectedStation._id,
          startDate.toISOString(),
          endDate.toISOString()
        );

        console.log('Charts: API\'den gelen veriler:', measurements);

        // Veriyi grafik formatına dönüştür
        const formattedData = measurements.map((measurement) => {
          // Hissedilen sıcaklık hesaplama (Heat Index formülü)
          const temp = measurement.temperature;
          const humidity = measurement.humidity;
          const windSpeed = measurement.windSpeed;
          
          // Basit hissedilen sıcaklık hesaplaması
          let feelsLike = temp;
          if (temp >= 27 && humidity >= 40) {
            // Heat Index hesaplaması (basitleştirilmiş)
            const hi = -8.78469475556 + 1.61139411 * temp + 2.33854883889 * humidity + 
                       -0.14611605 * temp * humidity + -0.012308094 * Math.pow(temp, 2) + 
                       -0.0164248277778 * Math.pow(humidity, 2) + 0.002211732 * Math.pow(temp, 2) * humidity + 
                       0.00072546 * temp * Math.pow(humidity, 2) + -0.000003582 * Math.pow(temp, 2) * Math.pow(humidity, 2);
            feelsLike = Math.round(hi * 10) / 10;
          } else if (temp <= 10 && windSpeed > 4.8) {
            // Wind Chill hesaplaması (basitleştirilmiş)
            const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
            feelsLike = Math.round(wc * 10) / 10;
          }

          return {
            timestamp: new Date(measurement.timestamp).toLocaleString('tr-TR'),
            temperature: measurement.temperature,
            humidity: measurement.humidity,
            windSpeed: measurement.windSpeed,
            pressure: measurement.pressure,
            windDirection: measurement.windDirection,
            feelsLike: feelsLike,
            uvIndex: measurement.uvIndex,
            precipitation: measurement.precipitation,
            visibility: measurement.visibility,
          };
        });

        console.log('Charts: Formatlanmış veriler:', formattedData);
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedStation, timeRange]);

  // WebSocket dinleyicisi - yeni ölçüm geldiğinde grafikleri güncelle
  useEffect(() => {
    if (!socket || !selectedStation) return;

    // İstasyon room'una katıl
    socket.emit('join_station', selectedStation._id);
    console.log(`Charts: Joined station room: ${selectedStation._id}`);

    const handleNewMeasurement = (data: any) => {
      console.log('Charts: Yeni ölçüm alındı:', data);
      console.log('Charts: Seçili istasyon ID:', selectedStation._id);
      console.log('Charts: Gelen veri stationId:', data.stationId);
      
      // stationId karşılaştırmasını düzelt - hem string hem de ObjectId formatını kontrol et
      const dataStationId = data.stationId?._id || data.stationId;
      const isMatchingStation = dataStationId === selectedStation._id || 
                               dataStationId === selectedStation._id.toString();
      
      console.log('Charts: İstasyon eşleşiyor mu?', isMatchingStation);
      
      if (isMatchingStation) {
        console.log('Charts: Grafik verilerini güncelliyor...');
        // Seçili istasyon için yeni ölçüm geldi, grafik verilerini güncelle
        setChartData(prev => {
          console.log('Charts: Mevcut grafik verisi sayısı:', prev.length);
          
          // Yeni ölçümü grafik formatına dönüştür
          const temp = Number(data.temperature);
          const humidity = Number(data.humidity);
          const windSpeed = Number(data.windSpeed);
          
          // Hissedilen sıcaklık hesaplama
          let feelsLike = temp;
          if (temp >= 27 && humidity >= 40) {
            const hi = -8.78469475556 + 1.61139411 * temp + 2.33854883889 * humidity + 
                       -0.14611605 * temp * humidity + -0.012308094 * Math.pow(temp, 2) + 
                       -0.0164248277778 * Math.pow(humidity, 2) + 0.002211732 * Math.pow(temp, 2) * humidity + 
                       0.00072546 * temp * Math.pow(humidity, 2) + -0.000003582 * Math.pow(temp, 2) * Math.pow(humidity, 2);
            feelsLike = Math.round(hi * 10) / 10;
          } else if (temp <= 10 && windSpeed > 4.8) {
            const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
            feelsLike = Math.round(wc * 10) / 10;
          }

          const newDataPoint = {
            timestamp: new Date(data.timestamp).toLocaleString('tr-TR'),
            temperature: temp,
            humidity: humidity,
            windSpeed: windSpeed,
            pressure: Number(data.pressure),
            windDirection: Number(data.windDirection),
            feelsLike: feelsLike,
            uvIndex: Number(data.uvIndex),
            precipitation: Number(data.precipitation),
            visibility: Number(data.visibility),
          };

          console.log('Charts: Yeni veri noktası:', newDataPoint);

          // Mevcut veriye yeni noktayı ekle ve sırala
          const updatedData = [...prev, newDataPoint].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          console.log('Charts: Güncellenmiş veri sayısı:', updatedData.length);
          console.log('Charts: Yeni veri eklendi, grafik güncelleniyor');
          
          return updatedData;
        });
      }
    };

    socket.on('newMeasurement', handleNewMeasurement);

    return () => {
      socket.emit('leave_station', selectedStation._id);
      socket.off('newMeasurement', handleNewMeasurement);
    };
  }, [socket, selectedStation, timeRange]);

  const getChartTitle = () => {
    const typeNames = {
      temperature: 'Sıcaklık',
      humidity: 'Nem',
      windSpeed: 'Rüzgar Hızı',
      pressure: 'Basınç',
      windDirection: 'Rüzgar Yönü',
      feelsLike: 'Hissedilen Sıcaklık',
      uvIndex: 'UV İndeksi',
      precipitation: 'Yağış Miktarı',
      visibility: 'Görüş Mesafesi',
    };
    return `${typeNames[chartType]} Grafiği`;
  };

  const getYAxisLabel = () => {
    const labels = {
      temperature: 'Sıcaklık (°C)',
      humidity: 'Nem (%)',
      windSpeed: 'Rüzgar Hızı (km/h)',
      pressure: 'Basınç (hPa)',
      windDirection: 'Rüzgar Yönü (°)',
      feelsLike: 'Hissedilen Sıcaklık (°C)',
      uvIndex: 'UV İndeksi',
      precipitation: 'Yağış (mm)',
      visibility: 'Görüş (km)',
    };
    return labels[chartType];
  };

  const getDataKey = () => {
    const keys = {
      temperature: 'temperature',
      humidity: 'humidity',
      windSpeed: 'windSpeed',
      pressure: 'pressure',
      windDirection: 'windDirection',
      feelsLike: 'feelsLike',
      uvIndex: 'uvIndex',
      precipitation: 'precipitation',
      visibility: 'visibility',
    };
    return keys[chartType];
  };

  const getColor = () => {
    const colors = {
      temperature: '#ef4444',
      humidity: '#3b82f6',
      windSpeed: '#10b981',
      pressure: '#8b5cf6',
      windDirection: '#f59e0b',
      feelsLike: '#ec4899',
      uvIndex: '#f97316',
      precipitation: '#06b6d4',
      visibility: '#84cc16',
    };
    return colors[chartType];
  };

  // Y ekseni aralığını dinamik olarak hesapla
  const getYAxisDomain = () => {
    if (chartData.length === 0) return ['dataMin', 'dataMax'];
    
    const dataKey = getDataKey();
    const values = chartData.map(item => item[dataKey]).filter(val => val != null && !isNaN(val));
    
    if (values.length === 0) return ['dataMin', 'dataMax'];
    
    // Sadece sayısal değerleri al
    const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
    
    if (numericValues.length === 0) return ['dataMin', 'dataMax'];
    
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    
    // Eğer min ve max aynıysa, biraz aralık ekle
    if (min === max) {
      const margin = Math.max(1, Math.abs(min) * 0.1);
      return [min - margin, max + margin];
    }
    
    // %10 margin ekle
    const margin = (max - min) * 0.1;
    const minWithMargin = Math.max(0, min - margin);
    const maxWithMargin = max + margin;
    
    console.log('Y ekseni aralığı:', { 
      dataKey, 
      min, 
      max, 
      minWithMargin, 
      maxWithMargin, 
      values: numericValues.slice(0, 5), // İlk 5 değeri göster
      totalValues: numericValues.length 
    });
    
    return [minWithMargin, maxWithMargin];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>
      
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col relative z-0">
        {/* Header kısmını en üste çekelim */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Veri Analizi & Grafikler
              </h2>
              <p className="text-sm text-yellow-300 mt-1">
                Hava durumu verilerini grafik olarak görüntüleyin
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full shadow-lg ${
                  isConnected ? 'bg-green-400 animate-pulse shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'
                }`}></div>
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Anlık güncelleme aktif' : 'Bağlantı yok'}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
        
        <main className="flex-1 p-6">
          <div className="bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            
            <div className="p-6">
              {/* Kontroller */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label htmlFor="station-select" className="block text-sm font-semibold text-gray-300 mb-3">
                    İstasyon Seçin
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="İstasyon ara..."
                        className="block w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 sm:text-sm text-white backdrop-blur-sm"
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          const filteredStations = stations.filter(station => 
                            station.name.toLowerCase().includes(searchTerm) || 
                            station.city.toLowerCase().includes(searchTerm)
                          );
                          if (filteredStations.length > 0 && searchTerm) {
                            setSelectedStation(filteredStations[0]);
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="relative mt-2">
                      <select
                        id="station-select"
                        value={selectedStation?._id || ''}
                        onChange={(e) => {
                          const station = stations.find(s => s._id === e.target.value);
                          setSelectedStation(station || null);
                        }}
                        className="block w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 sm:text-sm text-white appearance-none backdrop-blur-sm"
                      >
                        <option value="" className="bg-gray-800 text-white">İstasyon seçin...</option>
                        {stations.map((station) => (
                          <option key={station._id} value={station._id} className="bg-gray-800 text-white">
                            {station.name} - {station.city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="chart-type" className="block text-sm font-semibold text-gray-300 mb-3">
                    Grafik Türü
                  </label>
                  <div className="relative">
                    <select
                      id="chart-type"
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as ChartType)}
                      className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 sm:text-sm text-white appearance-none backdrop-blur-sm"
                    >
                      <option value="temperature" className="bg-gray-800 text-white">🌡️ Sıcaklık</option>
                      <option value="humidity" className="bg-gray-800 text-white">💧 Nem</option>
                      <option value="windSpeed" className="bg-gray-800 text-white">💨 Rüzgar Hızı</option>
                      <option value="pressure" className="bg-gray-800 text-white">📊 Basınç</option>
                      <option value="windDirection" className="bg-gray-800 text-white">🧭 Rüzgar Yönü</option>
                      <option value="feelsLike" className="bg-gray-800 text-white">🌡️ Hissedilen Sıcaklık</option>
                      <option value="uvIndex" className="bg-gray-800 text-white">🌞 UV İndeksi</option>
                      <option value="precipitation" className="bg-gray-800 text-white">🌧️ Yağış Miktarı</option>
                      <option value="visibility" className="bg-gray-800 text-white">👁️ Görüş Mesafesi</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="time-range" className="block text-sm font-semibold text-gray-300 mb-3">
                    Zaman Aralığı
                  </label>
                  <div className="relative">
                    <select
                      id="time-range"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                      className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 sm:text-sm text-white appearance-none backdrop-blur-sm"
                    >
                      <option value="24h" className="bg-gray-800 text-white">📅 Son 24 Saat</option>
                      <option value="7d" className="bg-gray-800 text-white">📆 Son 7 Gün</option>
                      <option value="30d" className="bg-gray-800 text-white">🗓️ Son 30 Gün</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafik */}
              {selectedStation && (
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">
                      {selectedStation.name} - {getChartTitle()}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>{chartData.length} veri noktası</span>
                    </div>
                  </div>
                  
                  {chartLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <div className="text-lg text-gray-600">Grafik verileri yükleniyor...</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[500px] bg-gradient-to-br from-black/20 to-purple-500/10 rounded-xl p-4 border border-white/20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.3} />
                          <XAxis 
                            dataKey="timestamp" 
                            tick={{ fontSize: 12, fill: '#ffffff' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            stroke="#ffffff"
                          />
                          <YAxis 
                            label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#ffffff' } }}
                            domain={['dataMin', 'dataMax']}
                            allowDataOverflow={false}
                            tick={{ fontSize: 12, fill: '#ffffff' }}
                            stroke="#ffffff"
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey={getDataKey()} 
                            stroke={getColor()} 
                            strokeWidth={3}
                            dot={{ r: 3, fill: getColor(), strokeWidth: 1, stroke: '#fff' }}
                            activeDot={{ r: 5, stroke: getColor(), strokeWidth: 2, fill: '#fff' }}
                            name={getChartTitle()}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {chartData.length === 0 && !chartLoading && (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <div className="text-gray-300 text-lg">Seçilen zaman aralığında veri bulunamadı.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
