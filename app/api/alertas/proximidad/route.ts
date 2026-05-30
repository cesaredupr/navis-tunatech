// app/api/alertas/proximidad/route.ts
// Detecta embarcaciones a menos de 2 millas náuticas entre sí
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const NAUTICAL_MILE_METERS = 1852
const UMBRAL_MN = 2

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        a.id  AS id_a,  a.codigo AS codigo_a, a.nombre AS nombre_a,
        ST_Y(pa.coordenada) AS lat_a, ST_X(pa.coordenada) AS lon_a,
        b.id  AS id_b,  b.codigo AS codigo_b, b.nombre AS nombre_b,
        ST_Y(pb.coordenada) AS lat_b, ST_X(pb.coordenada) AS lon_b,
        ROUND((ST_Distance(pa.coordenada::geography, pb.coordenada::geography) / $1)::numeric, 2) AS distancia_mn
      FROM embarcaciones a
      JOIN embarcaciones b ON a.id < b.id
      JOIN LATERAL (
        SELECT coordenada FROM posiciones_gps WHERE embarcacion_id = a.id ORDER BY timestamp_utc DESC LIMIT 1
      ) pa ON true
      JOIN LATERAL (
        SELECT coordenada FROM posiciones_gps WHERE embarcacion_id = b.id ORDER BY timestamp_utc DESC LIMIT 1
      ) pb ON true
      WHERE a.estado != 'inactivo' AND b.estado != 'inactivo'
        AND ST_Distance(pa.coordenada::geography, pb.coordenada::geography) < ($1 * $2)
      ORDER BY distancia_mn
    `, [NAUTICAL_MILE_METERS, UMBRAL_MN])

    return NextResponse.json({
      alertas: result.rows,
      total: result.rows.length,
      umbral_mn: UMBRAL_MN,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/alertas/proximidad]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
