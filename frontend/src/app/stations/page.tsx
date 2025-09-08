'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { Station } from '@/types';
import { stationsApi } from '@/lib/api';

export default function StationsPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching stations:', error);
      } finally {
        setStationsLoading(false);
      }
    };

    if (user) {
      fetchStations();
    }
  }, [user]);

  if (loading || stationsLoading) {
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
              <h2 className="text-xl font-semibold text-gray-900">İstasyonlar</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sistemdeki tüm hava durumu istasyonlarını görüntüleyin
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stations.map((station) => (
                  <div key={station._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{station.name}</h3>
                        <p className="text-sm text-gray-600">{station.city}, {station.country}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        station.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {station.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Enlem:</span>
                        <span className="font-medium">{station.location.latitude.toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Boylam:</span>
                        <span className="font-medium">{station.location.longitude.toFixed(4)}°</span>
                      </div>
                    </div>
                    
                    {station.description && (
                      <p className="text-sm text-gray-600 mb-4">{station.description}</p>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Haritada göster
                          window.open(`https://www.google.com/maps?q=${station.location.latitude},${station.location.longitude}`, '_blank');
                        }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Haritada Göster
                      </button>
                      <button
                        onClick={() => {
                          // Ölçümler sayfasına yönlendir
                          window.location.href = `/measurements?station=${station._id}`;
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Ölçümler
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {stations.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">Henüz istasyon bulunmuyor.</div>
                  <p className="text-gray-400 text-sm mt-2">
                    Admin panelinden yeni istasyon ekleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
