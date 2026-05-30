// app/api/rutas/calcular/route.ts
// POST → calcula ruta marítima óptima para el Pacífico guatemalteco
// Motor primario: Geodesia esférica con waypoints costeros reales
// Motor secundario: Valhalla (si está disponible y configurado)
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import {
  PUERTOS,
  calcularRutaCostera,
  calcularAhorro,
  haversine,
  type Coordenada,
} from '@/lib/maritime-route'

interface RequestBody {
  origen?: string
  destino_lat: number
  destino_lon: number
  embarcacion_id?: number
  optimizar?: 'distancia' | 'tiempo' | 'combustible'
  tipo?: 'maritima' | 'terrestre'
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const {
      origen = 'Puerto Quetzal',
      destino_lat,
      destino_lon,
      embarcacion_id = 1,
      optimizar = 'distancia',
      tipo = 'maritima',
    } = body

    // Validaciones
    const puertoOrigen = PUERTOS[origen]
    if (!puertoOrigen) {
      return NextResponse.json(
        { error: `Puerto desconocido: "${origen}"`, puertos_disponibles: Object.keys(PUERTOS) },
        { status: 400 }
      )
    }
    if (destino_lat === undefined || destino_lon === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: destino_lat, destino_lon' },
        { status: 400 }
      )
    }
    if (!['distancia', 'tiempo', 'combustible'].includes(optimizar)) {
      return NextResponse.json(
        { error: 'optimizar debe ser: distancia | tiempo | combustible' },
        { status: 400 }
      )
    }

    const destino: Coordenada = { lat: destino_lat, lon: destino_lon }

    // ── Motor 1: Valhalla (opcional, configurado via VALHALLA_URL) ──────────────
    let shape = ''
    let shapeAlt1 = ''
    let shapeAlt2 = ''
    let valhallaDisponible = false

    if (process.env.VALHALLA_URL) {
      if (tipo === 'terrestre') {
        // Para rutas terrestres: 3 peticiones paralelas con costings distintos
        // → garantiza 3 rutas reales por carretera aunque no haya alternativas geográficas
        const locs = [
          { lon: puertoOrigen.lon, lat: puertoOrigen.lat },
          { lon: destino_lon, lat: destino_lat },
        ]
        const baseOpts = { directions_options: { units: 'kilometers' } }
        const requests = [
          // Ruta más rápida (auto estándar)
          { ...baseOpts, locations: locs, costing: 'auto' },
          // Ruta más corta en distancia
          { ...baseOpts, locations: locs, costing: 'auto', costing_options: { auto: { shortest: true } } },
          // Ruta evitando autopistas (vías secundarias)
          { ...baseOpts, locations: locs, costing: 'auto', costing_options: { auto: { use_highways: 0.1, use_tolls: 0.1 } } },
        ]

        try {
          const results = await Promise.allSettled(
            requests.map(body =>
              fetch(`${process.env.VALHALLA_URL}/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(8_000),
              }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
          )
          const shapes = results.map(r =>
            r.status === 'fulfilled' ? (r.value?.trip?.legs?.[0]?.shape ?? '') : ''
          )
          shape      = shapes[0]
          shapeAlt1  = shapes[1]
          shapeAlt2  = shapes[2]
          valhallaDisponible = !!shape
        } catch {
          // Valhalla no disponible
        }
      } else {
        // Para rutas marítimas: una sola petición (Valhalla no tiene red náutica)
        try {
          const valRes = await fetch(`${process.env.VALHALLA_URL}/route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locations: [
                { lon: puertoOrigen.lon, lat: puertoOrigen.lat },
                { lon: destino_lon, lat: destino_lat },
              ],
              costing: 'pedestrian',
              directions_options: { units: 'kilometers' },
            }),
            signal: AbortSignal.timeout(6_000),
          })
          if (valRes.ok) {
            const val = await valRes.json()
            shape = val.trip?.legs?.[0]?.shape ?? ''
            valhallaDisponible = !!shape
          }
        } catch {
          // Valhalla no disponible — continuar con motor geodésico
        }
      }
    }

    // ── Motor 2: Geodesia esférica con waypoints costeros (siempre disponible) ──
    const ruta = calcularRutaCostera(puertoOrigen, destino, optimizar)
    const ahorro = calcularAhorro(puertoOrigen, destino, optimizar)

    // ── Guardar en base de datos (fire-and-forget) ────────────────────────────
    pool
      .query(
        `INSERT INTO rutas (embarcacion_id, origen, destino, distancia_mn, tiempo_horas, combustible_litros)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          embarcacion_id,
          origen,
          `${destino_lat.toFixed(4)},${destino_lon.toFixed(4)}`,
          ruta.distancia_mn,
          ruta.tiempo_horas,
          ruta.combustible_litros,
        ]
      )
      .catch((e: Error) => console.error('[rutas] Error guardando en BD:', e.message))

    // ── Respuesta ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      origen: { nombre: origen, lat: puertoOrigen.lat, lon: puertoOrigen.lon },
      destino: { lat: destino_lat, lon: destino_lon },
      optimizar,

      distancia_mn: ruta.distancia_mn,
      tiempo_horas: ruta.tiempo_horas,
      combustible_litros: ruta.combustible_litros,
      velocidad_nudos: ruta.velocidad_nudos,
      consumo_l_mn: ruta.consumo_l_mn,

      waypoints: ruta.waypoints,
      shape:      valhallaDisponible ? shape     : null,
      shape_alt1: shapeAlt1 || null,
      shape_alt2: shapeAlt2 || null,

      ahorro: ahorro
        ? { pct: ahorro.pct, campo: ahorro.campo, referencia: ahorro.referencia }
        : null,

      motor: valhallaDisponible ? `Valhalla + ${ruta.motor}` : ruta.motor,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/rutas/calcular]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
