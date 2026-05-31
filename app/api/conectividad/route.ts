// app/api/conectividad/route.ts
// Determina el tipo de conectividad de cada embarcación según su posición y velocidad.
// Lógica: embarcaciones a más de 20 mn de la costa usan satélite (Inmarsat/Iridium),
// entre 5-20 mn usan red celular con baja cobertura, menos de 5 mn tienen cobertura normal.
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

// Puertos de referencia para calcular distancia a costa (mn aproximadas)
const COSTA_REFERENCIA = [
  { nombre: 'Puerto Quetzal', lat: 13.9198, lon: -90.7969 },
  { nombre: 'Champerico',     lat: 14.3008, lon: -91.9197 },
  { nombre: 'Iztapa',         lat: 13.9281, lon: -90.7117 },
  { nombre: 'San José',       lat: 13.9333, lon: -90.8167 },
]

function haversineMn(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function distanciaMinCosta(lat: number, lon: number): number {
  return Math.min(...COSTA_REFERENCIA.map(p => haversineMn(lat, lon, p.lat, p.lon)))
}

function clasificarConectividad(distMn: number, velocidadNudos: number | null, minutosDesdeUltimaPosicion: number): {
  tipo: 'satelite' | 'celular' | 'puerto' | 'sin_senal'
  label: string
  descripcion: string
  color: string
  senal_pct: number
} {
  // Sin datos GPS recientes (más de 10 minutos)
  if (minutosDesdeUltimaPosicion > 10) {
    return { tipo: 'sin_senal', label: 'Sin señal', descripcion: 'Sin posición GPS en los últimos 10 minutos', color: 'destructive', senal_pct: 0 }
  }
  if (distMn > 20) {
    return { tipo: 'satelite', label: 'Satélite', descripcion: `${distMn.toFixed(1)} mn de costa — conectividad vía Inmarsat/Iridium`, color: 'info', senal_pct: Math.min(95, 70 + Math.random() * 15) }
  }
  if (distMn > 5) {
    const senal = Math.max(30, 70 - (distMn - 5) * 2)
    return { tipo: 'celular', label: 'Celular', descripcion: `${distMn.toFixed(1)} mn de costa — cobertura celular parcial`, color: 'warning', senal_pct: senal }
  }
  return { tipo: 'puerto', label: 'Puerto/Costa', descripcion: `${distMn.toFixed(1)} mn de costa — cobertura completa`, color: 'success', senal_pct: 95 + Math.random() * 5 }
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT e.id, e.codigo, e.nombre, e.estado,
             ST_Y(p.coordenada) AS lat, ST_X(p.coordenada) AS lon,
             p.velocidad_nudos, p.timestamp_utc,
             EXTRACT(EPOCH FROM (NOW() - p.timestamp_utc)) / 60 AS minutos_ultima_pos
      FROM embarcaciones e
      LEFT JOIN LATERAL (
        SELECT coordenada, velocidad_nudos, timestamp_utc
        FROM posiciones_gps
        WHERE embarcacion_id = e.id
        ORDER BY timestamp_utc DESC LIMIT 1
      ) p ON true
      WHERE e.estado != 'inactivo'
      ORDER BY e.codigo
    `)

    const embarcaciones = result.rows.map((b: {
      id: number; codigo: string; nombre: string; estado: string;
      lat: number | null; lon: number | null; velocidad_nudos: number | null;
      timestamp_utc: string | null; minutos_ultima_pos: number | null
    }) => {
      if (!b.lat || !b.lon) {
        return {
          id: b.id, codigo: b.codigo, nombre: b.nombre,
          conectividad: { tipo: 'sin_senal', label: 'Sin GPS', descripcion: 'Sin posición GPS registrada', color: 'destructive', senal_pct: 0 },
          distancia_costa_mn: null,
        }
      }
      const distMn = parseFloat(distanciaMinCosta(b.lat, b.lon).toFixed(2))
      const minutos = b.minutos_ultima_pos ?? 999
      const conectividad = clasificarConectividad(distMn, b.velocidad_nudos, minutos)
      return {
        id: b.id, codigo: b.codigo, nombre: b.nombre,
        lat: b.lat, lon: b.lon,
        velocidad_nudos: b.velocidad_nudos,
        timestamp_utc: b.timestamp_utc,
        minutos_ultima_pos: parseFloat(minutos.toFixed(1)),
        distancia_costa_mn: distMn,
        conectividad,
      }
    })

    // Resumen de flota
    const resumen = {
      satelite: embarcaciones.filter((e: {conectividad: {tipo: string}}) => e.conectividad.tipo === 'satelite').length,
      celular:  embarcaciones.filter((e: {conectividad: {tipo: string}}) => e.conectividad.tipo === 'celular').length,
      puerto:   embarcaciones.filter((e: {conectividad: {tipo: string}}) => e.conectividad.tipo === 'puerto').length,
      sin_senal:embarcaciones.filter((e: {conectividad: {tipo: string}}) => e.conectividad.tipo === 'sin_senal').length,
      total: embarcaciones.length,
    }

    return NextResponse.json({ embarcaciones, resumen, timestamp: new Date().toISOString() })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
