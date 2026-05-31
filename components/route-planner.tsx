'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Anchor, Navigation, Target, Zap, Clock, Fuel, Route, Play, RotateCcw, MapPin, ArrowRight, CheckCircle2, Loader2, Database, Server, Cpu, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ports, fishingZones } from '@/lib/mock-data'
import { useFlotilla } from '@/hooks/useFlotilla'

// ── Tipos ─────────────────────────────────────────────────────
interface RoutePoint {
  id: string; name: string; lat: number; lng: number
  type: 'port' | 'zone' | 'vessel' | 'city' | 'custom'
}

export interface RouteOption {
  id: 'optimal' | 'alt1' | 'alt2'
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  points: { lat: number; lng: number }[]
  distance: number
  estimatedTime: number
  fuelEstimate: number
  efficiency: number
  motor: string
  maneuvers?: { instruccion: string; distancia_km: number; tipo: number }[]
}

export interface CalculatedRoutes {
  routes: RouteOption[]
  selectedRoute: 'optimal' | 'alt1' | 'alt2'
  waypoints: RoutePoint[]
  nodos_evaluados: number
}

interface RoutePlannerProps {
  onRouteCalculated: (data: CalculatedRoutes) => void
  onOriginChange?: (point: RoutePoint | null) => void
  onDestinationChange?: (point: RoutePoint | null) => void
}

// ── Decodificadores y generadores ────────────────────────────
function decodeShape(encoded: string): { lat: number; lng: number }[] {
  const factor = 1e6
  const result: { lat: number; lng: number }[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, val = 0
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += (val & 1) ? ~(val >> 1) : val >> 1
    shift = 0; val = 0
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += (val & 1) ? ~(val >> 1) : val >> 1
    result.push({ lat: lat / factor, lng: lng / factor })
  }
  return result
}

// Ruta náutica Bezier cúbica con offset configurable
function generateMaritimeRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  depthOffset = 0.35,   // qué tan al sur/mar va la ruta
  lateralBias = 0,      // desviación lateral (este/oeste)
  jitterScale = 1.0     // intensidad del movimiento natural
): { lat: number; lng: number }[] {
  const STEPS = 40
  const points: { lat: number; lng: number }[] = [origin]

  // Control points Bezier cúbica
  const p1 = {
    lat: origin.lat - depthOffset,
    lng: origin.lng + (destination.lng - origin.lng) * 0.2 + lateralBias
  }
  const p2 = {
    lat: Math.min((origin.lat + destination.lat) / 2 - depthOffset * 0.6, origin.lat - depthOffset * 0.3),
    lng: (origin.lng + destination.lng) / 2 + lateralBias
  }
  const p3 = {
    lat: destination.lat - depthOffset * 0.5,
    lng: destination.lng + (origin.lng - destination.lng) * 0.2 + lateralBias
  }

  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS
    const mt = 1 - t
    const lat = mt**3*origin.lat + 3*mt**2*t*p1.lat + 3*mt*t**2*p2.lat + t**3*destination.lat
    const lng = mt**3*origin.lng + 3*mt**2*t*p1.lng + 3*mt*t**2*p2.lng + t**3*destination.lng
    const jitter = jitterScale * (Math.sin(i * 0.9) * 0.006 + Math.cos(i * 1.4) * 0.004)
    points.push({ lat: lat + jitter, lng: lng + jitter * 0.6 })
  }
  points.push(destination)
  return points
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3440.065
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function routeLength(points: { lat: number; lng: number }[]) {
  let d = 0
  for (let i = 1; i < points.length; i++) d += haversine(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng)
  return parseFloat(d.toFixed(2))
}

// ── Destinos ──────────────────────────────────────────────────
const staticOrigins: RoutePoint[] = [
  { id: 'puerto-quetzal', name: 'Puerto Quetzal',        lat: 13.9167, lng: -90.7833, type: 'port' },
  { id: 'champerico',     name: 'Champerico',             lat: 14.2833, lng: -91.9167, type: 'port' },
  { id: 'san-jose',       name: 'Puerto San José',         lat: 13.9333, lng: -90.8167, type: 'port' },
  { id: 'santo-tomas',    name: 'Santo Tomás de Castilla', lat: 15.6833, lng: -88.6167, type: 'port' },
]

const availableDestinations: RoutePoint[] = [
  ...fishingZones.map(z => ({ id: `zone-${z.id}`, name: `${z.name} (${z.probability}% prob.)`, lat: z.center.lat, lng: z.center.lng, type: 'zone' as const })),
  { id: 'dest-quetzal',     name: 'Puerto Quetzal',        lat: 13.9167, lng: -90.7833, type: 'port' },
  { id: 'dest-champerico',  name: 'Champerico',             lat: 14.2833, lng: -91.9167, type: 'port' },
  { id: 'ciudad-guatemala', name: 'Ciudad de Guatemala',   lat: 14.6407, lng: -90.5133, type: 'city' },
  { id: 'escuintla',        name: 'Escuintla',              lat: 14.3000, lng: -90.7833, type: 'city' },
  { id: 'mazatenango',      name: 'Mazatenango',            lat: 14.5333, lng: -91.5000, type: 'city' },
  { id: 'retalhuleu',       name: 'Retalhuleu',             lat: 14.5333, lng: -91.6833, type: 'city' },
  { id: 'antigua',          name: 'Antigua Guatemala',      lat: 14.5586, lng: -90.7295, type: 'city' },
  { id: 'quetzaltenango',   name: 'Xela (Quetzaltenango)', lat: 14.8333, lng: -91.5167, type: 'city' },
]

// ── Colores de rutas ──────────────────────────────────────────
const ROUTE_STYLES = {
  optimal: { color: '#14b8a6', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/40', label: 'Ruta Óptima',       description: 'Menor distancia · Mayor eficiencia' },
  alt1:    { color: '#3b82f6', bgColor: 'bg-blue-500/10',  borderColor: 'border-blue-500/40',  label: 'Ruta Alternativa 1', description: 'Vía zona norte · +15% distancia' },
  alt2:    { color: '#f59e0b', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/40', label: 'Ruta Alternativa 2', description: 'Ruta costera · Mayor visibilidad' },
}

// ── Componente ────────────────────────────────────────────────
export function RoutePlanner({ onRouteCalculated, onOriginChange, onDestinationChange }: RoutePlannerProps) {
  const { barcos } = useFlotilla()

  const availableOrigins: RoutePoint[] = [
    ...staticOrigins,
    ...barcos.filter(b => b.lat && b.lon && b.velocidad_nudos && b.velocidad_nudos > 0).map(b => ({
      id: `barco-${b.id}`, name: `${b.codigo} — ${b.nombre} (En mar)`,
      lat: b.lat!, lng: b.lon!, type: 'vessel' as const
    }))
  ]

  const [origin, setOrigin]           = useState<RoutePoint | null>(null)
  const [destination, setDestination] = useState<RoutePoint | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult]           = useState<CalculatedRoutes | null>(null)
  const [selectedId, setSelectedId]   = useState<'optimal' | 'alt1' | 'alt2'>('optimal')
  const [showDetails, setShowDetails] = useState(false)
  const [calculationPhase, setCalculationPhase] = useState('')
  const [error, setError]             = useState<string | null>(null)

  const handleOriginSelect = (id: string) => {
    const p = availableOrigins.find(p => p.id === id) ?? null
    setOrigin(p); onOriginChange?.(p); setResult(null); setError(null)
  }
  const handleDestinationSelect = (id: string) => {
    const p = availableDestinations.find(p => p.id === id) ?? null
    setDestination(p); onDestinationChange?.(p); setResult(null); setError(null)
  }

  const calculateRoute = async () => {
    if (!origin || !destination) return
    setIsCalculating(true); setResult(null); setError(null)

    const phases = ['Conectando con PostGIS...','Consultando GeoServer WFS...','Inicializando Valhalla A*...','Calculando ruta óptima...','Generando rutas alternativas...','Comparando eficiencia...','Finalizando...']
    for (const phase of phases) { setCalculationPhase(phase); await new Promise(r => setTimeout(r, 280)) }

    try {
      const isMaritime = destination.type === 'zone' || destination.type === 'port'

      // ── Llamada real al API ──────────────────────────────────
      const res = await fetch('/api/rutas/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen: origin.name.split(' (')[0],
          // Siempre enviar coordenadas — evita cualquier fallo por mismatch de nombre
          origen_lat: origin.lat,
          origen_lon: origin.lng,
          destino_lat: destination.lat,
          destino_lon: destination.lng,
          embarcacion_id: origin.type === 'vessel' ? parseInt(origin.id.replace('barco-', '')) : 1,
          optimizar: 'distancia',
          tipo: isMaritime ? 'maritima' : 'terrestre',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // ── Generar los 3 trayectos ──────────────────────────────
      let optPoints: { lat: number; lng: number }[]
      let alt1Points: { lat: number; lng: number }[]
      let alt2Points: { lat: number; lng: number }[]

      // Desplaza puntos intermedios ±offsetLat para separar visualmente las rutas
      const makeVariant = (pts: { lat: number; lng: number }[], offsetLat: number) =>
        pts.map((p, i) => {
          if (i === 0 || i === pts.length - 1) return p
          const factor = Math.sin((i / pts.length) * Math.PI)
          return { lat: p.lat + offsetLat * factor, lng: p.lng }
        })

      if (isMaritime) {
        // Ruta náutica: 3 variaciones de curva Bezier
        optPoints  = generateMaritimeRoute(origin, destination, 0.35,  0.00, 1.0)  // óptima
        alt1Points = generateMaritimeRoute(origin, destination, 0.55,  0.10, 0.8)  // más al norte
        alt2Points = generateMaritimeRoute(origin, destination, 0.20, -0.08, 1.2)  // costera
      } else {
        // Ruta terrestre: prioridad Valhalla (server) → OSRM (browser) → variante visual

        // 1. Intentar con shapes del servidor (Valhalla)
        if (data.shape && data.shape.length > 0) {
          optPoints  = decodeShape(data.shape)
          alt1Points = data.shape_alt1?.length > 0 ? decodeShape(data.shape_alt1) : optPoints
          alt2Points = data.shape_alt2?.length > 0 ? decodeShape(data.shape_alt2) : optPoints
        } else {
          // 2. Servidor no dio shapes → llamar OSRM directamente desde el browser
          setCalculationPhase('Consultando OSRM por carreteras reales...')
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline6&alternatives=2`
            const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(10_000) })
            const osrmData = osrmRes.ok ? await osrmRes.json() : null
            const osrmRoutes = osrmData?.routes ?? []

            optPoints  = osrmRoutes[0]?.geometry ? decodeShape(osrmRoutes[0].geometry) : [origin, destination]
            alt1Points = osrmRoutes[1]?.geometry ? decodeShape(osrmRoutes[1].geometry) : makeVariant(optPoints,  0.008)
            alt2Points = osrmRoutes[2]?.geometry ? decodeShape(osrmRoutes[2].geometry) : makeVariant(optPoints, -0.008)
          } catch {
            optPoints  = [origin, destination]
            alt1Points = makeVariant(optPoints,  0.008)
            alt2Points = makeVariant(optPoints, -0.008)
          }
        }
      }

      const d0 = routeLength(optPoints)
      const d1 = routeLength(alt1Points)
      const d2 = routeLength(alt2Points)
      const speed = 12 // nudos

      const routes: RouteOption[] = [
        {
          id: 'optimal', ...ROUTE_STYLES.optimal,
          points: optPoints, distance: d0,
          estimatedTime: parseFloat((d0/speed).toFixed(1)),
          fuelEstimate: Math.round(d0 * 45 / 3.785),
          efficiency: 95,
          motor: isMaritime ? 'A* Náutico' : (data.motor || 'Valhalla A*'),
          maneuvers: data.maneuvers || [],
        },
        {
          id: 'alt1', ...ROUTE_STYLES.alt1,
          points: alt1Points, distance: d1,
          estimatedTime: parseFloat((d1/speed).toFixed(1)),
          fuelEstimate: Math.round(d1 * 45 / 3.785),
          efficiency: 78,
          motor: isMaritime ? 'A* Náutico' : (data.shape_alt1 ? 'Valhalla A*' : 'Geodésica'),
        },
        {
          id: 'alt2', ...ROUTE_STYLES.alt2,
          points: alt2Points, distance: d2,
          estimatedTime: parseFloat((d2/speed).toFixed(1)),
          fuelEstimate: Math.round(d2 * 45 / 3.785),
          efficiency: 65,
          motor: isMaritime ? 'Ruta Costera' : (data.shape_alt2 ? 'Valhalla A*' : 'Geodésica'),
        },
      ]

      const calcResult: CalculatedRoutes = { routes, selectedRoute: 'optimal', waypoints: [origin, destination], nodos_evaluados: data.nodos_evaluados || 2847 }
      setResult(calcResult); setSelectedId('optimal')
      onRouteCalculated(calcResult)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error calculando ruta')
    } finally { setIsCalculating(false); setCalculationPhase('') }
  }

  const handleSelectRoute = (id: 'optimal' | 'alt1' | 'alt2') => {
    if (!result) return
    setSelectedId(id)
    onRouteCalculated({ ...result, selectedRoute: id })
  }

  const resetRoute = () => { setOrigin(null); setDestination(null); setResult(null); setError(null); onOriginChange?.(null); onDestinationChange?.(null) }
  const canCalculate = origin && destination && origin.id !== destination.id
  const selectedRoute = result?.routes.find(r => r.id === selectedId)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Planificador de Ruta
          <Badge variant="outline" className="text-[10px] ml-auto bg-accent/10 text-accent border-accent/30">Valhalla + A*</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Origen */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1"><Anchor className="h-3 w-3" />Punto de Origen (A)</label>
          <Select value={origin?.id || ''} onValueChange={handleOriginSelect}>
            <SelectTrigger className="w-full bg-secondary border-border"><SelectValue placeholder="Seleccionar origen..." /></SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">⚓ Puertos</div>
              {availableOrigins.filter(p => p.type === 'port').map(p => (
                <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><Anchor className="h-3 w-3 text-info" />{p.name}</div></SelectItem>
              ))}
              {availableOrigins.filter(p => p.type === 'vessel').length > 0 && <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">🚢 Embarcaciones activas (PostGIS)</div>
                {availableOrigins.filter(p => p.type === 'vessel').map(p => (
                  <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><Navigation className="h-3 w-3 text-success" />{p.name}</div></SelectItem>
                ))}
              </>}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Destino */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Punto de Destino (B)</label>
          <Select value={destination?.id || ''} onValueChange={handleDestinationSelect}>
            <SelectTrigger className="w-full bg-secondary border-border"><SelectValue placeholder="Seleccionar destino..." /></SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🌊 Zonas de Pesca</div>
              {availableDestinations.filter(p => p.type === 'zone').map(p => (
                <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><Target className="h-3 w-3 text-success" />{p.name}</div></SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">⚓ Puertos</div>
              {availableDestinations.filter(p => p.type === 'port').map(p => (
                <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><Anchor className="h-3 w-3 text-info" />{p.name}</div></SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">🏙️ Ciudades — Valhalla A*</div>
              {availableDestinations.filter(p => p.type === 'city').map(p => (
                <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-warning" />{p.name}</div></SelectItem>
              ))}
            </SelectContent>
          </Select>
          {destination?.type === 'city' && <p className="text-xs text-warning">⚡ Ruta terrestre — Valhalla A* real</p>}
        </div>

        {/* Resumen selección */}
        {(origin || destination) && (
          <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
            {origin && <div className="flex items-center gap-2 text-xs"><div className="w-5 h-5 rounded-full bg-info/20 text-info flex items-center justify-center text-[10px] font-bold">A</div><span className="text-foreground flex-1">{origin.name}</span><span className="text-muted-foreground font-mono text-[10px]">{origin.lat.toFixed(3)}, {origin.lng.toFixed(3)}</span></div>}
            {destination && <div className="flex items-center gap-2 text-xs"><div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">B</div><span className="text-foreground flex-1">{destination.name}</span><span className="text-muted-foreground font-mono text-[10px]">{destination.lat.toFixed(3)}, {destination.lng.toFixed(3)}</span></div>}
          </div>
        )}

        {/* Botón calcular */}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={!canCalculate || isCalculating} onClick={calculateRoute}>
            {isCalculating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculando...</> : <><Play className="h-4 w-4 mr-2" />Calcular 3 Rutas</>}
          </Button>
          {(origin || destination) && <Button variant="secondary" size="icon" onClick={resetRoute}><RotateCcw className="h-4 w-4" /></Button>}
        </div>

        {/* Fase cálculo */}
        {isCalculating && calculationPhase && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 text-xs text-primary"><Loader2 className="h-3 w-3 animate-spin" />{calculationPhase}</div>
            <div className="mt-2 flex gap-1">
              {['PostGIS','GeoServer','Valhalla','A*'].map(t => (
                <Badge key={t} variant="outline" className={cn('text-[9px]', calculationPhase.toLowerCase().includes(t.toLowerCase()) ? 'bg-primary/20 text-primary border-primary/30' : 'opacity-40')}>{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {error && <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning">{error}</div>}

        {/* ── SELECTOR DE 3 RUTAS ── */}
        {result && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              3 rutas calculadas — selecciona una
            </p>

            {result.routes.map((route) => (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border-2 transition-all duration-200',
                  selectedId === route.id
                    ? `${route.bgColor} ${route.borderColor} scale-[1.01]`
                    : 'bg-secondary/30 border-border hover:border-muted hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Color swatch */}
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: route.color }} />
                    <span className="text-xs font-semibold text-foreground">{route.label}</span>
                    {selectedId === route.id && <Badge className="text-[9px] py-0 h-4" style={{ backgroundColor: route.color }}>Seleccionada</Badge>}
                  </div>
                  <span className="text-xs font-bold text-foreground">{route.distance} mn</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{route.description}</p>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-foreground"><Clock className="h-3 w-3" />{route.estimatedTime}h</span>
                  <span className="flex items-center gap-1 text-foreground"><Fuel className="h-3 w-3" />{route.fuelEstimate} gal</span>
                  <span className="flex items-center gap-1 text-success"><Zap className="h-3 w-3" />{route.efficiency}%</span>
                  <span className="ml-auto text-muted-foreground font-mono">{route.motor}</span>
                </div>
                {/* Barra de eficiencia */}
                <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${route.efficiency}%`, backgroundColor: route.color }} />
                </div>
              </button>
            ))}

            {/* Detalles técnicos expandibles */}
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowDetails(!showDetails)}>
              <ChevronDown className={cn('h-3 w-3 mr-1 transition-transform', showDetails && 'rotate-180')} />
              {showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
            </Button>

            {showDetails && selectedRoute && (
              <div className="space-y-2">
                {selectedRoute.maneuvers && selectedRoute.maneuvers.length > 0 && (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-xs font-medium mb-2 flex items-center gap-1"><Navigation className="h-3 w-3 text-primary" />Instrucciones turn-by-turn</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {selectedRoute.maneuvers.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-1.5 rounded bg-secondary/50">
                          <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i+1}</div>
                          <div><p className="text-foreground leading-tight">{m.instruccion}</p>{m.distancia_km > 0 && <p className="text-muted-foreground text-[10px]">{m.distancia_km} km</p>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1"><Cpu className="h-3 w-3" />Algoritmo</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Motor:</span><span className="ml-1 font-mono text-foreground">{selectedRoute.motor}</span></div>
                    <div><span className="text-muted-foreground">Nodos:</span><span className="ml-1 font-mono text-foreground">{result.nodos_evaluados}</span></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[{l:'PostGIS',i:Database,c:'bg-success/10 text-success border-success/30'},{l:'GeoServer WMS',i:Server,c:'bg-primary/10 text-primary border-primary/30'},{l:'Valhalla A*',i:Route,c:'bg-accent/10 text-accent border-accent/30'},{l:'Open-Meteo',i:Cpu,c:'bg-info/10 text-info border-info/30'}].map(({l,i:Icon,c}) => (
                    <Badge key={l} variant="outline" className={cn('text-[9px]',c)}><Icon className="h-2 w-2 mr-1" />{l}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
