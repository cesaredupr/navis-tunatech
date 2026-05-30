// scripts/simular-gps.ts
// Simulador GPS de 8 embarcaciones en el Pacífico guatemalteco
// Uso:
//   npx ts-node scripts/simular-gps.ts           ← una ronda
//   npx ts-node scripts/simular-gps.ts --seed    ← insertar y salir
//   npx ts-node scripts/simular-gps.ts --loop    ← cada 30s (Ctrl+C para detener)

import pool from '../lib/db'

const flotilla = [
  { id: 1, lat: 14.80, lon: -91.20, vel: 12, activo: true  },
  { id: 2, lat: 14.30, lon: -90.80, vel:  9, activo: true  },
  { id: 3, lat: 15.10, lon: -91.70, vel:  0, activo: false },
  { id: 4, lat: 14.00, lon: -90.50, vel: 11, activo: true  },
  { id: 5, lat: 15.40, lon: -91.00, vel:  8, activo: true  },
  { id: 6, lat: 13.80, lon: -90.20, vel:  7, activo: true  },
  { id: 7, lat: 15.60, lon: -92.10, vel:  0, activo: false },
  { id: 8, lat: 13.50, lon: -89.90, vel: 10, activo: true  },
]

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

async function simularRonda() {
  let ok = 0
  for (const b of flotilla) {
    if (b.activo) {
      const d = (b.vel / 12) * 0.015
      b.lat = clamp(b.lat + (Math.random() - 0.5) * d, 12.5, 16.0)
      b.lon = clamp(b.lon + (Math.random() - 0.5) * d, -93.5, -88.5)
    }
    try {
      await pool.query(
        `INSERT INTO posiciones_gps (embarcacion_id, coordenada, velocidad_nudos, rumbo_grados)
         VALUES ($1, ST_SetSRID(ST_MakePoint($2,$3),4326), $4, $5)`,
        [b.id, b.lon, b.lat, b.vel, Math.floor(Math.random() * 360)]
      )
      ok++
    } catch (e: unknown) {
      console.error(`  ✗ Barco ${b.id}:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`[${new Date().toISOString()}] GPS: ${ok}/${flotilla.length} embarcaciones actualizadas`)
}

async function main() {
  const args = process.argv.slice(2)
  console.log('NAVIS TunaTech™ — Simulador GPS\n')
  await simularRonda()
  if (args.includes('--loop')) {
    console.log('Modo continuo (cada 30s). Ctrl+C para detener.')
    const iv = setInterval(simularRonda, 30_000)
    process.on('SIGINT', async () => { clearInterval(iv); await pool.end(); process.exit(0) })
  } else {
    await pool.end()
  }
}

main().catch(async e => { console.error('Error:', e.message); await pool.end(); process.exit(1) })
