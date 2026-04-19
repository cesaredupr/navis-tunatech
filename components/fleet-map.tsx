'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import { type LatLngExpression, Icon, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { vessels, fishingZones, type Vessel } from '@/lib/mock-data'

// Custom ship icon
const createShipIcon = (status: string) => {
  const colors = {
    active: '#22c55e',
    docked: '#3b82f6',
    maintenance: '#f59e0b'
  }
  const color = colors[status as keyof typeof colors] || colors.active
  
  return divIcon({
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
        <path d="M12 10v4"/>
        <path d="M12 2v3"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

interface FleetMapProps {
  selectedVessel?: Vessel | null
  onSelectVessel?: (vessel: Vessel) => void
  showZones?: boolean
  showRoutes?: boolean
  height?: string
  center?: [number, number]
  zoom?: number
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom())
    }
  }, [center, zoom, map])
  
  return null
}

export function FleetMap({
  selectedVessel,
  onSelectVessel,
  showZones = false,
  showRoutes = true,
  height = '400px',
  center = [-3.5, -81.5],
  zoom = 7
}: FleetMapProps) {
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
        <div className="text-muted-foreground">Cargando mapa...</div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center as LatLngExpression}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <MapController center={selectedVessel ? [selectedVessel.position.lat, selectedVessel.position.lng] as [number, number] : center} zoom={selectedVessel ? 10 : zoom} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Fishing zones */}
      {showZones && fishingZones.map((zone) => (
        <CircleMarker
          key={zone.id}
          center={[zone.center.lat, zone.center.lng] as LatLngExpression}
          radius={zone.probability / 3}
          pathOptions={{
            color: `rgba(34, 197, 94, ${zone.probability / 100})`,
            fillColor: `rgba(34, 197, 94, ${zone.probability / 200})`,
            fillOpacity: 0.5,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{zone.name}</p>
              <p>Probabilidad: {zone.probability}%</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Vessel routes */}
      {showRoutes && vessels.map((vessel) => (
        vessel.route.length > 0 && (
          <Polyline
            key={`route-${vessel.id}`}
            positions={vessel.route.map(p => [p.lat, p.lng]) as LatLngExpression[]}
            pathOptions={{
              color: vessel.id === selectedVessel?.id ? '#22c55e' : '#64748b',
              weight: vessel.id === selectedVessel?.id ? 3 : 2,
              opacity: vessel.id === selectedVessel?.id ? 1 : 0.5,
              dashArray: vessel.id === selectedVessel?.id ? undefined : '5, 5',
            }}
          />
        )
      ))}

      {/* Vessel markers */}
      {vessels.map((vessel) => (
        <Marker
          key={vessel.id}
          position={[vessel.position.lat, vessel.position.lng] as LatLngExpression}
          icon={createShipIcon(vessel.status)}
          eventHandlers={{
            click: () => onSelectVessel?.(vessel),
          }}
        >
          <Popup>
            <div className="text-sm min-w-[150px]">
              <p className="font-semibold text-foreground">{vessel.name}</p>
              <p className="text-muted-foreground">Capitán: {vessel.captain}</p>
              <p className="text-muted-foreground">Velocidad: {vessel.speed} nudos</p>
              <p className="text-muted-foreground">Estado: {vessel.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
