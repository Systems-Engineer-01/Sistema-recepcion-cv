import React, { useEffect, useState } from 'react';
import {
  Search,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api, ExpedienteResumenEvaluador, getToken } from '../services/api';

interface EvaluadorBandejaProps {
  onSelectExpediente: (expedienteId: number) => void;
}

export const EvaluadorBandeja: React.FC<EvaluadorBandejaProps> = ({ onSelectExpediente }) => {
  const [expedientes, setExpedientes] = useState<ExpedienteResumenEvaluador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'PENDIENTES' | 'APTO' | 'NO_APTO' | 'OBSERVADO' | 'CORREGIDO'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExpedientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExpedientesEvaluador();
      setExpedientes(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la lista de expedientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpedientes();
  }, []);

  const handleDownloadActa = async (expedienteId: number) => {
    try {
      const token = getToken();
      const url = api.getActaPdfUrl(expedienteId);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('No se pudo descargar el acta. (Error ' + res.status + ')');
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `acta_evaluacion_${expedienteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredExpedientes = expedientes.filter((exp) => {
    const matchesSearch =
      exp.postulante_dni.includes(searchTerm) ||
      `${exp.postulante_nombres} ${exp.postulante_apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'PENDIENTES') return !exp.resultado_final;
    if (filterStatus === 'APTO') return exp.resultado_final === 'APTO';
    if (filterStatus === 'NO_APTO') return exp.resultado_final === 'NO_APTO';
    if (filterStatus === 'OBSERVADO') return exp.resultado_final === 'OBSERVADO';
    if (filterStatus === 'CORREGIDO') return exp.resultado_final === 'CORREGIDO';

    return true;
  });

  const countTotal = expedientes.length;
  const countPendientes = expedientes.filter((e) => !e.resultado_final).length;
  const countAptos = expedientes.filter((e) => e.resultado_final === 'APTO').length;
  const countNoAptos = expedientes.filter((e) => e.resultado_final === 'NO_APTO').length;
  const countObservados = expedientes.filter((e) => e.resultado_final === 'OBSERVADO').length;
  const countCorregidos = expedientes.filter((e) => e.resultado_final === 'CORREGIDO').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#fff', margin: 0 }}>
            Bandeja de Evaluación de Expedientes
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Revisión técnica y dictamen del perfil de <strong>Operador Tecnológico</strong> (Concurso Magisterial 2026).
          </p>
        </div>

        <button
          onClick={fetchExpedientes}
          disabled={loading}
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Actualizar Bandeja</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div
          onClick={() => setFilterStatus('TODOS')}
          style={{
            background: filterStatus === 'TODOS' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
            border: filterStatus === 'TODOS' ? '1px solid var(--primary-light)' : '1px solid var(--border-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>RECIBIDOS Y FOLIADOS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{countTotal}</div>
        </div>

        <div
          onClick={() => setFilterStatus('PENDIENTES')}
          style={{
            background: filterStatus === 'PENDIENTES' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
            border: filterStatus === 'PENDIENTES' ? '1px solid #fbbf24' : '1px solid var(--border-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PENDIENTES DE EVALUAR</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>{countPendientes}</div>
        </div>

        <div
          onClick={() => setFilterStatus('APTO')}
          style={{
            background: filterStatus === 'APTO' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card)',
            border: filterStatus === 'APTO' ? '1px solid #4ade80' : '1px solid var(--border-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>POSTULANTES APTOS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4ade80', marginTop: '0.2rem' }}>{countAptos}</div>
        </div>

        <div
          onClick={() => setFilterStatus('NO_APTO')}
          style={{
            background: filterStatus === 'NO_APTO' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
            border: filterStatus === 'NO_APTO' ? '1px solid #fca5a5' : '1px solid var(--border-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>POSTULANTES NO APTOS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fca5a5', marginTop: '0.2rem' }}>{countNoAptos}</div>
        </div>

        <div
          onClick={() => setFilterStatus('OBSERVADO')}
          style={{
            background: filterStatus === 'OBSERVADO' ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-card)',
            border: filterStatus === 'OBSERVADO' ? '1px solid #eab308' : '1px solid var(--border-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>POSTULANTES OBSERVADOS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#eab308', marginTop: '0.2rem' }}>{countObservados}</div>
        </div>

        <div
          onClick={() => setFilterStatus('CORREGIDO')}
          style={{
            background: filterStatus === 'CORREGIDO' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-card)',
            border: filterStatus === 'CORREGIDO' ? '1px solid #a855f7' : '1px solid var(--border-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>POSTULANTES CORREGIDOS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7', marginTop: '0.2rem' }}>{countCorregidos}</div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar postulante por DNI o Nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '2.6rem' }}
        />
        <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#fca5a5'
        }}>
          {error}
        </div>
      )}

      {/* Expedientes List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Cargando expediente recibidos...
        </div>
      ) : filteredExpedientes.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <FileCheck size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No se encontraron expedientes finalizados que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Table Header (Optional, but helps with alignment if we want, or just rely on the grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(150px, 1fr) 80px 80px 110px 120px 220px',
            gap: '1rem',
            padding: '0 1.5rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>Postulante</div>
            <div>DNI</div>
            <div>Folios</div>
            <div>CVD</div>
            <div style={{ textAlign: 'center' }}>Estado</div>
            <div style={{ textAlign: 'right' }}>Acciones</div>
          </div>

          {filteredExpedientes.map((exp) => {
            const isEvaluado = Boolean(exp.resultado_final);
            const isApto = exp.resultado_final === 'APTO';
            const isObservado = exp.resultado_final === 'OBSERVADO';
            const isCorregido = exp.resultado_final === 'CORREGIDO';

            return (
              <div
                key={exp.expediente_id}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(12px)',
                  border: isEvaluado
                    ? (isApto ? '1px solid rgba(34, 197, 94, 0.3)' : isObservado ? '1px solid rgba(234, 179, 8, 0.3)' : isCorregido ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)')
                    : '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(150px, 1fr) 80px 80px 110px 120px 220px',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* 1. Postulante */}
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {exp.postulante_nombres} {exp.postulante_apellidos}
                </div>

                {/* 2. DNI */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  {exp.postulante_dni}
                </div>

                {/* 3. Folios */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  <Layers size={13} style={{ color: 'var(--primary-light)' }} />
                  {exp.total_paginas}
                </div>

                {/* 4. CVD */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.4rem', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    {exp.hash_cvd ? exp.hash_cvd.substring(0, 8).toUpperCase() + '...' : '...'}
                  </code>
                </div>

                {/* 5. Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {!isEvaluado ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '999px', width: '100%', justifyContent: 'center' }}>
                      <Clock size={12} /> PENDIENTE
                    </span>
                  ) : isApto ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', width: '100%', justifyContent: 'center' }}>
                      <CheckCircle2 size={12} /> APTO
                    </span>
                  ) : isObservado ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#fde047', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', width: '100%', justifyContent: 'center' }}>
                      <Layers size={12} /> OBSERVADO
                    </span>
                  ) : isCorregido ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', width: '100%', justifyContent: 'center' }}>
                      <RefreshCw size={12} /> CORREGIDO
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', width: '100%', justifyContent: 'center' }}>
                      <XCircle size={12} /> NO APTO
                    </span>
                  )}
                </div>

                {/* 6. Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  {isEvaluado && (
                    <button
                      onClick={() => handleDownloadActa(exp.expediente_id)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--primary-light)',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-light)';
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-card)';
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                      }}
                      title="Descargar Acta PDF"
                    >
                      <Download size={14} />
                      <span>Acta</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectExpediente(exp.expediente_id)}
                    style={{
                      minWidth: '120px',
                      justifyContent: 'center',
                      padding: '0.65rem 1rem',
                      background: 'linear-gradient(135deg, var(--primary), #1d4ed8)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <span>{isEvaluado ? 'Revisar' : 'Evaluar'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
