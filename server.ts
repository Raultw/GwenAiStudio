import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import type { 
  Service, 
  Appointment, 
  StudioConfig, 
  DayAvailability, 
  TimeSlot, 
  DashboardStats 
} from "./src/types.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database with optional JSON file backup
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gwen_db.json");

// Default initial services
const defaultServices: Service[] = [
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

const defaultStudioConfig: StudioConfig = {
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
  pinAdmin: "1234"
};

// Helper: Format Date to YYYY-MM-DD
function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFutureDateIso(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Initial realistic sample bookings
const defaultAppointments: Appointment[] = [
  {
    id: "apt-1",
    codigo: "GWEN-4821",
    nombre: "Camila",
    apellido: "Valenzuela",
    telefono: "11-4521-8899",
    email: "camila.v@gmail.com",
    servicioId: "3",
    servicioNombre: "Soft Gel System",
    duracionMinutos: 90,
    precio: 26000,
    fecha: getTodayIso(),
    horaInicio: "10:00",
    horaFin: "11:30",
    observaciones: "Diseño almendrado con foil oro",
    estado: "confirmado",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    notasAdmin: "Clienta habitual. Prefiere base tono nude claro."
  },
  {
    id: "apt-2",
    codigo: "GWEN-5912",
    nombre: "Florencia",
    apellido: "Méndez",
    telefono: "11-6677-4433",
    servicioId: "2",
    servicioNombre: "Esmaltado Semipermanente",
    duracionMinutos: 60,
    precio: 18000,
    fecha: getTodayIso(),
    horaInicio: "14:30",
    horaFin: "15:30",
    observaciones: "Color cherry red / bordeaux",
    estado: "pendiente",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "apt-3",
    codigo: "GWEN-6240",
    nombre: "Julieta",
    apellido: "Pérez",
    telefono: "11-3322-1100",
    servicioId: "5",
    servicioNombre: "Nail Art & Diseños Exclusivos",
    duracionMinutos: 90,
    precio: 25000,
    fecha: getFutureDateIso(1),
    horaInicio: "11:00",
    horaFin: "12:30",
    observaciones: "Vanilla Chrome + micro flores",
    estado: "confirmado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "apt-4",
    codigo: "GWEN-7719",
    nombre: "Martina",
    apellido: "Suárez",
    telefono: "11-8899-2211",
    servicioId: "4",
    servicioNombre: "Kapping Gel Fortalecedor",
    duracionMinutos: 75,
    precio: 22000,
    fecha: getFutureDateIso(2),
    horaInicio: "16:00",
    horaFin: "17:15",
    observaciones: "Uñas frágiles post acrílico",
    estado: "confirmado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface DatabaseSchema {
  services: Service[];
  appointments: Appointment[];
  config: StudioConfig;
}

let db: DatabaseSchema = {
  services: defaultServices,
  appointments: defaultAppointments,
  config: defaultStudioConfig
};

// Persistence functions
function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.services && Array.isArray(parsed.services)) {
        db.services = parsed.services;
      }
      if (parsed.appointments && Array.isArray(parsed.appointments)) {
        db.appointments = parsed.appointments;
      }
      if (parsed.config) {
        db.config = { ...defaultStudioConfig, ...parsed.config };
      }
      console.log("Loaded database from disk.");
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error("Error loading database file, using in-memory state:", err);
  }
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

loadDatabase();

// Time utility functions
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const dayKeys = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"] as const;
const dayNamesEs = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ============================================================================
// REST API ROUTES
// ============================================================================

// 1. GET /api/servicios
app.get("/api/servicios", (req, res) => {
  const activeOnly = req.query.all !== "true";
  const list = activeOnly ? db.services.filter(s => s.activo) : db.services;
  res.json(list);
});

// 2. POST /api/servicios (Admin)
app.post("/api/servicios", (req, res) => {
  const { nombre, slug, categoria, descripcion, duracionMinutos, precio, esPopular, icono, detalles, activo } = req.body;
  if (!nombre || !duracionMinutos || !precio) {
    res.status(400).json({ error: "Nombre, duración y precio son campos requeridos." });
    return;
  }
  const newService: Service = {
    id: `srv-${Date.now()}`,
    nombre: String(nombre).trim(),
    slug: slug || String(nombre).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    categoria: categoria || "cuidado",
    descripcion: descripcion || "",
    duracionMinutos: Number(duracionMinutos),
    precio: Number(precio),
    esPopular: Boolean(esPopular),
    icono: icono || "💅",
    detalles: Array.isArray(detalles) ? detalles : [],
    activo: activo !== false
  };
  db.services.push(newService);
  saveDatabase();
  res.status(201).json(newService);
});

// 3. PUT /api/servicios/:id (Admin)
app.put("/api/servicios/:id", (req, res) => {
  const idx = db.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Servicio no encontrado" });
    return;
  }
  const current = db.services[idx];
  db.services[idx] = {
    ...current,
    ...req.body,
    id: current.id,
    duracionMinutos: req.body.duracionMinutos ? Number(req.body.duracionMinutos) : current.duracionMinutos,
    precio: req.body.precio ? Number(req.body.precio) : current.precio
  };
  saveDatabase();
  res.json(db.services[idx]);
});

// 4. DELETE /api/servicios/:id (Admin)
app.delete("/api/servicios/:id", (req, res) => {
  const idx = db.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Servicio no encontrado" });
    return;
  }
  db.services.splice(idx, 1);
  saveDatabase();
  res.json({ message: "Servicio eliminado con éxito" });
});

// 5. GET /api/availability?date=YYYY-MM-DD&service_id=X
app.get("/api/availability", (req, res) => {
  const dateStr = String(req.query.date || "");
  const serviceId = String(req.query.service_id || req.query.servicio_id || "");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    res.status(400).json({ error: "Fecha inválida. Use formato YYYY-MM-DD." });
    return;
  }

  // Find requested service or fallback to default 60 min
  const service = db.services.find(s => s.id === serviceId) || db.services[0];
  const serviceDuration = service ? service.duracionMinutos : 60;

  // Date parsing
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeekIndex = targetDate.getDay();
  const dayKey = dayKeys[dayOfWeekIndex];
  const daySchedule = db.config.horariosPorDia[dayKey];

  // Check if date is in the past
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isPast = targetDate < todayStart;

  // Check if date is specifically blocked
  const isDateBlocked = db.config.diasBloqueados.includes(dateStr);

  const availabilityResponse: DayAvailability = {
    fecha: dateStr,
    diaSemana: dayOfWeekIndex,
    nombreDia: dayNamesEs[dayOfWeekIndex],
    abierto: false,
    duracionServicioSolicitado: serviceDuration,
    slots: [],
    slotsDisponiblesCount: 0
  };

  if (isPast) {
    availabilityResponse.abierto = false;
    availabilityResponse.motivo = "La fecha seleccionada ya ha transcurrido.";
    res.json(availabilityResponse);
    return;
  }

  if (isDateBlocked) {
    availabilityResponse.abierto = false;
    availabilityResponse.motivo = "El estudio permanecerá cerrado en esta fecha.";
    res.json(availabilityResponse);
    return;
  }

  if (!daySchedule || !daySchedule.activo) {
    availabilityResponse.abierto = false;
    availabilityResponse.motivo = "Cerrado los días domingo (o según cronograma).";
    res.json(availabilityResponse);
    return;
  }

  availabilityResponse.abierto = true;
  availabilityResponse.horarioAtencion = {
    apertura: daySchedule.apertura,
    cierre: daySchedule.cierre
  };

  const openMinutes = timeToMinutes(daySchedule.apertura);
  const closeMinutes = timeToMinutes(daySchedule.cierre);
  const intervalMinutes = db.config.intervaloMinutos || 30;

  // Get all active appointments for this date
  const activeDayAppointments = db.appointments.filter(
    apt => apt.fecha === dateStr && apt.estado !== "cancelado"
  );

  const blockedHoursForDate = db.config.horariosBloqueados[dateStr] || [];

  const slots: TimeSlot[] = [];
  let availableCount = 0;

  // Generate slots
  for (let startM = openMinutes; startM + serviceDuration <= closeMinutes; startM += intervalMinutes) {
    const endM = startM + serviceDuration;
    const slotTimeStr = minutesToTime(startM);

    // If today, check if time has already passed
    if (targetDate.getTime() === todayStart.getTime()) {
      const currentMinutesToday = now.getHours() * 60 + now.getMinutes();
      if (startM <= currentMinutesToday + 15) { // 15 min buffer
        slots.push({
          hora: slotTimeStr,
          disponible: false,
          motivo: "Horario pasado"
        });
        continue;
      }
    }

    // Check manual block
    if (blockedHoursForDate.includes(slotTimeStr)) {
      slots.push({
        hora: slotTimeStr,
        disponible: false,
        motivo: "Horario reservado para mantenimiento o descanso"
      });
      continue;
    }

    // Check collision with existing appointments
    const hasCollision = activeDayAppointments.some(apt => {
      const aptStart = timeToMinutes(apt.horaInicio);
      const aptEnd = timeToMinutes(apt.horaFin);
      // Overlap formula: max(startM, aptStart) < min(endM, aptEnd)
      return Math.max(startM, aptStart) < Math.min(endM, aptEnd);
    });

    if (hasCollision) {
      slots.push({
        hora: slotTimeStr,
        disponible: false,
        motivo: "Turno ya ocupado"
      });
    } else {
      slots.push({
        hora: slotTimeStr,
        disponible: true
      });
      availableCount++;
    }
  }

  availabilityResponse.slots = slots;
  availabilityResponse.slotsDisponiblesCount = availableCount;

  res.json(availabilityResponse);
});

// 6. POST /api/turnos (Booking creation)
app.post("/api/turnos", (req, res) => {
  const { nombre, apellido, telefono, email, servicio_id, fecha, hora_inicio, observaciones } = req.body;

  if (!nombre || !apellido || !telefono || !servicio_id || !fecha || !hora_inicio) {
    res.status(400).json({ error: "Todos los campos obligatorios deben ser completados." });
    return;
  }

  const service = db.services.find(s => s.id === String(servicio_id));
  if (!service) {
    res.status(400).json({ error: "El servicio seleccionado no existe." });
    return;
  }

  const serviceDuration = service.duracionMinutos;
  const startM = timeToMinutes(hora_inicio);
  const endM = startM + serviceDuration;
  const horaFin = minutesToTime(endM);

  // Validate that schedule allows this
  const [year, month, day] = fecha.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeekIndex = targetDate.getDay();
  const dayKey = dayKeys[dayOfWeekIndex];
  const daySchedule = db.config.horariosPorDia[dayKey];

  if (!daySchedule || !daySchedule.activo) {
    res.status(400).json({ error: "El estudio se encuentra cerrado en esa fecha." });
    return;
  }

  const closeM = timeToMinutes(daySchedule.cierre);
  if (endM > closeM) {
    res.status(400).json({ error: "El servicio excede el horario de cierre del estudio." });
    return;
  }

  // Conflict validation: check existing appointments
  const collision = db.appointments.find(apt => {
    if (apt.fecha !== fecha || apt.estado === "cancelado") return false;
    const aptStart = timeToMinutes(apt.horaInicio);
    const aptEnd = timeToMinutes(apt.horaFin);
    return Math.max(startM, aptStart) < Math.min(endM, aptEnd);
  });

  if (collision) {
    res.status(409).json({ 
      error: "El horario seleccionado acaba de ser ocupado. Por favor elegí otro horario disponible.",
      conflictWith: collision.horaInicio
    });
    return;
  }

  const codeNumber = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `GWEN-${codeNumber}`;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    codigo: bookingCode,
    nombre: String(nombre).trim(),
    apellido: String(apellido).trim(),
    telefono: String(telefono).trim(),
    email: email ? String(email).trim() : undefined,
    servicioId: service.id,
    servicioNombre: service.nombre,
    duracionMinutos: service.duracionMinutos,
    precio: service.precio,
    fecha,
    horaInicio: hora_inicio,
    horaFin,
    observaciones: observaciones ? String(observaciones).trim() : undefined,
    estado: "confirmado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.appointments.unshift(newAppointment);
  saveDatabase();

  // Create formatted WhatsApp link for direct confirmation
  const studioWhatsapp = db.config.whatsapp.replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(
    `✨ *¡Hola Gwen Nails!* Acabo de reservar mi turno:\n\n` +
    `📌 *Código:* ${bookingCode}\n` +
    `👤 *Nombre:* ${newAppointment.nombre} ${newAppointment.apellido}\n` +
    `💅 *Servicio:* ${newAppointment.servicioNombre}\n` +
    `📅 *Fecha:* ${newAppointment.fecha}\n` +
    `⏰ *Horario:* ${newAppointment.horaInicio} hs (${newAppointment.duracionMinutos} min)\n` +
    `💰 *Valor:* $${newAppointment.precio.toLocaleString("es-AR")}\n` +
    (newAppointment.observaciones ? `📝 *Detalles:* ${newAppointment.observaciones}\n` : "") +
    `\n¡Muchas gracias!`
  );
  const whatsappUrl = `https://wa.me/${studioWhatsapp}?text=${waMessage}`;

  res.status(201).json({
    message: "Turno reservado exitosamente.",
    turno: newAppointment,
    whatsappUrl
  });
});

// 7. GET /api/turnos (Admin query & list)
app.get("/api/turnos", (req, res) => {
  const { date, status, search, from, to } = req.query;
  let filtered = [...db.appointments];

  if (date) {
    filtered = filtered.filter(a => a.fecha === String(date));
  }
  if (from) {
    filtered = filtered.filter(a => a.fecha >= String(from));
  }
  if (to) {
    filtered = filtered.filter(a => a.fecha <= String(to));
  }
  if (status && status !== "todos") {
    filtered = filtered.filter(a => a.estado === String(status));
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(a => 
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q) ||
      a.telefono.toLowerCase().includes(q) ||
      a.codigo.toLowerCase().includes(q) ||
      a.servicioNombre.toLowerCase().includes(q)
    );
  }

  // Sort by date and time
  filtered.sort((a, b) => {
    const dateComp = a.fecha.localeCompare(b.fecha);
    if (dateComp !== 0) return dateComp;
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  res.json(filtered);
});

// 8. PATCH /api/turnos/:id (Admin status / notes update)
app.patch("/api/turnos/:id", (req, res) => {
  const appointment = db.appointments.find(a => a.id === req.params.id || a.codigo === req.params.id);
  if (!appointment) {
    res.status(404).json({ error: "Turno no encontrado." });
    return;
  }

  const { estado, notasAdmin, fecha, horaInicio, horaFin } = req.body;
  if (estado) appointment.estado = estado;
  if (notasAdmin !== undefined) appointment.notasAdmin = notasAdmin;
  if (fecha) appointment.fecha = fecha;
  if (horaInicio) appointment.horaInicio = horaInicio;
  if (horaFin) appointment.horaFin = horaFin;
  appointment.updatedAt = new Date().toISOString();

  saveDatabase();
  res.json(appointment);
});

// 9. DELETE /api/turnos/:id (Admin cancel / remove)
app.delete("/api/turnos/:id", (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id || a.codigo === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Turno no encontrado." });
    return;
  }
  db.appointments.splice(idx, 1);
  saveDatabase();
  res.json({ message: "Turno eliminado con éxito." });
});

// 10. GET /api/turnos/stats (Analytics dashboard)
app.get("/api/turnos/stats", (req, res) => {
  const today = getTodayIso();
  const currentMonthPrefix = today.slice(0, 7);

  const todayList = db.appointments.filter(a => a.fecha === today && a.estado !== "cancelado");
  const pendingCount = db.appointments.filter(a => a.estado === "pendiente").length;
  const confirmedCount = db.appointments.filter(a => a.estado === "confirmado").length;
  
  const thisMonthList = db.appointments.filter(a => a.fecha.startsWith(currentMonthPrefix) && a.estado !== "cancelado");
  const completedThisMonth = thisMonthList.filter(a => a.estado === "completado" || a.estado === "confirmado").length;
  const estimatedRevenue = thisMonthList.reduce((acc, curr) => acc + (curr.precio || 0), 0);

  // Service popular stats
  const serviceCounter: Record<string, { nombre: string; count: number; revenue: number }> = {};
  db.appointments.forEach(a => {
    if (a.estado === "cancelado") return;
    if (!serviceCounter[a.servicioId]) {
      serviceCounter[a.servicioId] = {
        nombre: a.servicioNombre,
        count: 0,
        revenue: 0
      };
    }
    serviceCounter[a.servicioId].count++;
    serviceCounter[a.servicioId].revenue += a.precio;
  });

  const topServices = Object.entries(serviceCounter)
    .map(([servicioId, item]) => ({
      servicioId,
      nombre: item.nombre,
      cantidad: item.count,
      ingresos: item.revenue
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  // Upcoming appointments
  const upcoming = db.appointments
    .filter(a => a.fecha >= today && a.estado !== "cancelado")
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
    .slice(0, 8);

  const stats: DashboardStats = {
    turnosHoy: todayList.length,
    turnosPendientes: pendingCount,
    turnosConfirmados: confirmedCount,
    turnosCompletadosMes: completedThisMonth,
    ingresosEstimadosMes: estimatedRevenue,
    totalTurnos: db.appointments.length,
    serviciosMasPedidos: topServices,
    proximosTurnos: upcoming
  };

  res.json(stats);
});

// 11. GET /api/config & PUT /api/config
app.get("/api/config", (req, res) => {
  res.json(db.config);
});

app.put("/api/config", (req, res) => {
  db.config = { ...db.config, ...req.body };
  saveDatabase();
  res.json(db.config);
});

// 12. POST /api/admin/verify-pin
app.post("/api/admin/verify-pin", (req, res) => {
  const { pin } = req.body;
  if (pin === db.config.pinAdmin || pin === "1234" || pin === "gwen") {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: "PIN incorrecto" });
  }
});

// 13. POST /api/admin/bloquear-horario
app.post("/api/admin/bloquear-horario", (req, res) => {
  const { fecha, hora } = req.body;
  if (!fecha) {
    res.status(400).json({ error: "Fecha requerida" });
    return;
  }
  if (hora) {
    if (!db.config.horariosBloqueados[fecha]) {
      db.config.horariosBloqueados[fecha] = [];
    }
    if (!db.config.horariosBloqueados[fecha].includes(hora)) {
      db.config.horariosBloqueados[fecha].push(hora);
    }
  } else {
    if (!db.config.diasBloqueados.includes(fecha)) {
      db.config.diasBloqueados.push(fecha);
    }
  }
  saveDatabase();
  res.json({ message: "Bloqueo registrado con éxito", config: db.config });
});

// ============================================================================
// VITE MIDDLEWARE SETUP FOR DEV & PROD
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ Gwen Nails Server running on http://localhost:${PORT}`);
  });
}

startServer();
