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
import { api, ExpedienteResumenEvaluador } from '../services/api';

interface EvaluadorBandejaProps {
  onSelectExpediente: (expedienteId: number) => void;
}

export const EvaluadorBandeja: React.FC<EvaluadorBandejaProps> = ({ onSelectExpediente }) => {
  const [expedientes, setExpedientes] = useState<ExpedienteResumenEvaluador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'PENDIENTES' | 'APTO' | 'NO_APTO'>('TODOS');

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

  const filteredExpedientes = expedientes.filter((exp) => {
    const matchesSearch =
      exp.postulante_dni.includes(searchTerm) ||
      `${exp.postulante_nombres} ${exp.postulante_apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'PENDIENTES') return !exp.resultado_final;
    if (filterStatus === 'APTO') return exp.resultado_final === 'APTO';
    if (filterStatus === 'NO_APTO') return exp.resultado_final === 'NO_APTO';

    return true;
  });

  const countTotal = expedientes.length;
  const countPendientes = expedientes.filter((e) => !e.resultado_final).length;
  const countAptos = expedientes.filter((e) => e.resultado_final === 'APTO').length;
  const countNoAptos = expedientes.filter((e) => e.resultado_final === 'NO_APTO').length;

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
        <Search className="input-icon" size={18} />
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
          {filteredExpedientes.map((exp) => {
            const isEvaluado = Boolean(exp.resultado_final);
            const isApto = exp.resultado_final === 'APTO';

            return (
              <div
                key={exp.expediente_id}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(12px)',
                  border: isEvaluado
                    ? (isApto ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)')
                    : '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                      {exp.postulante_nombres} {exp.postulante_apellidos}
                    </span>

                    {/* Status Badge */}
                    {!isEvaluado ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px'
                      }}>
                        <Clock size={12} />
                        Pendiente de Evaluar
                      </span>
                    ) : isApto ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#4ade80',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px'
                      }}>
                        <CheckCircle2 size={12} />
                        APTO
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px'
                      }}>
                        <XCircle size={12} />
                        NO APTO
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.3rem' }}>
                    <span><strong>DNI:</strong> {exp.postulante_dni}</span>
                    <span>&bull;</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Layers size={13} style={{ color: 'var(--primary-light)' }} />
                      {exp.total_paginas} Folios
                    </span>
                    <span>&bull;</span>
                    <span><strong>CVD:</strong> <code>{exp.hash_cvd?.substring(0, 12).toUpperCase()}...</code></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isEvaluado && (
                    <a
                      href={api.getActaPdfUrl(exp.expediente_id)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--primary-light)',
                        padding: '0.6rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Download size={14} />
                      <span>Acta PDF</span>
                    </a>
                  )}

                  <button
                    onClick={() => onSelectExpediente(exp.expediente_id)}
                    style={{
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
                    <span>{isEvaluado ? 'Ver / Re-evaluar' : 'Evaluar Expediente'}</span>
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
