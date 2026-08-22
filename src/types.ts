export type AppointmentStatus = 'pendiente' | 'confirmado' | 'completado' | 'cancelado';

export interface Client {
  id: string; // UUID
  nombre: string;
  apellido: string;
  telefono: string;
  telefonoNormalizado: string; // Canonical clean digits (e.g. 1112345678)
  email?: string;
  emailNormalizado?: string;
  nombreNormalizado: string;
  apellidoNormalizado: string;
  notasAdmin?: string; // Observaciones internas exclusivas del administrador
  fechaAlta: string; // ISO date
  fechaUltimaVisita?: string; // YYYY-MM-DD
  activo: boolean;
  browserId?: string; // Identificador técnico complementario anónimo
  
  // Auditoría calculada / enriquecida
  totalTurnos?: number;
  totalGastado?: number;
  primerTurnoFecha?: string;
  proximoTurno?: string; // YYYY-MM-DD
  proximoTurnoHora?: string; // HH:mm
  proximoTurnoServicio?: string;
  serviciosHistorial?: string[]; // Lista de nombres de servicios solicitados
  
  // Detección de posibles duplicados
  posibleDuplicadoDe?: string[]; // IDs de otros clientes similares
  motivoPosibleDuplicado?: string;
  nivelCoincidenciaDuplicado?: number; // 0-100
  duplicadoRevisado?: boolean;
  fusionadoConId?: string; // ID del cliente principal en caso de fusión
  fechaFusion?: string;
}

export interface DuplicatePair {
  id: string; // Identificador del par de duplicados
  clienteA: Client;
  clienteB: Client;
  confianza: number; // Porcentaje 0-100
  motivo: string;
  turnosA: Appointment[];
  turnosB: Appointment[];
}

export interface ClientStats {
  totalClientes: number;
  clientesNuevos: number; // Primer turno en últimos 30 días
  clientesRecurrentes: number; // 2 o más turnos
  clientesInactivos: number; // Sin turnos en últimos 60 días
  clientesConProximosTurnos: number;
  duplicadosPendientes: number;
}

export interface Service {
  id: string;
  nombre: string;
  slug: string;
  categoria: 'esculpidas' | 'esmaltado' | 'cuidado' | 'arte';
  descripcion: string;
  duracionMinutos: number;
  precio: number;
  esPopular?: boolean;
  icono: string; // emoji or icon identifier
  detalles: string[];
  activo: boolean;
}

export interface Appointment {
  id: string;
  clienteId?: string; // Relación con entidad Cliente (UUID)
  codigo: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  servicioId: string;
  servicioNombre: string;
  duracionMinutos: number;
  precio: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  observaciones?: string;
  estado: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  notasAdmin?: string;
  browserId?: string;
}

export interface TimeSlot {
  hora: string; // "09:00"
  disponible: boolean;
  motivo?: string; // "Turno ocupado", "Fuera de horario", "Bloqueado"
}

export interface DayAvailability {
  fecha: string;
  diaSemana: number; // 0=Domingo, 1=Lunes, ...
  nombreDia: string;
  abierto: boolean;
  motivo?: string;
  horarioAtencion?: {
    apertura: string;
    cierre: string;
  };
  duracionServicioSolicitado: number;
  slots: TimeSlot[];
  slotsDisponiblesCount: number;
}

export interface DayScheduleConfig {
  activo: boolean;
  apertura: string; // "09:00"
  cierre: string; // "19:00"
}

export interface BlockedTimeRange {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'dia_completo' | 'rango_horario';
  horaInicio?: string; // HH:mm (e.g. "14:00")
  horaFin?: string; // HH:mm (e.g. "17:30")
  motivo?: string; // e.g. "Capacitación / Evento", "Almuerzo", "Asuntos personales"
  createdAt?: string;
}

export interface StudioConfig {
  nombreEstudio: string;
  subtitulo: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  instagram: string;
  email: string;
  horariosPorDia: {
    lunes: DayScheduleConfig;
    martes: DayScheduleConfig;
    miercoles: DayScheduleConfig;
    jueves: DayScheduleConfig;
    viernes: DayScheduleConfig;
    sabado: DayScheduleConfig;
    domingo: DayScheduleConfig;
  };
  intervaloMinutos: number; // e.g. 30
  bufferMinutos: number; // e.g. 0 or 15
  diasBloqueados: string[]; // ['2026-12-25', '2026-01-01']
  horariosBloqueados: Record<string, string[]>; // { '2026-08-25': ['09:00', '09:30'] }
  bloqueosDetallados?: BlockedTimeRange[];
  pinAdmin: string;
}

export interface DashboardStats {
  turnosHoy: number;
  turnosPendientes: number;
  turnosConfirmados: number;
  turnosCompletadosMes: number;
  ingresosEstimadosMes: number;
  totalTurnos: number;
  serviciosMasPedidos: Array<{
    servicioId: string;
    nombre: string;
    cantidad: number;
    ingresos: number;
  }>;
  proximosTurnos: Appointment[];
}
