'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { User } from '@/types';

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setProfileData(user);
    }
  }, [user, loading, router]);

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
              <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
              <p className="text-sm text-gray-600 mt-1">
                Hesap bilgilerinizi görüntüleyin ve yönetin
              </p>
            </div>
            
            <div className="p-6">
              <div className="max-w-2xl">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full mt-1">
                          👑 Admin Kullanıcısı
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Soyad
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900">
                        {user.name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-posta
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900">
                        {user.email}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kullanıcı Rolü
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900">
                        {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hesap Durumu
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Sistem Bilgileri</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Hava durumu verilerini gerçek zamanlı olarak görüntüleyebilirsiniz</p>
                    <p>• İstasyon verilerini harita üzerinde inceleyebilirsiniz</p>
                    <p>• Ölçüm verilerini tablo ve grafik formatında görüntüleyebilirsiniz</p>
                    {user.role === 'admin' && (
                      <p>• Admin paneli ile sistem yönetimi yapabilirsiniz</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
