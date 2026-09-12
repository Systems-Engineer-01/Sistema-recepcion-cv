import React, { useEffect, useState } from 'react';
import {
  api,
  ReportePostulantesResponse,
  ImpactoAmbientalResponse,
  getToken,
} from '../services/api';
import {
  FileSpreadsheet,
  FileText,
  Leaf,
  Bus,
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Building2,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const Reporteria: React.FC = () => {
  const [reporte, setReporte] = useState<ReportePostulantesResponse | null>(null);
  const [impacto, setImpacto] = useState<ImpactoAmbientalResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parámetros interactivos para la simulación ante el INEI
  const [hojasPorExpediente, setHojasPorExpediente] = useState<number>(25);
  const [costoTraslado, setCostoTraslado] = useState<number>(15.0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataReporte, dataImpacto] = await Promise.all([
        api.getReportePostulantes(),
        api.getImpactoAmbiental({ hojasPorExpediente, costoTraslado }),
      ]);
      setReporte(dataReporte);
      setImpacto(dataImpacto);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los reportes institucionales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hojasPorExpediente, costoTraslado]);

  const handleExport = (formato: 'xlsx' | 'pdf') => {
    const token = getToken();
    const exportUrl = `${api.getExportarUrl(formato)}`;
    
    // Fetch con bearer token para descarga autenticada
    fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al descargar el reporte.');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_postulantes_sire_cv.${formato}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(err.message));
  };

  if (loading && !reporte) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-600 font-medium">Cargando datos cuantitativos y métricas institucionales...</p>
      </div>
    );
  }

  const resumen = reporte?.resumen;
  const imp = impacto?.impacto;

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1000px] mx-auto">
      {/* Cabecera del Tablero */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            <Building2 size={16} />
            <span>Sustento Cuantitativo & Gobernanza — INEI</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#fff', margin: 0 }}>
            Tablero de Reportería e Impacto Ambiental
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: '600px' }}>
            Estadísticas consolidadas de la convocatoria, estado de dictámenes y estimación de ahorro ecológico y económico por digitalización.
          </p>
        </div>

        {/* Botones de Exportación */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <FileText className="w-5 h-5" />
            <span>Exportar PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Bloque 1: Tarjetas de Resumen Cuantitativo de Postulantes */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span>Resumen General de Postulantes y Expedientes</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col justify-between transition-colors hover:border-blue-400/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Postulantes</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-white">{resumen?.total_postulantes || 0}</span>
              <Users className="w-6 h-6 text-blue-400 opacity-60" />
            </div>
            <span className="text-xs text-slate-500 mt-2">Registrados con DNI</span>
          </div>

          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col justify-between transition-colors hover:border-emerald-400/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expedientes Finalizados</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-white">{resumen?.expedientes_completos || 0}</span>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-60" />
            </div>
            <span className="text-xs text-slate-500 mt-2">Foliados y firmados digitalmente</span>
          </div>

          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col justify-between transition-colors hover:border-amber-400/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendientes de Evaluar</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-amber-400">{resumen?.pendientes_evaluar || 0}</span>
              <Clock className="w-6 h-6 text-amber-400 opacity-60" />
            </div>
            <span className="text-xs text-slate-500 mt-2">En bandeja de evaluación</span>
          </div>

          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col justify-between transition-colors hover:border-emerald-400/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aptos</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-emerald-400">{resumen?.aptos || 0}</span>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-500 mt-2">Cumplen perfil Operador Tecnológico</span>
          </div>

          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col justify-between transition-colors hover:border-rose-400/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Aptos</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-rose-400">{resumen?.no_aptos || 0}</span>
              <XCircle className="w-6 h-6 text-rose-400" />
            </div>
            <span className="text-xs text-slate-500 mt-2">Incumplen rubro obligatorio</span>
          </div>
        </div>
      </div>

      {/* Bloque 2: Indicador de Almacenamiento Institucional y Seguridad Ley 29733 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-900/50 text-blue-400 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Almacenamiento Local Institucional & Cifrado AES-256</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Conforme a la <strong className="text-slate-300">Ley N.º 29733 (Ley de Protección de Datos Personales del Perú)</strong>, ningún archivo PDF cargado ni documento consolidado es transmitido a nubes públicas (AWS S3, GCP Cloud Storage, etc.). Toda la información reside cifrada en reposo exclusivamente en el disco local del servidor institucional.
            </p>
          </div>
        </div>
        <div className="bg-slate-900/50 text-slate-300 text-xs font-mono font-semibold px-4 py-2 rounded-lg border border-slate-700 shrink-0">
          AES-256-CBC | Local Disk Storage
        </div>
      </div>

      {/* Bloque 3: Argumento Cuantitativo e Impacto Ambiental para el INEI */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Leaf className="w-4 h-4" />
              <span>Argumentación Cuantitativa & Eficiencia Operativa</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Ahorro Estimado e Impacto Ecoeficiente (Justificación INEI)
            </h2>
            <p className="text-emerald-100 text-sm mt-1">
              Cálculo de reducción de huella de carbono, uso de papel y costos de traslado derivados del reemplazo de la entrega física.
            </p>
          </div>

          {/* Ajustadores de Parámetros */}
          <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-2xl space-y-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Simulación Paramétrica INEI</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-emerald-200 mb-1">Hojas / expediente:</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={hojasPorExpediente}
                  onChange={(e) => setHojasPorExpediente(Number(e.target.value))}
                  className="w-full bg-emerald-900/60 border border-emerald-600 rounded-lg px-2.5 py-1 text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-emerald-200 mb-1">Costo traslado (S/.):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={costoTraslado}
                  onChange={(e) => setCostoTraslado(Number(e.target.value))}
                  className="w-full bg-emerald-900/60 border border-emerald-600 rounded-lg px-2.5 py-1 text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas Ambientales y Económicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hojas Ahorradas */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Hojas A4 Ahorradas</span>
              <div className="p-2.5 bg-emerald-800/50 rounded-xl text-emerald-300">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div>
              <span className="text-4xl font-black text-white">{imp?.hojas_papel_ahorradas || 0}</span>
              <span className="text-xs text-emerald-200 block mt-1">Hojas de papel no impresas</span>
            </div>
          </div>

          {/* Traslados Evitados */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Traslados Evitados</span>
              <div className="p-2.5 bg-emerald-800/50 rounded-xl text-emerald-300">
                <Bus className="w-6 h-6" />
              </div>
            </div>
            <div>
              <span className="text-4xl font-black text-white">{imp?.traslados_evitados || 0}</span>
              <span className="text-xs text-emerald-200 block mt-1">Viajes físicos presenciales evitados</span>
            </div>
          </div>

          {/* Ahorro Económico */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Ahorro Económico</span>
              <div className="p-2.5 bg-emerald-800/50 rounded-xl text-emerald-300">
                <Coins className="w-6 h-6" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-amber-300">S/. {imp?.ahorro_economico_pen?.toFixed(2) || '0.00'}</span>
              <span className="text-xs text-emerald-200 block mt-1">Ahorro estimado en pasajes para postulantes</span>
            </div>
          </div>

          {/* Reducción CO2 */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Emisiones CO2 Evitadas</span>
              <div className="p-2.5 bg-emerald-800/50 rounded-xl text-emerald-300">
                <Leaf className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-emerald-300">{imp?.co2_evitado_kg || 0} kg</span>
              <span className="text-xs text-emerald-200 block mt-1">Reducción total de CO2 equivalente</span>
            </div>
          </div>
        </div>

        {/* Pie informativo para presentación */}
        <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-4 text-xs text-emerald-200 flex items-center justify-between">
          <span>* Estimación computada automáticamente sobre los expedientes finalizados en SIRE-CV.</span>
          <span className="font-semibold text-emerald-400">SIRE-CV Ecoeficiente 2026</span>
        </div>
      </div>
    </div>
  );
};
