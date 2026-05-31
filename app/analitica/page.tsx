'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, TrendingDown, Minus, Ship, Award, Database, Calendar, Activity, Fish } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, ReferenceLine
} from 'recharts'
import { cn } from '@/lib/utils'

const COLORS = [
  'oklch(0.65 0.15 195)', 'oklch(0.55 0.18 165)',
  'oklch(0.70 0.12 85)',  'oklch(0.60 0.20 145)', 'oklch(0.75 0.15 55)',
]

const FALLBACK_MONTHLY = [
  { month: 'Ene', capture: 0 }, { month: 'Feb', capture: 0 }, { month: 'Mar', capture: 0 },
  { month: 'Abr', capture: 0 }, { month: 'May', capture: 0 }, { month: 'Jun', capture: 0 },
]

interface PatronMes {
  mes_label: string
  mes_num: string
  total_kg: number
  num_registros: number
  variacion_pct: number | null
  tendencia: 'pico' | 'minimo' | 'alza' | 'baja' | 'estable'
}

interface Patrones {
  mensual: PatronMes[]
  mes_pico: { mes_label: string; total_kg: number }
  promedio_mensual_kg: number
  total_anual_kg: number
  temporada_alta: string[]
  tendencia_general: 'alza' | 'baja' | 'estable'
}

interface AnaliticaData {
  captura_mensual: { month: string; capture: number }[]
  captura_por_especie: { especie: string; total_kg: number }[]
  rendimiento_flotilla: { codigo: string; nombre: string; total_kg: number }[]
  total_posiciones_gps: number
  patrones: Patrones
}

function TendenciaIcon({ t, size = 4 }: { t: string; size?: number }) {
  if (t === 'alza' || t === 'pico') return <TrendingUp className={`h-${size} w-${size} text-success`} />
  if (t === 'baja' || t === 'minimo') return <TrendingDown className={`h-${size} w-${size} text-destructive`} />
  return <Minus className={`h-${size} w-${size} text-muted-foreground`} />
}

function TendenciaBadge({ t }: { t: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pico:    { label: 'Pico',    cls: 'bg-success/20 text-success border-success/30' },
    alza:    { label: 'En alza', cls: 'bg-success/10 text-success border-success/30' },
    baja:    { label: 'En baja', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
    minimo:  { label: 'Mínimo',  cls: 'bg-destructive/20 text-destructive border-destructive/30' },
    estable: { label: 'Estable', cls: 'bg-muted text-muted-foreground border-border' },
  }
  const { label, cls } = map[t] || map.estable
  return <Badge variant="outline" className={cn('text-xs', cls)}>{label}</Badge>
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
  const patrones = data?.patrones
  const patronesMes = patrones?.mensual || []

  const tendenciaGeneral = patrones?.tendencia_general || 'estable'

  return (
    <DashboardLayout title="Analítica" subtitle="Análisis de rendimiento y patrones temporales — PostGIS">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <Database className="h-3 w-3 mr-1" />PostGIS en vivo
          </Badge>
          {data && <Badge variant="outline" className="text-xs text-muted-foreground">{data.total_posiciones_gps} posiciones GPS registradas</Badge>}
          {patrones && (
            <Badge variant="outline" className={cn('text-xs', tendenciaGeneral === 'alza' ? 'bg-success/10 text-success border-success/30' : tendenciaGeneral === 'baja' ? 'bg-destructive/10 text-destructive border-destructive/30' : 'text-muted-foreground')}>
              <TendenciaIcon t={tendenciaGeneral} size={3} />
              <span className="ml-1">Tendencia: {tendenciaGeneral === 'alza' ? 'En alza' : tendenciaGeneral === 'baja' ? 'En baja' : 'Estable'}</span>
            </Badge>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BarChart3, label: 'Captura Total', value: loading ? '…' : `${totalCapture.toFixed(1)} ton`, sub: 'últimos 6 meses', color: 'text-primary' },
            { icon: TrendingUp, label: 'GPS Registrados', value: loading ? '…' : (data?.total_posiciones_gps || 0).toLocaleString(), sub: 'posiciones en PostGIS', color: 'text-success' },
            { icon: Award,      label: 'Mejor Barco',    value: loading ? '…' : (topBarco?.codigo || '–'), sub: topBarco ? `${Number(topBarco.total_kg).toLocaleString()} kg` : 'sin datos', color: 'text-accent' },
            { icon: Ship,       label: 'Flotilla',       value: loading ? '…' : flotilla.length, sub: 'embarcaciones activas', color: 'text-info' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── PATRONES TEMPORALES ─── */}
        {patrones && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Patrones Temporales por Temporada
            </h2>

            {/* KPIs de patrones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mes pico de captura</p>
                    <p className="text-lg font-bold text-foreground">{patrones.mes_pico?.mes_label || '–'}</p>
                    <p className="text-xs text-muted-foreground">{Number(patrones.mes_pico?.total_kg || 0).toLocaleString()} kg</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Promedio mensual</p>
                    <p className="text-lg font-bold text-foreground">{patrones.promedio_mensual_kg.toLocaleString()} kg</p>
                    <p className="text-xs text-muted-foreground">base de comparación</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temporada alta</p>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {patrones.temporada_alta.length > 0
                        ? patrones.temporada_alta.slice(0, 3).join(', ') + (patrones.temporada_alta.length > 3 ? '…' : '')
                        : 'Sin datos suficientes'}
                    </p>
                    <p className="text-xs text-muted-foreground">{patrones.temporada_alta.length} meses sobre promedio</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfica de variación mes a mes */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Variación mensual de captura (últimos 12 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patronesMes.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos suficientes. Agrega bitácoras para ver patrones.
                  </div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={patronesMes} barSize={28}>
                        <XAxis dataKey="mes_label" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 11 }} />
                        <ReferenceLine y={patrones.promedio_mensual_kg} stroke="oklch(0.75 0.15 55)" strokeDasharray="4 3" label={{ value: 'Promedio', fill: 'oklch(0.75 0.15 55)', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'oklch(0.17 0.02 220)', border: '1px solid oklch(0.28 0.025 220)', borderRadius: '0.5rem', color: 'oklch(0.95 0.01 220)' }}
                          formatter={(v: number, _: string, props: {payload?: PatronMes}) => {
                            const pct = props?.payload?.variacion_pct
                            return [`${Number(v).toLocaleString()} kg${pct != null ? `  (${pct > 0 ? '+' : ''}${pct}% vs mes ant.)` : ''}`, 'Captura']
                          }}
                        />
                        <Bar dataKey="total_kg" radius={[4, 4, 0, 0]}
                          fill="oklch(0.65 0.15 195)"
                          label={false}
                        >
                          {patronesMes.map((m, i) => (
                            <Cell
                              key={i}
                              fill={
                                m.tendencia === 'pico'    ? 'oklch(0.55 0.18 165)' :
                                m.tendencia === 'alza'    ? 'oklch(0.60 0.15 195)' :
                                m.tendencia === 'baja'    ? 'oklch(0.60 0.18 25)'  :
                                m.tendencia === 'minimo'  ? 'oklch(0.50 0.20 25)'  :
                                'oklch(0.65 0.15 195)'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {[
                    { color: 'oklch(0.55 0.18 165)', label: 'Mes pico' },
                    { color: 'oklch(0.60 0.15 195)', label: 'En alza >10%' },
                    { color: 'oklch(0.65 0.15 195)', label: 'Estable' },
                    { color: 'oklch(0.60 0.18 25)',  label: 'En baja >10%' },
                    { color: 'oklch(0.50 0.20 25)',  label: 'Mínimo' },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabla de detalle mes a mes */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  Detalle por mes — variación y tendencia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Mes</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Captura (kg)</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Registros</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Vs mes anterior</th>
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {patronesMes.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">Sin datos</td></tr>
                      ) : patronesMes.map((m, i) => (
                        <tr key={i} className="hover:bg-secondary/30 transition-colors">
                          <td className="p-3 font-medium text-foreground">{m.mes_label}</td>
                          <td className="p-3 text-right text-foreground">{Number(m.total_kg).toLocaleString()}</td>
                          <td className="p-3 text-right text-muted-foreground">{m.num_registros}</td>
                          <td className="p-3 text-right">
                            {m.variacion_pct != null ? (
                              <span className={cn('font-medium', m.variacion_pct > 0 ? 'text-success' : m.variacion_pct < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                                {m.variacion_pct > 0 ? '+' : ''}{m.variacion_pct}%
                              </span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3 text-center">
                            <TendenciaBadge t={m.tendencia} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficas existentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Captura mensual */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Captura Mensual (ton) — últimos 6 meses
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
                Captura por Especie
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
                Rendimiento por Embarcación
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
