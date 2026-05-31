// hooks/useAlertas.ts
// Polling de alertas de proximidad cada 60s con detección de nuevas alertas
import { useState, useEffect, useRef, useCallback } from 'react'

export interface AlertaProximidad {
  id_a: number
  codigo_a: string
  nombre_a: string
  lat_a: number
  lon_a: number
  id_b: number
  codigo_b: string
  nombre_b: string
  lat_b: number
  lon_b: number
  distancia_mn: number
}

export interface AlertasState {
  alertas: AlertaProximidad[]
  total: number
  umbral_mn: number
  loading: boolean
  lastUpdate: Date | null
  nuevasAlertas: AlertaProximidad[]   // alertas que aparecieron en el último poll
}

const POLL_INTERVAL_MS = 60_000

export function useAlertas() {
  const [state, setState] = useState<AlertasState>({
    alertas: [], total: 0, umbral_mn: 2,
    loading: true, lastUpdate: null, nuevasAlertas: [],
  })
  const prevIds = useRef<Set<string>>(new Set())

  const fetchAlertas = useCallback(async () => {
    try {
      const res = await fetch('/api/alertas/proximidad')
      if (!res.ok) return
      const data = await res.json()
      const alertas: AlertaProximidad[] = data.alertas || []

      // Detectar nuevas (pares que no estaban en el poll anterior)
      const currentIds = new Set(alertas.map(a => `${a.id_a}-${a.id_b}`))
      const nuevas = alertas.filter(a => !prevIds.current.has(`${a.id_a}-${a.id_b}`))
      prevIds.current = currentIds

      setState({
        alertas,
        total: data.total || 0,
        umbral_mn: data.umbral_mn || 2,
        loading: false,
        lastUpdate: new Date(),
        nuevasAlertas: nuevas,
      })
    } catch {
      setState(s => ({ ...s, loading: false }))
    }
  }, [])

  useEffect(() => {
    fetchAlertas()
    const iv = setInterval(fetchAlertas, POLL_INTERVAL_MS)
    return () => clearInterval(iv)
  }, [fetchAlertas])

  return state
}
