'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ship, Gauge, Navigation, Clock, MapPin, ChevronRight, Circle, Database, Server, Route, Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFlotilla, type Barco } from '@/hooks/useFlotilla'
import { ConectividadPanel } from '@/components/conectividad-panel'
import { cn } from '@/lib/utils'

const FleetMap = dynamic(() => import('@/components/fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[500px] bg-muted rounded-xl flex items-center justify-center w-full">
      <span className="text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
})

export default function MonitoreoPage() {
  const { barcos, loading, error, lastUpdate, refresh } = useFlotilla()
  const [selectedVessel, setSelectedVessel] = useState<Barco | null>(null)

  return (
    <DashboardLayout title="Monitoreo de Flotilla" subtitle="Zona Económica Exclusiva de Guatemala - Seguimiento en tiempo real">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30"><Database className="h-3 w-3 mr-1" />PostGIS GPS</Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><Server className="h-3 w-3 mr-1" />GeoServer WMS</Badge>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30"><Route className="h-3 w-3 mr-1" />Valhalla A*</Badge>
          <Badge variant="outline" className="bg-info/10 text-info border-info/30"><Cpu className="h-3 w-3 mr-1" />Tiempo Real</Badge>
          {lastUpdate && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Actualizado: {lastUpdate.toLocaleTimeString('es-GT')} · polling 30s
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={refresh}>Actualizar</Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vessel List */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Flotilla ({barcos.length} embarcaciones)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-sm text-muted-foreground">Cargando desde PostGIS…</div>
                ) : barcos.map(b => {
                  const activo = b.velocidad_nudos && b.velocidad_nudos > 0
                  return (
                    <button
                      key={b.id}
                      className={cn(
                        'w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left',
                        selectedVessel?.id === b.id && 'bg-secondary/70'
                      )}
                      onClick={() => setSelectedVessel(b)}
                    >
                      <Circle className={cn('h-3 w-3 flex-shrink-0', activo ? 'text-success fill-success' : 'text-muted-foreground fill-muted-foreground')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{b.codigo} — {b.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {activo ? `${b.velocidad_nudos} nudos · ${b.rumbo_grados}°` : 'Anclado'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Posiciones GPS en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FleetMap height="500px" showZones={false} />
            </CardContent>
          </Card>
        </div>

        {/* Panel de conectividad satelital */}
        <ConectividadPanel />

        {/* Selected vessel detail */}
        {selectedVessel && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                {selectedVessel.codigo} — {selectedVessel.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Gauge,      label: 'Velocidad',  value: `${selectedVessel.velocidad_nudos ?? 0} nudos` },
                  { icon: Navigation, label: 'Rumbo',      value: `${selectedVessel.rumbo_grados ?? 0}°` },
                  { icon: MapPin,     label: 'Posición',   value: selectedVessel.lat ? `${selectedVessel.lat.toFixed(4)}°N ${selectedVessel.lon?.toFixed(4)}°W` : 'Sin GPS' },
                  { icon: Clock,      label: 'Última señal', value: selectedVessel.timestamp_utc ? new Date(selectedVessel.timestamp_utc).toLocaleTimeString('es-GT') : '–' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-4 rounded-lg bg-secondary/50 text-center">
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
