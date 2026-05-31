'use client'

import { Bell, Wifi, WifiOff, Satellite, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAlertas } from '@/hooks/useAlertas'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [showAlertas, setShowAlertas] = useState(false)
  const { alertas, total, nuevasAlertas, loading: loadingAlertas } = useAlertas()

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Disparar toast por cada nueva alerta detectada
  useEffect(() => {
    if (nuevasAlertas.length === 0) return
    nuevasAlertas.forEach(a => {
      toast.warning(
        `⚠️ Proximidad: ${a.codigo_a} — ${a.codigo_b}`,
        {
          description: `Distancia: ${a.distancia_mn} mn — por debajo del umbral de seguridad (2 mn)`,
          duration: 8000,
          action: { label: 'Ver monitoreo', onClick: () => window.location.href = '/monitoreo' },
        }
      )
    })
  }, [nuevasAlertas])

  // Estado de conectividad: si hay alertas activas usa satélite, si no usa wifi normal
  const conectado = true  // en producción esto viene de un estado real

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Hora */}
        <div className="hidden sm:block text-sm text-muted-foreground font-mono">{currentTime}</div>

        {/* Estado de conectividad satelital */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
          {conectado ? (
            <>
              <Satellite className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-success hidden sm:inline">Satélite OK</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive hidden sm:inline">Sin señal</span>
            </>
          )}
        </div>

        {/* Botón de alertas con badge */}
        <div className="relative">
          <button
            onClick={() => setShowAlertas(v => !v)}
            className={cn(
              'relative p-2 rounded-lg hover:bg-secondary transition-colors',
              total > 0 && 'text-warning'
            )}
          >
            <Bell className={cn('h-5 w-5', total > 0 ? 'text-warning' : 'text-muted-foreground')} />
            {total > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {total}
              </span>
            )}
          </button>

          {/* Dropdown de alertas */}
          {showAlertas && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alertas de proximidad
                </span>
                <button onClick={() => setShowAlertas(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {loadingAlertas ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Verificando…</div>
                ) : alertas.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    ✅ Sin alertas activas — todas las embarcaciones a distancia segura
                  </div>
                ) : alertas.map((a, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{a.codigo_a} ↔ {a.codigo_b}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.nombre_a} · {a.nombre_b}</p>
                      </div>
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                        a.distancia_mn < 1 ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
                      )}>
                        {a.distancia_mn} mn
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-border">
                <a href="/monitoreo" className="text-xs text-primary hover:underline">Ver en mapa →</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
