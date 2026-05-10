'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Ship, 
  Gauge, 
  Navigation, 
  Fuel, 
  Fish, 
  Clock,
  MapPin,
  ChevronRight,
  Circle
} from 'lucide-react'
import { vessels, type Vessel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const FleetMap = dynamic(() => import('@/components/fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[500px] bg-muted rounded-xl flex items-center justify-center w-full">
      <span className="text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
})

const statusColors = {
  active: 'bg-success',
  docked: 'bg-info',
  maintenance: 'bg-warning'
}

const statusLabels = {
  active: 'Activo',
  docked: 'En puerto',
  maintenance: 'Mantenimiento'
}

export default function MonitoreoPage() {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)

  return (
    <DashboardLayout title="Monitoreo de Flotilla" subtitle="Zona Económica Exclusiva de Guatemala - Seguimiento en tiempo real">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map */}
        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Mapa de Embarcaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FleetMap 
              height="500px" 
              selectedVessel={selectedVessel}
              onSelectVessel={setSelectedVessel}
              showRoutes={true}
            />
          </CardContent>
        </Card>

        {/* Vessel List */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Embarcaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {vessels.map((vessel) => (
                  <button
                    key={vessel.id}
                    onClick={() => setSelectedVessel(vessel)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      selectedVessel?.id === vessel.id
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Circle className={cn('h-2 w-2', statusColors[vessel.status])} fill="currentColor" />
                        <span className="text-sm font-medium text-foreground">{vessel.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{statusLabels[vessel.status]}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Vessel Details */}
          {selectedVessel && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-primary" />
                    {selectedVessel.name}
                  </span>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    selectedVessel.status === 'active' ? 'bg-success/20 text-success' :
                    selectedVessel.status === 'docked' ? 'bg-info/20 text-info' :
                    'bg-warning/20 text-warning'
                  )}>
                    {statusLabels[selectedVessel.status]}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Gauge className="h-4 w-4" />
                      <span className="text-xs">Velocidad</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{selectedVessel.speed} nudos</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Navigation className="h-4 w-4" />
                      <span className="text-xs">Rumbo</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{selectedVessel.heading}°</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Fuel className="h-4 w-4" />
                      <span className="text-xs">Combustible</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{selectedVessel.fuel}%</p>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                      <div 
                        className={cn(
                          'h-full rounded-full',
                          selectedVessel.fuel > 50 ? 'bg-success' : 
                          selectedVessel.fuel > 25 ? 'bg-warning' : 'bg-destructive'
                        )}
                        style={{ width: `${selectedVessel.fuel}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Fish className="h-4 w-4" />
                      <span className="text-xs">Captura</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{selectedVessel.catch} ton</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs">Última posición</span>
                  </div>
                  <p className="text-sm font-mono text-foreground">
                    {selectedVessel.position.lat.toFixed(4)}°, {selectedVessel.position.lng.toFixed(4)}°
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Última actualización</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {new Date(selectedVessel.lastUpdate).toLocaleString('es-GT', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Capitán: <span className="text-foreground">{selectedVessel.captain}</span></p>
                  <p>Puerto Base: <span className="text-foreground">{selectedVessel.port}</span></p>
                  <p>ID: <span className="text-foreground font-mono">{selectedVessel.id}</span></p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
