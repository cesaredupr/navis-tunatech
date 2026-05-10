'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Cloud, 
  Thermometer, 
  Wind, 
  Droplets, 
  Waves, 
  Eye, 
  Sun,
  CloudRain,
  CloudSun,
  Navigation,
  Compass
} from 'lucide-react'
import { weatherData } from '@/lib/mock-data'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'

const WeatherMap = dynamic(() => import('@/components/weather-map').then(mod => mod.WeatherMap), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">Cargando mapa climático...</span>
    </div>
  ),
})

// Simulated hourly data
const hourlyTemp = [
  { hour: '00:00', temp: 24 },
  { hour: '03:00', temp: 23 },
  { hour: '06:00', temp: 23 },
  { hour: '09:00', temp: 25 },
  { hour: '12:00', temp: 27 },
  { hour: '15:00', temp: 28 },
  { hour: '18:00', temp: 26 },
  { hour: '21:00', temp: 25 },
]

const hourlyWind = [
  { hour: '00:00', speed: 12 },
  { hour: '03:00', speed: 10 },
  { hour: '06:00', speed: 8 },
  { hour: '09:00', speed: 14 },
  { hour: '12:00', speed: 18 },
  { hour: '15:00', speed: 20 },
  { hour: '18:00', speed: 16 },
  { hour: '21:00', speed: 14 },
]

const getWeatherIcon = (condition: string) => {
  if (condition.toLowerCase().includes('soleado')) return Sun
  if (condition.toLowerCase().includes('lluvia')) return CloudRain
  if (condition.toLowerCase().includes('nublado')) return Cloud
  return CloudSun
}

export default function ClimaPage() {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('es-GT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout title="Condiciones Climáticas" subtitle="Costa del Pacífico de Guatemala">
      <div className="space-y-6">
        {/* Current Weather Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Main temperature card */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{currentTime}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-bold text-foreground">{weatherData.temperature}</span>
                    <span className="text-2xl text-muted-foreground">°C</span>
                  </div>
                  <p className="text-lg text-foreground mt-1">{weatherData.forecast[0].condition}</p>
                  <p className="text-sm text-muted-foreground mt-2">Pacífico Guatemalteco</p>
                </div>
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <CloudSun className="h-12 w-12 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather metrics */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wind className="h-4 w-4" />
                <span className="text-xs">Viento</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{weatherData.windSpeed}</p>
              <p className="text-sm text-muted-foreground">km/h {weatherData.windDirection}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Droplets className="h-4 w-4" />
                <span className="text-xs">Humedad</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{weatherData.humidity}</p>
              <p className="text-sm text-muted-foreground">%</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Waves className="h-4 w-4" />
                <span className="text-xs">Oleaje</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{weatherData.waveHeight}</p>
              <p className="text-sm text-muted-foreground">metros</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Visibilidad</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{weatherData.visibility}</p>
              <p className="text-sm text-muted-foreground">condiciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Temperature Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-primary" />
                Temperatura 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyTemp}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 10 }}
                    />
                    <YAxis 
                      domain={[20, 32]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.02 220)',
                        border: '1px solid oklch(0.28 0.025 220)',
                        borderRadius: '0.5rem',
                        color: 'oklch(0.95 0.01 220)',
                      }}
                      formatter={(value: number) => [`${value}°C`, 'Temperatura']}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="oklch(0.65 0.15 195)"
                      strokeWidth={2}
                      fill="url(#colorTemp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Wind Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wind className="h-5 w-5 text-primary" />
                Velocidad del Viento 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyWind}>
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 10 }}
                    />
                    <YAxis 
                      domain={[0, 25]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.02 220)',
                        border: '1px solid oklch(0.28 0.025 220)',
                        borderRadius: '0.5rem',
                        color: 'oklch(0.95 0.01 220)',
                      }}
                      formatter={(value: number) => [`${value} km/h`, 'Viento']}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="oklch(0.55 0.18 165)"
                      strokeWidth={2}
                      dot={{ fill: 'oklch(0.55 0.18 165)', strokeWidth: 0, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 5-Day Forecast */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                Pronóstico 5 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weatherData.forecast.map((day, index) => {
                  const Icon = getWeatherIcon(day.condition)
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{day.day}</p>
                          <p className="text-xs text-muted-foreground">{day.condition}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-foreground">{day.temp}°</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Map */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Mapa Climático Regional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeatherMap height="400px" />
            
            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-info/60" />
                <span className="text-muted-foreground">Vientos moderados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning/60" />
                <span className="text-muted-foreground">Vientos fuertes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success/60" />
                <span className="text-muted-foreground">Condiciones óptimas</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Dirección del viento</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
