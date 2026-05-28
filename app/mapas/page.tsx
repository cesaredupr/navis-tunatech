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
  MapPin,
  Zap,
  Anchor,
  Database,
  Server,
  Cpu
} from 'lucide-react'
import { fishingZones, optimalRoute, ports } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { TechStackPanel } from '@/components/tech-stack-panel'
import { AStarVisualizer } from '@/components/astar-visualizer'

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

export default function MapasPage() {
  const [selectedDate, setSelectedDate] = useState('week')
  const [selectedZone, setSelectedZone] = useState('all')
  const [showRouteOptimization, setShowRouteOptimization] = useState(false)
  const [calculatedRoute, setCalculatedRoute] = useState<{ lat: number; lng: number }[] | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleRouteCalculated = (route: { lat: number; lng: number }[]) => {
    setCalculatedRoute(route)
    setShowRouteOptimization(true)
    setIsCalculating(false)
  }

  const handleCalculationStart = () => {
    setIsCalculating(true)
    setShowRouteOptimization(false)
    setCalculatedRoute(null)
  }

  return (
    <DashboardLayout title="Mapas Inteligentes" subtitle="Zona Económica Exclusiva de Guatemala - Motor Valhalla + A*">
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

        {/* Main content - 3 column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left panel - Tech Stack */}
          <div className="xl:col-span-3 space-y-4">
            <TechStackPanel />
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
                  {showRouteOptimization && (
                    <Badge className="bg-success/20 text-success border-0">
                      Ruta A* activa
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapMap 
                  height="500px" 
                  showRoute={showRouteOptimization}
                  optimizedRoute={calculatedRoute || (showRouteOptimization ? optimalRoute : null)}
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Server className="h-3 w-3" />
                    Datos: GeoServer WMS/WFS
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel - A* Visualizer and Zones */}
          <div className="xl:col-span-3 space-y-4">
            <AStarVisualizer 
              onRouteCalculated={handleRouteCalculated}
              isCalculating={isCalculating}
              onCalculationStart={handleCalculationStart}
            />

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
                  .slice(0, 4)
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
                          className="h-full rounded-full bg-success"
                          style={{ width: `${zone.probability}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Route Info when active */}
            {showRouteOptimization && (
              <Card className="bg-card border-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-accent">
                    <Zap className="h-4 w-4" />
                    Ruta Valhalla
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Ruta optimizada usando motor Valhalla con heurística A* para máxima eficiencia en aguas guatemaltecas.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-info/20 text-info flex items-center justify-center">
                        <Anchor className="h-3 w-3" />
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-foreground">Puerto Quetzal</span>
                    </div>
                    
                    {fishingZones.slice(0, 2).map((zone, index) => (
                      <div key={zone.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-foreground">{zone.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Motor:</span>
                        <span className="text-foreground ml-1">Valhalla</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Algoritmo:</span>
                        <span className="text-foreground ml-1">A*</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Datos:</span>
                        <span className="text-foreground ml-1">PostGIS</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Render:</span>
                        <span className="text-foreground ml-1">GeoServer</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
