import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT b.id, b.embarcacion_id, e.codigo, e.nombre AS embarcacion_nombre,
             ST_Y(b.coordenada) AS lat, ST_X(b.coordenada) AS lon,
             b.captura_kg, b.especie, b.estado_mar, b.observaciones,
             b.fecha_hora, b.origen
      FROM bitacoras b
      JOIN embarcaciones e ON e.id = b.embarcacion_id
      ORDER BY b.fecha_hora DESC
      LIMIT 100
    `)
    return NextResponse.json(result.rows)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { embarcacion_id, lat, lon, captura_kg, especie, estado_mar, observaciones } = await request.json()
    const result = await pool.query(
      `INSERT INTO bitacoras (embarcacion_id, coordenada, captura_kg, especie, estado_mar, observaciones)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2,$3),4326), $4, $5, $6, $7)
       RETURNING id, fecha_hora`,
      [embarcacion_id, lon ?? -90.8, lat ?? 14.0, captura_kg, especie, estado_mar, observaciones]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
