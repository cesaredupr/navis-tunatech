'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Ship,
  Award,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { 
  monthlyCapture, 
  zoneProductivity, 
  vesselPerformance 
} from '@/lib/mock-data'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts'
import { cn } from '@/lib/utils'

const COLORS = [
  'oklch(0.65 0.15 195)',
  'oklch(0.55 0.18 165)',
  'oklch(0.70 0.12 85)',
  'oklch(0.60 0.20 145)',
  'oklch(0.75 0.15 55)',
]

// Generate insights
const insights = [
  {
    id: 1,
    type: 'positive',
    title: 'Aumento en eficiencia',
    description: 'La Zona Norte Alta ha incrementado su productividad en un 15% comparado con el mes anterior.',
    metric: '+15%'
  },
  {
    id: 2,
    type: 'positive',
    title: 'Mejor rendimiento',
    description: 'El buque Pescador Valiente lidera en eficiencia con 95% de aprovechamiento de rutas.',
    metric: '95%'
  },
  {
    id: 3,
    type: 'neutral',
    title: 'Patrón estacional',
    description: 'Se detecta mayor actividad de cardúmenes en horarios matutinos (6:00 - 10:00 AM).',
    metric: '4h'
  },
  {
    id: 4,
    type: 'negative',
    title: 'Zona en declive',
    description: 'Costa Cercana muestra reducción de capturas. Se recomienda explorar zonas alternativas.',
    metric: '-12%'
  },
]

// Comparison data for routes
const routeComparison = [
  { route: 'Norte', actual: 85, optimized: 92 },
  { route: 'Central', actual: 72, optimized: 88 },
  { route: 'Sur', actual: 65, optimized: 78 },
  { route: 'Oeste', actual: 58, optimized: 75 },
]

export default function AnaliticaPage() {
  const totalCapture = monthlyCapture.reduce((acc, m) => acc + m.capture, 0)
  const avgCapture = Math.round(totalCapture / monthlyCapture.length)
  const topVessel = vesselPerformance.reduce((prev, curr) => 
    prev.efficiency > curr.efficiency ? prev : curr
  )

  return (
    <DashboardLayout title="Analítica" subtitle="Análisis de rendimiento y productividad">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Captura Total (6 meses)</p>
                  <p className="text-3xl font-bold text-foreground">{totalCapture}</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <ArrowUp className="h-3 w-3" />
                    +12% vs período anterior
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Promedio Mensual</p>
                  <p className="text-3xl font-bold text-foreground">{avgCapture}</p>
                  <p className="text-xs text-muted-foreground mt-1">toneladas</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Zonas Activas</p>
                  <p className="text-3xl font-bold text-foreground">{zoneProductivity.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">en monitoreo</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mejor Rendimiento</p>
                  <p className="text-lg font-bold text-foreground truncate">{topVessel.name}</p>
                  <p className="text-xs text-success mt-1">{topVessel.efficiency}% eficiencia</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone Productivity */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Productividad por Zona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneProductivity} layout="vertical">
                    <XAxis 
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 12 }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="zone"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.02 220)',
                        border: '1px solid oklch(0.28 0.025 220)',
                        borderRadius: '0.5rem',
                        color: 'oklch(0.95 0.01 220)',
                      }}
                    />
                    <Bar 
                      dataKey="captures" 
                      fill="oklch(0.65 0.15 195)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Vessel Performance Radar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Rendimiento de Embarcaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={vesselPerformance}>
                    <PolarGrid stroke="oklch(0.28 0.025 220)" />
                    <PolarAngleAxis 
                      dataKey="name" 
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: 'oklch(0.65 0.02 220)', fontSize: 10 }}
                    />
                    <Radar
                      name="Eficiencia"
                      dataKey="efficiency"
                      stroke="oklch(0.65 0.15 195)"
                      fill="oklch(0.65 0.15 195)"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.02 220)',
                        border: '1px solid oklch(0.28 0.025 220)',
                        borderRadius: '0.5rem',
                        color: 'oklch(0.95 0.01 220)',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Capture Distribution Pie */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribución por Zona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneProductivity}
                      dataKey="captures"
                      nameKey="zone"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {zoneProductivity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.02 220)',
                        border: '1px solid oklch(0.28 0.025 220)',
                        borderRadius: '0.5rem',
                        color: 'oklch(0.95 0.01 220)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {zoneProductivity.slice(0, 3).map((zone, index) => (
                  <div key={zone.zone} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-muted-foreground truncate">{zone.zone}</span>
                    </div>
                    <span className="text-foreground font-medium">{zone.captures}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Route Comparison */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Comparación de Rutas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={routeComparison}>
                    <XAxis 
                      dataKey="route"
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
                    />
                    <Bar 
                      dataKey="actual" 
                      fill="oklch(0.65 0.02 220)"
                      radius={[4, 4, 0, 0]}
                      name="Actual"
                    />
                    <Bar 
                      dataKey="optimized" 
                      fill="oklch(0.55 0.18 165)"
                      radius={[4, 4, 0, 0]}
                      name="Optimizado"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted" />
                  <span className="text-muted-foreground">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-accent" />
                  <span className="text-muted-foreground">Optimizado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Rankings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Ranking de Zonas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zoneProductivity
                  .sort((a, b) => b.efficiency - a.efficiency)
                  .map((zone, index) => (
                    <div
                      key={zone.zone}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                    >
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 ? 'bg-warning/20 text-warning' :
                        index === 1 ? 'bg-muted text-muted-foreground' :
                        index === 2 ? 'bg-accent/20 text-accent' :
                        'bg-secondary text-muted-foreground'
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{zone.zone}</p>
                        <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                          <div 
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${zone.efficiency}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground">{zone.efficiency}%</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              Insights Generados Automáticamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    insight.type === 'positive' ? 'bg-success/5 border-success/30' :
                    insight.type === 'negative' ? 'bg-destructive/5 border-destructive/30' :
                    'bg-info/5 border-info/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {insight.type === 'positive' ? (
                          <ArrowUp className="h-4 w-4 text-success" />
                        ) : insight.type === 'negative' ? (
                          <ArrowDown className="h-4 w-4 text-destructive" />
                        ) : (
                          <Minus className="h-4 w-4 text-info" />
                        )}
                        <span className="text-sm font-medium text-foreground">{insight.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                    <span className={cn(
                      'text-lg font-bold',
                      insight.type === 'positive' ? 'text-success' :
                      insight.type === 'negative' ? 'text-destructive' :
                      'text-info'
                    )}>
                      {insight.metric}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
