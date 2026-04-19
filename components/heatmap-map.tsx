'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Popup } from 'react-leaflet'
import { type LatLngExpression, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fishingZones, heatmapPoints } from '@/lib/mock-data'

interface HeatmapMapProps {
  height?: string
  showRoute?: boolean
  optimizedRoute?: { lat: number; lng: number }[] | null
}

const portIcon = divIcon({
  html: `<div style="
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border-radius: 4px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
      <path d="M12 2v20M2 12h20M6 6l6-3 6 3"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const zoneIcon = (index: number) => divIcon({
  html: `<div style="
    width: 28px;
    height: 28px;
    background: ${index === 0 ? '#22c55e' : index === 1 ? '#0ea5e9' : '#14b8a6'};
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 12px;
  ">${index + 1}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export function HeatmapMap({ height = '500px', showRoute = false, optimizedRoute = null }: HeatmapMapProps) {
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
        <div className="text-muted-foreground">Cargando mapa de calor...</div>
      </div>
    )
  }

  const sortedZones = [...fishingZones].sort((a, b) => b.probability - a.probability)

  return (
    <MapContainer
      center={[-3.5, -81.5] as LatLngExpression}
      zoom={7}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Heatmap circles */}
      {heatmapPoints.map((point, index) => (
        <CircleMarker
          key={index}
          center={[point.lat, point.lng] as LatLngExpression}
          radius={30 * point.intensity}
          pathOptions={{
            color: 'transparent',
            fillColor: `rgba(34, 197, 94, ${point.intensity})`,
            fillOpacity: point.intensity * 0.6,
          }}
        />
      ))}

      {/* Fishing zones */}
      {fishingZones.map((zone) => (
        <CircleMarker
          key={zone.id}
          center={[zone.center.lat, zone.center.lng] as LatLngExpression}
          radius={zone.radius / 2}
          pathOptions={{
            color: `rgba(34, 197, 94, 0.8)`,
            weight: 2,
            fillColor: `rgba(34, 197, 94, ${zone.probability / 200})`,
            fillOpacity: 0.4,
            dashArray: '5, 5',
          }}
        >
          <Popup>
            <div className="text-sm min-w-[120px]">
              <p className="font-semibold">{zone.name}</p>
              <p className="text-success font-medium">{zone.probability}% probabilidad</p>
              <p className="text-muted-foreground">Radio: {zone.radius} km</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Optimized route */}
      {showRoute && optimizedRoute && optimizedRoute.length > 1 && (
        <>
          <Polyline
            positions={optimizedRoute.map(p => [p.lat, p.lng]) as LatLngExpression[]}
            pathOptions={{
              color: '#14b8a6',
              weight: 4,
              opacity: 0.9,
              dashArray: '10, 5',
            }}
          />
          
          {/* Port marker (start/end) */}
          <Marker
            position={[optimizedRoute[0].lat, optimizedRoute[0].lng] as LatLngExpression}
            icon={portIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Puerto de Guayaquil</p>
                <p className="text-muted-foreground">Punto de inicio/fin</p>
              </div>
            </Popup>
          </Marker>

          {/* Zone markers on route */}
          {optimizedRoute.slice(1, -1).map((point, index) => (
            <Marker
              key={index}
              position={[point.lat, point.lng] as LatLngExpression}
              icon={zoneIcon(index)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{sortedZones[index]?.name || `Zona ${index + 1}`}</p>
                  <p className="text-success">{sortedZones[index]?.probability || 0}% probabilidad</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}
    </MapContainer>
  )
}
