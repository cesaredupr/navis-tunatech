'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Satellite, Wifi, WifiOff, Radio, Signal, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conectividad {
  tipo: 'satelite' | 'celular' | 'puerto' | 'sin_senal'
  label: string
  descripcion: string
  color: string
  senal_pct: number
}

interface EmbarcacionConectividad {
  id: number
  codigo: string
  nombre: string
  lat?: number
  lon?: number
  velocidad_nudos?: number
  distancia_costa_mn?: number
  minutos_ultima_pos?: number
  conectividad: Conectividad
}

interface ResumenConectividad {
  satelite: number
  celular: number
  puerto: number
  sin_senal: number
  total: number
}

function IconTipo({ tipo }: { tipo: string }) {
  if (tipo === 'satelite') return <Satellite className="h-4 w-4 text-info" />
  if (tipo === 'celular')  return <Signal className="h-4 w-4 text-warning" />
  if (tipo === 'puerto')   return <Wifi className="h-4 w-4 text-success" />
  return <WifiOff className="h-4 w-4 text-destructive" />
}

function BarraSenal({ pct, tipo }: { pct: number; tipo: string }) {
  const color =
    tipo === 'satelite' ? 'bg-info' :
    tipo === 'celular'  ? 'bg-warning' :
    tipo === 'puerto'   ? 'bg-success' : 'bg-destructive'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-7 text-right">{Math.round(pct)}%</span>
    </div>
  )
}

export function ConectividadPanel() {
  const [embarcaciones, setEmbarcaciones] = useState<EmbarcacionConectividad[]>([])
  const [resumen, setResumen] = useState<ResumenConectividad | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/conectividad')
      const data = await res.json()
      setEmbarcaciones(data.embarcaciones || [])
      setResumen(data.resumen || null)
      setLastUpdate(new Date())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch_()
    const iv = setInterval(fetch_, 30_000)
    return () => clearInterval(iv)
  }, [fetch_])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Conectividad Satelital de la Flota
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString('es-GT')}
              </span>
            )}
            <button onClick={fetch_} className="p-1.5 rounded hover:bg-secondary transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Resumen de tipos */}
        {resumen && (
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { tipo: 'satelite', icon: Satellite, label: 'Satélite', count: resumen.satelite, cls: 'bg-info/10 text-info border-info/30' },
              { tipo: 'celular',  icon: Signal,    label: 'Celular',   count: resumen.celular,  cls: 'bg-warning/10 text-warning border-warning/30' },
              { tipo: 'puerto',   icon: Wifi,      label: 'Costa',     count: resumen.puerto,   cls: 'bg-success/10 text-success border-success/30' },
              { tipo: 'sin_senal',icon: WifiOff,   label: 'Sin señal', count: resumen.sin_senal,cls: 'bg-destructive/10 text-destructive border-destructive/30' },
            ].map(({ icon: Icon, label, count, cls }) => (
              <Badge key={label} variant="outline" className={cn('gap-1', cls)}>
                <Icon className="h-3 w-3" />
                {label}: {count}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Consultando estado de conectividad…</div>
        ) : (
          <div className="divide-y divide-border">
            {embarcaciones.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                {/* Icono tipo */}
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <IconTipo tipo={b.conectividad.tipo} />
                </div>

                {/* Info barco */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{b.codigo}</p>
                    <Badge variant="outline" className={cn('text-xs', {
                      'bg-info/10 text-info border-info/30': b.conectividad.tipo === 'satelite',
                      'bg-warning/10 text-warning border-warning/30': b.conectividad.tipo === 'celular',
                      'bg-success/10 text-success border-success/30': b.conectividad.tipo === 'puerto',
                      'bg-destructive/10 text-destructive border-destructive/30': b.conectividad.tipo === 'sin_senal',
                    })}>
                      {b.conectividad.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{b.conectividad.descripcion}</p>
                </div>

                {/* Señal + distancia */}
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <BarraSenal pct={b.conectividad.senal_pct} tipo={b.conectividad.tipo} />
                  {b.distancia_costa_mn != null && (
                    <span className="text-xs text-muted-foreground">{b.distancia_costa_mn} mn de costa</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda */}
        <div className="px-4 py-3 border-t border-border bg-secondary/20 rounded-b-xl">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            <span>
              <strong>&gt;20 mn</strong> de costa = Inmarsat/Iridium (satélite) ·
              <strong> 5–20 mn</strong> = celular ·
              <strong> &lt;5 mn</strong> = cobertura completa
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
