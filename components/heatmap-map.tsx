'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
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

interface HeatmapMapProps {
  height?: string
  showRoute?: boolean
  optimizedRoute?: { lat: number; lng: number }[] | null
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
        className="bg-muted rounded-xl flex items-center justify-center w-full h-[300px] md:h-[500px]"
        style={{ height }}
      >
        <div className="text-muted-foreground">Cargando mapa de calor...</div>
      </div>
    )
  }

  // Use provided route or default optimal route
  const routeToShow = optimizedRoute || optimalRoute

  // ZEE style
  const zeeStyle = {
    color: '#00d4aa',
    weight: 2,
    opacity: 0.6,
    fillColor: '#00d4aa',
    fillOpacity: 0.1,
  }

  const sortedZones = [...fishingZones].sort((a, b) => b.probability - a.probability)

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

      {/* Heatmap Layer */}
      <HeatmapLayer points={heatmapPoints} />

      {/* Optimized route */}
      {showRoute && routeToShow && routeToShow.length > 1 && (
        <>
          {/* Animated dashed route line */}
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
              icon={zoneIcon(index)}
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
    </MapContainer>
  )
}
