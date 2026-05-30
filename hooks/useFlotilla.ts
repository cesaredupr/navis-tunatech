// hooks/useFlotilla.ts
import { useState, useEffect, useCallback } from 'react'

export interface Barco {
  id: number
  codigo: string
  nombre: string
  estado: string
  capacidad_kg: number | null
  lat: number | null
  lon: number | null
  velocidad_nudos: number | null
  rumbo_grados: number | null
  timestamp_utc: string | null
}

export function useFlotilla() {
  const [barcos, setBarcos]     = useState<Barco[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchBarcos = useCallback(async () => {
    try {
      const res = await fetch('/api/barcos')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `HTTP ${res.status}`) }
      setBarcos(await res.json())
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBarcos()
    const interval = setInterval(fetchBarcos, 30_000)
    return () => clearInterval(interval)
  }, [fetchBarcos])

  return { barcos, loading, error, refresh: fetchBarcos, lastUpdate }
}
