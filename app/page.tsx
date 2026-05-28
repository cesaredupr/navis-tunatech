'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Ship, 
  MapPin, 
  Thermometer, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Anchor,
  Fish,
  Database,
  Server,
  Route,
  Cpu
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { vessels, alerts, weatherData, fishingZones, monthlyCapture } from '@/lib/mock-data'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

// Dynamic import for map to avoid SSR issues
const FleetMap = dynamic(() => import('@/components/fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] bg-muted rounded-xl flex items-center justify-center w-full">
      <span className="text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
})

const activeVessels = vessels.filter(v => v.status === 'active').length
const topZone = fishingZones.reduce((prev, curr) => prev.probability > curr.probability ? prev : curr)
const totalCapture = vessels.reduce((acc, v) => acc + v.catch, 0)

export default function DashboardPage() {
  return (
    <DashboardLayout title="Panel de Control" subtitle="Flota pesquera - Guatemala">
      <div className="space-y-6">
        {/* Tech Stack Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <Database className="h-3 w-3 mr-1" />
            PostGIS
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Server className="h-3 w-3 mr-1" />
            GeoServer
          </Badge>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
            <Route className="h-3 w-3 mr-1" />
            Valhalla
          </Badge>
          <Badge variant="outline" className="bg-info/10 text-info border-info/30">
            <Cpu className="h-3 w-3 mr-1" />
            A* Router
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Barcos Activos</p>
                  <p className="text-3xl font-bold text-foreground">{activeVessels}</p>
                  <p className="text-xs text-muted-foreground mt-1">de {vessels.length} totales</p>
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
                  <p className="text-lg font-bold text-foreground truncate">{topZone.name}</p>
                  <p className="text-xs text-success mt-1">{topZone.probability}% probabilidad</p>
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
                  <p className="text-3xl font-bold text-foreground">{weatherData.temperature}°C</p>
                  <p className="text-xs text-muted-foreground mt-1">Viento: {weatherData.windSpeed} km/h {weatherData.windDirection}</p>
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
                  <p className="text-sm text-muted-foreground">Alertas Activas</p>
                  <p className="text-3xl font-bold text-foreground">{alerts.length}</p>
                  <p className="text-xs text-warning mt-1">{alerts.filter(a => a.type === 'warning').length} advertencias</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Anchor className="h-5 w-5 text-primary" />
                Vista de Flotilla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FleetMap height="300px" showZones={true} />
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'warning'
                        ? 'bg-warning/10 border-warning/30'
                        : alert.type === 'success'
                        ? 'bg-success/10 border-success/30'
                        : 'bg-info/10 border-info/30'
                    }`}
                  >
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString('es-GT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capture Trend */}
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
                  <AreaChart data={monthlyCapture}>
                    <defs>
                      <linearGradient id="colorCapture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.02 220)',
                        border: '1px solid oklch(0.28 0.025 220)',
                        borderRadius: '0.5rem',
                        color: 'oklch(0.95 0.01 220)',
                      }}
                      labelStyle={{ color: 'oklch(0.95 0.01 220)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="capture"
                      stroke="oklch(0.65 0.15 195)"
                      strokeWidth={2}
                      fill="url(#colorCapture)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total este mes</p>
                  <p className="text-xl font-bold text-foreground">421 toneladas</p>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+5.8% vs mes anterior</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Fish className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Captura en Curso</p>
                      <p className="text-xs text-muted-foreground">Atún Dorado - 12.5 ton</p>
                    </div>
                  </div>
                  <span className="text-xs text-success">En vivo</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Ship className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Pescador Valiente</p>
                      <p className="text-xs text-muted-foreground">Rumbo a zona norte</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Hace 15 min</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Nueva zona detectada</p>
                      <p className="text-xs text-muted-foreground">Alta probabilidad - Pacífico Guatemalteco</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Hace 45 min</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Anchor className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Mar Pacífico</p>
                      <p className="text-xs text-muted-foreground">Llegó a puerto - 32.8 ton</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Hace 2 horas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
