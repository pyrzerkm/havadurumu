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
                    Meteoroloji İstasyonları
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sistemdeki tüm hava durumu istasyonlarını görüntüleyin
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">{stations.length} İstasyon</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stations.map((station) => (
                  <div key={station._id} className="bg-gradient-to-br from-white/80 to-blue-50/30 rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{station.name}</h3>
                          <p className="text-sm text-gray-600">{station.city}, {station.country}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        station.isActive 
                          ? 'bg-gradient-to-r from-green-400/20 to-emerald-500/20 text-green-700 border border-green-400/30' 
                          : 'bg-gradient-to-r from-red-400/20 to-pink-500/20 text-red-700 border border-red-400/30'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${station.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {station.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gray-200/50">
                        <span className="text-sm font-medium text-gray-600">Enlem:</span>
                        <span className="font-bold text-gray-900">{station.location.latitude.toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gray-200/50">
                        <span className="text-sm font-medium text-gray-600">Boylam:</span>
                        <span className="font-bold text-gray-900">{station.location.longitude.toFixed(4)}°</span>
                      </div>
                    </div>
                    
                    {station.description && (
                      <div className="mb-6 p-3 bg-blue-50/50 rounded-xl border border-blue-200/50">
                        <p className="text-sm text-blue-800">{station.description}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          window.open(`https://www.google.com/maps?q=${station.location.latitude},${station.location.longitude}`, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <span>Haritada Göster</span>
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = `/measurements?station=${station._id}`;
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Ölçümler</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {stations.length === 0 && (
                <div className="text-center py-16">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xl font-semibold mb-2">Henüz istasyon bulunmuyor</div>
                      <p className="text-gray-400 text-sm">
                        Admin panelinden yeni istasyon ekleyebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
