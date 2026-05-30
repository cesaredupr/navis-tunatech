// lib/db.ts
// Pool de conexiones PostgreSQL/PostGIS — usa variables de entorno exclusivamente
// El throw es lazy (en runtime) para no romper el build de Vercel si las vars no están al compilar
import { Pool } from 'pg'

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }
    : {
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     parseInt(process.env.DB_PORT ?? '5433', 10),
        database: process.env.DB_NAME     ?? 'navis_tunatech',
        user:     process.env.DB_USER     ?? 'navis_admin',
        password: process.env.DB_PASSWORD ?? '',
        ssl:      false,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }
)

pool.on('error', (err) => {
  console.error('[db] Error inesperado en cliente inactivo:', err.message)
})

export default pool
