import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Download,
  Save,
  FileCheck,

  Layers
} from 'lucide-react';
import { api, ExpedienteDetalleEvaluadorResponse } from '../services/api';

interface EvaluadorDetalleProps {
  expedienteId: number;
  onBack: () => void;
}

export const EvaluadorDetalle: React.FC<EvaluadorDetalleProps> = ({ expedienteId, onBack }) => {
  const [data, setData] = useState<ExpedienteDetalleEvaluadorResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form states for Rubros evaluation
  const [cumpleMap, setCumpleMap] = useState<Record<number, boolean>>({});
  const [obsMap, setObsMap] = useState<Record<number, string>>({});
  const [observacionGeneral, setObservacionGeneral] = useState<string>('');
  const [esObservado, setEsObservado] = useState<boolean>(false);

  const fetchDetalle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getExpedienteDetalleEvaluador(expedienteId);
      setData(res);

      // Pre-poblar estado inicial de cumple y observaciones
      const initialCumple: Record<number, boolean> = {};
      const initialObs: Record<number, string> = {};

      if (res.evaluacion && res.evaluacion.detalles) {
        res.evaluacion.detalles.forEach((d) => {
          initialCumple[d.rubro_id] = d.cumple === 1;
          initialObs[d.rubro_id] = d.observacion || '';
        });
        setObservacionGeneral(res.evaluacion.observacion_general || '');
        setEsObservado(res.evaluacion.resultado_final === 'OBSERVADO');
      } else {
        // Por defecto todos los rubros en true (Cumple)
        res.rubros.forEach((r) => {
          initialCumple[r.id] = true;
          initialObs[r.id] = '';
        });
      }

      setCumpleMap(initialCumple);
      setObsMap(initialObs);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles del expediente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
  }, [expedienteId]);

  const handleSubmitEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(null);

    const detallesPayload = data.rubros.map((r) => ({
      rubro_id: r.id,
      cumple: cumpleMap[r.id] ?? true,
      observacion: obsMap[r.id] || '',
    }));

    try {
      const res = await api.evaluarExpediente(expedienteId, {
        observacionGeneral,
        detalles: detallesPayload,
      });

      setSaveSuccess(res.message);
      // Recargar datos actualizados
      fetchDetalle();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la evaluación.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Cargando expediente #{expedienteId}...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', color: '#fca5a5' }}>
        No se pudo obtener el expediente. <button onClick={onBack}>Volver</button>
      </div>
    );
  }

  const { expediente, documentos, rubros, evaluacion } = data;
  const isEvaluado = Boolean(evaluacion);


  // Calcular pre-dictamen en vivo
  let dictamenEnVivo: 'APTO' | 'NO_APTO' | 'OBSERVADO' = 'APTO';
  
  if (esObservado) {
    dictamenEnVivo = 'OBSERVADO';
  } else {
    rubros.forEach((r) => {
      if (r.es_obligatorio === 1 && !cumpleMap[r.id]) {
        dictamenEnVivo = 'NO_APTO';
      }
    });
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            padding: '0.5rem 0.85rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver a la Bandeja</span>
        </button>

        {isEvaluado && (
          <a
            href={api.getActaPdfUrl(expedienteId)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{
              width: 'auto',
              padding: '0.5rem 1rem',
              margin: 0,
              background: 'linear-gradient(135deg, #0d9488, #059669)'
            }}
          >
            <Download size={16} />
            <span>Descargar Acta de Evaluación (.pdf)</span>
          </a>
        )}
      </div>

      {/* Postulante Summary Card */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
            Expediente: {expediente.postulante_nombres} {expediente.postulante_apellidos}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.3rem' }}>
            <span><strong>DNI:</strong> {expediente.postulante_dni}</span>
            <span>&bull;</span>
            <span><strong>Correo:</strong> {expediente.postulante_email}</span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={14} style={{ color: 'var(--primary-light)' }} />
              {expediente.total_paginas} Folios Estampados
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {expediente.pdf_consolidado_url && (
            <a
              href={expediente.pdf_consolidado_url}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: 'var(--radius-md)',
                color: '#93c5fd',
                padding: '0.6rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <FileCheck size={16} />
              <span>Ver Expediente Unificado (.pdf)</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
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

      {saveSuccess && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#86efac'
        }}>
          {saveSuccess}
        </div>
      )}

      {/* Main Grid: Documentos (Left) vs Formulario de Evaluación (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.75rem' }}>
        
        {/* LEFT: LISTA DE DOCUMENTOS CARGADOS (SLOTS A-H) */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>
            Documentos del Expediente (Slots A–H)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {documentos.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={15} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      [{doc.slot}] {doc.nombre_original}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {(doc.tamano_bytes / (1024 * 1024)).toFixed(2)} MB &bull; {new Date(doc.creado_en).toLocaleDateString()}
                  </div>
                </div>

                <a
                  href={doc.archivo_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--primary-light)',
                    textDecoration: 'none',
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    flexShrink: 0
                  }}
                >
                  <span>Abrir</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CHECKLIST DE EVALUACIÓN POR RUBRO Y DICTAMEN */}
        <div>
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', marginBottom: '0.25rem' }}>
              Formulario de Evaluación Técnica
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Valide los rubros del perfil <strong>Operador Tecnológico</strong>. Si un rubro obligatorio no cumple, el dictamen final será <strong>NO APTO</strong>.
            </p>

            <form onSubmit={handleSubmitEvaluacion}>
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: '#fef08a', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={esObservado}
                    onChange={(e) => setEsObservado(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#eab308' }}
                  />
                  Marcar expediente como OBSERVADO (Subsanación)
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Permite al postulante corregir y reenviar. Desactiva los rubros.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', opacity: esObservado ? 0.5 : 1, pointerEvents: esObservado ? 'none' : 'auto' }}>
                {rubros.map((r) => {
                  const isCumple = cumpleMap[r.id] ?? true;

                  return (
                    <div
                      key={r.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: isCumple ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
                            {r.nombre} {r.es_obligatorio === 1 && <span style={{ color: '#fca5a5' }}>*</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.descripcion}</div>
                        </div>

                        {/* Cumple / No Cumple Radio buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setCumpleMap((prev) => ({ ...prev, [r.id]: true }))}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              background: isCumple ? 'rgba(34, 197, 94, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                              color: isCumple ? '#4ade80' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Cumple</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCumpleMap((prev) => ({ ...prev, [r.id]: false }))}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              background: !isCumple ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                              color: !isCumple ? '#fca5a5' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <XCircle size={12} />
                            <span>No Cumple</span>
                          </button>
                        </div>
                      </div>

                      {/* Observación input */}
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Observaciones específicas (opcional)..."
                        value={obsMap[r.id] || ''}
                        onChange={(e) => setObsMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', marginTop: '0.4rem' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* General Observaciones */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Observaciones Generales de Evaluación</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Ingrese fundamentos adicionales o precisiones para el acta..."
                  value={observacionGeneral}
                  onChange={(e) => setObservacionGeneral(e.target.value)}
                  style={{ fontSize: '0.825rem', padding: '0.6rem' }}
                />
              </div>

              {/* Dictamen En Vivo Preview Banner */}
              <div style={{
                background: dictamenEnVivo === 'APTO' ? 'rgba(34, 197, 94, 0.15)' : dictamenEnVivo === 'OBSERVADO' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: dictamenEnVivo === 'APTO' ? '1px solid rgba(34, 197, 94, 0.3)' : dictamenEnVivo === 'OBSERVADO' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Resultado Proyectado:</span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: dictamenEnVivo === 'APTO' ? '#4ade80' : dictamenEnVivo === 'OBSERVADO' ? '#fde047' : '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  {dictamenEnVivo === 'APTO' ? <CheckCircle2 size={16} /> : dictamenEnVivo === 'OBSERVADO' ? <Layers size={16} /> : <XCircle size={16} />}
                  POSTULANTE {dictamenEnVivo}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <Save size={18} />
                <span>{saving ? 'Guardando Evaluación...' : 'Registrar Dictamen y Emitir Acta'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
