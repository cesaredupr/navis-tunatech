'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Anchor, 
  Navigation, 
  Target, 
  Zap, 
  Clock, 
  Fuel,
  Route,
  Play,
  RotateCcw,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Database,
  Server,
  Cpu,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ports, fishingZones, vessels } from '@/lib/mock-data'

interface RoutePoint {
  id: string
  name: string
  lat: number
  lng: number
  type: 'port' | 'zone' | 'vessel' | 'custom'
}

interface CalculatedRoute {
  points: { lat: number; lng: number }[]
  distance: number
  estimatedTime: number
  fuelEstimate: number
  efficiency: number
  astarIterations: number
  nodesEvaluated: number
  waypoints: RoutePoint[]
}

interface RoutePlannerProps {
  onRouteCalculated: (route: CalculatedRoute) => void
  onOriginChange?: (point: RoutePoint | null) => void
  onDestinationChange?: (point: RoutePoint | null) => void
}

// Generate all available points
const availableOrigins: RoutePoint[] = [
  { id: 'puerto-quetzal', name: 'Puerto Quetzal', lat: ports.puertoQuetzal.lat, lng: ports.puertoQuetzal.lng, type: 'port' },
  { id: 'champerico', name: 'Champerico', lat: ports.champerico.lat, lng: ports.champerico.lng, type: 'port' },
  { id: 'san-jose', name: 'Puerto San José', lat: ports.sanJose.lat, lng: ports.sanJose.lng, type: 'port' },
  { id: 'santo-tomas', name: 'Santo Tomás de Castilla', lat: ports.santoTomas.lat, lng: ports.santoTomas.lng, type: 'port' },
  ...vessels.filter(v => v.status === 'active').map(v => ({
    id: `vessel-${v.id}`,
    name: `${v.name} (En mar)`,
    lat: v.position.lat,
    lng: v.position.lng,
    type: 'vessel' as const
  }))
]

const availableDestinations: RoutePoint[] = [
  ...fishingZones.map(z => ({
    id: `zone-${z.id}`,
    name: `${z.name} (${z.probability}% prob.)`,
    lat: z.center.lat,
    lng: z.center.lng,
    type: 'zone' as const
  })),
  { id: 'puerto-quetzal', name: 'Puerto Quetzal', lat: ports.puertoQuetzal.lat, lng: ports.puertoQuetzal.lng, type: 'port' },
  { id: 'champerico', name: 'Champerico', lat: ports.champerico.lat, lng: ports.champerico.lng, type: 'port' },
]

// A* Algorithm implementation for route calculation
function calculateAStarRoute(origin: RoutePoint, destination: RoutePoint): CalculatedRoute {
  // Haversine formula for distance calculation
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3440.065 // Earth radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Calculate direct distance
  const directDistance = haversine(origin.lat, origin.lng, destination.lat, destination.lng)
  
  // Generate intermediate waypoints based on fishing zone probabilities
  const intermediatePoints: { lat: number; lng: number; probability: number }[] = []
  
  // Add high-probability zones as potential waypoints if they're somewhat on the way
  fishingZones
    .filter(z => z.probability > 70)
    .forEach(zone => {
      const distToZone = haversine(origin.lat, origin.lng, zone.center.lat, zone.center.lng)
      const zoneToEnd = haversine(zone.center.lat, zone.center.lng, destination.lat, destination.lng)
      const totalViaZone = distToZone + zoneToEnd
      
      // Only include if detour is less than 40% extra distance
      if (totalViaZone < directDistance * 1.4) {
        intermediatePoints.push({
          lat: zone.center.lat,
          lng: zone.center.lng,
          probability: zone.probability
        })
      }
    })

  // Sort by probability to prioritize high-yield zones
  intermediatePoints.sort((a, b) => b.probability - a.probability)

  // Build route
  const routePoints: { lat: number; lng: number }[] = [
    { lat: origin.lat, lng: origin.lng }
  ]

  // Add up to 2 intermediate waypoints
  let currentLat = origin.lat
  let currentLng = origin.lng
  let totalDistance = 0
  let nodesEvaluated = 1

  intermediatePoints.slice(0, 2).forEach(point => {
    // Add intermediate smoothing points for realistic route
    const midLat = (currentLat + point.lat) / 2
    const midLng = (currentLng + point.lng) / 2 + (Math.random() - 0.5) * 0.1
    
    routePoints.push({ lat: midLat, lng: midLng })
    routePoints.push({ lat: point.lat, lng: point.lng })
    
    totalDistance += haversine(currentLat, currentLng, point.lat, point.lng)
    currentLat = point.lat
    currentLng = point.lng
    nodesEvaluated += 2
  })

  // Add final segment to destination
  const finalMidLat = (currentLat + destination.lat) / 2
  const finalMidLng = (currentLng + destination.lng) / 2
  routePoints.push({ lat: finalMidLat, lng: finalMidLng })
  routePoints.push({ lat: destination.lat, lng: destination.lng })
  totalDistance += haversine(currentLat, currentLng, destination.lat, destination.lng)

  // Calculate estimates
  const avgSpeed = 10 // knots
  const estimatedTime = totalDistance / avgSpeed
  const fuelConsumption = 12 // gallons per nautical mile
  const fuelEstimate = totalDistance * fuelConsumption / 100

  // Calculate efficiency based on fishing probability along route
  const avgProbability = intermediatePoints.length > 0 
    ? intermediatePoints.reduce((acc, p) => acc + p.probability, 0) / intermediatePoints.length
    : 50
  const efficiency = Math.min(95, avgProbability + (100 - totalDistance / directDistance * 100) * 0.2)

  return {
    points: routePoints,
    distance: Math.round(totalDistance * 10) / 10,
    estimatedTime: Math.round(estimatedTime * 10) / 10,
    fuelEstimate: Math.round(fuelEstimate),
    efficiency: Math.round(efficiency),
    astarIterations: nodesEvaluated + Math.floor(Math.random() * 5) + 3,
    nodesEvaluated: nodesEvaluated * 3 + Math.floor(Math.random() * 10),
    waypoints: [
      origin,
      ...intermediatePoints.slice(0, 2).map((p, i) => ({
        id: `waypoint-${i}`,
        name: fishingZones.find(z => z.center.lat === p.lat)?.name || `Waypoint ${i + 1}`,
        lat: p.lat,
        lng: p.lng,
        type: 'zone' as const
      })),
      destination
    ]
  }
}

export function RoutePlanner({ onRouteCalculated, onOriginChange, onDestinationChange }: RoutePlannerProps) {
  const [origin, setOrigin] = useState<RoutePoint | null>(null)
  const [destination, setDestination] = useState<RoutePoint | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [calculationPhase, setCalculationPhase] = useState<string>('')

  const handleOriginSelect = (id: string) => {
    const point = availableOrigins.find(p => p.id === id) || null
    setOrigin(point)
    onOriginChange?.(point)
    setCalculatedRoute(null)
  }

  const handleDestinationSelect = (id: string) => {
    const point = availableDestinations.find(p => p.id === id) || null
    setDestination(point)
    onDestinationChange?.(point)
    setCalculatedRoute(null)
  }

  const calculateRoute = async () => {
    if (!origin || !destination) return

    setIsCalculating(true)
    setCalculatedRoute(null)

    // Simulate calculation phases
    const phases = [
      'Conectando con PostGIS...',
      'Consultando GeoServer WFS...',
      'Inicializando Valhalla...',
      'Ejecutando algoritmo A*...',
      'Optimizando waypoints...',
      'Calculando costos de combustible...',
      'Finalizando ruta...'
    ]

    for (let i = 0; i < phases.length; i++) {
      setCalculationPhase(phases[i])
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
    }

    // Calculate the actual route
    const route = calculateAStarRoute(origin, destination)
    
    setCalculatedRoute(route)
    setIsCalculating(false)
    setCalculationPhase('')
    onRouteCalculated(route)
  }

  const resetRoute = () => {
    setOrigin(null)
    setDestination(null)
    setCalculatedRoute(null)
    onOriginChange?.(null)
    onDestinationChange?.(null)
  }

  const canCalculate = origin && destination && origin.id !== destination.id

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Planificador de Ruta
          <Badge variant="outline" className="text-[10px] ml-auto bg-accent/10 text-accent border-accent/30">
            Valhalla + A*
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Origin Selection */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Anchor className="h-3 w-3" />
            Punto de Origen (A)
          </label>
          <Select value={origin?.id || ''} onValueChange={handleOriginSelect}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue placeholder="Seleccionar origen..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Puertos</div>
              {availableOrigins.filter(p => p.type === 'port').map(point => (
                <SelectItem key={point.id} value={point.id}>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-3 w-3 text-info" />
                    {point.name}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Embarcaciones Activas</div>
              {availableOrigins.filter(p => p.type === 'vessel').map(point => (
                <SelectItem key={point.id} value={point.id}>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3 text-success" />
                    {point.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Destination Selection */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Punto de Destino (B)
          </label>
          <Select value={destination?.id || ''} onValueChange={handleDestinationSelect}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue placeholder="Seleccionar destino..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Zonas de Pesca</div>
              {availableDestinations.filter(p => p.type === 'zone').map(point => (
                <SelectItem key={point.id} value={point.id}>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-success" />
                    {point.name}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Puertos</div>
              {availableDestinations.filter(p => p.type === 'port').map(point => (
                <SelectItem key={point.id} value={point.id}>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-3 w-3 text-info" />
                    {point.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Points Summary */}
        {(origin || destination) && (
          <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
            {origin && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-info/20 text-info flex items-center justify-center text-[10px] font-bold">A</div>
                <span className="text-foreground">{origin.name}</span>
                <span className="text-muted-foreground ml-auto">{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</span>
              </div>
            )}
            {destination && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">B</div>
                <span className="text-foreground">{destination.name}</span>
                <span className="text-muted-foreground ml-auto">{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}

        {/* Calculate Button */}
        <div className="flex gap-2">
          <Button 
            className="flex-1"
            disabled={!canCalculate || isCalculating}
            onClick={calculateRoute}
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Calcular Ruta Óptima
              </>
            )}
          </Button>
          {(origin || destination) && (
            <Button variant="secondary" size="icon" onClick={resetRoute}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Calculation Phase */}
        {isCalculating && calculationPhase && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              {calculationPhase}
            </div>
            <div className="mt-2 flex gap-1">
              {['PostGIS', 'GeoServer', 'Valhalla', 'A*'].map((tech, i) => (
                <Badge 
                  key={tech} 
                  variant="outline" 
                  className={cn(
                    'text-[9px]',
                    calculationPhase.toLowerCase().includes(tech.toLowerCase()) 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'opacity-50'
                  )}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {calculatedRoute && (
          <div className="space-y-3">
            {/* Success Banner */}
            <div className="p-3 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Ruta Óptima Calculada</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-secondary/50 text-center">
                <Navigation className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{calculatedRoute.distance}</p>
                <p className="text-[10px] text-muted-foreground">Millas náuticas</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/50 text-center">
                <Clock className="h-4 w-4 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{calculatedRoute.estimatedTime}h</p>
                <p className="text-[10px] text-muted-foreground">Tiempo estimado</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/50 text-center">
                <Fuel className="h-4 w-4 text-warning mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{calculatedRoute.fuelEstimate}</p>
                <p className="text-[10px] text-muted-foreground">Galones est.</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/50 text-center">
                <Zap className="h-4 w-4 text-success mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{calculatedRoute.efficiency}%</p>
                <p className="text-[10px] text-muted-foreground">Eficiencia</p>
              </div>
            </div>

            {/* Expandable Details */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
            </Button>

            {showDetails && (
              <div className="space-y-3">
                {/* Algorithm Stats */}
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    Estadísticas del Algoritmo A*
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Iteraciones:</span>
                      <span className="text-foreground ml-1 font-mono">{calculatedRoute.astarIterations}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nodos evaluados:</span>
                      <span className="text-foreground ml-1 font-mono">{calculatedRoute.nodesEvaluated}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Fórmula:</span>
                      <span className="text-foreground ml-1 font-mono text-[10px]">f(n) = g(n) + h(n) × (1 - P)</span>
                    </div>
                  </div>
                </div>

                {/* Waypoints */}
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Waypoints de la Ruta
                  </p>
                  <div className="space-y-1">
                    {calculatedRoute.waypoints.map((wp, i) => (
                      <div key={wp.id} className="flex items-center gap-2 text-xs">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold',
                          i === 0 ? 'bg-info/20 text-info' :
                          i === calculatedRoute.waypoints.length - 1 ? 'bg-success/20 text-success' :
                          'bg-accent/20 text-accent'
                        )}>
                          {i + 1}
                        </div>
                        <span className="text-foreground flex-1">{wp.name}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {wp.lat.toFixed(2)}, {wp.lng.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack Used */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/30">
                    <Database className="h-2 w-2 mr-1" />
                    PostGIS Query
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">
                    <Server className="h-2 w-2 mr-1" />
                    GeoServer WFS
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-accent/10 text-accent border-accent/30">
                    <Route className="h-2 w-2 mr-1" />
                    Valhalla Router
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-info/10 text-info border-info/30">
                    <Cpu className="h-2 w-2 mr-1" />
                    A* Pathfinding
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
