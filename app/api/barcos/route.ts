import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT e.id, e.codigo, e.nombre, e.estado,
             e.capacidad_kg,
             ST_X(p.coordenada) AS lon,
             ST_Y(p.coordenada) AS lat,
             p.velocidad_nudos, p.rumbo_grados,
             p.timestamp_utc
      FROM embarcaciones e
      LEFT JOIN LATERAL (
        SELECT * FROM posiciones_gps
        WHERE embarcacion_id = e.id
        ORDER BY timestamp_utc DESC LIMIT 1
      ) p ON true
      WHERE e.estado != 'inactivo'
      ORDER BY e.codigo
    `)
    return NextResponse.json(result.rows)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/barcos GET]', msg)
    return NextResponse.json(
      { error: msg, hint: 'Verifica que el contenedor navis_postgis está corriendo: docker ps' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { embarcacion_id, lat, lon, velocidad, rumbo } = await request.json()

    if (!embarcacion_id || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: embarcacion_id, lat, lon' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO posiciones_gps (embarcacion_id, coordenada, velocidad_nudos, rumbo_grados)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5) RETURNING id, timestamp_utc`,
      [embarcacion_id, lon, lat, velocidad ?? 0, rumbo ?? 0]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/barcos POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
