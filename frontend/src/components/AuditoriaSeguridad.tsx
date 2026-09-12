import React, { useEffect, useState } from 'react';
import {
  api,
  LogAuditoriaItem,
  CuentaBloqueadaItem,
} from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Unlock,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Building,
} from 'lucide-react';

export const AuditoriaSeguridad: React.FC = () => {
  const [logs, setLogs] = useState<LogAuditoriaItem[]>([]);
  const [cuentasBloqueadas, setCuentasBloqueadas] = useState<CuentaBloqueadaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSeguridadLogs({ page, limit: 25, search });
      setLogs(data.logs || []);
      setTotalPages(data.paginacion?.totalPaginas || 1);
      setCuentasBloqueadas(data.cuentasBloqueadas || []);
    } catch (err: any) {
      setError(err.message || 'Error al consultar logs de auditoría SGSI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  const handleDesbloquear = async (dni: string) => {
    try {
      const res = await api.desbloquearCuenta(dni);
      setSuccessMsg(res.message);
      fetchLogs();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al desbloquear la cuenta.');
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1000px] mx-auto">
      {/* Header Marco Normativo NTP-ISO/IEC 27001:2022 */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-indigo-900/60">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>NTP-ISO/IEC 27001:2022 & Res. SGTD N.º 003-2023-PCM/SGTD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Auditoría de Seguridad y Telemetría SGSI
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-3xl">
            Monitoreo continuo de accesos, telemetría de dispositivo/ubicación y bloqueo automático contra ataques de fuerza bruta (Control A.8.5 & A.8.16).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Telemetría</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Alerta de Cuentas Bloqueadas Defensivamente */}
      {cuentasBloqueadas.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-400/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-rose-700 mb-3">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <h3 className="text-lg font-bold">Cuentas Bloqueadas Defensivamente (Fuerza Bruta)</h3>
          </div>
          <p className="text-xs text-rose-800 mb-4">
            Las siguientes cuentas han superado el umbral de 5 intentos fallidos consecutivos de contraseña y se encuentran bloqueadas temporalmente (15 min) conforme al Control A.8.5 de la NTP-ISO/IEC 27001:2022.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cuentasBloqueadas.map((cb) => (
              <div key={cb.id} className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500">DNI: {cb.dni}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{cb.nombres} {cb.apellidos}</h4>
                  <span className="text-xs text-rose-600 font-semibold block mt-1">
                    {cb.intentos_fallidos} intentos fallidos
                  </span>
                </div>
                <button
                  onClick={() => handleDesbloquear(cb.dni)}
                  className="mt-3 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Desbloquear Cuenta</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buscador de Eventos */}
      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por DNI, IP, Acción, Navegador, SO..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Página {page} de {totalPages}
        </div>
      </div>

      {/* Tabla de Telemetría Extendida (ISO 27001) */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 text-slate-300 text-xs uppercase tracking-wider font-semibold shadow-sm">
                <th className="p-3.5 pl-6">Fecha / Hora</th>
                <th className="p-3.5">DNI / Usuario</th>
                <th className="p-3.5">IP Origen & Ubicación</th>
                <th className="p-3.5">Dispositivo & Entorno</th>
                <th className="p-3.5">Acción Auditada</th>
                <th className="p-3.5 pr-6">Detalle Término</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No se encontraron registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isBlock = log.accion.includes('BLOQUEO') || log.accion.includes('DENEGADO');
                  const isSuccess = log.accion === 'LOGIN' || log.accion === 'FINALIZACION_EXPEDIENTE';

                  return (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 pl-6 font-mono text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.fecha_hora).toLocaleString('es-PE')}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-200 whitespace-nowrap">
                        {log.dni ? (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{log.dni}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Anónimo / Sistema</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-medium text-slate-200">{log.ip}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{log.ubicacion_aproximada || 'Perú (Red Institucional)'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          {log.dispositivo?.includes('Móvil') ? (
                            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          <span>{log.sistema_operativo || 'N/D'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {log.navegador || 'Navegador Estándar'}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isBlock
                              ? 'bg-rose-900/30 text-rose-400 border border-rose-800'
                              : isSuccess
                              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                              : 'bg-blue-900/30 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {isBlock && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          {isSuccess && <FileCheck className="w-3 h-3 text-emerald-500" />}
                          <span>{log.accion}</span>
                        </span>
                      </td>

                      <td className="p-3.5 pr-6 max-w-xs truncate text-slate-400" title={log.detalles}>
                        {log.detalles || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex justify-between items-center text-xs rounded-b-2xl">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-700 rounded-lg disabled:opacity-40 font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Anterior
            </button>
            <span className="text-slate-400 font-medium">Página {page} de {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-700 rounded-lg disabled:opacity-40 font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
