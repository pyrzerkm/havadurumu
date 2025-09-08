'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Station, Measurement } from '@/types';
import { measurementsApi } from '@/lib/api';

// Leaflet'i dynamic import ile yükle
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">Harita yükleniyor...</div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet icon fix - dynamic import
const setupLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

interface WeatherMapProps {
  stations: Station[];
  onStationSelect?: (station: Station) => void;
}

const WeatherMap: React.FC<WeatherMapProps> = ({ stations, onStationSelect }) => {
  const [latestMeasurements, setLatestMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupLeafletIcons();
    }
    
    const fetchLatestMeasurements = async () => {
      try {
        const measurements = await measurementsApi.getLatest();
        setLatestMeasurements(measurements);
      } catch (error) {
        console.error('Error fetching latest measurements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (stations.length > 0) {
      fetchLatestMeasurements();
    }
  }, [stations]);

  const getTemperatureColor = (temperature: number) => {
    if (temperature < 0) return '#0066cc'; // Mavi - çok soğuk
    if (temperature < 10) return '#3399ff'; // Açık mavi - soğuk
    if (temperature < 20) return '#66cc66'; // Yeşil - ılık
    if (temperature < 30) return '#ffcc00'; // Sarı - sıcak
    return '#ff6600'; // Turuncu - çok sıcak
  };

  const getTemperatureIcon = (temperature: number) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    const color = getTemperatureColor(temperature);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${Math.round(temperature)}°
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Harita yükleniyor...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-lg">Harita verileri yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[39.9334, 32.8597]} // Ankara merkez
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {stations.map((station) => {
          const measurement = latestMeasurements.find(
            (m) => typeof m.stationId === 'object' ? m.stationId._id === station._id : m.stationId === station._id
          );
          
          if (!measurement) return null;
          
          return (
            <Marker
              key={station._id}
              position={[station.location.latitude, station.location.longitude]}
              icon={getTemperatureIcon(measurement.temperature)}
              eventHandlers={{
                click: () => onStationSelect?.(station),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-2">{station.name}</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Sıcaklık:</span>
                      <span className="font-semibold">{measurement.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nem:</span>
                      <span className="font-semibold">{measurement.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rüzgar:</span>
                      <span className="font-semibold">{measurement.windSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Basınç:</span>
                      <span className="font-semibold">{measurement.pressure} hPa</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(measurement.timestamp).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default WeatherMap;
