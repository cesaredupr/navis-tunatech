'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { type LatLngExpression, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LogLocationMapProps {
  height?: string
  location: { lat: number; lng: number }
}

const locationIcon = divIcon({
  html: `<div style="
    width: 24px;
    height: 24px;
    background: #22c55e;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

export function LogLocationMap({ height = '200px', location }: LogLocationMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className="bg-muted rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-muted-foreground text-sm">Cargando mapa...</div>
      </div>
    )
  }

  return (
    <MapContainer
      center={[location.lat, location.lng] as LatLngExpression}
      zoom={10}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <Marker
        position={[location.lat, location.lng] as LatLngExpression}
        icon={locationIcon}
      >
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">Ubicación de captura</p>
            <p className="text-muted-foreground font-mono text-xs">
              {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
