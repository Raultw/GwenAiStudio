import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  GitMerge, 
  Sparkles, 
  RefreshCw, 
  UserCheck, 
  UserPlus, 
  History, 
  X, 
  Check, 
  Tag, 
  CalendarPlus,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { Client, DuplicatePair, ClientStats, Appointment, Service } from '../types.js';

interface ClientManagementAdminProps {
  services: Service[];
  onRefreshData?: () => void;
  onOpenNewBookingWithClient?: (client: Client) => void;
}

export const ClientManagementAdmin: React.FC<ClientManagementAdminProps> = ({
  services,
  onRefreshData,
  onOpenNewBookingWithClient
}) => {
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicatePair[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'todos' | 'recurrentes' | 'nuevos' | 'inactivos' | 'proximos' | 'duplicados'>('todos');

  // Selected Client for Details / History Drawer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Edit / Notes Modal
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    notasAdmin: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Manual New Client Modal
  const [isCreatingClient, setIsCreatingClient] = useState<boolean>(false);
  const [newClientForm, setNewClientForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    notasAdmin: ''
  });
  const [isSavingNew, setIsSavingNew] = useState<boolean>(false);

  // Duplicate Resolution Modal
  const [activeDuplicatePair, setActiveDuplicatePair] = useState<DuplicatePair | null>(null);
  const [primaryClientId, setPrimaryClientId] = useState<string>('');
  const [mergeNotes, setMergeNotes] = useState<string>('');
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Success / feedback banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all clients, stats, and duplicates
  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, statsRes, dupesRes] = await Promise.all([
        fetch(`/api/clientes?category=${categoryFilter}&search=${encodeURIComponent(searchQuery)}`),
        fetch('/api/clientes/stats'),
        fetch('/api/clientes/duplicados')
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (dupesRes.ok) {
        const dupesData = await dupesRes.json();
        setDuplicatePairs(dupesData);
      }
    } catch (err) {
      console.error('Error loading client data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [categoryFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClientData();
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Client Details Drawer & fetch full history
  const handleOpenClientDetails = async (client: Client) => {
    setSelectedClient(client);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/clientes/${client.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClient(data.client);
        setClientAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Open Edit Client Modal
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      nombre: client.nombre,
      apellido: client.apellido,
      telefono: client.telefono,
      email: client.email || '',
      notasAdmin: client.notasAdmin || ''
    });
  };

  // Save Edit Client
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/clientes/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const updated = await res.json();
        showToast(`Cliente ${updated.nombre} ${updated.apellido} actualizado.`);
        setEditingClient(null);
        if (selectedClient?.id === updated.id) {
          setSelectedClient(prev => prev ? { ...prev, ...updated } : updated);
        }
        loadClientData();
      } else {
        alert('Error al guardar modificaciones');
      }
    } catch (err) {
      console.error('Error saving client edit:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Create Manual Client
  const handleSaveNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.nombre.trim() || !newClientForm.apellido.trim() || !newClientForm.telefono.trim()) {
      alert('Nombre, apellido y teléfono son obligatorios.');
      return;
    }

    setIsSavingNew(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientForm)
      });

      if (res.ok) {
        const created = await res.json();
        showToast(`Cliente ${created.nombre} ${created.apellido} registrado exitosamente.`);
        setIsCreatingClient(false);
        setNewClientForm({ nombre: '', apellido: '', telefono: '', email: '', notasAdmin: '' });
        loadClientData();
      } else {
        alert('Error al registrar nuevo cliente');
      }
    } catch (err) {
      console.error('Error creating client:', err);
    } finally {
      setIsSavingNew(false);
    }
  };

  // Open Duplicate Merge Resolution
  const handleOpenDuplicateMerge = (pair: DuplicatePair) => {
    setActiveDuplicatePair(pair);
    // Default primary to the one with more appointments or oldest
    const countA = pair.clienteA.totalTurnos || pair.turnosA?.length || 0;
    const countB = pair.clienteB.totalTurnos || pair.turnosB?.length || 0;
    setPrimaryClientId(countA >= countB ? pair.clienteA.id : pair.clienteB.id);
    setMergeNotes('');
  };

  // Execute Merge
  const handleExecuteMerge = async () => {
    if (!activeDuplicatePair || !primaryClientId) return;

    const secondaryId = primaryClientId === activeDuplicatePair.clienteA.id 
      ? activeDuplicatePair.clienteB.id 
      : activeDuplicatePair.clienteA.id;

    setIsMerging(true);
    try {
      const res = await fetch('/api/clientes/fusionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId: primaryClientId,
          secondaryId,
          adminNotes: mergeNotes.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Fusión completada. Se reasignaron ${data.migratedAppointmentsCount} turnos al perfil principal.`);
        setActiveDuplicatePair(null);
        loadClientData();
        if (onRefreshData) onRefreshData();
      } else {
        alert('Error al fusionar clientes');
      }
    } catch (err) {
      console.error('Error during merge:', err);
    } finally {
      setIsMerging(false);
    }
  };

  // Dismiss Duplicate Alert
  const handleDismissDuplicate = async (pair: DuplicatePair) => {
    if (!confirm('¿Descartar alerta de duplicado? Ambas personas se mantendrán como clientas independientes.')) return;

    try {
      const res = await fetch('/api/clientes/descartar-duplicado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idA: pair.clienteA.id,
          idB: pair.clienteB.id
        })
      });

      if (res.ok) {
        showToast('Alerta de duplicado descartada.');
        setActiveDuplicatePair(null);
        loadClientData();
      }
    } catch (err) {
      console.error('Error dismissing duplicate:', err);
    }
  };

  // Client initials helper
  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0) || ''}${apellido.charAt(0) || ''}`.toUpperCase();
  };

  // Formatted date helper
  const formatDateFriendly = (dateStr?: string) => {
    if (!dateStr) return 'Sin registros';
    try {
      const [y, m, d] = dateStr.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#241E1A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#8E4455]/40 text-sm animate-bounce-short">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8DCD5]">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#241E1A] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#8E4455]" />
            Gestión Inteligente de Clientes
          </h3>
          <p className="text-xs sm:text-sm text-[#7A6B62] mt-0.5">
            Historial unificado sin registros ni contraseñas. Detección proactiva de perfiles duplicados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadClientData}
            title="Recargar listado"
            className="p-2.5 rounded-xl border border-[#D9C9BF] text-[#4A3E39] hover:bg-[#FAF7F2] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreatingClient(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8E4455] text-white text-xs font-semibold hover:bg-[#783746] transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Nueva Clienta
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5]">
          <div className="flex items-center justify-between text-[#8C7A70] text-xs font-medium mb-1">
            <span>Total Clientes</span>
            <Users className="w-4 h-4 text-[#8E4455]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#241E1A]">
            {stats ? stats.totalClientes : '...'}
          </p>
          <span className="text-[10px] text-[#7A6B62]">Perfiles únicos</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5]">
          <div className="flex items-center justify-between text-[#8C7A70] text-xs font-medium mb-1">
            <span>Recurrentes</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#241E1A]">
            {stats ? stats.clientesRecurrentes : '...'}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">≥2 visitas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5]">
          <div className="flex items-center justify-between text-[#8C7A70] text-xs font-medium mb-1">
            <span>Nuevos (30d)</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#241E1A]">
            {stats ? stats.clientesNuevos : '...'}
          </p>
          <span className="text-[10px] text-[#7A6B62]">Altas recientes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5]">
          <div className="flex items-center justify-between text-[#8C7A70] text-xs font-medium mb-1">
            <span>Con Próximo</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#241E1A]">
            {stats ? stats.clientesConProximosTurnos : '...'}
          </p>
          <span className="text-[10px] text-[#7A6B62]">Turnos agendados</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5]">
          <div className="flex items-center justify-between text-[#8C7A70] text-xs font-medium mb-1">
            <span>Inactivos</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#241E1A]">
            {stats ? stats.clientesInactivos : '...'}
          </p>
          <span className="text-[10px] text-rose-500">{'>'}60d sin visitar</span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          (stats?.duplicadosPendientes || 0) > 0 
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' 
            : 'bg-white border-[#E8DCD5]'
        }`}>
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium mb-1">
            <span>Duplicados</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-amber-900">
            {stats ? stats.duplicadosPendientes : '...'}
          </p>
          <button 
            onClick={() => setCategoryFilter('duplicados')}
            className="text-[10px] font-semibold text-amber-700 hover:underline flex items-center gap-0.5"
          >
            Revisar alertas →
          </button>
        </div>

      </div>

      {/* Duplicate Alert Banner if pending */}
      {duplicatePairs.length > 0 && categoryFilter !== 'duplicados' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Se detectaron {duplicatePairs.length} posibles perfiles duplicados
              </h4>
              <p className="text-xs text-amber-700">
                Personas con nombres idénticos o teléfonos similares que podrían ser la misma clienta.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCategoryFilter('duplicados')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shrink-0 shadow-xs"
          >
            Ver y Fusionar ({duplicatePairs.length})
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DCD5] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C7A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apellido, teléfono, email o nota privada..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs sm:text-sm text-[#241E1A] placeholder-[#A6978E] focus:outline-none focus:border-[#8E4455] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7A70] hover:text-[#241E1A]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos', count: stats?.totalClientes },
            { id: 'recurrentes', label: 'Recurrentes', count: stats?.clientesRecurrentes },
            { id: 'nuevos', label: 'Nuevos', count: stats?.clientesNuevos },
            { id: 'inactivos', label: 'Inactivos', count: stats?.clientesInactivos },
            { id: 'proximos', label: 'Con Turno', count: stats?.clientesConProximosTurnos },
            { id: 'duplicados', label: 'Duplicados', count: stats?.duplicadosPendientes }
          ].map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#8E4455] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C4D44] border border-[#E8DCD5] hover:bg-white hover:text-[#241E1A]'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E8DCD5] text-[#4A3E39]'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Content Area */}
      {categoryFilter === 'duplicados' ? (
        /* ================= DUPLICATE COMPARISON VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-lg font-medium text-[#241E1A] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Comparativa de Posibles Duplicados ({duplicatePairs.length})
            </h4>
            <button
              onClick={() => setCategoryFilter('todos')}
              className="text-xs text-[#8E4455] font-semibold hover:underline"
            >
              Volver a todas las clientas
            </button>
          </div>

          {duplicatePairs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#E8DCD5] text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h5 className="font-medium text-[#241E1A] text-sm">¡Base de clientes impecable!</h5>
              <p className="text-xs text-[#7A6B62] mt-1 max-w-sm mx-auto">
                No hay coincidencias dudosas pendientes de revisión. El motor de normalización mantiene los historiales limpios.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicatePairs.map((pair) => (
                <div 
                  key={pair.id}
                  className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden"
                >
                  <div className="bg-amber-50/80 px-5 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-800 text-[11px] font-bold">
                        {pair.confianza}% Coincidencia
                      </span>
                      <span className="text-xs text-amber-900 font-medium">
                        {pair.motivo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDismissDuplicate(pair)}
                        className="px-3 py-1 text-xs text-[#7A6B62] hover:text-[#241E1A] hover:bg-white rounded-lg border border-[#D9C9BF] transition-colors"
                      >
                        Son diferentes
                      </button>
                      <button
                        onClick={() => handleOpenDuplicateMerge(pair)}
                        className="px-3.5 py-1 text-xs font-semibold bg-[#8E4455] text-white hover:bg-[#783746] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        Fusionar perfiles
                      </button>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E8DCD5]">
                    
                    {/* Perfil A */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D9C9BF] flex items-center justify-center font-serif font-bold text-[#8E4455]">
                            {getInitials(pair.clienteA.nombre, pair.clienteA.apellido)}
                          </div>
                          <div>
                            <h5 className="font-serif font-semibold text-[#241E1A]">
                              {pair.clienteA.nombre} {pair.clienteA.apellido}
                            </h5>
                            <p className="text-[11px] text-[#7A6B62]">
                              Alta: {formatDateFriendly(pair.clienteA.fechaAlta)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#8E4455] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                          {pair.turnosA?.length || pair.clienteA.totalTurnos || 0} turnos
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-[#5C4D44] bg-[#FAF7F2] p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#8C7A70]" />
                          <span className="font-mono font-medium">{pair.clienteA.telefono}</span>
                        </div>
                        {pair.clienteA.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#8C7A70]" />
                            <span>{pair.clienteA.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#8C7A70]" />
                          <span>Última visita: {formatDateFriendly(pair.clienteA.fechaUltimaVisita)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Perfil B */}
                    <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D9C9BF] flex items-center justify-center font-serif font-bold text-[#8E4455]">
                            {getInitials(pair.clienteB.nombre, pair.clienteB.apellido)}
                          </div>
                          <div>
                            <h5 className="font-serif font-semibold text-[#241E1A]">
                              {pair.clienteB.nombre} {pair.clienteB.apellido}
                            </h5>
                            <p className="text-[11px] text-[#7A6B62]">
                              Alta: {formatDateFriendly(pair.clienteB.fechaAlta)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#8E4455] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                          {pair.turnosB?.length || pair.clienteB.totalTurnos || 0} turnos
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-[#5C4D44] bg-[#FAF7F2] p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#8C7A70]" />
                          <span className="font-mono font-medium">{pair.clienteB.telefono}</span>
                        </div>
                        {pair.clienteB.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#8C7A70]" />
                            <span>{pair.clienteB.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#8C7A70]" />
                          <span>Última visita: {formatDateFriendly(pair.clienteB.fechaUltimaVisita)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= CLIENT LIST TABLE & CARDS ================= */
        <div className="bg-white rounded-2xl border border-[#E8DCD5] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[#7A6B62]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8E4455] mb-2" />
              <p className="text-sm">Buscando clientas...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-[#D9C9BF] mx-auto mb-3" />
              <h4 className="font-serif font-medium text-[#241E1A] text-base">No se encontraron clientes</h4>
              <p className="text-xs text-[#7A6B62] mt-1 max-w-sm mx-auto">
                No hay coincidencias para el filtro o término de búsqueda ingresado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8DCD5]">
              {clients.map((client) => {
                const isRecurrent = (client.totalTurnos || 0) >= 2;
                const hasUpcoming = Boolean(client.proximoTurno);
                const hasDuplicateWarning = Boolean(client.posibleDuplicadoDe && client.posibleDuplicadoDe.length > 0 && !client.duplicadoRevisado);

                return (
                  <div
                    key={client.id}
                    className="p-4 sm:p-5 hover:bg-[#FAF7F2]/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8E4455]/15 to-[#8E4455]/5 border border-[#8E4455]/20 flex items-center justify-center font-serif font-bold text-[#8E4455] shrink-0 text-sm">
                        {getInitials(client.nombre, client.apellido)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 
                            onClick={() => handleOpenClientDetails(client)}
                            className="font-serif text-base font-semibold text-[#241E1A] hover:text-[#8E4455] cursor-pointer transition-colors"
                          >
                            {client.nombre} {client.apellido}
                          </h4>

                          {/* Badges */}
                          {isRecurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              ⭐ Recurrente ({client.totalTurnos})
                            </span>
                          )}
                          {!isRecurrent && (client.totalTurnos || 0) === 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                              1 Turno
                            </span>
                          )}
                          {(client.totalTurnos || 0) === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                              Nueva
                            </span>
                          )}
                          {hasUpcoming && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              Próx: {formatDateFriendly(client.proximoTurno)} ({client.proximoTurnoHora} hs)
                            </span>
                          )}
                          {hasDuplicateWarning && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Duda Duplicado
                            </span>
                          )}
                        </div>

                        {/* Contact details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#7A6B62]">
                          <a 
                            href={`https://wa.me/${client.telefonoNormalizado || client.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-emerald-700 font-mono font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {client.telefono}
                          </a>
                          {client.email && (
                            <span className="inline-flex items-center gap-1 text-[#8C7A70]">
                              <Mail className="w-3.5 h-3.5" />
                              {client.email}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#8C7A70]" />
                            Última visita: {formatDateFriendly(client.fechaUltimaVisita)}
                          </span>
                        </div>

                        {/* Admin note preview if available */}
                        {client.notasAdmin && (
                          <p className="text-[11px] text-[#8C7A70] bg-[#FAF7F2] px-2.5 py-1 rounded-lg mt-1.5 line-clamp-1 border border-[#E8DCD5]">
                            💬 {client.notasAdmin}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Metrics & Action Buttons */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <div className="text-right mr-2 hidden sm:block">
                        <span className="text-xs font-semibold text-[#241E1A] block">
                          ${(client.totalGastado || 0).toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-[#8C7A70]">
                          {client.totalTurnos || 0} turnos totales
                        </span>
                      </div>

                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${client.telefonoNormalizado || client.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${client.nombre}! Te escribimos desde Gwen Nails ✨`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="Enviar WhatsApp directo"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-2 rounded-xl bg-[#FAF7F2] text-[#4A3E39] border border-[#D9C9BF] hover:bg-white transition-colors"
                        title="Editar datos y notas"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Full Profile Details Button */}
                      <button
                        onClick={() => handleOpenClientDetails(client)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#8E4455] hover:text-white text-[#4A3E39] border border-[#D9C9BF] text-xs font-medium transition-all cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Ficha</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CLIENT FULL DETAILS DRAWER ================= */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#E8DCD5] shadow-2xl animate-fade-in">
            
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-[#FAF7F2] to-white p-6 border-b border-[#E8DCD5] flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#8E4455] text-white flex items-center justify-center font-serif font-bold text-lg shadow-xs">
                  {getInitials(selectedClient.nombre, selectedClient.apellido)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-[#241E1A]">
                      {selectedClient.nombre} {selectedClient.apellido}
                    </h3>
                    {(selectedClient.totalTurnos || 0) >= 2 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Recurrente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A6B62] mt-0.5">
                    Cliente desde {formatDateFriendly(selectedClient.fechaAlta)} • ID: <span className="font-mono text-[10px]">{selectedClient.id.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-[#7A6B62] hover:bg-[#E8DCD5]/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD5]">
                  <span className="text-[10px] text-[#8C7A70] uppercase font-semibold block">Teléfono</span>
                  <span className="font-mono text-xs font-semibold text-[#241E1A]">{selectedClient.telefono}</span>
                </div>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD5]">
                  <span className="text-[10px] text-[#8C7A70] uppercase font-semibold block">Email</span>
                  <span className="text-xs font-medium text-[#241E1A] truncate block">{selectedClient.email || 'No registrado'}</span>
                </div>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD5]">
                  <span className="text-[10px] text-[#8C7A70] uppercase font-semibold block">Total Invertido</span>
                  <span className="text-xs font-bold text-[#8E4455]">${(selectedClient.totalGastado || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD5]">
                  <span className="text-[10px] text-[#8C7A70] uppercase font-semibold block">Visitas</span>
                  <span className="text-xs font-bold text-[#241E1A]">{clientAppointments.length} turnos</span>
                </div>
              </div>

              {/* Private Notes Section */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    Notas Privadas del Salón
                  </h4>
                  <button
                    onClick={() => {
                      handleOpenEdit(selectedClient);
                    }}
                    className="text-[11px] font-semibold text-amber-800 hover:underline"
                  >
                    Editar nota
                  </button>
                </div>
                <p className="text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                  {selectedClient.notasAdmin || 'Sin notas registradas para esta clienta. Podés agregar gustos, preferencias o detalles de cutículas.'}
                </p>
              </div>

              {/* Appointment History Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-base font-semibold text-[#241E1A] flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8E4455]" />
                    Historial Completo de Turnos ({clientAppointments.length})
                  </h4>
                  {onOpenNewBookingWithClient && (
                    <button
                      onClick={() => {
                        onOpenNewBookingWithClient(selectedClient);
                        setSelectedClient(null);
                      }}
                      className="text-xs font-semibold text-[#8E4455] hover:underline flex items-center gap-1"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Agendar nuevo turno
                    </button>
                  )}
                </div>

                {isLoadingHistory ? (
                  <div className="p-8 text-center text-[#7A6B62]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#8E4455] mb-2" />
                    <p className="text-xs">Cargando turnos...</p>
                  </div>
                ) : clientAppointments.length === 0 ? (
                  <div className="p-6 bg-[#FAF7F2] rounded-xl text-center text-xs text-[#7A6B62]">
                    No se registran turnos en el sistema para esta persona.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {clientAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-white p-3.5 rounded-xl border border-[#E8DCD5] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#241E1A]">{apt.servicioNombre}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.estado === 'confirmado' ? 'bg-emerald-100 text-emerald-800' :
                              apt.estado === 'completado' ? 'bg-blue-100 text-blue-800' :
                              apt.estado === 'cancelado' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {apt.estado}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[#7A6B62] mt-1 text-[11px]">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-[#8E4455]" />
                              {formatDateFriendly(apt.fecha)} - {apt.horaInicio} hs
                            </span>
                            <span className="font-mono text-[#8C7A70]">{apt.codigo}</span>
                          </div>
                          {apt.observaciones && (
                            <p className="text-[11px] text-[#5C4D44] mt-1 italic">
                              "{apt.observaciones}"
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-[#8E4455] block">${apt.precio.toLocaleString('es-AR')}</span>
                          <span className="text-[10px] text-[#8C7A70]">{apt.duracionMinutos} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="bg-[#FAF7F2] p-4 border-t border-[#E8DCD5] flex items-center justify-between">
              <a
                href={`https://wa.me/${selectedClient.telefonoNormalizado || selectedClient.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedClient.nombre}! Te escribimos de Gwen Nails.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </a>

              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C9BF] text-[#4A3E39] hover:bg-white text-xs font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CLIENT / NOTES ================= */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DCD5] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif text-lg font-bold text-[#241E1A]">
                Editar Datos de Clienta
              </h4>
              <button onClick={() => setEditingClient(null)} className="text-[#8C7A70] hover:text-[#241E1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A3E39] mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editForm.nombre}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A3E39] mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={editForm.apellido}
                    onChange={(e) => setEditForm(prev => ({ ...prev, apellido: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3E39] mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={editForm.telefono}
                  onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3E39] mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3E39] mb-1">Notas Privadas / Preferencias</label>
                <textarea
                  rows={3}
                  value={editForm.notasAdmin}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notasAdmin: e.target.value }))}
                  placeholder="Ej: Prefiere tonos pastel, cutículas sensibles, café con edulcorante..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl border border-[#D9C9BF] text-xs text-[#4A3E39] hover:bg-[#FAF7F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-[#8E4455] text-white text-xs font-semibold hover:bg-[#783746] transition-colors"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL NEW CLIENT ================= */}
      {isCreatingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DCD5] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif text-lg font-bold text-[#241E1A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#8E4455]" />
                Registrar Nueva Clienta
              </h4>
              <button onClick={() => setIsCreatingClient(false)} className="text-[#8C7A70] hover:text-[#241E1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A3E39] mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={newClientForm.nombre}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Luciana"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A3E39] mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={newClientForm.apellido}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, apellido: e.target.value }))}
                    placeholder="Ej: Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3E39] mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={newClientForm.telefono}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej: 011-15682386"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3E39] mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="luciana@correo.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3E39] mb-1">Notas Privadas / Gustos (Opcional)</label>
                <textarea
                  rows={2}
                  value={newClientForm.notasAdmin}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, notasAdmin: e.target.value }))}
                  placeholder="Ej: Clienta recomendada por Sofía..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingClient(false)}
                  className="px-4 py-2 rounded-xl border border-[#D9C9BF] text-xs text-[#4A3E39] hover:bg-[#FAF7F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingNew}
                  className="px-4 py-2 rounded-xl bg-[#8E4455] text-white text-xs font-semibold hover:bg-[#783746] transition-colors"
                >
                  {isSavingNew ? 'Registrando...' : 'Registrar Clienta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DUPLICATE MERGE RESOLUTION ================= */}
      {activeDuplicatePair && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E8DCD5] shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#241E1A] flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-[#8E4455]" />
                  Asistente de Fusión de Perfiles
                </h4>
                <p className="text-xs text-[#7A6B62] mt-0.5">
                  Seleccioná cuál de los dos perfiles será el principal. Todos los turnos y notas se unificarán.
                </p>
              </div>
              <button onClick={() => setActiveDuplicatePair(null)} className="text-[#8C7A70] hover:text-[#241E1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Radios */}
            <div className="space-y-3">
              <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                primaryClientId === activeDuplicatePair.clienteA.id 
                  ? 'border-[#8E4455] bg-rose-50/40 ring-2 ring-[#8E4455]/20' 
                  : 'border-[#E8DCD5] hover:border-[#D9C9BF]'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="primaryClient"
                    checked={primaryClientId === activeDuplicatePair.clienteA.id}
                    onChange={() => setPrimaryClientId(activeDuplicatePair.clienteA.id)}
                    className="accent-[#8E4455]"
                  />
                  <div>
                    <span className="font-serif font-semibold text-sm text-[#241E1A] block">
                      {activeDuplicatePair.clienteA.nombre} {activeDuplicatePair.clienteA.apellido}
                    </span>
                    <span className="text-xs text-[#7A6B62]">
                      Tel: {activeDuplicatePair.clienteA.telefono} • Alta: {formatDateFriendly(activeDuplicatePair.clienteA.fechaAlta)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#8E4455]">
                  {activeDuplicatePair.turnosA?.length || activeDuplicatePair.clienteA.totalTurnos || 0} turnos
                </span>
              </label>

              <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                primaryClientId === activeDuplicatePair.clienteB.id 
                  ? 'border-[#8E4455] bg-rose-50/40 ring-2 ring-[#8E4455]/20' 
                  : 'border-[#E8DCD5] hover:border-[#D9C9BF]'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="primaryClient"
                    checked={primaryClientId === activeDuplicatePair.clienteB.id}
                    onChange={() => setPrimaryClientId(activeDuplicatePair.clienteB.id)}
                    className="accent-[#8E4455]"
                  />
                  <div>
                    <span className="font-serif font-semibold text-sm text-[#241E1A] block">
                      {activeDuplicatePair.clienteB.nombre} {activeDuplicatePair.clienteB.apellido}
                    </span>
                    <span className="text-xs text-[#7A6B62]">
                      Tel: {activeDuplicatePair.clienteB.telefono} • Alta: {formatDateFriendly(activeDuplicatePair.clienteB.fechaAlta)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#8E4455]">
                  {activeDuplicatePair.turnosB?.length || activeDuplicatePair.clienteB.totalTurnos || 0} turnos
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A3E39] mb-1">
                Nota de fusión (Opcional)
              </label>
              <input
                type="text"
                value={mergeNotes}
                onChange={(e) => setMergeNotes(e.target.value)}
                placeholder="Ej: Cambio de número celular informado por la clienta..."
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D9C9BF] text-xs text-[#241E1A] focus:outline-none focus:border-[#8E4455]"
              />
            </div>

            <div className="bg-[#FAF7F2] p-3.5 rounded-xl text-[11px] text-[#5C4D44] border border-[#E8DCD5] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Esta acción transferirá de forma segura todos los turnos históricos al perfil seleccionado y archivará el perfil secundario sin pérdida de datos.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDuplicatePair(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C9BF] text-xs text-[#4A3E39] hover:bg-[#FAF7F2]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={isMerging}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8E4455] text-white text-xs font-semibold hover:bg-[#783746] transition-colors shadow-xs"
              >
                <GitMerge className="w-3.5 h-3.5" />
                {isMerging ? 'Fusionando...' : 'Confirmar Fusión'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
