// Mock data for Navis TunaTech - Guatemala Maritime Zones
export interface Vessel {
  id: string
  name: string
  captain: string
  status: 'active' | 'docked' | 'maintenance'
  position: { lat: number; lng: number }
  speed: number // knots
  heading: number // degrees
  lastUpdate: string
  fuel: number // percentage
  catch: number // tons
  route: { lat: number; lng: number }[]
  port: string
}

export interface FishingZone {
  id: string
  name: string
  center: { lat: number; lng: number }
  radius: number // km
  probability: number // 0-100
  lastActivity: string
}

export interface LogEntry {
  id: string
  date: string
  vesselId: string
  vesselName: string
  location: { lat: number; lng: number }
  catchAmount: number // tons
  species: string
  notes: string
  distanceFromPort: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: string
  waveHeight: number
  visibility: string
  forecast: { day: string; temp: number; condition: string }[]
}

export interface Alert {
  id: string
  type: 'warning' | 'info' | 'success'
  message: string
  timestamp: string
}

// Guatemala Ports
export const ports = {
  puertoQuetzal: { lat: 13.9167, lng: -90.7833, name: 'Puerto Quetzal' },
  santoTomas: { lat: 15.6833, lng: -88.6167, name: 'Santo Tomás de Castilla' },
  champerico: { lat: 14.2833, lng: -91.9167, name: 'Champerico' },
  sanJose: { lat: 13.9333, lng: -90.8167, name: 'Puerto San José' },
}

// Guatemala Exclusive Economic Zone (ZEE) GeoJSON
export const guatemalaZEE = {
  pacific: {
    type: 'Feature' as const,
    properties: { name: 'ZEE Pacífico Guatemalteco' },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [-90.1, 14.0],
        [-92.2, 14.0],
        [-93.5, 13.0],
        [-93.5, 11.5],
        [-92.0, 11.0],
        [-90.5, 12.5],
        [-90.1, 13.5],
        [-90.1, 14.0],
      ]]
    }
  },
  caribbean: {
    type: 'Feature' as const,
    properties: { name: 'ZEE Mar Caribe de Guatemala' },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [-88.2, 16.5],
        [-89.2, 16.0],
        [-89.2, 15.0],
        [-88.2, 15.5],
        [-87.5, 15.8],
        [-87.5, 16.5],
        [-88.2, 16.5],
      ]]
    }
  }
}

// Mock vessels data - Guatemala Pacific & Caribbean
export const vessels: Vessel[] = [
  {
    id: 'V001',
    name: 'Atún Dorado',
    captain: 'Carlos Mendoza',
    status: 'active',
    position: { lat: 13.2, lng: -91.8 },
    speed: 12.5,
    heading: 275,
    lastUpdate: '2024-01-15T14:30:00Z',
    fuel: 78,
    catch: 45.2,
    port: 'Puerto Quetzal',
    route: [
      { lat: 13.9167, lng: -90.7833 }, // Puerto Quetzal
      { lat: 13.5, lng: -91.2 },
      { lat: 13.2, lng: -91.8 },
    ]
  },
  {
    id: 'V002',
    name: 'Mar Pacífico',
    captain: 'Roberto Silva',
    status: 'active',
    position: { lat: 12.8, lng: -92.3 },
    speed: 8.3,
    heading: 180,
    lastUpdate: '2024-01-15T14:28:00Z',
    fuel: 65,
    catch: 32.8,
    port: 'Puerto Quetzal',
    route: [
      { lat: 13.9167, lng: -90.7833 }, // Puerto Quetzal
      { lat: 13.3, lng: -91.5 },
      { lat: 12.8, lng: -92.3 },
    ]
  },
  {
    id: 'V003',
    name: 'Pescador Valiente',
    captain: 'Miguel Torres',
    status: 'active',
    position: { lat: 13.9, lng: -91.0 },
    speed: 15.2,
    heading: 320,
    lastUpdate: '2024-01-15T14:25:00Z',
    fuel: 82,
    catch: 58.5,
    port: 'Puerto Quetzal',
    route: [
      { lat: 13.9167, lng: -90.7833 }, // Puerto Quetzal
      { lat: 13.9, lng: -91.0 },
    ]
  },
  {
    id: 'V004',
    name: 'Estrella Marina',
    captain: 'José García',
    status: 'docked',
    position: { lat: 13.9167, lng: -90.7833 },
    speed: 0,
    heading: 90,
    lastUpdate: '2024-01-15T12:00:00Z',
    fuel: 95,
    catch: 0,
    port: 'Puerto Quetzal',
    route: []
  },
  {
    id: 'V005',
    name: 'Caribe I',
    captain: 'Fernando López',
    status: 'active',
    position: { lat: 15.8, lng: -88.6 },
    speed: 10.5,
    heading: 45,
    lastUpdate: '2024-01-15T14:20:00Z',
    fuel: 70,
    catch: 28.3,
    port: 'Santo Tomás de Castilla',
    route: [
      { lat: 15.6833, lng: -88.6167 }, // Santo Tomás
      { lat: 15.8, lng: -88.6 },
    ]
  },
  {
    id: 'V006',
    name: 'Neptuno II',
    captain: 'Andrés Ramírez',
    status: 'active',
    position: { lat: 15.5, lng: -88.9 },
    speed: 9.2,
    heading: 120,
    lastUpdate: '2024-01-15T14:22:00Z',
    fuel: 55,
    catch: 35.1,
    port: 'Santo Tomás de Castilla',
    route: [
      { lat: 15.6833, lng: -88.6167 }, // Santo Tomás
      { lat: 15.5, lng: -88.9 },
    ]
  },
]

// Fishing zones with activity probability - Guatemala Pacific
export const fishingZones: FishingZone[] = [
  {
    id: 'Z001',
    name: 'Zona Alta Pacífico',
    center: { lat: 13.0, lng: -92.0 },
    radius: 50,
    probability: 92,
    lastActivity: '2024-01-15T10:00:00Z'
  },
  {
    id: 'Z002',
    name: 'Banco Sur Guatemala',
    center: { lat: 12.5, lng: -91.5 },
    radius: 60,
    probability: 85,
    lastActivity: '2024-01-15T08:30:00Z'
  },
  {
    id: 'Z003',
    name: 'Corriente Profunda',
    center: { lat: 13.5, lng: -92.5 },
    radius: 55,
    probability: 78,
    lastActivity: '2024-01-14T16:00:00Z'
  },
  {
    id: 'Z004',
    name: 'Área Puerto Quetzal',
    center: { lat: 13.8, lng: -91.2 },
    radius: 35,
    probability: 65,
    lastActivity: '2024-01-14T14:00:00Z'
  },
  {
    id: 'Z005',
    name: 'Golfo de Fonseca',
    center: { lat: 13.3, lng: -87.8 },
    radius: 40,
    probability: 58,
    lastActivity: '2024-01-13T12:00:00Z'
  },
]

// Log entries - Guatemala
export const logEntries: LogEntry[] = [
  {
    id: 'L001',
    date: '2024-01-15',
    vesselId: 'V001',
    vesselName: 'Atún Dorado',
    location: { lat: 13.2, lng: -91.8 },
    catchAmount: 12.5,
    species: 'Atún Aleta Amarilla',
    notes: 'Buenas condiciones en el Pacífico Guatemalteco',
    distanceFromPort: '65 mn desde Puerto Quetzal'
  },
  {
    id: 'L002',
    date: '2024-01-15',
    vesselId: 'V002',
    vesselName: 'Mar Pacífico',
    location: { lat: 12.8, lng: -92.3 },
    catchAmount: 8.3,
    species: 'Atún Patudo',
    notes: 'Zona Económica Exclusiva de Guatemala - Sector Sur',
    distanceFromPort: '98 mn desde Puerto Quetzal'
  },
  {
    id: 'L003',
    date: '2024-01-14',
    vesselId: 'V003',
    vesselName: 'Pescador Valiente',
    location: { lat: 13.9, lng: -91.0 },
    catchAmount: 15.2,
    species: 'Atún Aleta Amarilla',
    notes: 'Excelente día cerca de Puerto Quetzal',
    distanceFromPort: '15 mn desde Puerto Quetzal'
  },
  {
    id: 'L004',
    date: '2024-01-14',
    vesselId: 'V005',
    vesselName: 'Caribe I',
    location: { lat: 15.8, lng: -88.6 },
    catchAmount: 10.8,
    species: 'Atún Barrilete',
    notes: 'Mar Caribe de Guatemala - Buenas condiciones',
    distanceFromPort: '12 mn desde Santo Tomás'
  },
  {
    id: 'L005',
    date: '2024-01-13',
    vesselId: 'V006',
    vesselName: 'Neptuno II',
    location: { lat: 15.5, lng: -88.9 },
    catchAmount: 6.7,
    species: 'Atún Patudo',
    notes: 'Clima variable en el Caribe Guatemalteco',
    distanceFromPort: '22 mn desde Santo Tomás'
  },
]

// Weather data - Guatemala Pacific
export const weatherData: WeatherData = {
  temperature: 28,
  humidity: 75,
  windSpeed: 18,
  windDirection: 'SO',
  waveHeight: 1.5,
  visibility: 'Buena',
  forecast: [
    { day: 'Hoy', temp: 28, condition: 'Parcialmente nublado' },
    { day: 'Mar', temp: 29, condition: 'Soleado' },
    { day: 'Mié', temp: 27, condition: 'Nublado' },
    { day: 'Jue', temp: 26, condition: 'Lluvia ligera' },
    { day: 'Vie', temp: 28, condition: 'Soleado' },
  ]
}

// Active alerts - Guatemala
export const alerts: Alert[] = [
  {
    id: 'A001',
    type: 'warning',
    message: 'Alerta de viento fuerte en Zona Económica Exclusiva para las próximas 6 horas',
    timestamp: '2024-01-15T14:00:00Z'
  },
  {
    id: 'A002',
    type: 'info',
    message: 'Alta actividad de atún detectada a 70mn de Puerto Quetzal',
    timestamp: '2024-01-15T13:30:00Z'
  },
  {
    id: 'A003',
    type: 'success',
    message: 'Caribe I reporta captura exitosa en Mar Caribe de Guatemala',
    timestamp: '2024-01-15T12:00:00Z'
  },
]

// Analytics data
export const monthlyCapture = [
  { month: 'Ago', capture: 245 },
  { month: 'Sep', capture: 312 },
  { month: 'Oct', capture: 287 },
  { month: 'Nov', capture: 356 },
  { month: 'Dic', capture: 398 },
  { month: 'Ene', capture: 421 },
]

export const zoneProductivity = [
  { zone: 'Zona Alta Pacífico', captures: 156, efficiency: 92 },
  { zone: 'Banco Sur Guatemala', captures: 134, efficiency: 85 },
  { zone: 'Corriente Profunda', captures: 98, efficiency: 78 },
  { zone: 'Área Puerto Quetzal', captures: 76, efficiency: 65 },
  { zone: 'Golfo de Fonseca', captures: 45, efficiency: 58 },
]

export const vesselPerformance = [
  { name: 'Atún Dorado', capture: 145, trips: 12, efficiency: 92 },
  { name: 'Mar Pacífico', capture: 128, trips: 14, efficiency: 85 },
  { name: 'Pescador Valiente', capture: 156, trips: 11, efficiency: 95 },
  { name: 'Estrella Marina', capture: 89, trips: 8, efficiency: 78 },
  { name: 'Caribe I', capture: 98, trips: 10, efficiency: 82 },
  { name: 'Neptuno II', capture: 67, trips: 6, efficiency: 72 },
]

// Heatmap points for fishing activity - Guatemala Pacific
export const heatmapPoints: [number, number, number][] = [
  // Hot zones (red/orange) - High probability
  [13.0, -92.0, 1.0],
  [12.9, -92.1, 0.95],
  [13.1, -91.9, 0.9],
  [12.5, -91.5, 0.92],
  [12.4, -91.6, 0.88],
  [12.6, -91.4, 0.85],
  [13.5, -92.5, 0.9],
  [13.4, -92.6, 0.85],
  [13.6, -92.4, 0.82],
  // Medium zones (yellow)
  [14.0, -91.8, 0.65],
  [13.9, -91.9, 0.6],
  [14.1, -91.7, 0.58],
  [12.0, -92.8, 0.6],
  [12.1, -92.7, 0.55],
  [11.9, -92.9, 0.52],
  // Lower zones (teal/cyan)
  [13.8, -91.0, 0.4],
  [13.7, -90.9, 0.35],
  [14.2, -91.5, 0.3],
]

// Optimal route from Puerto Quetzal to fishing zones
export const optimalRoute = [
  { lat: 13.9167, lng: -90.7833 }, // Puerto Quetzal (start)
  { lat: 13.5, lng: -91.3 },       // Waypoint 1
  { lat: 13.0, lng: -92.0 },       // Zone 1 - Highest probability
  { lat: 12.5, lng: -91.8 },       // Zone 2
  { lat: 13.0, lng: -92.0 },       // Return via Zone 1
  { lat: 13.5, lng: -91.3 },       // Waypoint
  { lat: 13.9167, lng: -90.7833 }, // Puerto Quetzal (end)
]

// Weather zones for Guatemala Pacific coast
export const weatherZones = [
  { id: 1, center: { lat: 13.9167, lng: -90.7833 }, name: 'Puerto Quetzal', condition: 'optimal', windSpeed: 12, windDir: 'SO' },
  { id: 2, center: { lat: 14.2833, lng: -91.9167 }, name: 'Champerico', condition: 'optimal', windSpeed: 15, windDir: 'S' },
  { id: 3, center: { lat: 13.9333, lng: -90.8167 }, name: 'Puerto San José', condition: 'moderate', windSpeed: 18, windDir: 'SO' },
  { id: 4, center: { lat: 13.0, lng: -92.0 }, name: 'Zona Alta Pacífico', condition: 'moderate', windSpeed: 22, windDir: 'S' },
  { id: 5, center: { lat: 12.5, lng: -91.5 }, name: 'Banco Sur', condition: 'strong', windSpeed: 28, windDir: 'SE' },
]
