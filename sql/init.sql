-- NAVIS TunaTech™ — Inicialización PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE TABLE IF NOT EXISTS embarcaciones (
  id           SERIAL PRIMARY KEY,
  codigo       VARCHAR(10)  UNIQUE NOT NULL,
  nombre       VARCHAR(100) NOT NULL,
  matricula    VARCHAR(50),
  capacidad_kg DECIMAL(10,2),
  estado       VARCHAR(20)  DEFAULT 'activo',
  creado_en    TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posiciones_gps (
  id              SERIAL PRIMARY KEY,
  embarcacion_id  INT REFERENCES embarcaciones(id),
  coordenada      GEOMETRY(Point, 4326) NOT NULL,
  velocidad_nudos DECIMAL(5,2),
  rumbo_grados    INT,
  timestamp_utc   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posiciones_geom  ON posiciones_gps USING GIST(coordenada);
CREATE INDEX IF NOT EXISTS idx_posiciones_barco ON posiciones_gps(embarcacion_id, timestamp_utc DESC);

CREATE TABLE IF NOT EXISTS rutas (
  id                 SERIAL PRIMARY KEY,
  embarcacion_id     INT REFERENCES embarcaciones(id),
  origen             VARCHAR(100),
  destino            VARCHAR(100),
  trayectoria        GEOMETRY(LineString, 4326),
  distancia_mn       DECIMAL(10,2),
  tiempo_horas       DECIMAL(6,2),
  combustible_litros DECIMAL(10,2),
  algoritmo          VARCHAR(20) DEFAULT 'A_STAR',
  creado_en          TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bitacoras (
  id              SERIAL PRIMARY KEY,
  embarcacion_id  INT REFERENCES embarcaciones(id),
  coordenada      GEOMETRY(Point, 4326),
  fecha_hora      TIMESTAMP    DEFAULT NOW(),
  captura_kg      DECIMAL(10,2),
  especie         VARCHAR(100),
  estado_mar      VARCHAR(50),
  observaciones   TEXT,
  origen          VARCHAR(20)  DEFAULT 'MANUAL'
);

CREATE TABLE IF NOT EXISTS alertas (
  id              SERIAL PRIMARY KEY,
  tipo            VARCHAR(30)  NOT NULL,
  nivel           VARCHAR(20)  NOT NULL,
  embarcacion_id  INT REFERENCES embarcaciones(id),
  coordenada      GEOMETRY(Point, 4326),
  descripcion     TEXT,
  estado          VARCHAR(20)  DEFAULT 'ACTIVA',
  creado_en       TIMESTAMP    DEFAULT NOW(),
  resuelto_en     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datos_meteo (
  id               SERIAL PRIMARY KEY,
  ubicacion        GEOMETRY(Point, 4326),
  viento_kmh       DECIMAL(6,2),
  direccion_viento VARCHAR(10),
  temperatura_mar  DECIMAL(5,2),
  oleaje_m         DECIMAL(5,2),
  humedad_pct      DECIMAL(5,2),
  timestamp_utc    TIMESTAMP   DEFAULT NOW(),
  fuente           VARCHAR(50)
);

-- 8 embarcaciones (IDs 1-8, requeridos por el simulador GPS)
INSERT INTO embarcaciones (codigo, nombre, matricula, capacidad_kg, estado) VALUES
  ('AT-01', 'Atunero Pacífico I',  'GT-2025-001', 5000, 'activo'),
  ('AT-02', 'Atunero Pacífico II', 'GT-2025-002', 5000, 'activo'),
  ('AT-03', 'Atunero Caribe I',    'GT-2025-003', 4500, 'activo'),
  ('AT-04', 'Don Silverio',        'GT-2025-004', 4800, 'activo'),
  ('AT-05', 'Mar Profundo',        'GT-2025-005', 5200, 'activo'),
  ('AT-06', 'Quetzal Marino',      'GT-2025-006', 3800, 'activo'),
  ('AT-07', 'Barrios Express',     'GT-2025-007', 4200, 'activo'),
  ('AT-08', 'Champerico Azul',     'GT-2025-008', 4600, 'activo')
ON CONFLICT (codigo) DO NOTHING;

-- Posiciones GPS iniciales en el Pacífico guatemalteco
INSERT INTO posiciones_gps (embarcacion_id, coordenada, velocidad_nudos, rumbo_grados)
VALUES
  (1, ST_SetSRID(ST_MakePoint(-91.2, 14.8), 4326), 12.0, 180),
  (2, ST_SetSRID(ST_MakePoint(-90.8, 14.3), 4326),  9.0, 270),
  (3, ST_SetSRID(ST_MakePoint(-91.7, 15.1), 4326),  0.0,   0),
  (4, ST_SetSRID(ST_MakePoint(-90.5, 14.0), 4326), 11.0,  90),
  (5, ST_SetSRID(ST_MakePoint(-91.0, 15.4), 4326),  8.0, 225),
  (6, ST_SetSRID(ST_MakePoint(-90.2, 13.8), 4326),  7.0, 315),
  (7, ST_SetSRID(ST_MakePoint(-92.1, 15.6), 4326),  0.0,   0),
  (8, ST_SetSRID(ST_MakePoint(-89.9, 13.5), 4326), 10.0, 135);
