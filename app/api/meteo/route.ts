// app/api/meteo/route.ts
// Open-Meteo Marine API — gratuita, sin API key
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') || process.env.DEFAULT_LAT || '14.0'
  const lon = searchParams.get('lon') || process.env.DEFAULT_LON || '-91.0'
  const baseUrl = process.env.OPENMETEO_BASE_URL || 'https://marine-api.open-meteo.com/v1/marine'

  try {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      current: 'wave_height,wind_speed_10m,wind_direction_10m,sea_surface_temperature',
      hourly: 'wave_height,wind_speed_10m',
      timezone: 'America/Guatemala',
      forecast_days: '1',
    })
    const res = await fetch(`${baseUrl}?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`)

    const data = await res.json()
    const c = data.current || {}

    const oleaje = c.wave_height ?? 0
    const estadoMar = oleaje > 3 ? 'Muy agitado' : oleaje > 2 ? 'Agitado' : oleaje > 1 ? 'Moderado' : oleaje > 0.5 ? 'Poco agitado' : 'Calmo'
    const puntos = ['N','NE','E','SE','S','SO','O','NO']
    const direccion = puntos[Math.round((c.wind_direction_10m ?? 0) / 45) % 8]

    const respuesta = {
      viento_kmh: c.wind_speed_10m ?? null,
      direccion_viento: direccion,
      temperatura_mar: c.sea_surface_temperature ?? null,
      oleaje_m: c.wave_height ?? null,
      estado_mar: estadoMar,
      fuente: 'Open-Meteo Marine API',
      lat: parseFloat(lat), lon: parseFloat(lon),
      timestamp: new Date().toISOString(),
    }

    pool.query(
      `INSERT INTO datos_meteo (ubicacion, viento_kmh, temperatura_mar, oleaje_m, fuente)
       VALUES (ST_SetSRID(ST_MakePoint($1,$2),4326),$3,$4,$5,'OpenMeteo')`,
      [lon, lat, respuesta.viento_kmh, respuesta.temperatura_mar, respuesta.oleaje_m]
    ).catch(e => console.warn('[meteo] BD error:', e.message))

    return NextResponse.json(respuesta)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/meteo]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
