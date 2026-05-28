'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Map, 
  Target, 
  Calendar,
  Filter,
  Route,
  TrendingUp,
  Database,
  Server,
  Cpu,
  Info
} from 'lucide-react'
import { fishingZones } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { TechStackPanel } from '@/components/tech-stack-panel'
import { RoutePlanner } from '@/components/route-planner'

const HeatmapMap = dynamic(() => import('@/components/heatmap-map').then(mod => mod.HeatmapMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[500px] bg-muted rounded-xl flex items-center justify-center w-full">
      <span className="text-muted-foreground">Cargando mapa de calor...</span>
    </div>
  ),
})

const dateFilters = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'quarter', label: 'Trimestre' },
]

const zoneFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'pacific', label: 'Pacífico Guatemalteco' },
  { id: 'zee', label: 'ZEE Guatemala' },
]

interface RoutePoint {
  id: string
  name: string
  lat: number
  lng: number
  type: 'port' | 'zone' | 'vessel' | 'custom'
}

interface CalculatedRoute {
  points: { lat: number; lng: number }[]
  distance: number
  estimatedTime: number
  fuelEstimate: number
  efficiency: number
  astarIterations: number
  nodesEvaluated: number
  waypoints: RoutePoint[]
}

export default function MapasPage() {
  const [selectedDate, setSelectedDate] = useState('week')
  const [selectedZone, setSelectedZone] = useState('all')
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null)
  const [origin, setOrigin] = useState<RoutePoint | null>(null)
  const [destination, setDestination] = useState<RoutePoint | null>(null)

  const handleRouteCalculated = (route: CalculatedRoute) => {
    setCalculatedRoute(route)
  }

  const handleOriginChange = (point: RoutePoint | null) => {
    setOrigin(point)
    if (!point) setCalculatedRoute(null)
  }

  const handleDestinationChange = (point: RoutePoint | null) => {
    setDestination(point)
    if (!point) setCalculatedRoute(null)
  }

  return (
    <DashboardLayout title="Mapas Inteligentes" subtitle="Planificador de rutas con Valhalla + A* para la ZEE de Guatemala">
      <div className="space-y-6">
        {/* Tech badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <Database className="h-3 w-3 mr-1" />
            PostGIS Activo
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Server className="h-3 w-3 mr-1" />
            GeoServer WMS
          </Badge>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
            <Route className="h-3 w-3 mr-1" />
            Valhalla Router
          </Badge>
          <Badge variant="outline" className="bg-info/10 text-info border-info/30">
            <Cpu className="h-3 w-3 mr-1" />
            A* Algorithm
          </Badge>
          {calculatedRoute && (
            <Badge className="bg-success/20 text-success border-0 ml-auto">
              Ruta calculada: {calculatedRoute.distance} mn
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:inline">Período:</span>
                <div className="flex gap-1">
                  {dateFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={selectedDate === filter.id ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedDate(filter.id)}
                      className={cn(
                        'text-xs',
                        selectedDate === filter.id && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="h-6 w-px bg-border hidden md:block" />

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:inline">Zona:</span>
                <div className="flex gap-1 flex-wrap">
                  {zoneFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={selectedZone === filter.id ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedZone(filter.id)}
                      className={cn(
                        'text-xs',
                        selectedZone === filter.id && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Planificador de Ruta Interactivo</p>
              <p className="text-xs text-muted-foreground mt-1">
                1. Seleccione el <span className="text-info font-medium">Punto A (Origen)</span> - Puerto o embarcación activa
                <br />
                2. Seleccione el <span className="text-success font-medium">Punto B (Destino)</span> - Zona de pesca o puerto
                <br />
                3. Presione <span className="text-primary font-medium">Calcular Ruta Óptima</span> para obtener la mejor ruta usando Valhalla y A*
              </p>
            </div>
          </div>
        </div>

        {/* Main content - 3 column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left panel - Route Planner */}
          <div className="xl:col-span-3 space-y-4">
            <RoutePlanner 
              onRouteCalculated={handleRouteCalculated}
              onOriginChange={handleOriginChange}
              onDestinationChange={handleDestinationChange}
            />
            
            {/* Tech Stack Panel - Collapsible on mobile */}
            <div className="hidden xl:block">
              <TechStackPanel />
            </div>
          </div>

          {/* Center - Heatmap */}
          <div className="xl:col-span-6">
            <Card className="bg-card border-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Mapa de Calor - Pacífico Guatemalteco
                  </div>
                  {origin && destination && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-info/10 text-info">
                        A: {origin.name.split(' ')[0]}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-[10px] bg-success/10 text-success">
                        B: {destination.name.split(' ')[0]}
                      </Badge>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapMap 
                  height="500px" 
                  showRoute={!!calculatedRoute}
                  optimizedRoute={calculatedRoute?.points || null}
                  origin={origin ? { lat: origin.lat, lng: origin.lng, name: origin.name } : null}
                  destination={destination ? { lat: destination.lat, lng: destination.lng, name: destination.name } : null}
                  interactive={true}
                />
                
                {/* Legend */}
                <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-muted-foreground">Probabilidad:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ background: '#00d4ff' }} />
                      <span className="text-xs text-muted-foreground">Baja</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ background: '#00d4aa' }} />
                      <span className="text-xs text-muted-foreground">Media</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ background: '#ff4444' }} />
                      <span className="text-xs text-muted-foreground">Alta</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-info" />
                      <span className="text-muted-foreground">Origen (A)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-success" />
                      <span className="text-muted-foreground">Destino (B)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Waypoint</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel - Zone Rankings and Route Details */}
          <div className="xl:col-span-3 space-y-4">
            {/* Route Summary Card - Shows when route is calculated */}
            {calculatedRoute && (
              <Card className="bg-card border-success/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-success">
                    <Route className="h-4 w-4" />
                    Resumen de Ruta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xl font-bold text-foreground">{calculatedRoute.distance}</p>
                      <p className="text-[10px] text-muted-foreground">Millas náuticas</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xl font-bold text-foreground">{calculatedRoute.estimatedTime}h</p>
                      <p className="text-[10px] text-muted-foreground">Tiempo est.</p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <p className="text-xs text-muted-foreground">Eficiencia de ruta</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success rounded-full transition-all duration-500"
                          style={{ width: `${calculatedRoute.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-success">{calculatedRoute.efficiency}%</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">Waypoints de la ruta:</p>
                    {calculatedRoute.waypoints.map((wp, i) => (
                      <div key={wp.id} className="flex items-center gap-2">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold',
                          i === 0 ? 'bg-info/20 text-info' :
                          i === calculatedRoute.waypoints.length - 1 ? 'bg-success/20 text-success' :
                          'bg-accent/20 text-accent'
                        )}>
                          {i === 0 ? 'A' : i === calculatedRoute.waypoints.length - 1 ? 'B' : i}
                        </div>
                        <span className="text-foreground truncate">{wp.name.split('(')[0].trim()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Zone Rankings */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Zonas Prioritarias
                  <Badge variant="outline" className="text-[10px] ml-auto">PostGIS</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fishingZones
                  .sort((a, b) => b.probability - a.probability)
                  .slice(0, 5)
                  .map((zone, index) => (
                    <div
                      key={zone.id}
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                            index === 0 ? 'bg-success/20 text-success' :
                            index === 1 ? 'bg-primary/20 text-primary' :
                            index === 2 ? 'bg-accent/20 text-accent' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {index + 1}
                          </span>
                          <span className="text-xs font-medium text-foreground">{zone.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-success" />
                          <span className="text-xs text-success">{zone.probability}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full mt-2">
                        <div 
                          className={cn(
                            'h-full rounded-full',
                            index === 0 ? 'bg-success' :
                            index === 1 ? 'bg-primary' :
                            index === 2 ? 'bg-accent' :
                            'bg-muted-foreground'
                          )}
                          style={{ width: `${zone.probability}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {zone.center.lat.toFixed(2)}°N, {Math.abs(zone.center.lng).toFixed(2)}°O
                      </p>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Tech Stack Panel - Mobile only */}
            <div className="xl:hidden">
              <TechStackPanel />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
