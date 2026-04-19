'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Map, 
  Target, 
  Calendar,
  Filter,
  Route,
  TrendingUp,
  MapPin,
  Zap
} from 'lucide-react'
import { fishingZones, heatmapPoints } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const HeatmapMap = dynamic(() => import('@/components/heatmap-map').then(mod => mod.HeatmapMap), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
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
  { id: 'all', label: 'Todas las zonas' },
  { id: 'north', label: 'Zona Norte' },
  { id: 'central', label: 'Zona Central' },
  { id: 'south', label: 'Zona Sur' },
]

export default function MapasPage() {
  const [selectedDate, setSelectedDate] = useState('week')
  const [selectedZone, setSelectedZone] = useState('all')
  const [showRouteOptimization, setShowRouteOptimization] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<{ lat: number; lng: number }[] | null>(null)

  const handleOptimizeRoute = () => {
    setShowRouteOptimization(true)
    // Simulate route optimization with top fishing zones
    const topZones = fishingZones
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3)
    
    setOptimizedRoute([
      { lat: -2.19, lng: -79.89 }, // Starting port
      ...topZones.map(z => z.center),
      { lat: -2.19, lng: -79.89 }, // Return to port
    ])
  }

  return (
    <DashboardLayout title="Mapas Inteligentes" subtitle="Análisis de zonas de pesca y rutas óptimas">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Período:</span>
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
                <span className="text-sm text-muted-foreground">Zona:</span>
                <div className="flex gap-1">
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

              <div className="flex-1" />

              <Button 
                onClick={handleOptimizeRoute}
                className="bg-accent hover:bg-accent/80 text-accent-foreground"
              >
                <Route className="h-4 w-4 mr-2" />
                Sugerir Ruta Óptima
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Heatmap */}
          <Card className="lg:col-span-3 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Mapa de Calor - Actividad de Pesca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HeatmapMap 
                height="500px" 
                showRoute={showRouteOptimization}
                optimizedRoute={optimizedRoute}
              />
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-xs text-muted-foreground">Probabilidad de captura:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-success/30" />
                  <span className="text-xs text-muted-foreground">Baja</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-success/60" />
                  <span className="text-xs text-muted-foreground">Media</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-success" />
                  <span className="text-xs text-muted-foreground">Alta</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Rankings */}
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Zonas Prioritarias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fishingZones
                  .sort((a, b) => b.probability - a.probability)
                  .map((zone, index) => (
                    <div
                      key={zone.id}
                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0 ? 'bg-success/20 text-success' :
                            index === 1 ? 'bg-primary/20 text-primary' :
                            index === 2 ? 'bg-accent/20 text-accent' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">{zone.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-success" />
                          <span className="text-xs text-success">{zone.probability}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {zone.radius} km radio
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full mt-2">
                        <div 
                          className="h-full rounded-full bg-success"
                          style={{ width: `${zone.probability}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Optimized Route Info */}
            {showRouteOptimization && optimizedRoute && (
              <Card className="bg-card border-border border-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-accent">
                    <Zap className="h-5 w-5" />
                    Ruta Optimizada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ruta sugerida basada en probabilidades de captura actuales
                  </p>
                  
                  <div className="space-y-2">
                    {optimizedRoute.map((point, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 || index === optimizedRoute.length - 1
                            ? 'bg-info/20 text-info'
                            : 'bg-success/20 text-success'
                        )}>
                          {index === 0 ? 'P' : index === optimizedRoute.length - 1 ? 'P' : index}
                        </div>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-mono">
                          {point.lat.toFixed(2)}°, {point.lng.toFixed(2)}°
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-accent">Estimaciones</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Distancia:</span>
                        <span className="text-foreground ml-1">~185 km</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tiempo:</span>
                        <span className="text-foreground ml-1">~14 horas</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Combustible:</span>
                        <span className="text-foreground ml-1">~45%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Eficiencia:</span>
                        <span className="text-success ml-1">Alta</span>
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
