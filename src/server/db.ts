import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import type { 
  Service, 
  Appointment, 
  StudioConfig,
  Client,
  DuplicatePair,
  ClientStats
} from '../types.js';
import { 
  normalizeText, 
  normalizePhone, 
  normalizeEmail, 
  evaluateClientMatch, 
  stringSimilarity 
} from './clientMatching.js';

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
  clients: Client[];
  config: StudioConfig;
}

const memoryDb: FallbackDb = {
  services: defaultServices,
  appointments: [],
  clients: [],
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
      if (parsed.clients && Array.isArray(parsed.clients)) {
        memoryDb.clients = parsed.clients;
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

        // 2. Create Clients Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS clients (
            id VARCHAR(64) PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            apellido VARCHAR(255) NOT NULL,
            telefono VARCHAR(64) NOT NULL,
            telefono_normalizado VARCHAR(64) NOT NULL,
            email VARCHAR(255),
            email_normalizado VARCHAR(255),
            nombre_normalizado VARCHAR(255) NOT NULL,
            apellido_normalizado VARCHAR(255) NOT NULL,
            notas_admin TEXT,
            fecha_alta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            fecha_ultima_visita VARCHAR(10),
            activo BOOLEAN DEFAULT TRUE,
            browser_id VARCHAR(128),
            posible_duplicado_de JSONB DEFAULT '[]',
            motivo_posible_duplicado TEXT,
            nivel_coincidencia_duplicado INTEGER,
            duplicado_revisado BOOLEAN DEFAULT FALSE,
            fusionado_con_id VARCHAR(64),
            fecha_fusion TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_clients_telefono_norm ON clients(telefono_normalizado);
          CREATE INDEX IF NOT EXISTS idx_clients_email_norm ON clients(email_normalizado);
          CREATE INDEX IF NOT EXISTS idx_clients_nombre_norm ON clients(nombre_normalizado);
          CREATE INDEX IF NOT EXISTS idx_clients_activo ON clients(activo);
        `);

        // 3. Create Appointments (Turnos) Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS appointments (
            id VARCHAR(64) PRIMARY KEY,
            cliente_id VARCHAR(64),
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
            browser_id VARCHAR(128),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cliente_id VARCHAR(64);
          ALTER TABLE appointments ADD COLUMN IF NOT EXISTS browser_id VARCHAR(128);

          CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha);
          CREATE INDEX IF NOT EXISTS idx_appointments_estado ON appointments(estado);
          CREATE INDEX IF NOT EXISTS idx_appointments_cliente_id ON appointments(cliente_id);
        `);

        // 4. Create Studio Config Table
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

  // Automatic backfill migration
  await backfillAppointmentsClients();
}

/**
 * Migration helper: inspects existing appointments and ensures each has
 * an associated Client entity.
 */
async function backfillAppointmentsClients() {
  try {
    const appointments = await getAppointments();
    if (!appointments || appointments.length === 0) return;

    let hasUpdates = false;
    for (const apt of appointments) {
      if (!apt.clienteId) {
        const client = await findOrCreateClientForBooking({
          nombre: apt.nombre,
          apellido: apt.apellido,
          telefono: apt.telefono,
          email: apt.email,
          fecha: apt.fecha,
          browserId: apt.browserId
        });

        apt.clienteId = client.id;
        hasUpdates = true;

        if (isPostgresConnected && pgPool) {
          await pgPool.query('UPDATE appointments SET cliente_id = $1 WHERE id = $2', [client.id, apt.id]);
        }
      }
    }

    if (hasUpdates && !isPostgresConnected) {
      saveLocalFileDb();
    }
  } catch (err) {
    console.error('Error during backfillAppointmentsClients migration:', err);
  }
}

// ---------------------------------------------------------------------------
// CLIENT MANAGEMENT & MATCHING ENGINE (Dual PostgreSQL / Fallback)
// ---------------------------------------------------------------------------

export async function getClients(filter?: {
  search?: string;
  category?: 'todos' | 'recurrentes' | 'nuevos' | 'inactivos' | 'duplicados' | 'proximos';
  activeOnly?: boolean;
}): Promise<Client[]> {
  const activeOnly = filter?.activeOnly !== false;
  let rawClients: Client[] = [];

  if (isPostgresConnected && pgPool) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];

      if (activeOnly) {
        conditions.push(`activo = true`);
      }

      if (filter?.search) {
        const qNorm = normalizeText(filter.search);
        const qPhone = filter.search.replace(/\D/g, '');
        values.push(`%${filter.search.toLowerCase()}%`);
        values.push(`%${qNorm}%`);
        values.push(`%${qPhone}%`);
        
        conditions.push(`(
          LOWER(nombre) LIKE $1 OR
          LOWER(apellido) LIKE $1 OR
          LOWER(COALESCE(email, '')) LIKE $1 OR
          telefono LIKE $1 OR
          nombre_normalizado LIKE $2 OR
          apellido_normalizado LIKE $2 OR
          telefono_normalizado LIKE $3
        )`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const query = `SELECT * FROM clients ${whereClause} ORDER BY created_at DESC`;
      const res = await pgPool.query(query, values.length > 0 ? [values[0], values[1], values[2]] : []);

      rawClients = res.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        apellido: row.apellido,
        telefono: row.telefono,
        telefonoNormalizado: row.telefono_normalizado,
        email: row.email || undefined,
        emailNormalizado: row.email_normalizado || undefined,
        nombreNormalizado: row.nombre_normalizado,
        apellidoNormalizado: row.apellido_normalizado,
        notasAdmin: row.notas_admin || undefined,
        fechaAlta: row.fecha_alta ? new Date(row.fecha_alta).toISOString() : new Date().toISOString(),
        fechaUltimaVisita: row.fecha_ultima_visita || undefined,
        activo: Boolean(row.activo),
        browserId: row.browser_id || undefined,
        posibleDuplicadoDe: Array.isArray(row.posible_duplicado_de) ? row.posible_duplicado_de : (typeof row.posible_duplicado_de === 'string' ? JSON.parse(row.posible_duplicado_de) : []),
        motivoPosibleDuplicado: row.motivo_posible_duplicado || undefined,
        nivelCoincidenciaDuplicado: row.nivel_coincidencia_duplicado ? Number(row.nivel_coincidencia_duplicado) : undefined,
        duplicadoRevisado: Boolean(row.duplicado_revisado),
        fusionadoConId: row.fusionado_con_id || undefined,
        fechaFusion: row.fecha_fusion ? new Date(row.fecha_fusion).toISOString() : undefined
      }));
    } catch (err) {
      console.error('Error fetching clients from PostgreSQL:', err);
      rawClients = [...memoryDb.clients];
    }
  } else {
    rawClients = [...memoryDb.clients];
    if (activeOnly) {
      rawClients = rawClients.filter(c => c.activo !== false);
    }
  }

  // Enrich with appointment stats
  const allAppointments = await getAppointments();
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const enrichedClients = rawClients.map(client => {
    const clientApts = allAppointments.filter(a =>
      a.clienteId === client.id ||
      (a.telefono && normalizePhone(a.telefono).nationalDigits === client.telefonoNormalizado)
    );

    const totalTurnos = clientApts.length;
    const totalGastado = clientApts.reduce((acc, a) => acc + (a.precio || 0), 0);

    const sortedApts = [...clientApts].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));
    const primerTurnoFecha = sortedApts.length > 0 ? sortedApts[0].fecha : undefined;
    
    // Future appointments
    const upcomingApts = sortedApts.filter(a => a.fecha >= todayStr && a.estado !== 'cancelado');
    const nextApt = upcomingApts[0];

    // Past appointments
    const pastApts = sortedApts.filter(a => a.fecha <= todayStr);
    const lastVisit = pastApts.length > 0 ? pastApts[pastApts.length - 1].fecha : client.fechaUltimaVisita;

    const servicesCount: Record<string, number> = {};
    clientApts.forEach(a => {
      if (a.servicioNombre) {
        servicesCount[a.servicioNombre] = (servicesCount[a.servicioNombre] || 0) + 1;
      }
    });
    const serviciosHistorial = Object.entries(servicesCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return {
      ...client,
      totalTurnos,
      totalGastado,
      primerTurnoFecha,
      fechaUltimaVisita: lastVisit,
      proximoTurno: nextApt ? nextApt.fecha : undefined,
      proximoTurnoHora: nextApt ? nextApt.horaInicio : undefined,
      proximoTurnoServicio: nextApt ? nextApt.servicioNombre : undefined,
      serviciosHistorial
    };
  });

  // Apply Category / Segment Filters
  let result = enrichedClients;
  if (filter?.category && filter.category !== 'todos') {
    if (filter.category === 'recurrentes') {
      result = result.filter(c => (c.totalTurnos || 0) >= 2);
    } else if (filter.category === 'nuevos') {
      result = result.filter(c => c.fechaAlta >= thirtyDaysAgo || (c.primerTurnoFecha && c.primerTurnoFecha >= thirtyDaysAgo));
    } else if (filter.category === 'inactivos') {
      result = result.filter(c => !c.fechaUltimaVisita || c.fechaUltimaVisita < sixtyDaysAgo);
    } else if (filter.category === 'proximos') {
      result = result.filter(c => Boolean(c.proximoTurno));
    } else if (filter.category === 'duplicados') {
      result = result.filter(c => Boolean(c.posibleDuplicadoDe && c.posibleDuplicadoDe.length > 0 && !c.duplicadoRevisado));
    }
  }

  if (filter?.search && (!isPostgresConnected || !pgPool)) {
    const q = filter.search.toLowerCase();
    const qNorm = normalizeText(filter.search);
    result = result.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      c.telefono.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.nombreNormalizado.includes(qNorm) ||
      c.apellidoNormalizado.includes(qNorm) ||
      (c.notasAdmin && c.notasAdmin.toLowerCase().includes(q))
    );
  }

  return result;
}

export async function getClientById(id: string): Promise<{ client: Client; appointments: Appointment[] } | null> {
  const clients = await getClients({ activeOnly: false });
  const client = clients.find(c => c.id === id);
  if (!client) return null;

  const allAppointments = await getAppointments();
  const clientApts = allAppointments
    .filter(a => a.clienteId === client.id || (a.telefono && normalizePhone(a.telefono).nationalDigits === client.telefonoNormalizado))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.horaInicio.localeCompare(a.horaInicio));

  return {
    client,
    appointments: clientApts
  };
}

export async function createClient(clientData: Partial<Client> & { nombre: string; apellido: string; telefono: string }): Promise<Client> {
  const id = clientData.id || crypto.randomUUID();
  const phoneNorm = normalizePhone(clientData.telefono);
  const emailNorm = normalizeEmail(clientData.email);

  const client: Client = {
    id,
    nombre: clientData.nombre.trim(),
    apellido: clientData.apellido.trim(),
    telefono: clientData.telefono.trim(),
    telefonoNormalizado: phoneNorm.nationalDigits,
    email: clientData.email ? clientData.email.trim() : undefined,
    emailNormalizado: emailNorm || undefined,
    nombreNormalizado: normalizeText(clientData.nombre),
    apellidoNormalizado: normalizeText(clientData.apellido),
    notasAdmin: clientData.notasAdmin || undefined,
    fechaAlta: clientData.fechaAlta || new Date().toISOString(),
    fechaUltimaVisita: clientData.fechaUltimaVisita || undefined,
    activo: clientData.activo !== undefined ? clientData.activo : true,
    browserId: clientData.browserId || undefined,
    posibleDuplicadoDe: clientData.posibleDuplicadoDe || [],
    motivoPosibleDuplicado: clientData.motivoPosibleDuplicado || undefined,
    nivelCoincidenciaDuplicado: clientData.nivelCoincidenciaDuplicado,
    duplicadoRevisado: Boolean(clientData.duplicadoRevisado)
  };

  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO clients (
          id, nombre, apellido, telefono, telefono_normalizado, email, email_normalizado,
          nombre_normalizado, apellido_normalizado, notas_admin, fecha_alta, fecha_ultima_visita,
          activo, browser_id, posible_duplicado_de, motivo_posible_duplicado, nivel_coincidencia_duplicado,
          duplicado_revisado, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, NOW(), NOW()
        )
      `, [
        client.id,
        client.nombre,
        client.apellido,
        client.telefono,
        client.telefonoNormalizado,
        client.email || null,
        client.emailNormalizado || null,
        client.nombreNormalizado,
        client.apellidoNormalizado,
        client.notasAdmin || null,
        client.fechaAlta,
        client.fechaUltimaVisita || null,
        client.activo,
        client.browserId || null,
        JSON.stringify(client.posibleDuplicadoDe || []),
        client.motivoPosibleDuplicado || null,
        client.nivelCoincidenciaDuplicado || null,
        client.duplicadoRevisado
      ]);
      return client;
    } catch (err) {
      console.error('Error creating client in PostgreSQL:', err);
    }
  }

  memoryDb.clients.unshift(client);
  saveLocalFileDb();
  return client;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  if (isPostgresConnected && pgPool) {
    try {
      const currentRes = await pgPool.query('SELECT * FROM clients WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) return null;

      const curr = currentRes.rows[0];
      const newNombre = updates.nombre !== undefined ? updates.nombre.trim() : curr.nombre;
      const newApellido = updates.apellido !== undefined ? updates.apellido.trim() : curr.apellido;
      const newTelefono = updates.telefono !== undefined ? updates.telefono.trim() : curr.telefono;
      const newEmail = updates.email !== undefined ? updates.email.trim() : curr.email;

      const phoneNorm = normalizePhone(newTelefono);
      const emailNorm = normalizeEmail(newEmail);

      await pgPool.query(`
        UPDATE clients
        SET nombre = $2,
            apellido = $3,
            telefono = $4,
            telefono_normalizado = $5,
            email = $6,
            email_normalizado = $7,
            nombre_normalizado = $8,
            apellido_normalizado = $9,
            notas_admin = COALESCE($10, notas_admin),
            fecha_ultima_visita = COALESCE($11, fecha_ultima_visita),
            activo = COALESCE($12, activo),
            posible_duplicado_de = COALESCE($13, posible_duplicado_de),
            motivo_posible_duplicado = COALESCE($14, motivo_posible_duplicado),
            nivel_coincidencia_duplicado = COALESCE($15, nivel_coincidencia_duplicado),
            duplicado_revisado = COALESCE($16, duplicado_revisado),
            updated_at = NOW()
        WHERE id = $1
      `, [
        id,
        newNombre,
        newApellido,
        newTelefono,
        phoneNorm.nationalDigits,
        newEmail || null,
        emailNorm || null,
        normalizeText(newNombre),
        normalizeText(newApellido),
        updates.notasAdmin !== undefined ? updates.notasAdmin : null,
        updates.fechaUltimaVisita || null,
        updates.activo !== undefined ? updates.activo : null,
        updates.posibleDuplicadoDe !== undefined ? JSON.stringify(updates.posibleDuplicadoDe) : null,
        updates.motivoPosibleDuplicado !== undefined ? updates.motivoPosibleDuplicado : null,
        updates.nivelCoincidenciaDuplicado !== undefined ? updates.nivelCoincidenciaDuplicado : null,
        updates.duplicadoRevisado !== undefined ? updates.duplicadoRevisado : null
      ]);

      const updatedRes = await pgPool.query('SELECT * FROM clients WHERE id = $1', [id]);
      const row = updatedRes.rows[0];
      return {
        id: row.id,
        nombre: row.nombre,
        apellido: row.apellido,
        telefono: row.telefono,
        telefonoNormalizado: row.telefono_normalizado,
        email: row.email || undefined,
        emailNormalizado: row.email_normalizado || undefined,
        nombreNormalizado: row.nombre_normalizado,
        apellidoNormalizado: row.apellido_normalizado,
        notasAdmin: row.notas_admin || undefined,
        fechaAlta: row.fecha_alta ? new Date(row.fecha_alta).toISOString() : new Date().toISOString(),
        fechaUltimaVisita: row.fecha_ultima_visita || undefined,
        activo: Boolean(row.activo),
        browserId: row.browser_id || undefined,
        posibleDuplicadoDe: Array.isArray(row.posible_duplicado_de) ? row.posible_duplicado_de : (typeof row.posible_duplicado_de === 'string' ? JSON.parse(row.posible_duplicado_de) : []),
        motivoPosibleDuplicado: row.motivo_posible_duplicado || undefined,
        nivelCoincidenciaDuplicado: row.nivel_coincidencia_duplicado ? Number(row.nivel_coincidencia_duplicado) : undefined,
        duplicadoRevisado: Boolean(row.duplicado_revisado)
      };
    } catch (err) {
      console.error('Error updating client in PostgreSQL:', err);
    }
  }

  const idx = memoryDb.clients.findIndex(c => c.id === id);
  if (idx === -1) return null;

  const current = memoryDb.clients[idx];
  const updated: Client = {
    ...current,
    ...updates,
    nombreNormalizado: updates.nombre ? normalizeText(updates.nombre) : current.nombreNormalizado,
    apellidoNormalizado: updates.apellido ? normalizeText(updates.apellido) : current.apellidoNormalizado,
    telefonoNormalizado: updates.telefono ? normalizePhone(updates.telefono).nationalDigits : current.telefonoNormalizado,
    emailNormalizado: updates.email !== undefined ? normalizeEmail(updates.email) : current.emailNormalizado
  };

  memoryDb.clients[idx] = updated;
  saveLocalFileDb();
  return updated;
}

export async function deleteClient(id: string): Promise<boolean> {
  const updated = await updateClient(id, { activo: false });
  return Boolean(updated);
}

/**
 * Intelligent Matching Engine for Incoming Booking Requests:
 * Evaluates candidate clients without forcing registration or logins.
 */
export async function findOrCreateClientForBooking(incoming: {
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  fecha?: string;
  browserId?: string;
}): Promise<Client> {
  const existingClients = await getClients({ activeOnly: true });
  const matchResult = evaluateClientMatch(incoming, existingClients);

  if (matchResult.isMatch && matchResult.matchedClient) {
    const matched = matchResult.matchedClient;
    const updates: Partial<Client> = {};

    if (incoming.fecha && (!matched.fechaUltimaVisita || incoming.fecha > matched.fechaUltimaVisita)) {
      updates.fechaUltimaVisita = incoming.fecha;
    }
    if (incoming.email && !matched.email) {
      updates.email = incoming.email;
    }
    if (incoming.browserId && !matched.browserId) {
      updates.browserId = incoming.browserId;
    }

    if (Object.keys(updates).length > 0) {
      await updateClient(matched.id, updates);
    }

    return matched;
  }

  // Create new client record
  const newClientData: Partial<Client> & { nombre: string; apellido: string; telefono: string } = {
    id: crypto.randomUUID(),
    nombre: incoming.nombre,
    apellido: incoming.apellido,
    telefono: incoming.telefono,
    email: incoming.email,
    fechaAlta: new Date().toISOString(),
    fechaUltimaVisita: incoming.fecha || new Date().toISOString().split('T')[0],
    activo: true,
    browserId: incoming.browserId
  };

  if (matchResult.isPotentialDuplicate && matchResult.duplicateCandidate) {
    newClientData.posibleDuplicadoDe = [matchResult.duplicateCandidate.id];
    newClientData.motivoPosibleDuplicado = matchResult.duplicateReason;
    newClientData.nivelCoincidenciaDuplicado = matchResult.confidence;
    newClientData.duplicadoRevisado = false;

    // Link back to duplicate candidate for bidirectional visibility
    const candidateDuplicates = matchResult.duplicateCandidate.posibleDuplicadoDe || [];
    if (!candidateDuplicates.includes(newClientData.id!)) {
      await updateClient(matchResult.duplicateCandidate.id, {
        posibleDuplicadoDe: [...candidateDuplicates, newClientData.id!],
        motivoPosibleDuplicado: matchResult.duplicateReason,
        nivelCoincidenciaDuplicado: matchResult.confidence,
        duplicadoRevisado: false
      });
    }
  }

  return await createClient(newClientData);
}

/**
 * Retrieves all detected duplicate pairs with full comparison data.
 */
export async function getPotentialDuplicatePairs(): Promise<DuplicatePair[]> {
  const clients = await getClients({ activeOnly: true });
  const allAppointments = await getAppointments();
  const pairs: DuplicatePair[] = [];
  const processedPairKeys = new Set<string>();

  for (const clientA of clients) {
    if (!clientA.posibleDuplicadoDe || clientA.posibleDuplicadoDe.length === 0 || clientA.duplicadoRevisado) {
      // Also check on the fly for potential name similarities with different phones
      for (const clientB of clients) {
        if (clientA.id === clientB.id) continue;
        const pairKey = [clientA.id, clientB.id].sort().join('__');
        if (processedPairKeys.has(pairKey)) continue;

        const sameName = clientA.nombreNormalizado === clientB.nombreNormalizado && clientA.apellidoNormalizado === clientB.apellidoNormalizado;
        const sim = stringSimilarity(`${clientA.nombreNormalizado} ${clientA.apellidoNormalizado}`, `${clientB.nombreNormalizado} ${clientB.apellidoNormalizado}`);

        if ((sameName || sim >= 0.88) && clientA.telefonoNormalizado !== clientB.telefonoNormalizado) {
          processedPairKeys.add(pairKey);
          const turnosA = allAppointments.filter(a => a.clienteId === clientA.id || normalizePhone(a.telefono).nationalDigits === clientA.telefonoNormalizado);
          const turnosB = allAppointments.filter(a => a.clienteId === clientB.id || normalizePhone(a.telefono).nationalDigits === clientB.telefonoNormalizado);

          pairs.push({
            id: pairKey,
            clienteA: clientA,
            clienteB: clientB,
            confianza: sameName ? 80 : Math.round(sim * 100),
            motivo: sameName ? 'Mismo nombre y apellido pero números de teléfono diferentes' : `Nombres muy similares (${Math.round(sim * 100)}%) con teléfonos distintos`,
            turnosA,
            turnosB
          });
        }
      }
      continue;
    }

    for (const otherId of clientA.posibleDuplicadoDe) {
      const clientB = clients.find(c => c.id === otherId);
      if (!clientB) continue;

      const pairKey = [clientA.id, clientB.id].sort().join('__');
      if (processedPairKeys.has(pairKey)) continue;
      processedPairKeys.add(pairKey);

      const turnosA = allAppointments.filter(a => a.clienteId === clientA.id || normalizePhone(a.telefono).nationalDigits === clientA.telefonoNormalizado);
      const turnosB = allAppointments.filter(a => a.clienteId === clientB.id || normalizePhone(a.telefono).nationalDigits === clientB.telefonoNormalizado);

      pairs.push({
        id: pairKey,
        clienteA: clientA,
        clienteB: clientB,
        confianza: clientA.nivelCoincidenciaDuplicado || 75,
        motivo: clientA.motivoPosibleDuplicado || 'Coincidencia parcial de datos personales',
        turnosA,
        turnosB
      });
    }
  }

  return pairs;
}

/**
 * Merges secondary client into primary client:
 * 1. Reassigns all appointments from secondary to primary.
 * 2. Merges internal notes & contact details.
 * 3. Deactivates secondary client and marks fusion timestamp.
 */
export async function mergeClients(primaryId: string, secondaryId: string, adminNotes?: string): Promise<{ primary: Client; migratedAppointmentsCount: number }> {
  const clients = await getClients({ activeOnly: false });
  const primary = clients.find(c => c.id === primaryId);
  const secondary = clients.find(c => c.id === secondaryId);

  if (!primary || !secondary) {
    throw new Error('Uno o ambos clientes no existen para realizar la fusión');
  }

  // 1. Reassign all appointments
  const allAppointments = await getAppointments();
  const secondaryAppointments = allAppointments.filter(a =>
    a.clienteId === secondary.id ||
    (a.telefono && normalizePhone(a.telefono).nationalDigits === secondary.telefonoNormalizado)
  );

  let migratedCount = 0;
  for (const apt of secondaryAppointments) {
    await updateAppointment(apt.id, { clienteId: primary.id } as any);
    if (isPostgresConnected && pgPool) {
      await pgPool.query('UPDATE appointments SET cliente_id = $1 WHERE id = $2', [primary.id, apt.id]);
    }
    migratedCount++;
  }

  // 2. Merge internal notes
  const combinedNotesParts: string[] = [];
  if (primary.notasAdmin) combinedNotesParts.push(primary.notasAdmin);
  if (secondary.notasAdmin) combinedNotesParts.push(`[Nota previa cuenta fusionada]: ${secondary.notasAdmin}`);
  if (adminNotes) combinedNotesParts.push(`[Fusión realizada]: ${adminNotes}`);
  combinedNotesParts.push(`[Historial]: Fusión de cliente ${secondary.nombre} ${secondary.apellido} (Tel: ${secondary.telefono}) el ${new Date().toLocaleDateString('es-AR')}`);

  const mergedNotes = combinedNotesParts.join('\n\n');

  // 3. Update primary client
  const oldestAlta = primary.fechaAlta < secondary.fechaAlta ? primary.fechaAlta : secondary.fechaAlta;
  const latestVisita = (primary.fechaUltimaVisita && secondary.fechaUltimaVisita)
    ? (primary.fechaUltimaVisita > secondary.fechaUltimaVisita ? primary.fechaUltimaVisita : secondary.fechaUltimaVisita)
    : (primary.fechaUltimaVisita || secondary.fechaUltimaVisita);

  const updatedPrimary = await updateClient(primary.id, {
    email: primary.email || secondary.email,
    fechaAlta: oldestAlta,
    fechaUltimaVisita: latestVisita,
    notasAdmin: mergedNotes,
    posibleDuplicadoDe: (primary.posibleDuplicadoDe || []).filter(id => id !== secondary.id),
    duplicadoRevisado: true
  });

  // 4. Mark secondary client as merged and inactive
  if (isPostgresConnected && pgPool) {
    await pgPool.query(`
      UPDATE clients
      SET activo = false,
          fusionado_con_id = $2,
          fecha_fusion = NOW(),
          duplicado_revisado = true,
          updated_at = NOW()
      WHERE id = $1
    `, [secondary.id, primary.id]);
  } else {
    const secIdx = memoryDb.clients.findIndex(c => c.id === secondary.id);
    if (secIdx !== -1) {
      memoryDb.clients[secIdx].activo = false;
      memoryDb.clients[secIdx].fusionadoConId = primary.id;
      memoryDb.clients[secIdx].fechaFusion = new Date().toISOString();
      memoryDb.clients[secIdx].duplicadoRevisado = true;
      saveLocalFileDb();
    }
  }

  return {
    primary: updatedPrimary || primary,
    migratedAppointmentsCount: migratedCount
  };
}

/**
 * Dismisses a potential duplicate pair without merging.
 */
export async function dismissDuplicatePair(idA: string, idB: string): Promise<boolean> {
  const clients = await getClients({ activeOnly: true });
  const clientA = clients.find(c => c.id === idA);
  const clientB = clients.find(c => c.id === idB);

  if (clientA) {
    const updatedA = (clientA.posibleDuplicadoDe || []).filter(id => id !== idB);
    await updateClient(clientA.id, { posibleDuplicadoDe: updatedA, duplicadoRevisado: true });
  }
  if (clientB) {
    const updatedB = (clientB.posibleDuplicadoDe || []).filter(id => id !== idA);
    await updateClient(clientB.id, { posibleDuplicadoDe: updatedB, duplicadoRevisado: true });
  }

  return true;
}

/**
 * Calculates global statistics and KPIs for clients.
 */
export async function getClientStats(): Promise<ClientStats> {
  const clients = await getClients({ activeOnly: true });
  const duplicates = await getPotentialDuplicatePairs();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const totalClientes = clients.length;
  const clientesNuevos = clients.filter(c => c.fechaAlta >= thirtyDaysAgo || (c.primerTurnoFecha && c.primerTurnoFecha >= thirtyDaysAgo)).length;
  const clientesRecurrentes = clients.filter(c => (c.totalTurnos || 0) >= 2).length;
  const clientesInactivos = clients.filter(c => !c.fechaUltimaVisita || c.fechaUltimaVisita < sixtyDaysAgo).length;
  const clientesConProximosTurnos = clients.filter(c => Boolean(c.proximoTurno)).length;

  return {
    totalClientes,
    clientesNuevos,
    clientesRecurrentes,
    clientesInactivos,
    clientesConProximosTurnos,
    duplicadosPendientes: duplicates.length
  };
}

// ---------------------------------------------------------------------------
// CRUD OPERATIONS: SERVICES
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CRUD OPERATIONS: APPOINTMENTS (TURNOS)
// ---------------------------------------------------------------------------

export async function getAppointments(filter?: {
  date?: string;
  from?: string;
  to?: string;
  status?: string;
  search?: string;
  clienteId?: string;
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
      if (filter?.clienteId) {
        values.push(filter.clienteId);
        conditions.push(`cliente_id = $${values.length}`);
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
        clienteId: row.cliente_id || undefined,
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
        browserId: row.browser_id || undefined,
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
  if (filter?.clienteId) filtered = filtered.filter(a => a.clienteId === filter.clienteId);
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
  // Ensure client exists and link client_id
  if (!apt.clienteId) {
    const client = await findOrCreateClientForBooking({
      nombre: apt.nombre,
      apellido: apt.apellido,
      telefono: apt.telefono,
      email: apt.email,
      fecha: apt.fecha,
      browserId: apt.browserId
    });
    apt.clienteId = client.id;
  }

  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO appointments (
          id, cliente_id, codigo, nombre, apellido, telefono, email,
          servicio_id, servicio_nombre, duracion_minutos, precio,
          fecha, hora_inicio, hora_fin, observaciones, estado,
          notas_admin, browser_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      `, [
        apt.id,
        apt.clienteId,
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
        apt.notasAdmin || null,
        apt.browserId || null
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
            cliente_id = COALESCE($7, cliente_id),
            updated_at = NOW()
        WHERE id = $1
      `, [
        targetId,
        updates.estado || null,
        updates.notasAdmin !== undefined ? updates.notasAdmin : null,
        updates.fecha || null,
        updates.horaInicio || null,
        updates.horaFin || null,
        updates.clienteId || null
      ]);

      const updatedRes = await pgPool.query('SELECT * FROM appointments WHERE id = $1', [targetId]);
      const row = updatedRes.rows[0];
      return {
        id: row.id,
        clienteId: row.cliente_id || undefined,
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
        browserId: row.browser_id || undefined,
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
  if (updates.clienteId) apt.clienteId = updates.clienteId;
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

// ---------------------------------------------------------------------------
// STUDIO CONFIG
// ---------------------------------------------------------------------------

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
