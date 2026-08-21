export type AppointmentStatus = 'pendiente' | 'confirmado' | 'completado' | 'cancelado';

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
