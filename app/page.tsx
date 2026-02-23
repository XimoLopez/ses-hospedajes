"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  BarChart3,
  Send,
  Settings,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Building2,
  ChevronRight,
  FileUp,
  Loader2,
  Eye,
  RotateCcw,
  Download,
  X,
  Menu,
} from "lucide-react";
import type {
  ImportJob,
  CommunicationBatch,
  ValidationError,
  CommunicationType,
} from "@/lib/types";

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

type Page = "dashboard" | "upload" | "batches" | "settings";

function Sidebar({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const links: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "dashboard", label: "Dashboard", icon: <BarChart3 size={20} /> },
    { page: "upload", label: "Importar CSV", icon: <Upload size={20} /> },
    { page: "batches", label: "Lotes Enviados", icon: <Send size={20} /> },
    { page: "settings", label: "Configuración", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface-900/95 backdrop-blur-xl border-r border-surface-700/50 z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                SES.Hospedajes
              </h1>
              <p className="text-xs text-surface-400">Panel de Gestión</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <button
              key={link.page}
              onClick={() => {
                onNavigate(link.page);
                onClose();
              }}
              className={
                currentPage === link.page
                  ? "sidebar-link-active w-full"
                  : "sidebar-link w-full"
              }
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>

        {/* Environment indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-700/50">
          <div className="glass-card p-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${process.env.NEXT_PUBLIC_SES_ENVIRONMENT === "PRO"
                  ? "bg-emerald-400"
                  : "bg-amber-400"
                  }`}
              />
              <span className="text-xs text-surface-400">Entorno:</span>
              <span
                className={`text-xs font-bold ${process.env.NEXT_PUBLIC_SES_ENVIRONMENT === "PRO"
                  ? "text-emerald-400"
                  : "text-amber-400"
                  }`}
              >
                {process.env.NEXT_PUBLIC_SES_ENVIRONMENT || "PRE"}
              </span>
            </div>
            <p className="text-[10px] text-surface-500 mt-1">
              Casa Rural Castalla
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

// ==========================================
// DASHBOARD PAGE
// ==========================================

function DashboardPage({
  jobs,
  batches,
  stats: apiStats, // Add stats prop
}: {
  jobs: ImportJob[];
  batches: CommunicationBatch[];
  stats?: any; // stats from API
}) {
  const totalGuests = apiStats?.totalGuests ?? jobs.reduce((sum, j) => sum + j.rowCount, 0);
  const totalBatches = apiStats?.totalBatches ?? batches.length;
  const accepted = apiStats?.acceptedBatches ?? batches.filter((b) => b.status === "accepted").length;
  const pending = apiStats?.pendingBatches ?? batches.filter(
    (b) => b.status === "pending" || b.status === "processing"
  ).length;

  const stats = [
    {
      label: "Importaciones",
      value: jobs.length,
      icon: <FileText size={24} />,
      color: "text-brand-400",
      gradient: "from-brand-500/10 to-brand-600/5",
    },
    {
      label: "Huéspedes",
      value: totalGuests,
      icon: <Users size={24} />,
      color: "text-emerald-400",
      gradient: "from-emerald-500/10 to-emerald-600/5",
    },
    {
      label: "Lotes Enviados",
      value: totalBatches,
      icon: <Send size={24} />,
      color: "text-violet-400",
      gradient: "from-violet-500/10 to-violet-600/5",
    },
    {
      label: "Aceptados",
      value: accepted,
      icon: <CheckCircle2 size={24} />,
      color: "text-emerald-400",
      gradient: "from-emerald-500/10 to-emerald-600/5",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Dashboard
        </h2>
        <p className="text-surface-400 mt-1">
          Resumen de tus comunicaciones con el Ministerio del Interior
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`stat-card bg-gradient-to-br ${stat.gradient} animate-slide-up`}
          >
            <div className="flex items-center justify-between">
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-3xl font-bold text-white">
                {stat.value}
              </span>
            </div>
            <p className="text-sm text-surface-400 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileUp size={20} className="text-brand-400" />
            Últimas Importaciones
          </h3>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Upload size={40} className="mx-auto text-surface-600 mb-3" />
              <p className="text-surface-500 text-sm">
                No hay importaciones todavía
              </p>
              <p className="text-surface-600 text-xs mt-1">
                Sube un archivo CSV para empezar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-surface-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {job.filename}
                      </p>
                      <p className="text-xs text-surface-500">
                        {job.rowCount} registros •{" "}
                        {new Date(job.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Batches */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send size={20} className="text-violet-400" />
            Últimos Lotes
          </h3>
          {batches.length === 0 ? (
            <div className="text-center py-8">
              <Send size={40} className="mx-auto text-surface-600 mb-3" />
              <p className="text-surface-500 text-sm">
                No hay lotes enviados todavía
              </p>
              <p className="text-surface-600 text-xs mt-1">
                Importa y envía tu primer lote
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.slice(0, 5).map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 hover:bg-surface-800/80 transition-colors"
                >
                  <div>
                    <p className="text-sm text-white">
                      Lote {batch.sesBatchId || batch.id.substring(0, 8)}
                    </p>
                    <p className="text-xs text-surface-500">
                      {batch.itemCount} comunicaciones •{" "}
                      {batch.sentAt
                        ? new Date(batch.sentAt).toLocaleDateString("es-ES")
                        : "—"}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// UPLOAD PAGE
// ==========================================

function UploadPage({
  onJobCreated,
  onNavigateToBatches,
}: {
  onJobCreated: () => void;
  onNavigateToBatches: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ImportJob[]>([]);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    xml?: string;
    errors?: Array<{ code: string; message: string }>;
    guestErrors?: Array<{ code: string; message: string }>;
    acceptedCount?: number;
    rejectedCount?: number;
    guestCount?: number;
  } | null>(null);
  const [communicationType, setCommunicationType] =
    useState<CommunicationType>("parte_viajeros");
  const [showXML, setShowXML] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [contractData, setContractData] = useState({
    referenciaContrato: `REF-${Date.now()}`,
    fechaContrato: new Date().toISOString().split("T")[0],
    fechaEntradaGlobal: "",
    fechaSalidaGlobal: "",
    numeroPersonasGlobal: "",
    tipoPago: "Otros medios de pago",
    fechaPago: new Date().toISOString().split("T")[0]
  });

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setSendResult(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("communicationType", communicationType);

        // Append contract metadata
        formData.append("referenciaContrato", contractData.referenciaContrato);
        formData.append("fechaContrato", contractData.fechaContrato);
        if (contractData.fechaEntradaGlobal) formData.append("fechaEntradaGlobal", contractData.fechaEntradaGlobal);
        if (contractData.fechaSalidaGlobal) formData.append("fechaSalidaGlobal", contractData.fechaSalidaGlobal);
        if (contractData.numeroPersonasGlobal) formData.append("numeroPersonasGlobal", contractData.numeroPersonasGlobal);
        if (contractData.tipoPago) formData.append("tipoPago", contractData.tipoPago);
        if (contractData.fechaPago) formData.append("fechaPago", contractData.fechaPago);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          // FIX #4: Warn about duplicate document numbers before adding to activeJobs
          const existingDocs = new Set(
            activeJobs.flatMap(j => (j.guests || []).map((g: any) => g.numeroDocumento))
          );
          const newGuests: any[] = data.job?.guests || [];
          const duplicates = newGuests.filter(g => g.numeroDocumento && existingDocs.has(g.numeroDocumento));
          if (duplicates.length > 0) {
            const names = duplicates.map((g: any) => `${g.nombre} ${g.primerApellido} (${g.numeroDocumento})`).join(', ');
            const proceed = confirm(
              `⚠️ Atención: Los siguientes documentos ya están en la lista y podrían causar un RECHAZO del Ministerio por duplicado:\n\n${names}\n\n¿Deseas añadirlos de todas formas?`
            );
            if (!proceed) {
              setIsUploading(false);
              return;
            }
          }
          setActiveJobs(prev => [...prev, data.job]);
          onJobCreated();
        } else {
          alert(data.error || "Error al procesar el archivo");
        }
      } catch (error) {
        alert("Error de conexión");
      } finally {
        setIsUploading(false);
      }
    },
    [communicationType, onJobCreated, contractData]
  );

  const handleSend = async () => {
    if (activeJobs.length === 0) return;
    setIsSending(true);
    setSendResult(null);

    const jobIds = activeJobs.map(j => j.id);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });

      const data = await response.json();
      setSendResult({
        success: data.success,
        xml: data.xml,
        errors: data.errors,
        guestErrors: data.guestErrors,
        acceptedCount: data.acceptedCount,
        rejectedCount: data.rejectedCount,
        guestCount: data.guestCount,
      });
      if (data.success) {
        setActiveJobs([]);
      }
      onJobCreated();
    } catch (error) {
      setSendResult({
        success: false,
        errors: [
          { code: "NETWORK", message: "Error de red al enviar" },
        ],
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        setPendingFile(file);
      }
    },
    []
  );

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Importar CSV
        </h2>
        <p className="text-surface-400 mt-1">
          Sube tu archivo de registro de viajeros para validar y enviar
        </p>
      </div>

      {/* Communication Type Selector */}
      <div className="glass-card p-4 mb-6">
        <label className="text-sm font-medium text-surface-300 mb-3 block">
          Tipo de Comunicación
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setCommunicationType("parte_viajeros")}
            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${communicationType === "parte_viajeros"
              ? "border-brand-500 bg-brand-500/10 text-white"
              : "border-surface-600/50 bg-surface-800/50 text-surface-400 hover:border-surface-500"
              }`}
          >
            <Users size={24} className="mb-2" />
            <p className="font-semibold text-sm">Parte de Viajeros</p>
            <p className="text-xs opacity-70 mt-1">
              Registro de entrada de huéspedes
            </p>
          </button>
          <button
            onClick={() => setCommunicationType("reserva")}
            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${communicationType === "reserva"
              ? "border-brand-500 bg-brand-500/10 text-white"
              : "border-surface-600/50 bg-surface-800/50 text-surface-400 hover:border-surface-500"
              }`}
          >
            <FileText size={24} className="mb-2" />
            <p className="font-semibold text-sm">Reserva de Hospedaje</p>
            <p className="text-xs opacity-70 mt-1">
              Comunicación de nueva reserva
            </p>
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      {!sendResult && (
        <div
          className={`glass-card p-8 text-center border-2 border-dashed transition-all duration-300 cursor-pointer mb-6 ${isDragging
            ? "border-brand-400 bg-brand-500/10"
            : "border-surface-600/50 hover:border-surface-500"
            }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingFile(file);
              // Reset input exactly right away so they can select the same file again if aborted
              e.target.value = '';
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="text-brand-400 animate-spin" />
              <p className="text-surface-300">Procesando archivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 flex items-center justify-center">
                <Upload size={36} className="text-brand-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  Arrastra tu archivo CSV aquí
                </p>
                <p className="text-sm text-surface-400 mt-1">
                  o haz clic para seleccionar
                </p>
              </div>
              <p className="text-xs text-surface-500">
                Formato: registro-de-viajeros.csv
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contract Data Modal */}
      {pendingFile && !isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-700 w-full max-w-2xl rounded-2xl shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-surface-800 flex justify-between items-center bg-surface-800/50">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-brand-400" size={24} />
                  Datos del Contrato y Lote
                </h3>
                <p className="text-sm text-surface-400 mt-1">Configura la información global que aplicará a todos los viajeros del archivo <strong>{pendingFile.name}</strong></p>
              </div>
              <button onClick={() => setPendingFile(null)} className="text-surface-400 hover:text-white transition-colors bg-surface-800 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Referencia y Fechas */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-brand-400 uppercase tracking-wider mb-2">Contrato</h4>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Referencia del Contrato</label>
                    <input
                      type="text"
                      className="input-field"
                      value={contractData.referenciaContrato}
                      onChange={e => setContractData({ ...contractData, referenciaContrato: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Fecha Firma Contrato</label>
                    <input
                      type="date"
                      className="input-field"
                      value={contractData.fechaContrato}
                      onChange={e => setContractData({ ...contractData, fechaContrato: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-surface-400 mb-1">Entrada Global</label>
                      <input
                        type="datetime-local"
                        className="input-field"
                        value={contractData.fechaEntradaGlobal}
                        onChange={e => setContractData({ ...contractData, fechaEntradaGlobal: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-surface-400 mb-1">Salida Global</label>
                      <input
                        type="datetime-local"
                        className="input-field"
                        value={contractData.fechaSalidaGlobal}
                        onChange={e => setContractData({ ...contractData, fechaSalidaGlobal: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Pagos y Extra */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Pago y Ocupación</h4>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Método de Pago</label>
                    <select
                      className="input-field"
                      value={contractData.tipoPago}
                      onChange={e => setContractData({ ...contractData, tipoPago: e.target.value })}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                      <option value="Tarjeta de débito">Tarjeta de débito</option>
                      <option value="Transferencia bancaria">Transferencia bancaria</option>
                      <option value="Plataforma de pago">Plataforma de pago online</option>
                      <option value="Otros medios de pago">Otros medios de pago</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Fecha de Pago</label>
                    <input
                      type="date"
                      className="input-field"
                      value={contractData.fechaPago}
                      onChange={e => setContractData({ ...contractData, fechaPago: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Número de Personas</label>
                    <input
                      type="number"
                      placeholder="Autocalcular según CSV"
                      className="input-field"
                      value={contractData.numeroPersonasGlobal}
                      onChange={e => setContractData({ ...contractData, numeroPersonasGlobal: e.target.value })}
                    />
                    <p className="text-[10px] text-surface-500 mt-1">Déjalo en blanco para autocalcularlo basado en el número de filas válidas del CSV.</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-surface-800 bg-surface-900/50 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setPendingFile(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  handleFile(pendingFile);
                  setPendingFile(null); // Clear modal
                }}
              >
                Procesar CSV
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Job Summary and list */}
      {activeJobs.length > 0 && !sendResult && (
        <div className="space-y-6 animate-slide-up mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText size={20} className="text-brand-400" />
                Resumen de Importación ({activeJobs.length} {activeJobs.length === 1 ? 'archivo' : 'archivos'})
              </h3>
              <button
                onClick={() => {
                  setActiveJobs([]);
                  setSendResult(null);
                }}
                className="text-surface-400 hover:text-white transition-colors"
                title="Limpiar todo"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface-800/60">
                <p className="text-2xl font-bold text-white">
                  {activeJobs.reduce((sum, j) => sum + j.rowCount, 0)}
                </p>
                <p className="text-xs text-surface-400">Total registros</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-bold text-emerald-400">
                  {activeJobs.reduce((sum, j) => sum + j.validCount, 0)}
                </p>
                <p className="text-xs text-surface-400">Válidos</p>
              </div>
              <div
                className={`p-4 rounded-xl ${activeJobs.some(j => j.errorCount > 0)
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-surface-800/60"
                  }`}
              >
                <p
                  className={`text-2xl font-bold ${activeJobs.some(j => j.errorCount > 0)
                    ? "text-red-400"
                    : "text-surface-400"
                    }`}
                >
                  {activeJobs.reduce((sum, j) => sum + j.errorCount, 0)}
                </p>
                <p className="text-xs text-surface-400">Con errores</p>
              </div>
            </div>

            {/* List of active files */}
            <div className="space-y-2 mb-6">
              {activeJobs.map((job, idx) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-800/40 border border-surface-700/50">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-surface-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{job.filename}</p>
                      <p className="text-[10px] text-surface-500">{job.validCount} válidos • {job.errorCount} errores</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveJobs(prev => prev.filter((_, i) => i !== idx))}
                    className="text-surface-500 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {activeJobs.some(j => j.validCount > 0) && (
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="btn-primary"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando Lote...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar {activeJobs.reduce((sum, j) => sum + j.validCount, 0)} registros válidos
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Combined Guest Preview */}
          {activeJobs.some(j => j.guests.length > 0) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye size={20} className="text-brand-400" />
                Vista Previa Consolidada (Huéspedes de todos los archivos)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-surface-700/50">
                      <th className="table-header w-24">Archivo</th>
                      <th className="table-header w-32">Referencia</th>
                      <th className="table-header w-48">Huésped (Nombre / Nacimiento / Nac.)</th>
                      <th className="table-header w-40">Documento (Tipo / Nº / Soporte)</th>
                      <th className="table-header w-48">Dirección Completa</th>
                      <th className="table-header w-48">Estancia (Entrada - Salida)</th>
                      <th className="table-header w-32">Pago (Tipo / Fecha)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJobs.flatMap(job =>
                      job.guests.map(g => ({
                        ...g,
                        filename: job.filename,
                        displayEntrada: job.fechaEntradaGlobal || g.fechaEntrada,
                        displaySalida: job.fechaSalidaGlobal || g.fechaSalida || "-",
                        displayReferencia: job.referenciaContrato || g.referencia || "-",
                        displayPago: job.tipoPago || "-",
                        displayFechaPago: job.fechaPago || "-",
                      }))
                    ).map((g, i) => (
                      <tr
                        key={i}
                        className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors"
                      >
                        <td className="table-cell text-[10px] text-surface-500 truncate max-w-[100px]" title={g.filename}>
                          {g.filename}
                        </td>
                        <td className="table-cell text-xs font-mono text-brand-400">
                          {g.displayReferencia}
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{g.nombre} {g.primerApellido} {g.segundoApellido || ""}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-surface-400 bg-surface-800 px-1 rounded" title="Fecha Nacimiento">📅 {g.fechaNacimiento}</span>
                              <span className="text-[10px] font-bold text-brand-300 bg-brand-500/10 px-1 rounded" title="Nacionalidad">🌍 {g.nacionalidad}</span>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <span className="bg-surface-700/50 px-1.5 py-0.5 rounded text-[10px] text-surface-300 font-bold">
                              {g.tipoDocumento}
                            </span>
                            <span className="font-mono text-xs text-white">{g.numeroDocumento}</span>
                          </div>
                          {g.soporteDocumento && (
                            <p className="text-[10px] text-surface-500 mt-0.5 ml-0.5">Sop: {g.soporteDocumento}</p>
                          )}
                        </td>
                        <td className="table-cell">
                          <p className="text-[10px] text-surface-300 truncate max-w-[200px]" title={g.direccion}>
                            {g.direccion} {g.direccion2 || ""}
                          </p>
                          <p className="text-[10px] text-surface-500">
                            {g.codigoPostal} {g.ciudad} ({g.pais})
                          </p>
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[11px] text-surface-300">
                              <span className="text-emerald-500 font-bold mr-1">ENT:</span> {g.displayEntrada}
                            </div>
                            <div className="text-[11px] text-surface-300">
                              <span className="text-red-500 font-bold mr-1">SAL:</span> {g.displaySalida}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <p className="text-[10px] text-surface-300 font-medium truncate max-w-[120px]" title={g.displayPago}>
                            {g.displayPago}
                          </p>
                          <p className="text-[10px] text-surface-500">
                            {g.displayFechaPago}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Result */}
      {sendResult && (
        <div className="space-y-6 animate-slide-up">
          <div
            className={`glass-card p-6 border-l-4 ${sendResult.success
              ? "border-l-emerald-500"
              : "border-l-red-500"
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {sendResult.success ? (
                <CheckCircle2 size={28} className="text-emerald-400" />
              ) : (
                <XCircle size={28} className="text-red-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {sendResult.success
                    ? "Lote enviado correctamente"
                    : "Error al enviar"}
                </h3>
                <p className="text-sm text-surface-400">
                  {sendResult.success
                    ? "El lote ha sido enviado al Ministerio del Interior para su procesamiento"
                    : "No se pudo completar el envío"}
                </p>
              </div>
            </div>

            {sendResult.errors && sendResult.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                {sendResult.errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm"
                  >
                    <span className="font-medium text-red-400">
                      [{err.code}]
                    </span>{" "}
                    <span className="text-red-300">{err.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* FIX #5: Per-guest accepted/rejected counters */}
            {sendResult.success && (sendResult.acceptedCount !== undefined || sendResult.rejectedCount !== undefined) && (
              <div className="mt-4 flex gap-3">
                {sendResult.acceptedCount !== undefined && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">{sendResult.acceptedCount} aceptado(s)</span>
                  </div>
                )}
                {sendResult.rejectedCount !== undefined && sendResult.rejectedCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-sm text-red-300 font-medium">{sendResult.rejectedCount} rechazado(s)</span>
                  </div>
                )}
              </div>
            )}

            {/* FIX #5: Per-guest errors returned by the Ministry */}
            {sendResult.guestErrors && sendResult.guestErrors.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <p className="text-sm font-semibold text-amber-300">
                    El Ministerio rechazó {sendResult.guestErrors.length} viajero(s) individualmente:
                  </p>
                </div>
                <div className="space-y-2">
                  {sendResult.guestErrors.map((err, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm"
                    >
                      <span className="font-medium text-amber-400">[{err.code}]</span>{" "}
                      <span className="text-amber-300">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowXML(!showXML)}
                className="btn-secondary"
              >
                <Eye size={18} />
                {showXML ? "Ocultar" : "Ver"} XML generado
              </button>
              <button
                onClick={() => {
                  setActiveJobs([]);
                  setSendResult(null);
                }}
                className="btn-secondary"
              >
                <RotateCcw size={18} />
                Nueva importación
              </button>
              {sendResult.success && (
                <button onClick={onNavigateToBatches} className="btn-primary">
                  <Send size={18} />
                  Ver lotes
                </button>
              )}
            </div>
          </div>

          {showXML && sendResult.xml && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-surface-400 mb-3">
                XML Generado
              </h3>
              <pre className="text-xs text-surface-300 bg-surface-900 p-4 rounded-xl overflow-x-auto max-h-96 overflow-y-auto">
                {sendResult.xml}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// BATCHES PAGE
// ==========================================

function BatchesPage({ batches }: { batches: CommunicationBatch[] }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Lotes Enviados
        </h2>
        <p className="text-surface-400 mt-1">
          Monitoriza el estado de tus envíos al Ministerio del Interior
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {batches.length === 0 ? (
          <div className="text-center py-16">
            <Send size={48} className="mx-auto text-surface-600 mb-4" />
            <p className="text-surface-400 text-lg font-medium">
              No hay lotes enviados
            </p>
            <p className="text-surface-600 text-sm mt-1">
              Importa un CSV y envíalo para ver los resultados aquí
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-700/50 bg-surface-800/30">
                  <th className="table-header">ID Lote</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Registros</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Fecha Envío</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors"
                  >
                    <td className="table-cell font-mono text-xs">
                      {batch.sesBatchId || batch.id.substring(0, 12)}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs bg-surface-700/50 px-2 py-1 rounded">
                        {batch.type === "parte_viajeros"
                          ? "Parte Viajeros"
                          : "Reserva"}
                      </span>
                    </td>
                    <td className="table-cell">{batch.itemCount}</td>
                    <td className="table-cell">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="table-cell text-xs">
                      {batch.sentAt
                        ? new Date(batch.sentAt).toLocaleString("es-ES")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// SETTINGS PAGE
// ==========================================

function SettingsPage() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Configuración
        </h2>
        <p className="text-surface-400 mt-1">
          Ajustes del establecimiento y conexión con SES
        </p>
      </div>

      <div className="space-y-6">
        {/* Establishment Info */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-brand-400" />
            Establecimiento
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-surface-400 block mb-1">
                Nombre
              </label>
              <p className="text-sm text-white bg-surface-800/60 p-3 rounded-xl">
                CASA RURAL CASTALLA - PRIMAVERA D&apos;HIVERN
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-surface-400 block mb-1">
                  Código Establecimiento
                </label>
                <p className="text-sm text-white bg-surface-800/60 p-3 rounded-xl font-mono">
                  {process.env.NEXT_PUBLIC_SES_ESTABLISHMENT_CODE || "0000159962"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-400 block mb-1">
                  Código Entidad
                </label>
                <p className="text-sm text-white bg-surface-800/60 p-3 rounded-xl font-mono">
                  {process.env.NEXT_PUBLIC_SES_ENTITY_CODE || "0000084636"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings size={20} className="text-violet-400" />
            Conexión SES
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-surface-400 block mb-1">
                Entorno
              </label>
              <div className="flex items-center gap-2 bg-surface-800/60 p-3 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm text-white font-medium">
                  PRE-PRODUCCIÓN
                </span>
                <span className="text-xs text-surface-500">(Sandbox)</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 block mb-1">
                Endpoint
              </label>
              <p className="text-xs text-surface-400 bg-surface-800/60 p-3 rounded-xl font-mono break-all">
                https://hospedajes.pre-ses.mir.es/hospedajes-web/ws/v1/comunicacion
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 block mb-1">
                Usuario WS
              </label>
              <p className="text-sm text-white bg-surface-800/60 p-3 rounded-xl font-mono">
                ••••••••WS
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-sm text-emerald-400">
                Credenciales configuradas
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string; icon: React.ReactNode }> =
  {
    pending: {
      className: "status-pending",
      label: "Pendiente",
      icon: <Clock size={12} />,
    },
    processing: {
      className: "status-processing",
      label: "Procesando",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    accepted: {
      className: "status-accepted",
      label: "Aceptado",
      icon: <CheckCircle2 size={12} />,
    },
    rejected: {
      className: "status-rejected",
      label: "Rechazado",
      icon: <XCircle size={12} />,
    },
    uploaded: {
      className: "status-pending",
      label: "Subido",
      icon: <Upload size={12} />,
    },
    validated: {
      className: "status-accepted",
      label: "Validado",
      icon: <CheckCircle2 size={12} />,
    },
    validating: {
      className: "status-processing",
      label: "Validando",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    sending: {
      className: "status-processing",
      label: "Enviando",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    sent: {
      className: "status-accepted",
      label: "Enviado",
      icon: <Send size={12} />,
    },
    error: {
      className: "status-error",
      label: "Error",
      icon: <XCircle size={12} />,
    },
    partial_error: {
      className: "status-error",
      label: "Error Parcial",
      icon: <AlertTriangle size={12} />,
    },
  };

  const c = config[status] || {
    className: "status-pending",
    label: status,
    icon: <Clock size={12} />,
  };

  return (
    <span className={c.className}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ==========================================
// MAIN APP
// ==========================================

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [batches, setBatches] = useState<CommunicationBatch[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      console.log("Fetching dashboard data...");
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      console.log("Dashboard data received:", data);
      setJobs(data.recentJobs || []);
      setBatches(data.recentBatches || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        {/* Top bar for mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-surface-900/95 backdrop-blur-xl border-b border-surface-700/50 p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-surface-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">SES.Hospedajes</h1>
        </div>

        <div className="p-6 lg:p-10">
          {currentPage === "dashboard" && (
            <DashboardPage jobs={jobs} batches={batches} stats={stats} />
          )}
          {currentPage === "upload" && (
            <UploadPage
              onJobCreated={fetchData}
              onNavigateToBatches={() => setCurrentPage("batches")}
            />
          )}
          {currentPage === "batches" && <BatchesPage batches={batches} />}
          {currentPage === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
