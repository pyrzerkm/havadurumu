'use client';

import React from 'react';
import { User } from '@/types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hava Durumu Dashboard</h1>
          <p className="text-sm text-gray-600">Gerçek zamanlı meteoroloji verileri</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name || 'Kullanıcı'}</p>
                <p className="text-xs text-gray-500">{user.email || 'email@example.com'}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Çıkış Yap
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
