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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={logout} />
        
        <main className="flex-1 p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-white/50 to-blue-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                    Hava Durumu Haritası
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    İstasyonları harita üzerinde görüntüleyin ve güncel hava durumu verilerini inceleyin
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Canlı Veri</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 h-full">
              <div className="h-[calc(100vh-200px)] rounded-xl overflow-hidden shadow-lg border border-gray-200/50">
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