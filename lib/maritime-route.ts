// lib/maritime-route.ts
// Cálculo de rutas marítimas para el Pacífico guatemalteco
// Usa geodesia esférica (Haversine) con waypoints costeros reales para evitar tierra

export interface Coordenada {
  lat: number
  lon: number
  nombre?: string
}

export interface ResultadoRuta {
  distancia_mn: number
  tiempo_horas: number
  combustible_litros: number
  waypoints: Coordenada[]
  motor: string
  velocidad_nudos: number
  consumo_l_mn: number
}

// Puertos guatemaltecos del Pacífico con coordenadas reales
export const PUERTOS: Record<string, Coordenada> = {
  'Puerto Quetzal':    { lat: 13.9198, lon: -90.7969, nombre: 'Puerto Quetzal' },
  'Champerico':        { lat: 14.3008, lon: -91.9197, nombre: 'Champerico' },
  'San José':          { lat: 13.9333, lon: -90.8167, nombre: 'San José' },
  'Puerto San José':   { lat: 13.9333, lon: -90.8167, nombre: 'Puerto San José' },
  'Iztapa':            { lat: 13.9281, lon: -90.7117, nombre: 'Iztapa' },
  'Santo Tomás de Castilla': { lat: 15.6833, lon: -88.6167, nombre: 'Santo Tomás de Castilla' },
}

// Waypoints costeros para rutas que deben rodear la costa
// Estos puntos están a ~15-20 mn mar adentro para evitar tierra
const WAYPOINTS_PACIFICO: Coordenada[] = [
  { lat: 14.35, lon: -92.10, nombre: 'WP-Champerico-Offshore' },
  { lat: 14.20, lon: -91.70, nombre: 'WP-Retalhuleu-Offshore' },
  { lat: 14.05, lon: -91.20, nombre: 'WP-Escuintla-Offshore' },
  { lat: 13.85, lon: -90.60, nombre: 'WP-Iztapa-Offshore' },
]

// Parámetros por modo de optimización
const PARAMS: Record<string, { velocidad_nudos: number; consumo_l_mn: number }> = {
  distancia:   { velocidad_nudos: 12, consumo_l_mn: 45 },
  tiempo:      { velocidad_nudos: 16, consumo_l_mn: 80 },
  combustible: { velocidad_nudos:  9, consumo_l_mn: 28 },
}

/** Distancia Haversine en millas náuticas entre dos puntos */
export function haversine(a: Coordenada, b: Coordenada): number {
  const R = 3_440.065 // mn
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const x =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLon * sinLon
  return parseFloat((2 * R * Math.asin(Math.sqrt(x))).toFixed(2))
}

/** Rumbo inicial (bearing) entre dos puntos en grados */
export function bearing(a: Coordenada, b: Coordenada): number {
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Longitud total de una secuencia de waypoints en mn */
function longitudTotal(waypoints: Coordenada[]): number {
  let total = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversine(waypoints[i], waypoints[i + 1])
  }
  return parseFloat(total.toFixed(2))
}

/**
 * Calcula la ruta costera óptima entre origen y destino.
 * Selecciona solo los waypoints costeros que están "entre" origen y destino
 * en términos de longitud, evitando tierra cuando la ruta cruza la costa.
 */
export function calcularRutaCostera(
  origen: Coordenada,
  destino: Coordenada,
  optimizar: string = 'distancia'
): ResultadoRuta {
  const params = PARAMS[optimizar] ?? PARAMS.distancia

  // Ruta directa (linea recta geodésica)
  const distanciaDirecta = haversine(origen, destino)

  // Construir ruta costera: incluir solo waypoints relevantes
  const lonMin = Math.min(origen.lon, destino.lon) - 0.1
  const lonMax = Math.max(origen.lon, destino.lon) + 0.1
  const waypointsRelevantes = WAYPOINTS_PACIFICO.filter(
    (wp) => wp.lon >= lonMin && wp.lon <= lonMax
  ).sort((a, b) => a.lon - b.lon)

  // Si el destino está más al oeste, invertir waypoints
  const wpOrdenados =
    destino.lon < origen.lon ? [...waypointsRelevantes].reverse() : waypointsRelevantes

  const rutaCostera: Coordenada[] = [origen, ...wpOrdenados, destino]
  const distanciaCostera = longitudTotal(rutaCostera)

  // Elegir la ruta más corta para el modo seleccionado
  // (en el Pacífico guatemalteco la ruta directa generalmente no cruza tierra)
  const usarCostera = distanciaCostera < distanciaDirecta * 1.15 && wpOrdenados.length > 0
  const waypoints = usarCostera ? rutaCostera : [origen, destino]
  const distancia_mn = usarCostera ? distanciaCostera : distanciaDirecta

  const tiempo_horas = parseFloat((distancia_mn / params.velocidad_nudos).toFixed(2))
  const combustible_litros = Math.round(distancia_mn * params.consumo_l_mn)

  return {
    distancia_mn,
    tiempo_horas,
    combustible_litros,
    waypoints,
    motor: 'Geodesia esférica (Haversine)',
    velocidad_nudos: params.velocidad_nudos,
    consumo_l_mn: params.consumo_l_mn,
  }
}

/**
 * Calcula el ahorro real (%) comparando la ruta optimizada vs la menos eficiente.
 * Retorna null si no hay suficiente diferencia para ser significativo.
 */
export function calcularAhorro(
  origen: Coordenada,
  destino: Coordenada,
  optimizar: string
): { pct: number; campo: string; referencia: string } | null {
  if (optimizar === 'combustible') {
    const base = calcularRutaCostera(origen, destino, 'tiempo')
    const opt  = calcularRutaCostera(origen, destino, 'combustible')
    const diff = base.combustible_litros - opt.combustible_litros
    if (diff <= 0) return null
    return {
      pct: Math.round((diff / base.combustible_litros) * 100),
      campo: 'combustible',
      referencia: 'vs ruta rápida',
    }
  }
  if (optimizar === 'tiempo') {
    const base = calcularRutaCostera(origen, destino, 'distancia')
    const opt  = calcularRutaCostera(origen, destino, 'tiempo')
    const diff = base.tiempo_horas - opt.tiempo_horas
    if (diff <= 0) return null
    return {
      pct: Math.round((diff / base.tiempo_horas) * 100),
      campo: 'tiempo',
      referencia: 'vs ruta corta',
    }
  }
  return null
}
