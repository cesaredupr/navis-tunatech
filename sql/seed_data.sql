-- ============================================================
-- NAVIS TunaTech™ — Seed de datos de prueba
-- Ejecutar con:
--   docker exec -i navis_postgis psql -U navis_admin -d navis_tunatech < sql/seed_data.sql
-- ============================================================

BEGIN;

-- ── 1. POSICIONES GPS — historial de 30 días, 6 barcos activos ───────────────

INSERT INTO posiciones_gps (embarcacion_id, coordenada, velocidad_nudos, rumbo_grados, timestamp_utc)
SELECT
  barco,
  ST_SetSRID(ST_MakePoint(
    lon_base + (random() - 0.5) * 0.6 * (dia::float / 30),
    lat_base + (random() - 0.5) * 0.6 * (dia::float / 30)
  ), 4326),
  round((6 + random() * 8)::numeric, 1),
  floor(random() * 360),
  NOW() - (30 - dia) * INTERVAL '1 day' - floor(random() * 20) * INTERVAL '1 hour'
FROM (VALUES
  (1, 14.80, -91.20),
  (2, 14.30, -90.80),
  (4, 14.00, -90.50),
  (5, 15.40, -91.00),
  (6, 13.80, -90.20),
  (8, 13.50, -89.90)
) AS flotilla(barco, lat_base, lon_base)
CROSS JOIN generate_series(0, 29) AS dia;

-- ── 2. BITÁCORAS — capturas de los últimos 6 meses ───────────────────────────
-- Columnas reales: embarcacion_id, coordenada, fecha_hora, captura_kg, especie, estado_mar, observaciones

INSERT INTO bitacoras (embarcacion_id, coordenada, fecha_hora, captura_kg, especie, estado_mar, observaciones)
VALUES
  -- Enero
  (1, ST_SetSRID(ST_MakePoint(-91.2, 14.8), 4326), NOW()-'175 days'::interval, 3200, 'Atún aleta amarilla', 'Calmo',    'Mar en calma, buena jornada'),
  (2, ST_SetSRID(ST_MakePoint(-90.8, 14.3), 4326), NOW()-'170 days'::interval, 2850, 'Atún aleta amarilla', 'Moderado', 'Viento del sur 15 km/h'),
  (4, ST_SetSRID(ST_MakePoint(-90.5, 14.0), 4326), NOW()-'165 days'::interval, 1900, 'Dorado',              'Calmo',    'Captura mixta'),
  -- Febrero
  (1, ST_SetSRID(ST_MakePoint(-91.0, 15.0), 4326), NOW()-'145 days'::interval, 4100, 'Atún aleta amarilla', 'Calmo',    'Mejor mes del trimestre'),
  (5, ST_SetSRID(ST_MakePoint(-91.0, 15.4), 4326), NOW()-'140 days'::interval, 2200, 'Pez espada',          'Calmo',    'Condiciones ideales'),
  (8, ST_SetSRID(ST_MakePoint(-89.9, 13.5), 4326), NOW()-'135 days'::interval, 1750, 'Dorado',              'Moderado', 'Oleaje moderado'),
  -- Marzo
  (1, ST_SetSRID(ST_MakePoint(-91.2, 14.9), 4326), NOW()-'115 days'::interval, 3800, 'Atún aleta amarilla', 'Calmo',    'Cuota mensual alcanzada'),
  (2, ST_SetSRID(ST_MakePoint(-90.9, 14.4), 4326), NOW()-'110 days'::interval, 3100, 'Atún aleta amarilla', 'Calmo',    'Temperatura del mar 29C'),
  (6, ST_SetSRID(ST_MakePoint(-90.2, 13.8), 4326), NOW()-'105 days'::interval, 2400, 'Marlin',              'Agitado',  'Captura destacada de marlin'),
  -- Abril
  (4, ST_SetSRID(ST_MakePoint(-90.6, 14.1), 4326), NOW()-'85 days'::interval,  2700, 'Atún aleta amarilla', 'Moderado', 'Jornada normal'),
  (5, ST_SetSRID(ST_MakePoint(-91.1, 15.3), 4326), NOW()-'80 days'::interval,  1950, 'Pez espada',          'Agitado',  'Mar agitado, regreso temprano'),
  (8, ST_SetSRID(ST_MakePoint(-89.8, 13.6), 4326), NOW()-'75 days'::interval,  3300, 'Dorado',              'Calmo',    'Excelente banco encontrado'),
  -- Mayo
  (1, ST_SetSRID(ST_MakePoint(-91.3, 15.1), 4326), NOW()-'55 days'::interval,  4500, 'Atún aleta amarilla', 'Calmo',    'Record mensual del año'),
  (2, ST_SetSRID(ST_MakePoint(-90.7, 14.5), 4326), NOW()-'50 days'::interval,  3600, 'Atún aleta amarilla', 'Calmo',    'Corriente favorable al norte'),
  (4, ST_SetSRID(ST_MakePoint(-90.4, 13.9), 4326), NOW()-'45 days'::interval,  2100, 'Dorado',              'Moderado', 'Temperatura bajo a 27C'),
  (6, ST_SetSRID(ST_MakePoint(-90.1, 13.7), 4326), NOW()-'40 days'::interval,  2900, 'Marlin',              'Calmo',    'Buena semana'),
  -- Junio
  (1, ST_SetSRID(ST_MakePoint(-91.1, 14.7), 4326), NOW()-'20 days'::interval,  3900, 'Atún aleta amarilla', 'Calmo',    'Temporada alta iniciando'),
  (5, ST_SetSRID(ST_MakePoint(-91.0, 15.5), 4326), NOW()-'15 days'::interval,  2600, 'Atún aleta amarilla', 'Calmo',    'Migracion hacia el norte detectada'),
  (8, ST_SetSRID(ST_MakePoint(-90.0, 13.8), 4326), NOW()-'10 days'::interval,  3200, 'Pez espada',          'Calmo',    'Mar tranquilo toda la jornada'),
  (2, ST_SetSRID(ST_MakePoint(-91.2, 15.0), 4326), NOW()-'5 days'::interval,   4200, 'Atún aleta amarilla', 'Calmo',    'Mejor captura del mes');

COMMIT;

-- Resumen
SELECT 'posiciones_gps' AS tabla, COUNT(*) AS total FROM posiciones_gps
UNION ALL
SELECT 'bitacoras', COUNT(*) FROM bitacoras;
