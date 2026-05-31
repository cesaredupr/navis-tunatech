// app/api/cron/simular-gps/route.ts
// Avanza la posición GPS de la flotilla activa.
// Llamado por el cron de Vercel cada 30s (vercel.json) o manualmente.
// Protegido con CRON_SECRET para evitar llamadas externas no autorizadas.
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const BOUNDS = { latMin: 12.5, latMax: 16.0, lonMin: -93.5, lonMax: -88.5 }
const clamp  = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Estado en memoria del simulador (persiste mientras el serverless instance vive)
// En Vercel cada invocación puede ser una instancia nueva, por eso leemos la última posición de la BD
export async function GET(request: Request) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Leer última posición de cada embarcación activa
    const result = await pool.query(`
      SELECT e.id, e.codigo,
             ST_Y(p.coordenada) AS lat,
             ST_X(p.coordenada) AS lon,
             p.velocidad_nudos,
             p.rumbo_grados
      FROM embarcaciones e
      JOIN LATERAL (
        SELECT coordenada, velocidad_nudos, rumbo_grados
        FROM posiciones_gps
        WHERE embarcacion_id = e.id
        ORDER BY timestamp_utc DESC LIMIT 1
      ) p ON true
      WHERE e.estado = 'activo'
    `)

    let actualizados = 0
    const inserts: Promise<unknown>[] = []

    for (const b of result.rows) {
      const vel = b.velocidad_nudos ?? 0
      if (vel === 0) continue // barcos anclados no se mueven

      // Desplazamiento proporcional a la velocidad (en grados ≈ mn/60)
      const d = (vel / 12) * 0.015

      // Usar el rumbo actual para dar una dirección más realista
      // + pequeño ruido aleatorio para simular corrientes
      const rumboRad = ((b.rumbo_grados ?? Math.random() * 360) * Math.PI) / 180
      const dlat = Math.cos(rumboRad) * d * 0.7 + (Math.random() - 0.5) * d * 0.3
      const dlon = Math.sin(rumboRad) * d * 0.7 + (Math.random() - 0.5) * d * 0.3

      const newLat = clamp(b.lat + dlat, BOUNDS.latMin, BOUNDS.latMax)
      const newLon = clamp(b.lon + dlon, BOUNDS.lonMin, BOUNDS.lonMax)

      // Si llegó al límite, invertir rumbo
      const hitBound = newLat <= BOUNDS.latMin || newLat >= BOUNDS.latMax || newLon <= BOUNDS.lonMin || newLon >= BOUNDS.lonMax
      const newRumbo = hitBound ? (b.rumbo_grados + 180) % 360 : (b.rumbo_grados + Math.floor((Math.random() - 0.5) * 30) + 360) % 360

      inserts.push(
        pool.query(
          `INSERT INTO posiciones_gps (embarcacion_id, coordenada, velocidad_nudos, rumbo_grados)
           VALUES ($1, ST_SetSRID(ST_MakePoint($2,$3),4326), $4, $5)`,
          [b.id, newLon, newLat, vel + (Math.random() - 0.5) * 2, newRumbo]
        ).then(() => { actualizados++ })
         .catch(e => console.error(`[cron-gps] barco ${b.codigo}:`, e.message))
      )
    }

    await Promise.all(inserts)

    return NextResponse.json({
      ok: true,
      actualizados,
      total: result.rows.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[cron-gps]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
