import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import type { 
  Service, 
  Appointment, 
  StudioConfig 
} from '../types.js';

// Default initial services
export const defaultServices: Service[] = [
  {
    id: "1",
    nombre: "Manicura Clásica & Rusa",
    slug: "manicura-clasica",
    categoria: "cuidado",
    descripcion: "Limpieza profunda combinada, repujado y corte prolijo de cutículas, limado y nutrición para manos impecables.",
    duracionMinutos: 45,
    precio: 14000,
    esPopular: false,
    icono: "💅",
    detalles: [
      "Técnica rusa combinada",
      "Nutrición profunda con aceites orgánicos",
      "Esmaltado tradicional o brillo protector",
      "Exfoliación suave de manos"
    ],
    activo: true
  },
  {
    id: "2",
    nombre: "Esmaltado Semipermanente",
    slug: "semipermanente",
    categoria: "esmaltado",
    descripcion: "Color brillante y de alta adherencia que se mantiene intacto por 2 a 3 semanas. Gran variedad de tonos de temporada.",
    duracionMinutos: 60,
    precio: 18000,
    esPopular: false,
    icono: "✨",
    detalles: [
      "Preparación rusa de cutículas",
      "Capa base niveladora fortalecedora",
      "Más de 80 tonos premium disponibles",
      "Top coat ultra brillante o mate satinado"
    ],
    activo: true
  },
  {
    id: "3",
    nombre: "Soft Gel System",
    slug: "soft-gel",
    categoria: "esculpidas",
    descripcion: "Extensiones ultralivianas de gel que cuidan tu uña natural con máxima resistencia y flexibilidad. El método estrella.",
    duracionMinutos: 90,
    precio: 26000,
    esPopular: true,
    icono: "🌸",
    detalles: [
      "Tip completo 100% soak-off gel",
      "Largo y forma a elección (Almond, Coffin, Square, Stiletto)",
      "Durabilidad de 3 a 4 semanas sin levantamientos",
      "Incluye esmaltado liso a elección"
    ],
    activo: true
  },
  {
    id: "4",
    nombre: "Kapping Gel Fortalecedor",
    slug: "kapping",
    categoria: "cuidado",
    descripcion: "Fino recubrimiento en gel o acrigel sobre la uña natural para evitar quiebres y permitir que crezca fuerte y sana.",
    duracionMinutos: 75,
    precio: 22000,
    esPopular: false,
    icono: "💎",
    detalles: [
      "Ideal para uñas frágiles, quebradizas o escamadas",
      "Nivelación y arquitectura perfecta",
      "Refuerzo estructural sin grosor excesivo",
      "Incluye esmaltado semipermanente"
    ],
    activo: true
  },
  {
    id: "5",
    nombre: "Nail Art & Diseños Exclusivos",
    slug: "nail-art",
    categoria: "arte",
    descripcion: "Creaciones artísticas a mano alzada, efectos chrome, foil dorado, degradados aura, flores y pedrería fina.",
    duracionMinutos: 90,
    precio: 25000,
    esPopular: true,
    icono: "🎨",
    detalles: [
      "Mano alzada personalizada",
      "Tendencias: Chrome, Glazed Donut, Aura, French 3D",
      "Aplicación de foil, microbrillos y cristalería",
      "Asesoramiento estético personalizado"
    ],
    activo: true
  },
  {
    id: "6",
    nombre: "Esculpidas en Polygel / Acrílico",
    slug: "esculpidas",
    categoria: "esculpidas",
    descripcion: "Construcción escultural con molde milimétrico para formas impecables, resistencia superior y máximo detalle.",
    duracionMinutos: 120,
    precio: 32000,
    esPopular: false,
    icono: "👑",
    detalles: [
      "Estructura personalizada con moldes",
      "Control de apex y curva C perfecta",
      "Máxima resistencia para uñas exigentes",
      "Incluye esmaltado semipermanente"
    ],
    activo: true
  },
  {
    id: "7",
    nombre: "Retiro Seguro & Tratamiento",
    slug: "retiro",
    categoria: "cuidado",
    descripcion: "Remoción profesional no invasiva mediante torno de precisión o método soak-off, preservando la placa ungueal.",
    duracionMinutos: 45,
    precio: 10000,
    esPopular: false,
    icono: "🔄",
    detalles: [
      "Retiro suave sin dañar las capas de la uña",
      "Tratamiento de queratina y calcio",
      "Pulido y sellado nutritivo",
      "Recomendado para descansos o cambio de técnica"
    ],
    activo: true
  }
];

export const defaultStudioConfig: StudioConfig = {
  nombreEstudio: "Gwen Nails Studio",
  subtitulo: "Donde tus manos cuentan tu historia",
  direccion: "Gorriti 5540, Palermo Hollywood, CABA",
  telefono: "011-15682386",
  whatsapp: "5491115682386",
  instagram: "gwennails",
  email: "contacto@gwennails.com",
  horariosPorDia: {
    lunes: { activo: true, apertura: "09:00", cierre: "19:00" },
    martes: { activo: true, apertura: "09:00", cierre: "19:00" },
    miercoles: { activo: true, apertura: "09:00", cierre: "19:00" },
    jueves: { activo: true, apertura: "09:00", cierre: "19:00" },
    viernes: { activo: true, apertura: "09:00", cierre: "19:00" },
    sabado: { activo: true, apertura: "09:00", cierre: "17:00" },
    domingo: { activo: false, apertura: "10:00", cierre: "14:00" }
  },
  intervaloMinutos: 30,
  bufferMinutos: 0,
  diasBloqueados: [],
  horariosBloqueados: {},
  bloqueosDetallados: [],
  pinAdmin: "1234"
};

// In-Memory & Local File Fallback Engine
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gwen_db.json");

interface FallbackDb {
  services: Service[];
  appointments: Appointment[];
  config: StudioConfig;
}

const memoryDb: FallbackDb = {
  services: defaultServices,
  appointments: [],
  config: defaultStudioConfig
};

function loadLocalFileDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.services && Array.isArray(parsed.services)) {
        memoryDb.services = parsed.services;
      }
      if (parsed.appointments && Array.isArray(parsed.appointments)) {
        memoryDb.appointments = parsed.appointments;
      }
      if (parsed.config) {
        memoryDb.config = { ...defaultStudioConfig, ...parsed.config };
      }
    } else {
      saveLocalFileDb();
    }
  } catch (err) {
    console.error("Local file DB fallback read error:", err);
  }
}

function saveLocalFileDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Local file DB fallback write error:", err);
  }
}

// PostgreSQL Connection Pool Setup
let pgPool: Pool | null = null;
let isPostgresConnected = false;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (connectionString) {
  try {
    pgPool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pgPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool:', err);
  }
}

/**
 * Initializes the database tables and default data if connected to PostgreSQL.
 * If not connected, initializes the local fallback database.
 */
export async function initDatabase() {
  if (pgPool) {
    try {
      console.log('🐘 Connecting to PostgreSQL database...');
      const client = await pgPool.connect();
      try {
        // 1. Create Services Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS services (
            id VARCHAR(64) PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            categoria VARCHAR(64) NOT NULL,
            descripcion TEXT,
            duracion_minutos INTEGER NOT NULL,
            precio NUMERIC NOT NULL,
            es_popular BOOLEAN DEFAULT FALSE,
            icono VARCHAR(32),
            detalles JSONB DEFAULT '[]',
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);

        // 2. Create Appointments (Turnos) Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS appointments (
            id VARCHAR(64) PRIMARY KEY,
            codigo VARCHAR(64) NOT NULL UNIQUE,
            nombre VARCHAR(255) NOT NULL,
            apellido VARCHAR(255) NOT NULL,
            telefono VARCHAR(64) NOT NULL,
            email VARCHAR(255),
            servicio_id VARCHAR(64) NOT NULL,
            servicio_nombre VARCHAR(255) NOT NULL,
            duracion_minutos INTEGER NOT NULL,
            precio NUMERIC NOT NULL,
            fecha VARCHAR(10) NOT NULL,
            hora_inicio VARCHAR(10) NOT NULL,
            hora_fin VARCHAR(10) NOT NULL,
            observaciones TEXT,
            estado VARCHAR(32) DEFAULT 'confirmado',
            notas_admin TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha);
          CREATE INDEX IF NOT EXISTS idx_appointments_estado ON appointments(estado);
        `);

        // 3. Create Studio Config Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS studio_config (
            id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
            config JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);

        // Seed initial services if empty
        const countRes = await client.query('SELECT COUNT(*) FROM services');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
          console.log('🌱 Seeding initial nail studio services to PostgreSQL...');
          for (const s of defaultServices) {
            await client.query(`
              INSERT INTO services (id, nombre, slug, categoria, descripcion, duracion_minutos, precio, es_popular, icono, detalles, activo)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO NOTHING;
            `, [
              s.id,
              s.nombre,
              s.slug,
              s.categoria,
              s.descripcion,
              s.duracionMinutos,
              s.precio,
              s.esPopular,
              s.icono,
              JSON.stringify(s.detalles || []),
              s.activo
            ]);
          }
        }

        // Seed initial studio config if empty
        const configCount = await client.query('SELECT COUNT(*) FROM studio_config WHERE id = $1', ['default']);
        if (parseInt(configCount.rows[0].count, 10) === 0) {
          await client.query(`
            INSERT INTO studio_config (id, config)
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING;
          `, ['default', JSON.stringify(defaultStudioConfig)]);
        }

        isPostgresConnected = true;
        console.log('✅ PostgreSQL connected & schema verified successfully.');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('⚠️ Could not connect to PostgreSQL, falling back to local storage:', err);
      isPostgresConnected = false;
      loadLocalFileDb();
    }
  } else {
    console.log('📁 No DATABASE_URL specified. Running with local filesystem storage.');
    loadLocalFileDb();
  }
}

// ---------------------------------------------------------------------------
// CRUD OPERATIONS (Dual PostgreSQL / Fallback)
// ---------------------------------------------------------------------------

// Services
export async function getServices(activeOnly = true): Promise<Service[]> {
  if (isPostgresConnected && pgPool) {
    try {
      const query = activeOnly
        ? 'SELECT * FROM services WHERE activo = true ORDER BY id ASC'
        : 'SELECT * FROM services ORDER BY id ASC';
      const res = await pgPool.query(query);
      return res.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        slug: row.slug,
        categoria: row.categoria,
        descripcion: row.descripcion || '',
        duracionMinutos: Number(row.duracion_minutos),
        precio: Number(row.precio),
        esPopular: Boolean(row.es_popular),
        icono: row.icono || '💅',
        detalles: Array.isArray(row.detalles) ? row.detalles : (typeof row.detalles === 'string' ? JSON.parse(row.detalles) : []),
        activo: Boolean(row.activo)
      }));
    } catch (err) {
      console.error('Error fetching services from PostgreSQL:', err);
    }
  }

  return activeOnly ? memoryDb.services.filter(s => s.activo) : memoryDb.services;
}

export async function createService(service: Service): Promise<Service> {
  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO services (id, nombre, slug, categoria, descripcion, duracion_minutos, precio, es_popular, icono, detalles, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        service.id,
        service.nombre,
        service.slug,
        service.categoria,
        service.descripcion,
        service.duracionMinutos,
        service.precio,
        service.esPopular,
        service.icono,
        JSON.stringify(service.detalles || []),
        service.activo
      ]);
      return service;
    } catch (err) {
      console.error('Error creating service in PostgreSQL:', err);
    }
  }

  memoryDb.services.push(service);
  saveLocalFileDb();
  return service;
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
  if (isPostgresConnected && pgPool) {
    try {
      const currentRes = await pgPool.query('SELECT * FROM services WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) return null;

      const curr = currentRes.rows[0];
      const updated: Service = {
        id,
        nombre: updates.nombre !== undefined ? updates.nombre : curr.nombre,
        slug: updates.slug !== undefined ? updates.slug : curr.slug,
        categoria: updates.categoria !== undefined ? updates.categoria : curr.categoria,
        descripcion: updates.descripcion !== undefined ? updates.descripcion : curr.descripcion,
        duracionMinutos: updates.duracionMinutos !== undefined ? Number(updates.duracionMinutos) : Number(curr.duracion_minutos),
        precio: updates.precio !== undefined ? Number(updates.precio) : Number(curr.precio),
        esPopular: updates.esPopular !== undefined ? Boolean(updates.esPopular) : Boolean(curr.es_popular),
        icono: updates.icono !== undefined ? updates.icono : curr.icono,
        detalles: updates.detalles !== undefined ? updates.detalles : (typeof curr.detalles === 'string' ? JSON.parse(curr.detalles) : curr.detalles),
        activo: updates.activo !== undefined ? Boolean(updates.activo) : Boolean(curr.activo)
      };

      await pgPool.query(`
        UPDATE services
        SET nombre = $2, slug = $3, categoria = $4, descripcion = $5,
            duracion_minutos = $6, precio = $7, es_popular = $8, icono = $9,
            detalles = $10, activo = $11, updated_at = NOW()
        WHERE id = $1
      `, [
        id,
        updated.nombre,
        updated.slug,
        updated.categoria,
        updated.descripcion,
        updated.duracionMinutos,
        updated.precio,
        updated.esPopular,
        updated.icono,
        JSON.stringify(updated.detalles || []),
        updated.activo
      ]);

      return updated;
    } catch (err) {
      console.error('Error updating service in PostgreSQL:', err);
    }
  }

  const idx = memoryDb.services.findIndex(s => s.id === id);
  if (idx === -1) return null;
  memoryDb.services[idx] = { ...memoryDb.services[idx], ...updates };
  saveLocalFileDb();
  return memoryDb.services[idx];
}

export async function deleteService(id: string): Promise<boolean> {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('DELETE FROM services WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('Error deleting service from PostgreSQL:', err);
    }
  }

  const idx = memoryDb.services.findIndex(s => s.id === id);
  if (idx === -1) return false;
  memoryDb.services.splice(idx, 1);
  saveLocalFileDb();
  return true;
}

// Appointments (Turnos)
export async function getAppointments(filter?: {
  date?: string;
  from?: string;
  to?: string;
  status?: string;
  search?: string;
}): Promise<Appointment[]> {
  if (isPostgresConnected && pgPool) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      if (filter?.date) {
        values.push(filter.date);
        conditions.push(`fecha = $${values.length}`);
      }
      if (filter?.from) {
        values.push(filter.from);
        conditions.push(`fecha >= $${values.length}`);
      }
      if (filter?.to) {
        values.push(filter.to);
        conditions.push(`fecha <= $${values.length}`);
      }
      if (filter?.status && filter.status !== 'todos') {
        values.push(filter.status);
        conditions.push(`estado = $${values.length}`);
      }
      if (filter?.search) {
        values.push(`%${filter.search.toLowerCase()}%`);
        conditions.push(`(
          LOWER(nombre) LIKE $${values.length} OR
          LOWER(apellido) LIKE $${values.length} OR
          LOWER(telefono) LIKE $${values.length} OR
          LOWER(codigo) LIKE $${values.length} OR
          LOWER(servicio_nombre) LIKE $${values.length}
        )`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const query = `SELECT * FROM appointments ${whereClause} ORDER BY fecha ASC, hora_inicio ASC`;
      
      const res = await pgPool.query(query, values);
      return res.rows.map(row => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        apellido: row.apellido,
        telefono: row.telefono,
        email: row.email || undefined,
        servicioId: row.servicio_id,
        servicioNombre: row.servicio_nombre,
        duracionMinutos: Number(row.duracion_minutos),
        precio: Number(row.precio),
        fecha: row.fecha,
        horaInicio: row.hora_inicio,
        horaFin: row.hora_fin,
        observaciones: row.observaciones || undefined,
        estado: row.estado as any,
        notasAdmin: row.notas_admin || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      }));
    } catch (err) {
      console.error('Error fetching appointments from PostgreSQL:', err);
    }
  }

  // Fallback memory filtering
  let filtered = [...memoryDb.appointments];
  if (filter?.date) filtered = filtered.filter(a => a.fecha === filter.date);
  if (filter?.from) filtered = filtered.filter(a => a.fecha >= filter.from!);
  if (filter?.to) filtered = filtered.filter(a => a.fecha <= filter.to!);
  if (filter?.status && filter.status !== 'todos') filtered = filtered.filter(a => a.estado === filter.status);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q) ||
      a.telefono.toLowerCase().includes(q) ||
      a.codigo.toLowerCase().includes(q) ||
      a.servicioNombre.toLowerCase().includes(q)
    );
  }
  return filtered.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));
}

export async function createAppointment(apt: Appointment): Promise<Appointment> {
  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO appointments (
          id, codigo, nombre, apellido, telefono, email,
          servicio_id, servicio_nombre, duracion_minutos, precio,
          fecha, hora_inicio, hora_fin, observaciones, estado,
          notas_admin, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      `, [
        apt.id,
        apt.codigo,
        apt.nombre,
        apt.apellido,
        apt.telefono,
        apt.email || null,
        apt.servicioId,
        apt.servicioNombre,
        apt.duracionMinutos,
        apt.precio,
        apt.fecha,
        apt.horaInicio,
        apt.horaFin,
        apt.observaciones || null,
        apt.estado,
        apt.notasAdmin || null
      ]);
      return apt;
    } catch (err) {
      console.error('Error saving appointment to PostgreSQL:', err);
    }
  }

  memoryDb.appointments.unshift(apt);
  saveLocalFileDb();
  return apt;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
  if (isPostgresConnected && pgPool) {
    try {
      const currentRes = await pgPool.query('SELECT * FROM appointments WHERE id = $1 OR codigo = $1', [id]);
      if (currentRes.rows.length === 0) return null;

      const curr = currentRes.rows[0];
      const targetId = curr.id;

      await pgPool.query(`
        UPDATE appointments
        SET estado = COALESCE($2, estado),
            notas_admin = COALESCE($3, notas_admin),
            fecha = COALESCE($4, fecha),
            hora_inicio = COALESCE($5, hora_inicio),
            hora_fin = COALESCE($6, hora_fin),
            updated_at = NOW()
        WHERE id = $1
      `, [
        targetId,
        updates.estado || null,
        updates.notasAdmin !== undefined ? updates.notasAdmin : null,
        updates.fecha || null,
        updates.horaInicio || null,
        updates.horaFin || null
      ]);

      const updatedRes = await pgPool.query('SELECT * FROM appointments WHERE id = $1', [targetId]);
      const row = updatedRes.rows[0];
      return {
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        apellido: row.apellido,
        telefono: row.telefono,
        email: row.email || undefined,
        servicioId: row.servicio_id,
        servicioNombre: row.servicio_nombre,
        duracionMinutos: Number(row.duracion_minutos),
        precio: Number(row.precio),
        fecha: row.fecha,
        horaInicio: row.hora_inicio,
        horaFin: row.hora_fin,
        observaciones: row.observaciones || undefined,
        estado: row.estado as any,
        notasAdmin: row.notas_admin || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
    } catch (err) {
      console.error('Error updating appointment in PostgreSQL:', err);
    }
  }

  const apt = memoryDb.appointments.find(a => a.id === id || a.codigo === id);
  if (!apt) return null;
  if (updates.estado) apt.estado = updates.estado;
  if (updates.notasAdmin !== undefined) apt.notasAdmin = updates.notasAdmin;
  if (updates.fecha) apt.fecha = updates.fecha;
  if (updates.horaInicio) apt.horaInicio = updates.horaInicio;
  if (updates.horaFin) apt.horaFin = updates.horaFin;
  apt.updatedAt = new Date().toISOString();
  saveLocalFileDb();
  return apt;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('DELETE FROM appointments WHERE id = $1 OR codigo = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('Error deleting appointment from PostgreSQL:', err);
    }
  }

  const idx = memoryDb.appointments.findIndex(a => a.id === id || a.codigo === id);
  if (idx === -1) return false;
  memoryDb.appointments.splice(idx, 1);
  saveLocalFileDb();
  return true;
}

// Studio Config
export async function getStudioConfig(): Promise<StudioConfig> {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT config FROM studio_config WHERE id = $1', ['default']);
      if (res.rows.length > 0) {
        const conf = typeof res.rows[0].config === 'string' ? JSON.parse(res.rows[0].config) : res.rows[0].config;
        return { ...defaultStudioConfig, ...conf };
      }
    } catch (err) {
      console.error('Error fetching config from PostgreSQL:', err);
    }
  }

  return memoryDb.config;
}

export async function updateStudioConfig(updates: Partial<StudioConfig>): Promise<StudioConfig> {
  const current = await getStudioConfig();
  const merged: StudioConfig = { ...current, ...updates };

  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO studio_config (id, config, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (id) DO UPDATE SET config = $2, updated_at = NOW();
      `, ['default', JSON.stringify(merged)]);
      return merged;
    } catch (err) {
      console.error('Error updating config in PostgreSQL:', err);
    }
  }

  memoryDb.config = merged;
  saveLocalFileDb();
  return memoryDb.config;
}

export function isDatabasePostgres(): boolean {
  return isPostgresConnected;
}
