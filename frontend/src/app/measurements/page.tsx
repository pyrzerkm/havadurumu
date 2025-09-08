'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import { Station, Measurement } from '@/types';
import { stationsApi, measurementsApi } from '@/lib/api';

export default function MeasurementsPage() {
  const { user, logout, loading } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

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
    const fetchMeasurements = async () => {
      if (!selectedStation) return;
      
      setMeasurementsLoading(true);
      try {
        const data = await measurementsApi.getByStation(selectedStation._id, 30);
        setMeasurements(data);
      } catch (error) {
        console.error('Error fetching measurements:', error);
      } finally {
        setMeasurementsLoading(false);
      }
    };

    fetchMeasurements();
  }, [selectedStation]);

  // WebSocket dinleyicisi - yeni ölçüm geldiğinde güncelle
  useEffect(() => {
    if (!socket || !selectedStation) return;

    // İstasyon room'una katıl
    socket.emit('join_station', selectedStation._id);
    console.log(`Joined station room: ${selectedStation._id}`);

    const handleNewMeasurement = (data: any) => {
      console.log('Yeni ölçüm alındı:', data);
      if (data.stationId === selectedStation._id) {
        // Seçili istasyon için yeni ölçüm geldi, listeyi güncelle
        setMeasurements(prev => {
          // Duplikasyon kontrolü - aynı ID'ye sahip ölçüm varsa güncelle, yoksa ekle
          const existingIndex = prev.findIndex(m => m._id === data._id);
          if (existingIndex >= 0) {
            // Mevcut ölçümü güncelle
            const updated = [...prev];
            updated[existingIndex] = data;
            return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          } else {
            // Yeni ölçüm ekle
            const newMeasurements = [data, ...prev];
            return newMeasurements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
        });
      }
    };

    socket.on('newMeasurement', handleNewMeasurement);

    return () => {
      socket.emit('leave_station', selectedStation._id);
      socket.off('newMeasurement', handleNewMeasurement);
    };
  }, [socket, selectedStation]);

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
                Ölçüm Verileri
              </h2>
              <p className="text-sm text-yellow-300 mt-1">
                İstasyonlardan alınan son ölçüm verilerini görüntüleyin
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full shadow-lg ${
                  isConnected ? 'bg-green-400 animate-pulse shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'
                }`}></div>
                <span className="text-sm text-gray-300">{isConnected ? 'Canlı Veri' : 'Bağlantı Yok'}</span>
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
              {/* İstasyon Seçimi */}
              <div className="mb-8">
                <label htmlFor="station-select" className="block text-sm font-semibold text-gray-300 mb-3">
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
                    className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 sm:text-sm text-white appearance-none backdrop-blur-sm"
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

              {/* Ölçümler Tablosu */}
              {selectedStation && (
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">
                      {selectedStation.name} - Son 30 Ölçüm
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
                    </div>
                  </div>
                  
                  {measurementsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <div className="text-lg text-gray-600">Ölçümler yükleniyor...</div>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200/50">
                        <thead className="bg-gradient-to-r from-white/10 to-emerald-500/20">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Tarih/Saat
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Sıcaklık (°C)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Nem (%)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Rüzgar (km/h)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Yön (°)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Basınç (hPa)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/5 divide-y divide-white/10">
                          {measurements
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((measurement, index) => (
                            <tr key={measurement._id} className={`hover:bg-white/10 transition-colors duration-200 ${index === 0 ? 'bg-emerald-500/20' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <div className="flex items-center space-x-2">
                                  {index === 0 && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  )}
                                  <span className="font-medium">{new Date(measurement.timestamp).toLocaleString('tr-TR')}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                  measurement.temperature > 25 ? 'bg-red-500/20 text-red-200 border border-red-500/30' :
                                  measurement.temperature > 15 ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' :
                                  measurement.temperature > 5 ? 'bg-green-500/20 text-green-200 border border-green-500/30' :
                                  'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                                }`}>
                                  {measurement.temperature}°C
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                                  {measurement.humidity}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-200 border border-purple-500/30">
                                  {measurement.windSpeed} km/h
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-200 border border-yellow-500/30">
                                  {measurement.windDirection}°
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-200 border border-gray-500/30">
                                  {measurement.pressure} hPa
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {measurements.length === 0 && (
                        <div className="text-center py-12">
                          <div className="flex flex-col items-center space-y-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div className="text-gray-300 text-lg">Bu istasyon için ölçüm verisi bulunamadı.</div>
                          </div>
                        </div>
                      )}
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
