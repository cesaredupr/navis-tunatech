// app/api/test-db/route.ts
// Endpoint de diagnóstico — solo activo fuera de producción
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  try {
    const [embarcaciones, posiciones, meteo] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM embarcaciones'),
      pool.query('SELECT COUNT(*) AS total FROM posiciones_gps'),
      pool.query('SELECT COUNT(*) AS total FROM datos_meteo'),
    ])

    return NextResponse.json({
      ok: true,
      db_host: process.env.DB_HOST ?? 'via DATABASE_URL',
      tablas: {
        embarcaciones: parseInt(embarcaciones.rows[0].total),
        posiciones_gps: parseInt(posiciones.rows[0].total),
        datos_meteo: parseInt(meteo.rows[0].total),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, error: msg, hint: 'Verifica que el contenedor navis_postgis está corriendo: docker ps' },
      { status: 500 }
    )
  }
}
