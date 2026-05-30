import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [capturaMes, capturaEspecie, capturaBarco, totalPosiciones] = await Promise.all([
      // Captura por mes (últimos 6 meses)
      pool.query(`
        SELECT TO_CHAR(fecha_hora, 'Mon') AS month,
               COALESCE(SUM(captura_kg)/1000, 0)::numeric(10,1) AS capture
        FROM bitacoras
        WHERE fecha_hora >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', fecha_hora), TO_CHAR(fecha_hora, 'Mon')
        ORDER BY DATE_TRUNC('month', fecha_hora)
      `),
      // Captura por especie
      pool.query(`
        SELECT especie, SUM(captura_kg) AS total_kg
        FROM bitacoras WHERE especie IS NOT NULL
        GROUP BY especie ORDER BY total_kg DESC LIMIT 5
      `),
      // Captura por embarcación
      pool.query(`
        SELECT e.codigo, e.nombre, COALESCE(SUM(b.captura_kg),0) AS total_kg
        FROM embarcaciones e
        LEFT JOIN bitacoras b ON b.embarcacion_id = e.id
        GROUP BY e.id, e.codigo, e.nombre ORDER BY total_kg DESC
      `),
      // Total posiciones GPS registradas
      pool.query(`SELECT COUNT(*) AS total FROM posiciones_gps`),
    ])

    return NextResponse.json({
      captura_mensual: capturaMes.rows,
      captura_por_especie: capturaEspecie.rows,
      rendimiento_flotilla: capturaBarco.rows,
      total_posiciones_gps: parseInt(totalPosiciones.rows[0].total),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
