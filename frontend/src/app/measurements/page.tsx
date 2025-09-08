'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
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
                    Ölçüm Verileri
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    İstasyonlardan alınan son ölçüm verilerini görüntüleyin
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">{isConnected ? 'Canlı Veri' : 'Bağlantı Yok'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* İstasyon Seçimi */}
              <div className="mb-8">
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

              {/* Ölçümler Tablosu */}
              {selectedStation && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedStation.name} - Son 30 Ölçüm
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                        <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/80">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Tarih/Saat
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Sıcaklık (°C)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Nem (%)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Rüzgar (km/h)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Yön (°)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Basınç (hPa)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-gray-200/30">
                          {measurements
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((measurement, index) => (
                            <tr key={measurement._id} className={`hover:bg-blue-50/50 transition-colors duration-200 ${index === 0 ? 'bg-blue-50/30' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                  {index === 0 && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  )}
                                  <span className="font-medium">{new Date(measurement.timestamp).toLocaleString('tr-TR')}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                  measurement.temperature > 25 ? 'bg-red-100 text-red-800' :
                                  measurement.temperature > 15 ? 'bg-orange-100 text-orange-800' :
                                  measurement.temperature > 5 ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {measurement.temperature}°C
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                  {measurement.humidity}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                  {measurement.windSpeed} km/h
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                  {measurement.windDirection}°
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
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
                            <div className="text-gray-500 text-lg">Bu istasyon için ölçüm verisi bulunamadı.</div>
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
