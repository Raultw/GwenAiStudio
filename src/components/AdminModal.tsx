import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  AlertTriangle,
  MessageCircle, 
  Phone, 
  Search, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Ban, 
  Trash2, 
  Edit3, 
  Check, 
  User, 
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import type { 
  Appointment, 
  Service, 
  StudioConfig, 
  DashboardStats, 
  AppointmentStatus 
} from '../types.js';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPublicData: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onRefreshPublicData
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'agenda' | 'nuevo' | 'bloqueos' | 'servicios' | 'horarios' | 'stats'>('agenda');

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dbStatus, setDbStatus] = useState<{ postgresConnected: boolean; driver: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filters for Agenda
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>(''); // specific date

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Manual appointment form state
  const [manualForm, setManualForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    servicioId: '',
    fecha: '',
    horaInicio: '10:00',
    observaciones: '',
    notasAdmin: ''
  });
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Block date & time range form state
  const [blockType, setBlockType] = useState<'rango_horario' | 'dia_completo'>('rango_horario');
  const [blockDate, setBlockDate] = useState<string>('');
  const [blockStartHour, setBlockStartHour] = useState<string>('13:00');
  const [blockEndHour, setBlockEndHour] = useState<string>('16:00');
  const [blockMotivo, setBlockMotivo] = useState<string>('');
  const [blockSuccessMsg, setBlockSuccessMsg] = useState<string | null>(null);
  const [blockErrorMsg, setBlockErrorMsg] = useState<string | null>(null);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState<boolean>(false);
  const [serverBlockConflicts, setServerBlockConflicts] = useState<any[]>([]);

  // Service edit/create state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreatingService, setIsCreatingService] = useState<boolean>(false);
  const [serviceForm, setServiceForm] = useState({
    nombre: '',
    categoria: 'cuidado',
    descripcion: '',
    duracionMinutos: 60,
    precio: 20000,
    esPopular: false,
    icono: '💅',
    activo: true
  });

  // Verify PIN
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      if (res.ok) {
        setIsAuthenticated(true);
        loadAdminData();
      } else {
        setPinError('PIN incorrecto. El PIN por defecto es 1234');
      }
    } catch (err) {
      setPinError('Error de verificación con el servidor');
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, srvRes, cfgRes, statsRes, dbRes] = await Promise.all([
        fetch('/api/turnos'),
        fetch('/api/servicios?all=true'),
        fetch('/api/config'),
        fetch('/api/turnos/stats'),
        fetch('/api/db-status')
      ]);

      if (aptRes.ok) setAppointments(await aptRes.json());
      if (srvRes.ok) setServices(await srvRes.json());
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (dbRes.ok) setDbStatus(await dbRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAdminData();
    }
  }, [isOpen, isAuthenticated]);

  // Change Appointment Status
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const res = await fetch(`/api/turnos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a.id === id ? updated : a));
        loadAdminData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Save Admin Notes
  const handleSaveNotes = async (id: string) => {
    try {
      const res = await fetch(`/api/turnos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notasAdmin: tempNotes })
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a.id === id ? updated : a));
        setEditingNotesId(null);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  // Delete Appointment
  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('¿Segura que deseás eliminar este turno del sistema?')) return;
    try {
      const res = await fetch(`/api/turnos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        loadAdminData();
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  // Create Manual Appointment
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);

    if (!manualForm.nombre || !manualForm.telefono || !manualForm.servicioId || !manualForm.fecha) {
      setManualError('Por favor completá los campos obligatorios.');
      return;
    }

    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: manualForm.nombre,
          apellido: manualForm.apellido || 'Cliente',
          telefono: manualForm.telefono,
          servicio_id: manualForm.servicioId,
          fecha: manualForm.fecha,
          hora_inicio: manualForm.horaInicio,
          observaciones: manualForm.observaciones
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setManualError(data.error || 'No se pudo crear el turno.');
        return;
      }

      setManualSuccess(`¡Turno creado con éxito! Código: ${data.turno.codigo}`);
      setManualForm({
        nombre: '',
        apellido: '',
        telefono: '',
        servicioId: '',
        fecha: '',
        horaInicio: '10:00',
        observaciones: '',
        notasAdmin: ''
      });
      loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      setManualError('Error al conectar con el servidor.');
    }
  };

  // Real-time conflict calculator for proposed block
  const liveBlockConflicts = useMemo(() => {
    if (!blockDate) return [];
    const dayAppointments = appointments.filter(a => a.fecha === blockDate && a.estado !== 'cancelado');

    if (blockType === 'dia_completo') {
      return dayAppointments;
    }

    if (!blockStartHour || !blockEndHour) return [];

    const [sh, sm] = blockStartHour.split(':').map(Number);
    const [eh, em] = blockEndHour.split(':').map(Number);
    const startM = (sh || 0) * 60 + (sm || 0);
    const endM = (eh || 0) * 60 + (em || 0);

    if (startM >= endM) return [];

    return dayAppointments.filter(apt => {
      const [ash, asm] = apt.horaInicio.split(':').map(Number);
      const [aeh, aem] = apt.horaFin.split(':').map(Number);
      const aptStart = (ash || 0) * 60 + (asm || 0);
      const aptEnd = (aeh || 0) * 60 + (aem || 0);
      return Math.max(startM, aptStart) < Math.min(endM, aptEnd);
    });
  }, [blockDate, blockType, blockStartHour, blockEndHour, appointments]);

  // Block Date or Range Slot
  const handleBlockSubmit = async (e?: React.FormEvent, force: boolean = false) => {
    if (e) e.preventDefault();
    if (!blockDate) {
      setBlockErrorMsg('Seleccioná una fecha válida.');
      return;
    }

    if (blockType === 'rango_horario') {
      if (!blockStartHour || !blockEndHour) {
        setBlockErrorMsg('Definí la hora de inicio y de fin.');
        return;
      }
      const [sh, sm] = blockStartHour.split(':').map(Number);
      const [eh, em] = blockEndHour.split(':').map(Number);
      if ((sh * 60 + sm) >= (eh * 60 + em)) {
        setBlockErrorMsg('La hora de fin debe ser posterior a la hora de inicio.');
        return;
      }
    }

    setIsSubmittingBlock(true);
    setBlockErrorMsg(null);
    setBlockSuccessMsg(null);
    setServerBlockConflicts([]);

    try {
      const res = await fetch('/api/admin/bloquear-horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: blockDate,
          tipo: blockType,
          horaInicio: blockType === 'rango_horario' ? blockStartHour : undefined,
          horaFin: blockType === 'rango_horario' ? blockEndHour : undefined,
          motivo: blockMotivo || undefined,
          force
        })
      });

      const data = await res.json();

      if (res.status === 409) {
        setServerBlockConflicts(data.conflicts || []);
        setBlockErrorMsg(data.error || 'Existen turnos reservados que coinciden con este horario.');
        setIsSubmittingBlock(false);
        return;
      }

      if (!res.ok) {
        setBlockErrorMsg(data.error || 'No se pudo registrar el bloqueo.');
        setIsSubmittingBlock(false);
        return;
      }

      setConfig(data.config);
      setBlockSuccessMsg(
        blockType === 'dia_completo'
          ? `Día completo (${blockDate}) bloqueado exitosamente.`
          : `Franja ${blockStartHour} - ${blockEndHour} hs del ${blockDate} bloqueada exitosamente.`
      );
      setBlockMotivo('');
      setServerBlockConflicts([]);
      loadAdminData();
      onRefreshPublicData();
    } catch (err) {
      console.error('Error blocking date/time:', err);
      setBlockErrorMsg('Error al conectar con el servidor.');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Remove Block (by ID or date)
  const handleDeleteBlock = async (identifier: string) => {
    try {
      const res = await fetch(`/api/admin/bloquear-horario/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setBlockSuccessMsg('Bloqueo eliminado correctamente.');
        loadAdminData();
        onRefreshPublicData();
      }
    } catch (err) {
      console.error('Error removing block:', err);
    }
  };

  // Quick Preset Helper for Duration
  const setBlockDurationHours = (hours: number) => {
    if (!blockStartHour) return;
    const [h, m] = blockStartHour.split(':').map(Number);
    const endMinutes = h * 60 + m + hours * 60;
    const endH = Math.min(23, Math.floor(endMinutes / 60));
    const endM = endMinutes % 60;
    setBlockEndHour(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
  };

  // Save Service (Create or Edit)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        const res = await fetch(`/api/servicios/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceForm)
        });
        if (res.ok) {
          setEditingService(null);
          loadAdminData();
          onRefreshPublicData();
        }
      } else if (isCreatingService) {
        const res = await fetch('/api/servicios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceForm)
        });
        if (res.ok) {
          setIsCreatingService(false);
          loadAdminData();
          onRefreshPublicData();
        }
      }
    } catch (err) {
      console.error('Error saving service:', err);
    }
  };

  // WhatsApp quick text generator
  const getWhatsAppChatUrl = (apt: Appointment) => {
    const rawPhone = apt.telefono.replace(/[^0-9]/g, '');
    let cleanPhone = rawPhone;
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
    if (!cleanPhone.startsWith('549') && !cleanPhone.startsWith('54')) {
      cleanPhone = `549${cleanPhone}`;
    }
    const msg = encodeURIComponent(
      `¡Hola ${apt.nombre}! Te escribimos desde *Gwen Nails* ✨\n\n` +
      `Queríamos confirmarte tu turno para *${apt.servicioNombre}* el día *${apt.fecha}* a las *${apt.horaInicio} hs*.\n` +
      `Estudio: Gorriti 5540, Palermo Hollywood.\n\n` +
      `¿Nos confirmás asistencia? ¡Muchas gracias!`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  // Filtered appointments list
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter !== 'todos' && a.estado !== statusFilter) return false;
    if (dateFilter && a.fecha !== dateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = a.nombre.toLowerCase().includes(q) || a.apellido.toLowerCase().includes(q);
      const matchPhone = a.telefono.includes(q);
      const matchCode = a.codigo.toLowerCase().includes(q);
      const matchSrv = a.servicioNombre.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCode && !matchSrv) return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-[#E8DCD5]">
        
        {/* Modal Header */}
        <div className="bg-[#241E1A] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#8E4455] text-white flex items-center justify-center font-bold text-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-medium">
                Panel de Gestión · Gwen Nails
              </h3>
              <p className="text-[11px] text-[#C4B0A3]">Control de agenda, turnos, servicios y horarios</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && dbStatus && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                dbStatus.postgresConnected 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' 
                  : 'bg-[#3A2F28] text-[#D9C9BF] border-[#5A4A3E]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.postgresConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{dbStatus.postgresConnected ? '🐘 PostgreSQL Conectado' : '📁 Almacenamiento Local'}</span>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={loadAdminData}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8DCC4] transition-colors cursor-pointer"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8DCC4] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Authenticated: PIN Prompt */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#8E4455] border border-[#E8DCD5] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="font-serif text-2xl font-medium text-[#241E1A] mb-2">
              Acceso Exclusivo del Estudio
            </h4>
            <p className="text-xs text-[#7A6B62] mb-6">
              Ingresá el PIN de seguridad de 4 dígitos para acceder a la gestión de turnos. (Por defecto: <strong>1234</strong>)
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresar PIN"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 px-4 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-rose-600 font-medium">{pinError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#8E4455] text-white text-sm font-medium hover:bg-[#783645] transition-all cursor-pointer"
              >
                Desbloquear Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF7F2]">
            
            {/* Tabs Bar */}
            <div className="bg-white border-b border-[#E8DCD5] px-6 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
              <button
                onClick={() => setActiveTab('agenda')}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'agenda'
                    ? 'bg-[#8E4455] text-white shadow-xs'
                    : 'text-[#5A4B43] hover:bg-[#FAF7F2]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Agenda ({appointments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('nuevo')}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'nuevo'
                    ? 'bg-[#8E4455] text-white shadow-xs'
                    : 'text-[#5A4B43] hover:bg-[#FAF7F2]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Turno Manual</span>
              </button>

              <button
                onClick={() => setActiveTab('bloqueos')}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bloqueos'
                    ? 'bg-[#8E4455] text-white shadow-xs'
                    : 'text-[#5A4B43] hover:bg-[#FAF7F2]'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Bloquear Días/Horas</span>
              </button>

              <button
                onClick={() => setActiveTab('servicios')}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'servicios'
                    ? 'bg-[#8E4455] text-white shadow-xs'
                    : 'text-[#5A4B43] hover:bg-[#FAF7F2]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Servicios & Precios</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-[#8E4455] text-white shadow-xs'
                    : 'text-[#5A4B43] hover:bg-[#FAF7F2]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Métricas</span>
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* TAB 1: AGENDA DE TURNOS */}
              {activeTab === 'agenda' && (
                <div className="space-y-4">
                  {/* Filters Header */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5] flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por cliente, teléfono o código..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                      />
                    </div>

                    {/* Status filter pills */}
                    <div className="flex items-center gap-1">
                      {['todos', 'confirmado', 'pendiente', 'completado', 'cancelado'].map(st => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                            statusFilter === st
                              ? 'bg-[#241E1A] text-white'
                              : 'bg-[#FAF7F2] text-[#5A4B43] hover:bg-[#E8DCD5]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Date filter */}
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none"
                      />
                      {dateFilter && (
                        <button
                          onClick={() => setDateFilter('')}
                          className="text-xs text-[#8E4455] hover:underline"
                        >
                          Ver todos
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Appointments List */}
                  {filteredAppointments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DCD5]">
                      <CalendarIcon className="w-10 h-10 text-[#C4B0A3] mx-auto mb-3" />
                      <h4 className="font-serif text-lg text-[#241E1A]">No se encontraron turnos</h4>
                      <p className="text-xs text-[#7A6B62]">Probá cambiando los filtros o agregá un nuevo turno manual.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAppointments.map((apt) => {
                        const isEditingThisNote = editingNotesId === apt.id;

                        const statusBadge = {
                          confirmado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
                          completado: 'bg-blue-50 text-blue-700 border-blue-200',
                          cancelado: 'bg-rose-50 text-rose-700 border-rose-200 line-through opacity-70'
                        }[apt.estado];

                        return (
                          <div
                            key={apt.id}
                            className="bg-white rounded-2xl p-5 border border-[#E8DCD5] shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              {/* Header Card */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#241E1A] text-base">
                                      {apt.nombre} {apt.apellido}
                                    </span>
                                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                                      {apt.estado}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-[#8C7A70]">
                                    Código: {apt.codigo}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="font-serif font-bold text-[#8E4455] text-lg">
                                    ${apt.precio.toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>

                              {/* Service & Time Info */}
                              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD5] mb-3 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between text-[#241E1A]">
                                  <span className="font-medium">💅 {apt.servicioNombre}</span>
                                  <span className="text-[#7A6B62]">{apt.duracionMinutos} min</span>
                                </div>
                                <div className="flex items-center justify-between text-[#5A4B43]">
                                  <span className="flex items-center gap-1 font-semibold text-[#8E4455]">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    {apt.fecha}
                                  </span>
                                  <span className="flex items-center gap-1 font-semibold text-[#241E1A]">
                                    <Clock className="w-3.5 h-3.5" />
                                    {apt.horaInicio} - {apt.horaFin} hs
                                  </span>
                                </div>
                              </div>

                              {/* Contact row */}
                              <div className="flex items-center justify-between mb-3 text-xs">
                                <span className="text-[#5A4B43] flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-[#8C7A70]" />
                                  {apt.telefono}
                                </span>
                                <a
                                  href={getWhatsAppChatUrl(apt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3 fill-current" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>

                              {/* Observations from client */}
                              {apt.observaciones && (
                                <p className="text-[11px] text-[#6E5D55] bg-white p-2 rounded-lg border border-[#E8DCD5] mb-3 italic">
                                  "{apt.observaciones}"
                                </p>
                              )}

                              {/* Internal Admin Notes */}
                              <div className="mb-3">
                                {isEditingThisNote ? (
                                  <div className="space-y-1.5">
                                    <textarea
                                      rows={2}
                                      value={tempNotes}
                                      onChange={(e) => setTempNotes(e.target.value)}
                                      placeholder="Nota privada interna para este turno..."
                                      className="w-full text-xs p-2 rounded-lg bg-[#FAF7F2] border border-[#D9C9BF] text-[#241E1A] focus:outline-none"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => setEditingNotesId(null)}
                                        className="text-[10px] text-[#7A6B62] px-2 py-1"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => handleSaveNotes(apt.id)}
                                        className="text-[10px] bg-[#8E4455] text-white px-2.5 py-1 rounded-md"
                                      >
                                        Guardar Nota
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between text-[11px] text-[#8C7A70] bg-[#FAF7F2]/50 p-2 rounded-lg">
                                    <span>
                                      📝 {apt.notasAdmin ? apt.notasAdmin : 'Sin notas internas'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingNotesId(apt.id);
                                        setTempNotes(apt.notasAdmin || '');
                                      }}
                                      className="text-[#8E4455] hover:underline shrink-0 ml-2"
                                    >
                                      Editar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="pt-3 border-t border-[#F0E6DE] flex items-center justify-between gap-1 text-xs">
                              <div className="flex items-center gap-1">
                                {apt.estado !== 'confirmado' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'confirmado')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 text-[11px]"
                                  >
                                    Confirmar
                                  </button>
                                )}
                                {apt.estado !== 'completado' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'completado')}
                                    className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-medium hover:bg-blue-200 text-[11px]"
                                  >
                                    Completar
                                  </button>
                                )}
                                {apt.estado !== 'cancelado' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'cancelado')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-medium hover:bg-rose-200 text-[11px]"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteAppointment(apt.id)}
                                className="p-1.5 text-[#C4B0A3] hover:text-rose-600 rounded-lg transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: NUEVO TURNO MANUAL */}
              {activeTab === 'nuevo' && (
                <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DCD5] shadow-xs">
                  <h4 className="font-serif text-2xl font-medium text-[#241E1A] mb-1">
                    Cargar Turno Manualmente
                  </h4>
                  <p className="text-xs text-[#7A6B62] mb-6">
                    Útil para agendar clientas que llaman por teléfono o acuden personalmente al estudio.
                  </p>

                  <form onSubmit={handleCreateManual} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">Nombre *</label>
                        <input
                          type="text"
                          required
                          value={manualForm.nombre}
                          onChange={(e) => setManualForm({ ...manualForm, nombre: e.target.value })}
                          placeholder="Nombre"
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">Apellido</label>
                        <input
                          type="text"
                          value={manualForm.apellido}
                          onChange={(e) => setManualForm({ ...manualForm, apellido: e.target.value })}
                          placeholder="Apellido"
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">Teléfono / WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          value={manualForm.telefono}
                          onChange={(e) => setManualForm({ ...manualForm, telefono: e.target.value })}
                          placeholder="11-4521-8899"
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">Servicio *</label>
                        <select
                          required
                          value={manualForm.servicioId}
                          onChange={(e) => setManualForm({ ...manualForm, servicioId: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                        >
                          <option value="">Seleccionar Servicio</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} ({s.duracionMinutos} min - ${s.precio.toLocaleString('es-AR')})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">Fecha *</label>
                        <input
                          type="date"
                          required
                          value={manualForm.fecha}
                          onChange={(e) => setManualForm({ ...manualForm, fecha: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">Hora Inicio *</label>
                        <input
                          type="time"
                          required
                          value={manualForm.horaInicio}
                          onChange={(e) => setManualForm({ ...manualForm, horaInicio: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A3E39] mb-1">Observaciones / Detalles</label>
                      <input
                        type="text"
                        value={manualForm.observaciones}
                        onChange={(e) => setManualForm({ ...manualForm, observaciones: e.target.value })}
                        placeholder="Ej: Viene por primera vez, retiro previo..."
                        className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                      />
                    </div>

                    {manualError && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{manualError}</p>
                    )}
                    {manualSuccess && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">{manualSuccess}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#8E4455] text-white text-xs font-medium hover:bg-[#783645] transition-all cursor-pointer"
                    >
                      Guardar Turno en la Agenda
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: BLOQUEO DE DÍAS Y HORARIOS */}
              {activeTab === 'bloqueos' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Main Block Configuration Card */}
                  <div className="bg-white p-6 rounded-3xl border border-[#E8DCD5] shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DCD5] flex items-center justify-center text-[#8E4455]">
                        <Ban className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-xl font-medium text-[#241E1A]">
                          Bloqueo de Agenda y Horarios
                        </h4>
                        <p className="text-xs text-[#7A6B62]">
                          Reservá franjas para descansos, cursos o bloqueá días enteros. El sistema te advertirá si se pisa con turnos existentes.
                        </p>
                      </div>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8DCD5] my-5">
                      <button
                        type="button"
                        onClick={() => { setBlockType('rango_horario'); setServerBlockConflicts([]); }}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          blockType === 'rango_horario'
                            ? 'bg-white text-[#241E1A] shadow-xs border border-[#E8DCD5]'
                            : 'text-[#7A6B62] hover:text-[#241E1A]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Franja / Rango Horario
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBlockType('dia_completo'); setServerBlockConflicts([]); }}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          blockType === 'dia_completo'
                            ? 'bg-white text-[#241E1A] shadow-xs border border-[#E8DCD5]'
                            : 'text-[#7A6B62] hover:text-[#241E1A]'
                        }`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Día Completo (Cierre Total)
                      </button>
                    </div>

                    <form onSubmit={(e) => handleBlockSubmit(e, false)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#4A3E39] mb-1">
                            Fecha a Bloquear *
                          </label>
                          <input
                            type="date"
                            required
                            value={blockDate}
                            onChange={(e) => {
                              setBlockDate(e.target.value);
                              setServerBlockConflicts([]);
                              setBlockErrorMsg(null);
                            }}
                            className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                          />
                        </div>

                        {blockType === 'rango_horario' ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-[#4A3E39] mb-1">
                                Hora Inicio *
                              </label>
                              <input
                                type="time"
                                required
                                value={blockStartHour}
                                onChange={(e) => {
                                  setBlockStartHour(e.target.value);
                                  setServerBlockConflicts([]);
                                  setBlockErrorMsg(null);
                                }}
                                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#4A3E39] mb-1">
                                Hora Fin *
                              </label>
                              <input
                                type="time"
                                required
                                value={blockEndHour}
                                onChange={(e) => {
                                  setBlockEndHour(e.target.value);
                                  setServerBlockConflicts([]);
                                  setBlockErrorMsg(null);
                                }}
                                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="sm:col-span-2 flex items-center p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCD5] text-xs text-[#7A6B62]">
                            <span>Se deshabilitarán todos los turnos y la agenda pública para esta fecha completa.</span>
                          </div>
                        )}
                      </div>

                      {/* Presets for range */}
                      {blockType === 'rango_horario' && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] text-[#7A6B62] font-medium">Accesos rápidos:</span>
                          <button
                            type="button"
                            onClick={() => setBlockDurationHours(1)}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F2] hover:bg-[#E8DCD5] text-[#4A3E39] border border-[#D9C9BF] transition-all cursor-pointer"
                          >
                            +1 Hora
                          </button>
                          <button
                            type="button"
                            onClick={() => setBlockDurationHours(2)}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F2] hover:bg-[#E8DCD5] text-[#4A3E39] border border-[#D9C9BF] transition-all cursor-pointer"
                          >
                            +2 Horas
                          </button>
                          <button
                            type="button"
                            onClick={() => setBlockDurationHours(3)}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F2] hover:bg-[#E8DCD5] text-[#4A3E39] border border-[#D9C9BF] transition-all cursor-pointer"
                          >
                            +3 Horas
                          </button>
                          <button
                            type="button"
                            onClick={() => { setBlockStartHour('09:00'); setBlockEndHour('13:00'); }}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F2] hover:bg-[#E8DCD5] text-[#4A3E39] border border-[#D9C9BF] transition-all cursor-pointer"
                          >
                            Mañana (09:00 - 13:00)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setBlockStartHour('14:00'); setBlockEndHour('19:00'); }}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F2] hover:bg-[#E8DCD5] text-[#4A3E39] border border-[#D9C9BF] transition-all cursor-pointer"
                          >
                            Tarde (14:00 - 19:00)
                          </button>
                        </div>
                      )}

                      {/* Motivo Input */}
                      <div>
                        <label className="block text-xs font-medium text-[#4A3E39] mb-1">
                          Motivo / Descripción (Opcional)
                        </label>
                        <input
                          type="text"
                          value={blockMotivo}
                          onChange={(e) => setBlockMotivo(e.target.value)}
                          placeholder="Ej: Capacitación técnica, almuerzo, trámite, feriado..."
                          className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                        />
                      </div>

                      {/* LIVE CONFLICT DETECTION ALERT */}
                      {(liveBlockConflicts.length > 0 || serverBlockConflicts.length > 0) && (
                        <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-900 space-y-3 animate-in fade-in">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                                ¡Atención! Se pisa con {(serverBlockConflicts.length || liveBlockConflicts.length)} turno(s) agendado(s)
                              </h5>
                              <p className="text-xs text-amber-800 mt-0.5">
                                Hay clientas que ya tienen reservas confirmadas dentro de este rango. Si bloqueás este horario, no podrán ingresar nuevas reservas en la web.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-semibold text-amber-950">Turnos afectados en esta fecha:</p>
                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                              {(serverBlockConflicts.length > 0 ? serverBlockConflicts : liveBlockConflicts).map((apt: any) => (
                                <div 
                                  key={apt.id || apt.codigo}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 text-xs shadow-2xs"
                                >
                                  <div>
                                    <div className="font-medium text-[#241E1A] flex items-center gap-1.5">
                                      <span>{apt.nombre} {apt.apellido || ''}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                                        {apt.codigo || apt.id}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#7A6B62]">
                                      {apt.servicioNombre} • {apt.horaInicio} a {apt.horaFin} hs
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={`https://wa.me/${apt.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(apt.nombre)},%20te%20escribo%20de%20Gwen%20Nails%20respecto%20a%20tu%20turno...`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all text-[11px] flex items-center gap-1"
                                      title="Contactar clienta"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">WhatsApp</span>
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleBlockSubmit(undefined, true)}
                              disabled={isSubmittingBlock}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <AlertCircle className="w-4 h-4" />
                              Bloquear de todos modos (Confirmar)
                            </button>
                            <span className="text-[11px] text-amber-800 italic">
                              Los turnos existentes seguirán activos en la lista de turnos.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Success and Error messages */}
                      {blockErrorMsg && !serverBlockConflicts.length && (
                        <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {blockErrorMsg}
                        </p>
                      )}

                      {blockSuccessMsg && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          {blockSuccessMsg}
                        </p>
                      )}

                      {/* Submit button when no active collisions shown */}
                      {liveBlockConflicts.length === 0 && serverBlockConflicts.length === 0 && (
                        <button
                          type="submit"
                          disabled={isSubmittingBlock}
                          className="w-full py-3 rounded-xl bg-[#241E1A] hover:bg-[#8E4455] text-white text-xs font-medium transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmittingBlock ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                          {blockType === 'dia_completo' ? 'Bloquear Día Completo en Agenda' : 'Bloquear Franja Horaria Seleccionada'}
                        </button>
                      )}
                    </form>
                  </div>

                  {/* ACTIVE DETAILED RANGE BLOCKS */}
                  <div className="bg-white p-6 rounded-3xl border border-[#E8DCD5] shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8E4455]" />
                        <h5 className="font-serif text-base font-medium text-[#241E1A]">
                          Franjas Horarias Bloqueadas ({config?.bloqueosDetallados?.filter(b => b.tipo === 'rango_horario').length || 0})
                        </h5>
                      </div>
                    </div>

                    {(!config?.bloqueosDetallados || config.bloqueosDetallados.filter(b => b.tipo === 'rango_horario').length === 0) ? (
                      <p className="text-xs text-[#7A6B62] py-2 italic">
                        No hay franjas horarias específicas bloqueadas actualmente.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {config.bloqueosDetallados
                          .filter(b => b.tipo === 'rango_horario')
                          .map((b) => (
                            <div 
                              key={b.id || `${b.fecha}-${b.horaInicio}`}
                              className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCD5] flex items-center justify-between gap-3 group hover:border-[#D9C9BF] transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-[#8E4455] bg-white px-2 py-0.5 rounded-md border border-[#E8DCD5]">
                                    {b.fecha}
                                  </span>
                                  <span className="text-xs font-medium text-[#241E1A]">
                                    {b.horaInicio} - {b.horaFin} hs
                                  </span>
                                </div>
                                {b.motivo && (
                                  <p className="text-[11px] text-[#7A6B62] line-clamp-1">
                                    {b.motivo}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(b.id || b.fecha)}
                                className="p-2 rounded-xl text-[#8C7A70] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Desbloquear este horario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE FULL-DAY BLOCKS */}
                  <div className="bg-white p-6 rounded-3xl border border-[#E8DCD5] shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#8E4455]" />
                        <h5 className="font-serif text-base font-medium text-[#241E1A]">
                          Días Completos Cerrados ({config?.diasBloqueados?.length || 0})
                        </h5>
                      </div>
                    </div>

                    {(!config?.diasBloqueados || config.diasBloqueados.length === 0) ? (
                      <p className="text-xs text-[#7A6B62] py-2 italic">
                        No hay días completos bloqueados actualmente.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {config.diasBloqueados.map(d => {
                          const detailed = config.bloqueosDetallados?.find(b => b.fecha === d && b.tipo === 'dia_completo');
                          return (
                            <div 
                              key={d} 
                              className="flex items-center gap-2.5 bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E8DCD5] text-xs group hover:border-[#D9C9BF] transition-all"
                            >
                              <div>
                                <span className="font-mono font-medium text-[#8E4455]">{d}</span>
                                {detailed?.motivo && (
                                  <span className="text-[11px] text-[#7A6B62] ml-1.5">({detailed.motivo})</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(detailed?.id || d)}
                                className="p-1 rounded-md text-[#8C7A70] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Habilitar día"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SERVICIOS Y PRECIOS */}
              {activeTab === 'servicios' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-2xl font-medium text-[#241E1A]">
                        Carta de Servicios y Valores
                      </h4>
                      <p className="text-xs text-[#7A6B62]">Actualizá precios, duraciones y disponibilidad en vivo.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsCreatingService(true);
                        setEditingService(null);
                        setServiceForm({
                          nombre: '',
                          categoria: 'cuidado',
                          descripcion: '',
                          duracionMinutos: 60,
                          precio: 20000,
                          esPopular: false,
                          icono: '💅',
                          activo: true
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E4455] text-white text-xs font-medium hover:bg-[#783645] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Servicio</span>
                    </button>
                  </div>

                  {/* Create / Edit Form Modal or Inline */}
                  {(isCreatingService || editingService) && (
                    <div className="bg-white p-6 rounded-3xl border-2 border-[#8E4455]/40 shadow-md">
                      <h5 className="font-serif text-lg font-medium text-[#241E1A] mb-4">
                        {editingService ? `Editar: ${editingService.nombre}` : 'Nuevo Servicio'}
                      </h5>
                      <form onSubmit={handleSaveService} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#4A3E39] mb-1">Nombre *</label>
                            <input
                              type="text"
                              required
                              value={serviceForm.nombre}
                              onChange={(e) => setServiceForm({ ...serviceForm, nombre: e.target.value })}
                              className="w-full p-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#4A3E39] mb-1">Precio ($ ARS) *</label>
                            <input
                              type="number"
                              required
                              value={serviceForm.precio}
                              onChange={(e) => setServiceForm({ ...serviceForm, precio: Number(e.target.value) })}
                              className="w-full p-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#4A3E39] mb-1">Duración (minutos) *</label>
                            <input
                              type="number"
                              required
                              step={15}
                              value={serviceForm.duracionMinutos}
                              onChange={(e) => setServiceForm({ ...serviceForm, duracionMinutos: Number(e.target.value) })}
                              className="w-full p-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#4A3E39] mb-1">Descripción</label>
                          <textarea
                            rows={2}
                            value={serviceForm.descripcion}
                            onChange={(e) => setServiceForm({ ...serviceForm, descripcion: e.target.value })}
                            className="w-full p-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A]"
                          />
                        </div>

                        <div className="flex items-center gap-6 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={serviceForm.esPopular}
                              onChange={(e) => setServiceForm({ ...serviceForm, esPopular: e.target.checked })}
                            />
                            <span>Marcar como "Más Elegido / Popular"</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={serviceForm.activo}
                              onChange={(e) => setServiceForm({ ...serviceForm, activo: e.target.checked })}
                            />
                            <span>Activo para reservas públicas</span>
                          </label>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingService(false);
                              setEditingService(null);
                            }}
                            className="px-4 py-2 rounded-xl text-xs text-[#5A4B43] hover:bg-[#FAF7F2]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-[#8E4455] text-white text-xs font-medium hover:bg-[#783645]"
                          >
                            Guardar Servicio
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Services List Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(srv => (
                      <div
                        key={srv.id}
                        className="bg-white p-5 rounded-2xl border border-[#E8DCD5] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DCD5] flex items-center justify-center text-xl">
                            {srv.icono}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-serif font-medium text-base text-[#241E1A]">{srv.nombre}</h5>
                              {srv.esPopular && (
                                <span className="text-[10px] bg-[#8E4455] text-white px-1.5 py-0.2 rounded-full font-bold">
                                  POPULAR
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#7A6B62]">
                              {srv.duracionMinutos} min · <strong className="text-[#8E4455]">${srv.precio.toLocaleString('es-AR')}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingService(srv);
                              setIsCreatingService(false);
                              setServiceForm({
                                nombre: srv.nombre,
                                categoria: srv.categoria,
                                descripcion: srv.descripcion,
                                duracionMinutos: srv.duracionMinutos,
                                precio: srv.precio,
                                esPopular: !!srv.esPopular,
                                icono: srv.icono || '💅',
                                activo: srv.activo
                              });
                            }}
                            className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#E8DCD5] text-[#5A4B43]"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: MÉTRICAS */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-[#E8DCD5]">
                      <span className="text-xs text-[#7A6B62] block mb-1">Turnos para Hoy</span>
                      <span className="font-serif text-3xl font-bold text-[#8E4455]">{stats.turnosHoy}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#E8DCD5]">
                      <span className="text-xs text-[#7A6B62] block mb-1">Pendientes de Confirmación</span>
                      <span className="font-serif text-3xl font-bold text-amber-600">{stats.turnosPendientes}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#E8DCD5]">
                      <span className="text-xs text-[#7A6B62] block mb-1">Confirmados Este Mes</span>
                      <span className="font-serif text-3xl font-bold text-emerald-600">{stats.turnosCompletadosMes}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#E8DCD5]">
                      <span className="text-xs text-[#7A6B62] block mb-1">Facturación Proyectada Mes</span>
                      <span className="font-serif text-3xl font-bold text-[#241E1A]">
                        ${stats.ingresosEstimadosMes.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Top Services ranking */}
                  <div className="bg-white p-6 rounded-3xl border border-[#E8DCD5]">
                    <h5 className="font-serif text-lg font-medium text-[#241E1A] mb-4">
                      Servicios Más Solicitados
                    </h5>
                    <div className="space-y-3">
                      {stats.serviciosMasPedidos.map((item, idx) => (
                        <div key={item.servicioId} className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FAF7F2]">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#8E4455] w-5">#{idx + 1}</span>
                            <span className="font-medium text-[#241E1A]">{item.nombre}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-[#7A6B62]">{item.cantidad} reservas</span>
                            <span className="font-bold text-[#241E1A]">${item.ingresos.toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
