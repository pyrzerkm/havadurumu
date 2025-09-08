'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
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

type ChartType = 'temperature' | 'humidity' | 'windSpeed' | 'pressure';
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
        const formattedData = measurements.map((measurement) => ({
          timestamp: new Date(measurement.timestamp).toLocaleString('tr-TR'),
          temperature: measurement.temperature,
          humidity: measurement.humidity,
          windSpeed: measurement.windSpeed,
          pressure: measurement.pressure,
        }));

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
          const newDataPoint = {
            timestamp: new Date(data.timestamp).toLocaleString('tr-TR'),
            temperature: Number(data.temperature),
            humidity: Number(data.humidity),
            windSpeed: Number(data.windSpeed),
            pressure: Number(data.pressure),
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
    };
    return `${typeNames[chartType]} Grafiği`;
  };

  const getYAxisLabel = () => {
    const labels = {
      temperature: 'Sıcaklık (°C)',
      humidity: 'Nem (%)',
      windSpeed: 'Rüzgar Hızı (km/h)',
      pressure: 'Basınç (hPa)',
    };
    return labels[chartType];
  };

  const getDataKey = () => {
    const keys = {
      temperature: 'temperature',
      humidity: 'humidity',
      windSpeed: 'windSpeed',
      pressure: 'pressure',
    };
    return keys[chartType];
  };

  const getColor = () => {
    const colors = {
      temperature: '#ef4444',
      humidity: '#3b82f6',
      windSpeed: '#10b981',
      pressure: '#8b5cf6',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={logout} />
        
        <main className="flex-1 p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-white/50 to-blue-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                    Veri Analizi & Grafikler
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Hava durumu verilerini grafik olarak görüntüleyin
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Anlık güncelleme aktif' : 'Bağlantı yok'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Kontroller */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label htmlFor="station-select" className="block text-sm font-semibold text-gray-700 mb-3">
                    İstasyon Seçin
                  </label>
                  <div className="relative">
                    <select
                      id="station-select"
                      value={selectedStation?._id || ''}
                      onChange={(e) => {
                        const station = stations.find(s => s._id === e.target.value);
                        setSelectedStation(station || null);
                      }}
                      className="block w-full px-4 py-3 bg-white/80 border border-gray-200/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm text-gray-900 appearance-none"
                    >
                      <option value="" className="text-gray-900">İstasyon seçin...</option>
                      {stations.map((station) => (
                        <option key={station._id} value={station._id} className="text-gray-900">
                          {station.name} - {station.city}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="chart-type" className="block text-sm font-semibold text-gray-700 mb-3">
                    Grafik Türü
                  </label>
                  <div className="relative">
                    <select
                      id="chart-type"
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as ChartType)}
                      className="block w-full px-4 py-3 bg-white/80 border border-gray-200/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm text-gray-900 appearance-none"
                    >
                      <option value="temperature" className="text-gray-900">🌡️ Sıcaklık</option>
                      <option value="humidity" className="text-gray-900">💧 Nem</option>
                      <option value="windSpeed" className="text-gray-900">💨 Rüzgar Hızı</option>
                      <option value="pressure" className="text-gray-900">📊 Basınç</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="time-range" className="block text-sm font-semibold text-gray-700 mb-3">
                    Zaman Aralığı
                  </label>
                  <div className="relative">
                    <select
                      id="time-range"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                      className="block w-full px-4 py-3 bg-white/80 border border-gray-200/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm text-gray-900 appearance-none"
                    >
                      <option value="24h" className="text-gray-900">📅 Son 24 Saat</option>
                      <option value="7d" className="text-gray-900">📆 Son 7 Gün</option>
                      <option value="30d" className="text-gray-900">🗓️ Son 30 Gün</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafik */}
              {selectedStation && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedStation.name} - {getChartTitle()}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                    <div className="h-[500px] bg-gradient-to-br from-white/50 to-blue-50/30 rounded-xl p-4 border border-gray-200/50">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                          <XAxis 
                            dataKey="timestamp" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            stroke="#9ca3af"
                          />
                          <YAxis 
                            label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                            domain={['dataMin', 'dataMax']}
                            allowDataOverflow={false}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#9ca3af"
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
                            dot={{ r: 6, fill: getColor(), strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8, stroke: getColor(), strokeWidth: 2, fill: '#fff' }}
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
                        <div className="text-gray-500 text-lg">Seçilen zaman aralığında veri bulunamadı.</div>
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
