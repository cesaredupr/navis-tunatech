'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker, GeoJSON } from 'react-leaflet'
import { type LatLngExpression, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { weatherZones, guatemalaZEE, ports } from '@/lib/mock-data'

interface WeatherMapProps {
  height?: string
}

const conditionColors = {
  optimal: { stroke: '#22c55e', fill: '#22c55e' },
  moderate: { stroke: '#3b82f6', fill: '#3b82f6' },
  strong: { stroke: '#f59e0b', fill: '#f59e0b' },
}

// Port icon
const portIcon = (name: string) => divIcon({
  html: `<div style="
    padding: 4px 8px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid #00d4aa;
    border-radius: 4px;
    color: white;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">${name}</div>`,
  className: '',
  iconSize: [100, 24],
  iconAnchor: [50, 12],
})

// Wind arrow component
function WindArrow({ start, direction, speed }: { start: { lat: number; lng: number }; direction: string; speed: number }) {
  // Calculate end point based on direction
  const directionAngles: Record<string, number> = {
    'N': 180, 'S': 0, 'E': 270, 'W': 90,
    'NE': 225, 'NW': 135, 'SE': 315, 'SW': 45,
    'SO': 45, // Spanish for SW
  }
  
  const angle = (directionAngles[direction] || 0) * (Math.PI / 180)
  const length = 0.3 // degrees
  
  const end = {
    lat: start.lat + length * Math.cos(angle),
    lng: start.lng + length * Math.sin(angle)
  }

  return (
    <Polyline
      positions={[
        [start.lat, start.lng],
        [end.lat, end.lng],
      ] as LatLngExpression[]}
      pathOptions={{
        color: '#60a5fa',
        weight: 2,
        opacity: 0.8,
      }}
    />
  )
}

export function WeatherMap({ height = '400px' }: WeatherMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className="bg-muted rounded-xl flex items-center justify-center w-full h-[300px] md:h-[500px]"
        style={{ height }}
      >
        <div className="text-muted-foreground">Cargando mapa climático...</div>
      </div>
    )
  }

  // ZEE style
  const zeeStyle = {
    color: '#00d4aa',
    weight: 1,
    opacity: 0.4,
    fillColor: '#00d4aa',
    fillOpacity: 0.05,
  }

  return (
    <MapContainer
      center={[13.5, -91.5] as LatLngExpression}
      zoom={7}
      style={{ height, width: '100%' }}
      className="z-0 rounded-xl overflow-hidden w-full"
    >
      {/* Dark ocean tiles */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Guatemala ZEE */}
      <GeoJSON 
        data={guatemalaZEE.pacific as GeoJSON.Feature} 
        style={zeeStyle}
      />

      {/* Port markers */}
      <Marker
        position={[ports.puertoQuetzal.lat, ports.puertoQuetzal.lng] as LatLngExpression}
        icon={portIcon('Puerto Quetzal')}
      />
      <Marker
        position={[ports.champerico.lat, ports.champerico.lng] as LatLngExpression}
        icon={portIcon('Champerico')}
      />
      <Marker
        position={[ports.sanJose.lat, ports.sanJose.lng] as LatLngExpression}
        icon={portIcon('Puerto San José')}
      />

      {/* Weather zones */}
      {weatherZones.map((zone) => {
        const colors = conditionColors[zone.condition as keyof typeof conditionColors]
        return (
          <CircleMarker
            key={zone.id}
            center={[zone.center.lat, zone.center.lng] as LatLngExpression}
            radius={35}
            pathOptions={{
              color: colors.stroke,
              weight: 2,
              fillColor: colors.fill,
              fillOpacity: 0.2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold">{zone.name}</p>
                <p>Viento: {zone.windSpeed} km/h</p>
                <p>Dirección: {zone.windDir}</p>
                <p className={`font-medium ${
                  zone.condition === 'optimal' ? 'text-green-500' :
                  zone.condition === 'moderate' ? 'text-blue-500' : 'text-amber-500'
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
      {weatherZones.map((zone) => (
        <WindArrow
          key={`wind-${zone.id}`}
          start={zone.center}
          direction={zone.windDir}
          speed={zone.windSpeed}
        />
      ))}

      {/* Inner circles for better visibility */}
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
