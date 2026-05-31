import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [capturaMes, capturaEspecie, capturaBarco, totalPosiciones, patronesMes] = await Promise.all([
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

      // Patrones temporales — últimos 12 meses con variación mes a mes
      pool.query(`
        WITH mensual AS (
          SELECT
            DATE_TRUNC('month', fecha_hora) AS mes,
            TO_CHAR(fecha_hora, 'Mon YYYY') AS mes_label,
            TO_CHAR(fecha_hora, 'MM') AS mes_num,
            COALESCE(SUM(captura_kg), 0) AS total_kg,
            COUNT(*) AS num_registros
          FROM bitacoras
          WHERE fecha_hora >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', fecha_hora), TO_CHAR(fecha_hora, 'Mon YYYY'), TO_CHAR(fecha_hora, 'MM')
          ORDER BY mes
        ),
        con_variacion AS (
          SELECT
            mes, mes_label, mes_num, total_kg, num_registros,
            LAG(total_kg) OVER (ORDER BY mes) AS mes_anterior_kg,
            CASE
              WHEN LAG(total_kg) OVER (ORDER BY mes) > 0
              THEN ROUND(((total_kg - LAG(total_kg) OVER (ORDER BY mes)) / LAG(total_kg) OVER (ORDER BY mes) * 100)::numeric, 1)
              ELSE NULL
            END AS variacion_pct
          FROM mensual
        )
        SELECT
          mes_label,
          mes_num,
          ROUND(total_kg::numeric, 0) AS total_kg,
          num_registros,
          mes_anterior_kg,
          variacion_pct,
          CASE
            WHEN total_kg = MAX(total_kg) OVER () THEN 'pico'
            WHEN total_kg = MIN(total_kg) OVER () THEN 'minimo'
            WHEN variacion_pct > 10 THEN 'alza'
            WHEN variacion_pct < -10 THEN 'baja'
            ELSE 'estable'
          END AS tendencia
        FROM con_variacion
        ORDER BY mes
      `),
    ])

    // Calcular resumen de patrones
    const patrones = patronesMes.rows
    const mesPico = patrones.reduce((a: {total_kg: number}, b: {total_kg: number}) => Number(a.total_kg) >= Number(b.total_kg) ? a : b, patrones[0] || { total_kg: 0 })
    const totalAnual = patrones.reduce((acc: number, m: {total_kg: number}) => acc + Number(m.total_kg), 0)
    const promedioMensual = patrones.length > 0 ? Math.round(totalAnual / patrones.length) : 0

    // Detectar temporada alta: meses consecutivos con captura > promedio
    const temporadaAlta = patrones
      .filter((m: {total_kg: number}) => Number(m.total_kg) > promedioMensual)
      .map((m: {mes_label: string}) => m.mes_label)

    // Tendencia general (últimos 3 vs 3 anteriores)
    let tendenciaGeneral = 'estable'
    if (patrones.length >= 6) {
      const ultimos3 = patrones.slice(-3).reduce((acc: number, m: {total_kg: number}) => acc + Number(m.total_kg), 0)
      const anteriores3 = patrones.slice(-6, -3).reduce((acc: number, m: {total_kg: number}) => acc + Number(m.total_kg), 0)
      if (anteriores3 > 0) {
        const diff = ((ultimos3 - anteriores3) / anteriores3) * 100
        tendenciaGeneral = diff > 10 ? 'alza' : diff < -10 ? 'baja' : 'estable'
      }
    }

    return NextResponse.json({
      captura_mensual: capturaMes.rows,
      captura_por_especie: capturaEspecie.rows,
      rendimiento_flotilla: capturaBarco.rows,
      total_posiciones_gps: parseInt(totalPosiciones.rows[0].total),
      patrones: {
        mensual: patrones,
        mes_pico: mesPico,
        promedio_mensual_kg: promedioMensual,
        total_anual_kg: Math.round(totalAnual),
        temporada_alta: temporadaAlta,
        tendencia_general: tendenciaGeneral,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
