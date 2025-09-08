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
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={logout} />
        
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Ölçümler</h2>
              <p className="text-sm text-gray-600 mt-1">
                İstasyonlardan alınan son ölçüm verilerini görüntüleyin
              </p>
            </div>
            
            <div className="p-6">
              {/* İstasyon Seçimi */}
              <div className="mb-6">
                <label htmlFor="station-select" className="block text-sm font-medium text-gray-700 mb-2">
                  İstasyon Seçin
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

              {/* Ölçümler Tablosu */}
              {selectedStation && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedStation.name} - Son 30 Ölçüm
                  </h3>
                  
                  {measurementsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-lg">Ölçümler yükleniyor...</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih/Saat
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sıcaklık (°C)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nem (%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rüzgar (km/h)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Yön (°)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Basınç (hPa)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {measurements
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((measurement) => (
                            <tr key={measurement._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(measurement.timestamp).toLocaleString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`font-medium ${
                                  measurement.temperature > 25 ? 'text-red-600' :
                                  measurement.temperature > 15 ? 'text-orange-600' :
                                  measurement.temperature > 5 ? 'text-green-600' :
                                  'text-blue-600'
                                }`}>
                                  {measurement.temperature}°C
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {measurement.humidity}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {measurement.windSpeed} km/h
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {measurement.windDirection}°
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {measurement.pressure} hPa
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {measurements.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          Bu istasyon için ölçüm verisi bulunamadı.
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
