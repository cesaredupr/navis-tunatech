'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Route, 
  Server, 
  Cpu, 
  Activity,
  CheckCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TechItem {
  name: string
  description: string
  icon: React.ReactNode
  status: 'active' | 'processing' | 'standby'
  details: string[]
}

const techStack: TechItem[] = [
  {
    name: 'Valhalla',
    description: 'Motor de ruteo marítimo',
    icon: <Route className="h-5 w-5" />,
    status: 'active',
    details: [
      'Cálculo de rutas en tiempo real',
      'Optimización multi-waypoint',
      'Consideración de corrientes',
      'Evitación de zonas restringidas'
    ]
  },
  {
    name: 'PostGIS',
    description: 'Extensión geoespacial PostgreSQL',
    icon: <Database className="h-5 w-5" />,
    status: 'active',
    details: [
      'Almacenamiento de georeferencias',
      'Consultas espaciales avanzadas',
      'Análisis de polígonos ZEE',
      'Indexación espacial R-Tree'
    ]
  },
  {
    name: 'GeoServer',
    description: 'Servidor de mapas y datos GPS',
    icon: <Server className="h-5 w-5" />,
    status: 'active',
    details: [
      'Renderizado de capas WMS/WFS',
      'Streaming de datos GPS',
      'Heatmaps en tiempo real',
      'Exportación KML/GeoJSON'
    ]
  },
  {
    name: 'A* Algorithm',
    description: 'Búsqueda de ruta óptima',
    icon: <Cpu className="h-5 w-5" />,
    status: 'processing',
    details: [
      'Heurística de distancia geodésica',
      'Evaluación f(n) = g(n) + h(n)',
      'Priorización zonas de pesca',
      'Minimización consumo combustible'
    ]
  },
]

export function TechStackPanel() {
  const [expandedTech, setExpandedTech] = useState<string | null>(null)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Stack Tecnológico
          </div>
          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
            <Activity className="h-3 w-3 mr-1" />
            En línea
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {techStack.map((tech) => (
          <div
            key={tech.name}
            className={cn(
              'p-3 rounded-lg border transition-all cursor-pointer',
              expandedTech === tech.name 
                ? 'bg-secondary border-primary/50' 
                : 'bg-secondary/30 border-border hover:border-primary/30'
            )}
            onClick={() => setExpandedTech(expandedTech === tech.name ? null : tech.name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  tech.status === 'active' ? 'bg-success/20 text-success' :
                  tech.status === 'processing' ? 'bg-accent/20 text-accent' :
                  'bg-muted text-muted-foreground'
                )}>
                  {tech.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tech.status === 'active' && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                {tech.status === 'processing' && (
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                )}
              </div>
            </div>
            
            {expandedTech === tech.name && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <ul className="space-y-1">
                  {tech.details.map((detail, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
