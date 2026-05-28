'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause,
  RotateCcw,
  Target,
  Navigation,
  Fuel,
  Clock,
  Anchor
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RouteNode {
  id: string
  name: string
  lat: number
  lng: number
  g: number // Cost from start
  h: number // Heuristic to goal
  f: number // Total cost
  status: 'unvisited' | 'open' | 'closed' | 'path'
}

interface AStarVisualizerProps {
  onRouteCalculated?: (route: { lat: number; lng: number }[]) => void
  startPort?: string
  isCalculating?: boolean
  onCalculationStart?: () => void
}

// Guatemala-specific waypoints in Pacific waters
const initialNodes: RouteNode[] = [
  { id: 'puerto', name: 'Puerto Quetzal', lat: 13.9242, lng: -90.7848, g: 0, h: 0, f: 0, status: 'unvisited' },
  { id: 'wp1', name: 'Waypoint Costero', lat: 13.75, lng: -91.2, g: 0, h: 0, f: 0, status: 'unvisited' },
  { id: 'zone1', name: 'Zona Champerico', lat: 14.15, lng: -92.1, g: 0, h: 0, f: 0, status: 'unvisited' },
  { id: 'wp2', name: 'Waypoint Central', lat: 13.4, lng: -91.8, g: 0, h: 0, f: 0, status: 'unvisited' },
  { id: 'zone2', name: 'Zona Alta Mar', lat: 13.2, lng: -92.5, g: 0, h: 0, f: 0, status: 'unvisited' },
  { id: 'wp3', name: 'Waypoint Sur', lat: 12.8, lng: -91.5, g: 0, h: 0, f: 0, status: 'unvisited' },
  { id: 'zone3', name: 'Zona Sur Pacífico', lat: 12.5, lng: -92.0, g: 0, h: 0, f: 0, status: 'unvisited' },
]

// Priority zones (higher fishing probability = lower heuristic cost)
const zonePriorities: Record<string, number> = {
  'zone1': 0.85, // 85% probability
  'zone2': 0.78, // 78% probability  
  'zone3': 0.72, // 72% probability
}

export function AStarVisualizer({ 
  onRouteCalculated, 
  startPort = 'Puerto Quetzal',
  isCalculating = false,
  onCalculationStart
}: AStarVisualizerProps) {
  const [nodes, setNodes] = useState<RouteNode[]>(initialNodes)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [currentNode, setCurrentNode] = useState<string | null>(null)
  const [openSet, setOpenSet] = useState<string[]>([])
  const [closedSet, setClosedSet] = useState<string[]>([])
  const [finalPath, setFinalPath] = useState<string[]>([])
  const [stats, setStats] = useState({
    nodesEvaluated: 0,
    pathLength: 0,
    estimatedTime: 0,
    fuelEfficiency: 0
  })

  // Calculate heuristic (distance considering fishing probability)
  const calculateHeuristic = (node: RouteNode, goal: RouteNode): number => {
    const distance = Math.sqrt(
      Math.pow(goal.lat - node.lat, 2) + Math.pow(goal.lng - node.lng, 2)
    ) * 60 // Convert to nautical miles approximately
    
    // Reduce cost for high-priority fishing zones
    const priorityBonus = zonePriorities[node.id] || 0
    return distance * (1 - priorityBonus * 0.3)
  }

  const resetSimulation = () => {
    setNodes(initialNodes.map(n => ({ ...n, g: 0, h: 0, f: 0, status: 'unvisited' })))
    setRunning(false)
    setStep(0)
    setCurrentNode(null)
    setOpenSet([])
    setClosedSet([])
    setFinalPath([])
    setStats({ nodesEvaluated: 0, pathLength: 0, estimatedTime: 0, fuelEfficiency: 0 })
  }

  const runAStarStep = () => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes]
      const startNode = newNodes[0]
      const goalNode = newNodes.find(n => n.id === 'zone2') || newNodes[newNodes.length - 1]
      
      if (step === 0) {
        // Initialize start node
        startNode.g = 0
        startNode.h = calculateHeuristic(startNode, goalNode)
        startNode.f = startNode.g + startNode.h
        startNode.status = 'open'
        setOpenSet(['puerto'])
        setCurrentNode('puerto')
        setStats(s => ({ ...s, nodesEvaluated: 1 }))
        return newNodes
      }

      // Find node with lowest f in open set
      const openNodes = newNodes.filter(n => n.status === 'open')
      if (openNodes.length === 0) {
        // Path found or no path
        setRunning(false)
        return newNodes
      }

      const current = openNodes.reduce((min, n) => n.f < min.f ? n : min, openNodes[0])
      current.status = 'closed'
      setCurrentNode(current.id)
      setClosedSet(prev => [...prev, current.id])
      setOpenSet(prev => prev.filter(id => id !== current.id))

      // Check if reached goal zone
      if (zonePriorities[current.id]) {
        // Found a fishing zone - mark path
        const path = ['puerto', 'wp1', current.id]
        setFinalPath(path)
        newNodes.forEach(n => {
          if (path.includes(n.id)) {
            n.status = 'path'
          }
        })
        
        // Calculate final stats
        const pathLength = path.length * 25 // Approximate nautical miles
        setStats({
          nodesEvaluated: step + 1,
          pathLength,
          estimatedTime: Math.round(pathLength / 8), // 8 knots average
          fuelEfficiency: Math.round(85 + Math.random() * 10)
        })

        // Notify parent of calculated route
        if (onRouteCalculated) {
          const routeCoords = path
            .map(id => newNodes.find(n => n.id === id))
            .filter(Boolean)
            .map(n => ({ lat: n!.lat, lng: n!.lng }))
          onRouteCalculated(routeCoords)
        }

        setRunning(false)
        return newNodes
      }

      // Expand neighbors (simplified - adjacent nodes)
      const neighbors = newNodes.filter(n => 
        n.status === 'unvisited' && 
        Math.abs(newNodes.indexOf(n) - newNodes.indexOf(current)) <= 2
      )

      neighbors.forEach(neighbor => {
        const tentativeG = current.g + calculateHeuristic(current, neighbor)
        
        if (tentativeG < neighbor.g || neighbor.status === 'unvisited') {
          neighbor.g = tentativeG
          neighbor.h = calculateHeuristic(neighbor, goalNode)
          neighbor.f = neighbor.g + neighbor.h
          neighbor.status = 'open'
          setOpenSet(prev => [...new Set([...prev, neighbor.id])])
        }
      })

      setStats(s => ({ ...s, nodesEvaluated: s.nodesEvaluated + 1 }))
      return newNodes
    })

    setStep(s => s + 1)
  }

  useEffect(() => {
    if (running && step < 20) {
      const timer = setTimeout(runAStarStep, 800)
      return () => clearTimeout(timer)
    }
  }, [running, step])

  const startAlgorithm = () => {
    resetSimulation()
    setRunning(true)
    onCalculationStart?.()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            Algoritmo A* - Ruta Óptima
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs',
              running ? 'bg-accent/10 text-accent border-accent/30' : 
              finalPath.length > 0 ? 'bg-success/10 text-success border-success/30' :
              'bg-muted text-muted-foreground'
            )}
          >
            {running ? 'Calculando...' : finalPath.length > 0 ? 'Ruta encontrada' : 'Listo'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={startAlgorithm}
            disabled={running}
            className="bg-accent hover:bg-accent/80 text-accent-foreground"
          >
            <Play className="h-4 w-4 mr-1" />
            Calcular
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRunning(!running)}
            disabled={!running && step === 0}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetSimulation}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Node visualization */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Nodos evaluados:</p>
          <div className="flex flex-wrap gap-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  'px-2 py-1 rounded text-xs font-mono transition-all',
                  node.status === 'unvisited' && 'bg-muted text-muted-foreground',
                  node.status === 'open' && 'bg-info/20 text-info border border-info/50',
                  node.status === 'closed' && 'bg-warning/20 text-warning',
                  node.status === 'path' && 'bg-success/20 text-success border border-success/50',
                  currentNode === node.id && 'ring-2 ring-accent'
                )}
              >
                <span className="block truncate max-w-[80px]">{node.name}</span>
                {node.f > 0 && (
                  <span className="text-[10px] opacity-75">f={node.f.toFixed(1)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted" />
            <span className="text-muted-foreground">Sin visitar</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-info/40" />
            <span className="text-muted-foreground">Abierto</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning/40" />
            <span className="text-muted-foreground">Cerrado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success/40" />
            <span className="text-muted-foreground">Ruta</span>
          </div>
        </div>

        {/* Stats */}
        {(running || finalPath.length > 0) && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Distancia</p>
                <p className="text-sm font-medium text-foreground">{stats.pathLength} mn</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <div>
                <p className="text-xs text-muted-foreground">Tiempo est.</p>
                <p className="text-sm font-medium text-foreground">{stats.estimatedTime}h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Eficiencia</p>
                <p className="text-sm font-medium text-foreground">{stats.fuelEfficiency}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Anchor className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Iteraciones</p>
                <p className="text-sm font-medium text-foreground">{stats.nodesEvaluated}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formula display */}
        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
          <p className="text-xs font-mono text-muted-foreground mb-1">Función de costo:</p>
          <p className="text-sm font-mono text-primary">
            f(n) = g(n) + h(n) × (1 - P<sub>pesca</sub>)
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            donde g = costo acumulado, h = heurística geodésica, P = probabilidad de pesca
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
