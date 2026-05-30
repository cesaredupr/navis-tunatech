'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, CircleMarker, GeoJSON, useMap } from 'react-leaflet'
import { type LatLngExpression, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fishingZones, guatemalaZEE, ports, type Vessel } from '@/lib/mock-data'
import { useFlotilla, type Barco } from '@/hooks/useFlotilla'

// ── Iconos ────────────────────────────────────────────────────
const createShipIcon = (activo: boolean) => {
  const color = activo ? '#22c55e' : '#64748b'
  return divIcon({
    html: `<div style="width:32px;height:32px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
        <path d="M12 10v4"/><path d="M12 2v3"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const portIcon = divIcon({
  html: `<div style="width:28px;height:28px;background:#3b82f6;border-radius:4px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3Z"/>
      <path d="M6 17v4"/><path d="M18 17v4"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

// ── Props ─────────────────────────────────────────────────────
interface FleetMapProps {
  selectedVessel?: Vessel | null
  onSelectVessel?: (vessel: Vessel) => void
  showZones?: boolean
  showRoutes?: boolean
  showZEE?: boolean
  showPorts?: boolean
  showWMS?: boolean
  height?: string
  center?: [number, number]
  zoom?: number
  region?: 'pacific' | 'caribbean' | 'general'
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => { if (center) map.setView(center, zoom || map.getZoom()) }, [center, zoom, map])
  return null
}

const regionCenters = {
  pacific:   { center: [13.5, -91.5] as [number, number], zoom: 7 },
  caribbean: { center: [15.7, -88.5] as [number, number], zoom: 7 },
  general:   { center: [14.0, -90.5] as [number, number], zoom: 6 },
}

export function FleetMap({
  selectedVessel,
  onSelectVessel,
  showZones = false,
  showZEE = true,
  showPorts = true,
  showWMS = true,
  height = '400px',
  center,
  zoom,
  region = 'pacific'
}: FleetMapProps) {
  const [mounted, setMounted] = useState(false)
  const { barcos, lastUpdate } = useFlotilla()

  useEffect(() => { setMounted(true) }, [])

  const defaultConfig = regionCenters[region]
  const mapCenter = center || defaultConfig.center
  const mapZoom = zoom || defaultConfig.zoom

  if (!mounted) {
    return (
      <div className="bg-muted rounded-xl flex items-center justify-center w-full" style={{ height }}>
        <div className="text-muted-foreground">Cargando mapa...</div>
      </div>
    )
  }

  const zeeStyle = { color: '#00d4aa', weight: 2, opacity: 0.8, fillColor: '#00d4aa', fillOpacity: 0.15 }

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter as LatLngExpression}
        zoom={mapZoom}
        style={{ height, width: '100%' }}
        className="z-0 rounded-xl overflow-hidden w-full"
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Mapa base oscuro */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Capa WMS de GeoServer — posiciones GPS en tiempo real */}
        {showWMS && (
          <WMSTileLayer
            url="http://localhost:8090/geoserver/navis/wms"
            layers="navis:posiciones_gps"
            format="image/png"
            transparent={true}
            opacity={0.85}
            attribution="PostGIS + GeoServer"
          />
        )}

        {/* ZEE Guatemala */}
        {showZEE && (
          <>
            <GeoJSON data={guatemalaZEE.pacific as GeoJSON.Feature} style={zeeStyle} />
            <GeoJSON data={guatemalaZEE.caribbean as GeoJSON.Feature} style={zeeStyle} />
          </>
        )}

        {/* Puertos */}
        {showPorts && Object.values(ports).map((port) => (
          <Marker key={port.name} position={[port.lat, port.lng] as LatLngExpression} icon={portIcon}>
            <Popup>
              <div className="text-sm min-w-[120px]">
                <p className="font-semibold">{port.name}</p>
                <p className="text-xs text-gray-500">Puerto base</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Zonas de pesca */}
        {showZones && fishingZones.map((zone) => (
          <CircleMarker
            key={zone.id}
            center={[zone.center.lat, zone.center.lng] as LatLngExpression}
            radius={zone.probability / 3}
            pathOptions={{
              color: `rgba(34,197,94,${zone.probability / 100})`,
              fillColor: `rgba(34,197,94,${zone.probability / 200})`,
              fillOpacity: 0.5,
            }}
          >
            <Popup>
              <p className="font-semibold text-sm">{zone.name}</p>
              <p className="text-xs">Probabilidad: {zone.probability}%</p>
            </Popup>
          </CircleMarker>
        ))}

        {/* Marcadores de barcos — datos reales de PostGIS */}
        {barcos.map((barco: Barco) => {
          if (!barco.lat || !barco.lon) return null
          const activo = !!(barco.velocidad_nudos && barco.velocidad_nudos > 0)
          return (
            <Marker
              key={barco.id}
              position={[barco.lat, barco.lon] as LatLngExpression}
              icon={createShipIcon(activo)}
            >
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-semibold">{barco.codigo} — {barco.nombre}</p>
                  <p className="text-xs text-gray-500">Velocidad: {barco.velocidad_nudos ?? 0} nudos</p>
                  <p className="text-xs text-gray-500">Rumbo: {barco.rumbo_grados ?? 0}°</p>
                  <p className="text-xs text-gray-500">Lat: {barco.lat.toFixed(4)}°N</p>
                  <p className="text-xs text-gray-500">Lon: {barco.lon.toFixed(4)}°W</p>
                  {barco.timestamp_utc && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(barco.timestamp_utc).toLocaleTimeString('es-GT')}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Badge de estado */}
      {lastUpdate && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-black/70 text-white text-xs px-2 py-1 rounded">
          GPS PostGIS · {lastUpdate.toLocaleTimeString('es-GT')}
        </div>
      )}
    </div>
  )
}
