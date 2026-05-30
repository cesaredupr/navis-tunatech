// lib/db.ts
// Pool de conexiones PostgreSQL/PostGIS — usa variables de entorno exclusivamente
import { Pool } from 'pg'

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error(
    '[db] Falta configuración. Define DATABASE_URL o DB_HOST/DB_USER/DB_PASSWORD en .env.local'
  )
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5433', 10),
        database: process.env.DB_NAME ?? 'navis_tunatech',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }
)

pool.on('error', (err) => {
  console.error('[db] Error inesperado en cliente inactivo:', err.message)
})

export default pool
