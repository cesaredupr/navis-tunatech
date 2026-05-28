'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, GeoJSON, useMap, CircleMarker } from 'react-leaflet'
import { type LatLngExpression, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fishingZones, guatemalaZEE, ports, heatmapPoints, optimalRoute } from '@/lib/mock-data'

// Heatmap layer component
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap()
  const heatLayerRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    const loadHeatmap = async () => {
      // Dynamically import leaflet.heat
      const L = await import('leaflet')
      await import('leaflet.heat')
      
      // Remove existing layer if any
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }

      // Create heatmap layer with Guatemala-specific gradient
      // @ts-expect-error - leaflet.heat extends L
      const heat = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.4: '#00d4ff',  // Cyan for low
          0.65: '#00d4aa', // Teal for medium
          1.0: '#ff4444'   // Red for high
        }
      })

      heat.addTo(map)
      heatLayerRef.current = heat
    }

    loadHeatmap()

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }
    }
  }, [map, points])

  return null
}

// Map controller for fitting bounds to route
function MapController({ route, origin, destination }: { 
  route?: { lat: number; lng: number }[] | null
  origin?: { lat: number; lng: number } | null
  destination?: { lat: number; lng: number } | null
}) {
  const map = useMap()

  useEffect(() => {
    if (route && route.length > 1) {
      const bounds = route.map(p => [p.lat, p.lng] as [number, number])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 })
    } else if (origin && destination) {
      const bounds = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      ] as [number, number][]
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 })
    }
  }, [map, route, origin, destination])

  return null
}

interface HeatmapMapProps {
  height?: string
  showRoute?: boolean
  optimizedRoute?: { lat: number; lng: number }[] | null
  origin?: { lat: number; lng: number; name?: string } | null
  destination?: { lat: number; lng: number; name?: string } | null
  interactive?: boolean
}

const portIcon = divIcon({
  html: `<div style="
    width: 28px;
    height: 28px;
    background: #3b82f6;
    border-radius: 4px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3Z"/>
      <path d="M6 17v4"/>
      <path d="M18 17v4"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

const originIcon = divIcon({
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    animation: pulse 2s infinite;
  ">A</div>
  <style>
    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 12px rgba(14, 165, 233, 0.5); }
      50% { box-shadow: 0 4px 20px rgba(14, 165, 233, 0.8); }
    }
  </style>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const destinationIcon = divIcon({
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    animation: pulse-green 2s infinite;
  ">B</div>
  <style>
    @keyframes pulse-green {
      0%, 100% { box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5); }
      50% { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.8); }
    }
  </style>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const waypointIcon = (index: number) => divIcon({
  html: `<div style="
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 12px;
  ">${index}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const zoneIcon = (index: number, probability: number) => divIcon({
  html: `<div style="
    width: 28px;
    height: 28px;
    background: ${probability > 85 ? '#22c55e' : probability > 70 ? '#0ea5e9' : '#14b8a6'};
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

export function HeatmapMap({ 
  height = '500px', 
  showRoute = false, 
  optimizedRoute = null,
  origin = null,
  destination = null,
  interactive = false
}: HeatmapMapProps) {
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
        <div className="text-muted-foreground">Cargando mapa de calor...</div>
      </div>
    )
  }

  // Use provided route or default optimal route
  const routeToShow = optimizedRoute || (showRoute ? optimalRoute : null)

  // ZEE style
  const zeeStyle = {
    color: '#00d4aa',
    weight: 2,
    opacity: 0.6,
    fillColor: '#00d4aa',
    fillOpacity: 0.1,
  }

  const sortedZones = [...fishingZones].sort((a, b) => b.probability - a.probability)

  // Determine what to show based on mode
  const showInteractiveMarkers = interactive && (origin || destination)
  const showDefaultRoute = showRoute && !interactive

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

      {/* Map controller for auto-fitting */}
      <MapController route={routeToShow} origin={origin} destination={destination} />

      {/* Guatemala ZEE */}
      <GeoJSON 
        data={guatemalaZEE.pacific as GeoJSON.Feature} 
        style={zeeStyle}
      />

      {/* Heatmap Layer */}
      <HeatmapLayer points={heatmapPoints} />

      {/* Interactive origin marker */}
      {origin && (
        <Marker
          position={[origin.lat, origin.lng] as LatLngExpression}
          icon={originIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-blue-600">Punto de Origen (A)</p>
              <p className="text-gray-700">{origin.name || 'Origen seleccionado'}</p>
              <p className="text-gray-500 text-xs">{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Interactive destination marker */}
      {destination && (
        <Marker
          position={[destination.lat, destination.lng] as LatLngExpression}
          icon={destinationIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-green-600">Punto de Destino (B)</p>
              <p className="text-gray-700">{destination.name || 'Destino seleccionado'}</p>
              <p className="text-gray-500 text-xs">{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Calculated route */}
      {routeToShow && routeToShow.length > 1 && (
        <>
          {/* Route shadow for depth effect */}
          <Polyline
            positions={routeToShow.map(p => [p.lat, p.lng]) as LatLngExpression[]}
            pathOptions={{
              color: '#000',
              weight: 6,
              opacity: 0.3,
            }}
          />
          
          {/* Main route line - animated dashed */}
          <Polyline
            positions={routeToShow.map(p => [p.lat, p.lng]) as LatLngExpression[]}
            pathOptions={{
              color: '#14b8a6',
              weight: 4,
              opacity: 0.9,
              dashArray: '15, 10',
              lineCap: 'round',
            }}
          />

          {/* Waypoint markers (intermediate points) */}
          {routeToShow.slice(1, -1).map((point, index) => (
            <Marker
              key={`waypoint-${index}`}
              position={[point.lat, point.lng] as LatLngExpression}
              icon={waypointIcon(index + 1)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Waypoint {index + 1}</p>
                  <p className="text-gray-500 text-xs">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {/* Show fishing zones when no custom route */}
      {!interactive && showDefaultRoute && (
        <>
          {/* Port marker (start/end) */}
          <Marker
            position={[ports.puertoQuetzal.lat, ports.puertoQuetzal.lng] as LatLngExpression}
            icon={portIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Puerto Quetzal</p>
                <p className="text-muted-foreground">Punto de inicio/fin</p>
              </div>
            </Popup>
          </Marker>

          {/* Zone markers on route - only show first 3 fishing zones */}
          {sortedZones.slice(0, 3).map((zone, index) => (
            <Marker
              key={zone.id}
              position={[zone.center.lat, zone.center.lng] as LatLngExpression}
              icon={zoneIcon(index, zone.probability)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{zone.name}</p>
                  <p className="text-success">{zone.probability}% probabilidad</p>
                  <p className="text-muted-foreground text-xs">Pacífico Guatemalteco</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {/* Show all ports as reference when in interactive mode */}
      {interactive && !origin && !destination && (
        Object.entries(ports).map(([key, port]) => (
          <CircleMarker
            key={key}
            center={[port.lat, port.lng] as LatLngExpression}
            radius={6}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{port.name}</p>
                <p className="text-gray-500 text-xs">Puerto disponible</p>
              </div>
            </Popup>
          </CircleMarker>
        ))
      )}

      {/* Show fishing zones as targets when in interactive mode */}
      {interactive && !destination && origin && (
        sortedZones.map((zone, index) => (
          <CircleMarker
            key={zone.id}
            center={[zone.center.lat, zone.center.lng] as LatLngExpression}
            radius={8 + (zone.probability / 20)}
            pathOptions={{
              color: zone.probability > 85 ? '#22c55e' : zone.probability > 70 ? '#0ea5e9' : '#14b8a6',
              fillColor: zone.probability > 85 ? '#22c55e' : zone.probability > 70 ? '#0ea5e9' : '#14b8a6',
              fillOpacity: 0.4,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{zone.name}</p>
                <p className="text-green-600">{zone.probability}% probabilidad</p>
                <p className="text-gray-500 text-xs">Zona de pesca disponible</p>
              </div>
            </Popup>
          </CircleMarker>
        ))
      )}
    </MapContainer>
  )
}
