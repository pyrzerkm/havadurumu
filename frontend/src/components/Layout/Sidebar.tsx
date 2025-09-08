'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types';

interface SidebarProps {
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Harita', icon: '🗺️' },
    { href: '/stations', label: 'İstasyonlar', icon: '🏢' },
    { href: '/measurements', label: 'Ölçümler', icon: '📊' },
    { href: '/charts', label: 'Grafikler', icon: '📈' },
    { href: '/profile', label: 'Profil', icon: '👤' },
  ];

  // Admin için ek menü öğeleri
  if (user?.role === 'admin') {
    menuItems.push(
      { href: '/admin', label: 'Admin Panel', icon: '👑' }
    );
  }

  return (
    <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">Hava Durumu</h1>
        <p className="text-sm text-gray-400">Meteoroloji Sistemi</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="font-medium">{user.name || 'Kullanıcı'}</p>
              <p className="text-xs text-gray-400">{user.email || 'email@example.com'}</p>
              {user.role === 'admin' && (
                <span className="inline-block bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full mt-1">
                  👑 Admin
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          © 2024 Hava Durumu App
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
