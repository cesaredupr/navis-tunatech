// Mock data for Navis TunaTech
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

// Mock vessels data
export const vessels: Vessel[] = [
  {
    id: 'V001',
    name: 'Atún Dorado',
    captain: 'Carlos Mendoza',
    status: 'active',
    position: { lat: -3.45, lng: -81.05 },
    speed: 12.5,
    heading: 275,
    lastUpdate: '2024-01-15T14:30:00Z',
    fuel: 78,
    catch: 45.2,
    route: [
      { lat: -3.45, lng: -81.05 },
      { lat: -3.52, lng: -81.15 },
      { lat: -3.60, lng: -81.25 },
      { lat: -3.65, lng: -81.40 },
    ]
  },
  {
    id: 'V002',
    name: 'Mar Pacífico',
    captain: 'Roberto Silva',
    status: 'active',
    position: { lat: -4.12, lng: -82.30 },
    speed: 8.3,
    heading: 180,
    lastUpdate: '2024-01-15T14:28:00Z',
    fuel: 65,
    catch: 32.8,
    route: [
      { lat: -4.12, lng: -82.30 },
      { lat: -4.25, lng: -82.35 },
      { lat: -4.40, lng: -82.28 },
    ]
  },
  {
    id: 'V003',
    name: 'Pescador Valiente',
    captain: 'Miguel Torres',
    status: 'active',
    position: { lat: -2.85, lng: -80.55 },
    speed: 15.2,
    heading: 320,
    lastUpdate: '2024-01-15T14:25:00Z',
    fuel: 82,
    catch: 58.5,
    route: [
      { lat: -2.85, lng: -80.55 },
      { lat: -2.70, lng: -80.75 },
      { lat: -2.55, lng: -80.90 },
    ]
  },
  {
    id: 'V004',
    name: 'Estrella Marina',
    captain: 'José García',
    status: 'docked',
    position: { lat: -2.19, lng: -79.89 },
    speed: 0,
    heading: 90,
    lastUpdate: '2024-01-15T12:00:00Z',
    fuel: 95,
    catch: 0,
    route: []
  },
  {
    id: 'V005',
    name: 'Neptuno II',
    captain: 'Fernando López',
    status: 'maintenance',
    position: { lat: -2.21, lng: -79.91 },
    speed: 0,
    heading: 45,
    lastUpdate: '2024-01-14T18:00:00Z',
    fuel: 40,
    catch: 0,
    route: []
  },
]

// Fishing zones with activity probability
export const fishingZones: FishingZone[] = [
  {
    id: 'Z001',
    name: 'Zona Norte Alta',
    center: { lat: -2.5, lng: -81.0 },
    radius: 50,
    probability: 85,
    lastActivity: '2024-01-15T10:00:00Z'
  },
  {
    id: 'Z002',
    name: 'Banco Pesquero Central',
    center: { lat: -3.5, lng: -82.0 },
    radius: 75,
    probability: 72,
    lastActivity: '2024-01-15T08:30:00Z'
  },
  {
    id: 'Z003',
    name: 'Corriente Sur',
    center: { lat: -4.5, lng: -81.5 },
    radius: 60,
    probability: 65,
    lastActivity: '2024-01-14T16:00:00Z'
  },
  {
    id: 'Z004',
    name: 'Aguas Profundas Oeste',
    center: { lat: -3.0, lng: -83.0 },
    radius: 80,
    probability: 58,
    lastActivity: '2024-01-14T14:00:00Z'
  },
  {
    id: 'Z005',
    name: 'Costa Cercana',
    center: { lat: -2.8, lng: -80.2 },
    radius: 30,
    probability: 45,
    lastActivity: '2024-01-13T12:00:00Z'
  },
]

// Log entries
export const logEntries: LogEntry[] = [
  {
    id: 'L001',
    date: '2024-01-15',
    vesselId: 'V001',
    vesselName: 'Atún Dorado',
    location: { lat: -3.45, lng: -81.05 },
    catchAmount: 12.5,
    species: 'Atún Aleta Amarilla',
    notes: 'Buenas condiciones, cardumen grande detectado'
  },
  {
    id: 'L002',
    date: '2024-01-15',
    vesselId: 'V002',
    vesselName: 'Mar Pacífico',
    location: { lat: -4.12, lng: -82.30 },
    catchAmount: 8.3,
    species: 'Atún Patudo',
    notes: 'Condiciones moderadas'
  },
  {
    id: 'L003',
    date: '2024-01-14',
    vesselId: 'V003',
    vesselName: 'Pescador Valiente',
    location: { lat: -2.85, lng: -80.55 },
    catchAmount: 15.2,
    species: 'Atún Aleta Amarilla',
    notes: 'Excelente día de pesca'
  },
  {
    id: 'L004',
    date: '2024-01-14',
    vesselId: 'V001',
    vesselName: 'Atún Dorado',
    location: { lat: -3.52, lng: -81.15 },
    catchAmount: 10.8,
    species: 'Atún Barrilete',
    notes: 'Cardumen mediano'
  },
  {
    id: 'L005',
    date: '2024-01-13',
    vesselId: 'V002',
    vesselName: 'Mar Pacífico',
    location: { lat: -4.25, lng: -82.35 },
    catchAmount: 6.7,
    species: 'Atún Patudo',
    notes: 'Clima variable'
  },
]

// Weather data
export const weatherData: WeatherData = {
  temperature: 26,
  humidity: 78,
  windSpeed: 15,
  windDirection: 'SO',
  waveHeight: 1.8,
  visibility: 'Buena',
  forecast: [
    { day: 'Hoy', temp: 26, condition: 'Parcialmente nublado' },
    { day: 'Mar', temp: 27, condition: 'Soleado' },
    { day: 'Mié', temp: 25, condition: 'Nublado' },
    { day: 'Jue', temp: 24, condition: 'Lluvia ligera' },
    { day: 'Vie', temp: 26, condition: 'Soleado' },
  ]
}

// Active alerts
export const alerts: Alert[] = [
  {
    id: 'A001',
    type: 'warning',
    message: 'Alerta de viento fuerte en Zona Norte para las próximas 6 horas',
    timestamp: '2024-01-15T14:00:00Z'
  },
  {
    id: 'A002',
    type: 'info',
    message: 'Alta actividad de atún detectada en Banco Pesquero Central',
    timestamp: '2024-01-15T13:30:00Z'
  },
  {
    id: 'A003',
    type: 'success',
    message: 'Neptuno II completó mantenimiento programado',
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
  { zone: 'Zona Norte Alta', captures: 156, efficiency: 85 },
  { zone: 'Banco Central', captures: 134, efficiency: 72 },
  { zone: 'Corriente Sur', captures: 98, efficiency: 65 },
  { zone: 'Aguas Oeste', captures: 76, efficiency: 58 },
  { zone: 'Costa Cercana', captures: 45, efficiency: 45 },
]

export const vesselPerformance = [
  { name: 'Atún Dorado', capture: 145, trips: 12, efficiency: 92 },
  { name: 'Mar Pacífico', capture: 128, trips: 14, efficiency: 85 },
  { name: 'Pescador Valiente', capture: 156, trips: 11, efficiency: 95 },
  { name: 'Estrella Marina', capture: 89, trips: 8, efficiency: 78 },
  { name: 'Neptuno II', capture: 67, trips: 6, efficiency: 72 },
]

// Heatmap points for fishing activity
export const heatmapPoints = [
  { lat: -2.5, lng: -81.0, intensity: 0.9 },
  { lat: -2.6, lng: -81.1, intensity: 0.85 },
  { lat: -2.4, lng: -80.9, intensity: 0.8 },
  { lat: -3.5, lng: -82.0, intensity: 0.75 },
  { lat: -3.6, lng: -82.1, intensity: 0.7 },
  { lat: -3.4, lng: -81.9, intensity: 0.72 },
  { lat: -4.5, lng: -81.5, intensity: 0.65 },
  { lat: -4.4, lng: -81.6, intensity: 0.6 },
  { lat: -3.0, lng: -83.0, intensity: 0.55 },
  { lat: -3.1, lng: -83.1, intensity: 0.5 },
  { lat: -2.8, lng: -80.2, intensity: 0.45 },
  { lat: -2.9, lng: -80.3, intensity: 0.4 },
]
