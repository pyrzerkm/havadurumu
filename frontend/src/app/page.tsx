'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import WeatherMap from '@/components/Map/WeatherMap';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { Station } from '@/types';
import { stationsApi } from '@/lib/api';

export default function HomePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [mapLoading, setMapLoading] = useState(true);

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
        setMapLoading(false);
      }
    };

    if (user) {
      fetchStations();
    }
  }, [user]);

  if (loading || mapLoading) {
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
          <div className="bg-white rounded-lg shadow-sm h-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Hava Durumu Haritası</h2>
              <p className="text-sm text-gray-600 mt-1">
                İstasyonları harita üzerinde görüntüleyin ve güncel hava durumu verilerini inceleyin
              </p>
            </div>
            
            <div className="p-6 h-full">
              <div className="h-[calc(100vh-200px)]">
                <WeatherMap 
                  stations={stations} 
                  onStationSelect={(station) => {
                    console.log('Selected station:', station);
                    // İstasyon seçildiğinde yapılacak işlemler
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}