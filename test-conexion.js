// test-conexion.js — corre con: node test-conexion.js
const { Client } = require('pg')

const configs = [
  { label: 'IPv4 127.0.0.1',  host: '127.0.0.1', password: 'navis2025' },
  { label: 'IPv4 127.0.0.1 pass original', host: '127.0.0.1', password: 'NavisGT2025!' },
  { label: 'localhost',        host: 'localhost',  password: 'navis2025' },
]

async function test({ label, host, password }) {
  const client = new Client({
    host, port: 5433,
    database: 'navis_tunatech',
    user: 'navis_admin',
    password,
    ssl: false,
    connectionTimeoutMillis: 5000,
  })
  try {
    await client.connect()
    const r = await client.query('SELECT current_user, COUNT(*) FROM embarcaciones')
    await client.end()
    console.log(`✔ [${label}] OK — user: ${r.rows[0].current_user}, embarcaciones: ${r.rows[0].count}`)
  } catch (e) {
    console.log(`✗ [${label}] ERROR: ${e.message}`)
  }
}

;(async () => {
  for (const c of configs) await test(c)
})()
