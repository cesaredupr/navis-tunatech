'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ship, MapPin, Thermometer, AlertTriangle, TrendingUp, Activity, Anchor, Fish, Database, Server, Route, Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFlotilla } from '@/hooks/useFlotilla'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const FleetMap = dynamic(() => import('@/components/fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] bg-muted rounded-xl flex items-center justify-center w-full">
      <span className="text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
})

export default function DashboardPage() {
  const { barcos, loading: loadingBarcos, lastUpdate } = useFlotilla()
  const [meteo, setMeteo] = useState<any>(null)
  const [alertas, setAlertas] = useState<{ total: number }>({ total: 0 })
  const [capturasMensuales, setCapturasMensuales] = useState<{ month: string; capture: number }[]>([])

  useEffect(() => {
    fetch('/api/meteo').then(r => r.json()).then(setMeteo).catch(() => {})
    fetch('/api/alertas/proximidad').then(r => r.json()).then(setAlertas).catch(() => {})
    fetch('/api/analitica').then(r => r.json()).then(d => {
      setCapturasMensuales(d.captura_mensual ?? [])
    }).catch(() => {})
  }, [])

  // Zona de mayor actividad: cuadrante con más barcos activos
  const zonaActiva = (() => {
    const activos = barcos.filter(b => b.lat && b.lon)
    if (!activos.length) return { nombre: '–', barcos: 0 }
    const zonas = [
      { nombre: 'Pacífico Noroeste', barcos: activos.filter(b => b.lon! < -91 && b.lat! > 14.5).length },
      { nombre: 'Pacífico Central',  barcos: activos.filter(b => b.lon! >= -91 && b.lon! < -90.5).length },
      { nombre: 'Pacífico Norte',    barcos: activos.filter(b => b.lat! > 15).length },
      { nombre: 'Pacífico Sur',      barcos: activos.filter(b => b.lat! < 14).length },
    ]
    return zonas.reduce((a, b) => a.barcos >= b.barcos ? a : b)
  })()

  const barcosActivos = barcos.filter(b => b.velocidad_nudos && b.velocidad_nudos > 0).length

  return (
    <DashboardLayout title="Panel de Control" subtitle="Flota pesquera - Guatemala">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30"><Database className="h-3 w-3 mr-1" />PostGIS</Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><Server className="h-3 w-3 mr-1" />GeoServer</Badge>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30"><Route className="h-3 w-3 mr-1" />Valhalla</Badge>
          <Badge variant="outline" className="bg-info/10 text-info border-info/30"><Cpu className="h-3 w-3 mr-1" />A* Router</Badge>
          {lastUpdate && <Badge variant="outline" className="text-xs text-muted-foreground">GPS: {lastUpdate.toLocaleTimeString('es-GT')}</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Barcos Activos</p>
                  <p className="text-3xl font-bold text-foreground">{loadingBarcos ? '…' : barcosActivos}</p>
                  <p className="text-xs text-muted-foreground mt-1">de {barcos.length} totales</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Ship className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Zona Mayor Actividad</p>
                  <p className="text-lg font-bold text-foreground truncate">{loadingBarcos ? '…' : zonaActiva.nombre}</p>
                  <p className="text-xs text-success mt-1">{loadingBarcos ? '' : `${zonaActiva.barcos} barco${zonaActiva.barcos !== 1 ? 's' : ''} en zona`}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clima Actual</p>
                  <p className="text-3xl font-bold text-foreground">{meteo ? `${meteo.temperatura_mar ?? '–'}°C` : '…'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{meteo ? `Oleaje: ${meteo.oleaje_m} m · ${meteo.estado_mar}` : 'Cargando…'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
                  <Thermometer className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertas Proximidad</p>
                  <p className="text-3xl font-bold text-foreground">{alertas.total}</p>
                  <p className="text-xs text-warning mt-1">barcos a &lt;2 mn entre sí</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Anchor className="h-5 w-5 text-primary" />
                Vista de Flotilla — PostGIS GPS en vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FleetMap height="300px" showZones={true} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Flotilla en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {loadingBarcos ? (
                  <p className="text-sm text-muted-foreground">Cargando desde PostGIS…</p>
                ) : barcos.map(b => (
                  <div key={b.id} className="p-3 rounded-lg bg-secondary/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.codigo} — {b.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.lat ? `${b.lat.toFixed(3)}°N ${b.lon?.toFixed(3)}°W` : 'Sin posición'}
                      </p>
                    </div>
                    <Badge variant="outline" className={b.velocidad_nudos && b.velocidad_nudos > 0 ? 'text-success border-success/30' : 'text-muted-foreground'}>
                      {b.velocidad_nudos && b.velocidad_nudos > 0 ? `${b.velocidad_nudos} kn` : 'Anclado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendencia de Captura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={capturasMensuales.length ? capturasMensuales : [{ month: 'Sin datos', capture: 0 }]}>
                    <defs>
                      <linearGradient id="colorCapture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'oklch(0.17 0.02 220)', border: '1px solid oklch(0.28 0.025 220)', borderRadius: '0.5rem', color: 'oklch(0.95 0.01 220)' }} />
                    <Area type="monotone" dataKey="capture" stroke="oklch(0.65 0.15 195)" strokeWidth={2} fill="url(#colorCapture)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Clima Open-Meteo — Pacífico GT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Temperatura del mar', value: meteo ? `${meteo.temperatura_mar ?? '–'}°C` : '…', icon: Thermometer },
                  { label: 'Viento', value: meteo ? `${meteo.viento_kmh ?? '–'} km/h ${meteo.direccion_viento}` : '…', icon: Activity },
                  { label: 'Oleaje', value: meteo ? `${meteo.oleaje_m ?? '–'} m · ${meteo.estado_mar}` : '…', icon: Fish },
                  { label: 'Fuente', value: 'Open-Meteo Marine API', icon: Server },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-info" />
                      </div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
