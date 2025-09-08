'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case '24h':
            startDate.setHours(endDate.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
        }

        const measurements = await measurementsApi.getByDateRange(
          selectedStation._id,
          startDate.toISOString(),
          endDate.toISOString()
        );

        // Veriyi grafik formatına dönüştür
        const formattedData = measurements.map((measurement) => ({
          timestamp: new Date(measurement.timestamp).toLocaleString('tr-TR'),
          temperature: measurement.temperature,
          humidity: measurement.humidity,
          windSpeed: measurement.windSpeed,
          pressure: measurement.pressure,
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedStation, timeRange]);

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
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={logout} />
        
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Grafikler</h2>
              <p className="text-sm text-gray-600 mt-1">
                Hava durumu verilerini grafik olarak görüntüleyin
              </p>
            </div>
            
            <div className="p-6">
              {/* Kontroller */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label htmlFor="station-select" className="block text-sm font-medium text-gray-700 mb-2">
                    İstasyon
                  </label>
                <select
                  id="station-select"
                  value={selectedStation?._id || ''}
                  onChange={(e) => {
                    const station = stations.find(s => s._id === e.target.value);
                    setSelectedStation(station || null);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                >
                    <option value="" className="text-gray-900">İstasyon seçin...</option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id} className="text-gray-900">
                        {station.name} - {station.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="chart-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Grafik Türü
                  </label>
                  <select
                    id="chart-type"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                  >
                    <option value="temperature" className="text-gray-900">Sıcaklık</option>
                    <option value="humidity" className="text-gray-900">Nem</option>
                    <option value="windSpeed" className="text-gray-900">Rüzgar Hızı</option>
                    <option value="pressure" className="text-gray-900">Basınç</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-2">
                    Zaman Aralığı
                  </label>
                  <select
                    id="time-range"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                  >
                    <option value="24h" className="text-gray-900">Son 24 Saat</option>
                    <option value="7d" className="text-gray-900">Son 7 Gün</option>
                    <option value="30d" className="text-gray-900">Son 30 Gün</option>
                  </select>
                </div>
              </div>

              {/* Grafik */}
              {selectedStation && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedStation.name} - {getChartTitle()}
                  </h3>
                  
                  {chartLoading ? (
                    <div className="text-center py-8">
                      <div className="text-lg">Grafik verileri yükleniyor...</div>
                    </div>
                  ) : (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="timestamp" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey={getDataKey()} 
                            stroke={getColor()} 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name={getChartTitle()}
                          />
                        </LineChart>
                      </ResponsiveContainer>
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
