'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
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
                Meteoroloji İstasyonları
              </h2>
              <p className="text-sm text-yellow-300 mt-1">
                Sistemdeki tüm hava durumu istasyonlarını görüntüleyin
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-sm text-gray-300">{stations.length} İstasyon</span>
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
              {/* İstasyon Listesi */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-gradient-to-r from-white/10 to-purple-500/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          İstasyon
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Konum
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Koordinatlar
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-white/10">
                      {stations.map((station) => (
                        <tr key={station._id} className="hover:bg-white/10 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{station.name}</div>
                                {station.description && (
                                  <div className="text-xs text-gray-300 max-w-xs truncate">{station.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{station.city}</div>
                            <div className="text-xs text-gray-300">{station.country}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              station.isActive 
                                ? 'bg-gradient-to-r from-green-400/30 to-emerald-500/30 text-green-200 border border-green-400/50' 
                                : 'bg-gradient-to-r from-red-400/30 to-pink-500/30 text-red-200 border border-red-400/50'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                station.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                              }`}></div>
                              {station.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-300">
                              <div>Enlem: {station.location.latitude.toFixed(4)}°</div>
                              <div>Boylam: {station.location.longitude.toFixed(4)}°</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  window.open(`https://www.google.com/maps?q=${station.location.latitude},${station.location.longitude}`, '_blank');
                                }}
                                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border border-purple-500/30 backdrop-blur-sm"
                              >
                                Harita
                              </button>
                              <button
                                onClick={() => {
                                  window.location.href = `/measurements?station=${station._id}`;
                                }}
                                className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border border-blue-500/30 backdrop-blur-sm"
                              >
                                Ölçümler
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                      <div className="text-gray-300 text-xl font-semibold mb-2">Henüz istasyon bulunmuyor</div>
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
