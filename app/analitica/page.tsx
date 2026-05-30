'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Ship, Award, Database } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'

const COLORS = [
  'oklch(0.65 0.15 195)', 'oklch(0.55 0.18 165)',
  'oklch(0.70 0.12 85)',  'oklch(0.60 0.20 145)', 'oklch(0.75 0.15 55)',
]

const FALLBACK_MONTHLY = [
  { month: 'Ene', capture: 0 }, { month: 'Feb', capture: 0 }, { month: 'Mar', capture: 0 },
  { month: 'Abr', capture: 0 }, { month: 'May', capture: 0 }, { month: 'Jun', capture: 0 },
]

interface AnaliticaData {
  captura_mensual: { month: string; capture: number }[]
  captura_por_especie: { especie: string; total_kg: number }[]
  rendimiento_flotilla: { codigo: string; nombre: string; total_kg: number }[]
  total_posiciones_gps: number
}

export default function AnaliticaPage() {
  const [data, setData] = useState<AnaliticaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analitica')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const monthly = data?.captura_mensual?.length ? data.captura_mensual : FALLBACK_MONTHLY
  const totalCapture = monthly.reduce((acc, m) => acc + Number(m.capture), 0)
  const especies = data?.captura_por_especie || []
  const flotilla = data?.rendimiento_flotilla || []
  const topBarco = flotilla.length ? flotilla[0] : null

  return (
    <DashboardLayout title="Analítica" subtitle="Análisis de rendimiento real — PostGIS">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <Database className="h-3 w-3 mr-1" />PostGIS en vivo
          </Badge>
          {data && <Badge variant="outline" className="text-xs text-muted-foreground">{data.total_posiciones_gps} posiciones GPS registradas</Badge>}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BarChart3, label: 'Captura Total', value: loading ? '…' : `${totalCapture.toFixed(1)} ton`, sub: 'últimos 6 meses', color: 'text-primary' },
            { icon: TrendingUp, label: 'GPS Registrados', value: loading ? '…' : (data?.total_posiciones_gps || 0).toLocaleString(), sub: 'posiciones en PostGIS', color: 'text-success' },
            { icon: Award,      label: 'Mejor Barco',    value: loading ? '…' : (topBarco?.codigo || '–'), sub: topBarco ? `${topBarco.total_kg} kg` : 'sin datos', color: 'text-accent' },
            { icon: Ship,       label: 'Flotilla',       value: loading ? '…' : flotilla.length, sub: 'embarcaciones activas', color: 'text-info' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`text-3xl font-bold text-foreground`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-secondary flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Captura mensual */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Captura Mensual (ton) — PostGIS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthly.every(m => m.capture === 0) ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  Sin registros de bitácora aún. Agrega capturas en la sección Bitácoras.
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly}>
                      <defs>
                        <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'oklch(0.17 0.02 220)', border: '1px solid oklch(0.28 0.025 220)', borderRadius: '0.5rem', color: 'oklch(0.95 0.01 220)' }} />
                      <Area type="monotone" dataKey="capture" stroke="oklch(0.65 0.15 195)" strokeWidth={2} fill="url(#colorC)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Captura por especie */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Captura por Especie — PostGIS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {especies.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Sin datos de especies aún.</div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={especies} dataKey="total_kg" nameKey="especie" cx="50%" cy="50%" outerRadius={80} label={({ especie, percent }) => `${especie?.split(' ')[1] || especie}: ${(percent * 100).toFixed(0)}%`}>
                        {especies.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'oklch(0.17 0.02 220)', border: '1px solid oklch(0.28 0.025 220)', borderRadius: '0.5rem' }} formatter={(v: number) => [`${v} kg`, 'Captura']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rendimiento por barco */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Rendimiento por Embarcación — PostGIS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flotilla.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flotilla}>
                      <XAxis dataKey="codigo" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'oklch(0.17 0.02 220)', border: '1px solid oklch(0.28 0.025 220)', borderRadius: '0.5rem', color: 'oklch(0.95 0.01 220)' }} formatter={(v: number) => [`${v} kg`, 'Captura']} />
                      <Bar dataKey="total_kg" fill="oklch(0.65 0.15 195)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
