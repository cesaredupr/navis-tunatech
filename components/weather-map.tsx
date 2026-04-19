'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet'
import { type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface WeatherMapProps {
  height?: string
}

// Simulated weather zones
const weatherZones = [
  { id: 1, center: { lat: -2.5, lng: -80.5 }, condition: 'optimal', windSpeed: 12, windDir: 'SW' },
  { id: 2, center: { lat: -3.0, lng: -81.5 }, condition: 'moderate', windSpeed: 18, windDir: 'S' },
  { id: 3, center: { lat: -3.5, lng: -82.5 }, condition: 'strong', windSpeed: 25, windDir: 'SE' },
  { id: 4, center: { lat: -4.0, lng: -81.0 }, condition: 'optimal', windSpeed: 10, windDir: 'W' },
  { id: 5, center: { lat: -2.8, lng: -82.0 }, condition: 'moderate', windSpeed: 15, windDir: 'SW' },
]

const conditionColors = {
  optimal: { stroke: '#22c55e', fill: '#22c55e' },
  moderate: { stroke: '#3b82f6', fill: '#3b82f6' },
  strong: { stroke: '#f59e0b', fill: '#f59e0b' },
}

// Wind direction arrows (simplified as lines)
const windArrows = [
  { start: { lat: -2.5, lng: -80.3 }, end: { lat: -2.7, lng: -80.6 } },
  { start: { lat: -3.0, lng: -81.3 }, end: { lat: -3.3, lng: -81.5 } },
  { start: { lat: -3.5, lng: -82.3 }, end: { lat: -3.7, lng: -82.6 } },
  { start: { lat: -4.0, lng: -80.8 }, end: { lat: -4.0, lng: -81.2 } },
]

export function WeatherMap({ height = '400px' }: WeatherMapProps) {
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
        <div className="text-muted-foreground">Cargando mapa climático...</div>
      </div>
    )
  }

  return (
    <MapContainer
      center={[-3.2, -81.2] as LatLngExpression}
      zoom={7}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Weather zones */}
      {weatherZones.map((zone) => {
        const colors = conditionColors[zone.condition as keyof typeof conditionColors]
        return (
          <CircleMarker
            key={zone.id}
            center={[zone.center.lat, zone.center.lng] as LatLngExpression}
            radius={40}
            pathOptions={{
              color: colors.stroke,
              weight: 2,
              fillColor: colors.fill,
              fillOpacity: 0.2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[120px]">
                <p className="font-semibold">Zona {zone.id}</p>
                <p>Viento: {zone.windSpeed} km/h</p>
                <p>Dirección: {zone.windDir}</p>
                <p className={`font-medium ${
                  zone.condition === 'optimal' ? 'text-success' :
                  zone.condition === 'moderate' ? 'text-info' : 'text-warning'
                }`}>
                  {zone.condition === 'optimal' ? 'Óptimo' :
                   zone.condition === 'moderate' ? 'Moderado' : 'Fuerte'}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Wind direction arrows */}
      {windArrows.map((arrow, index) => (
        <Polyline
          key={index}
          positions={[
            [arrow.start.lat, arrow.start.lng],
            [arrow.end.lat, arrow.end.lng],
          ] as LatLngExpression[]}
          pathOptions={{
            color: '#60a5fa',
            weight: 2,
            opacity: 0.8,
          }}
        />
      ))}

      {/* Smaller inner circles for visibility */}
      {weatherZones.map((zone) => {
        const colors = conditionColors[zone.condition as keyof typeof conditionColors]
        return (
          <CircleMarker
            key={`inner-${zone.id}`}
            center={[zone.center.lat, zone.center.lng] as LatLngExpression}
            radius={8}
            pathOptions={{
              color: 'white',
              weight: 2,
              fillColor: colors.fill,
              fillOpacity: 0.9,
            }}
          />
        )
      })}
    </MapContainer>
  )
}
