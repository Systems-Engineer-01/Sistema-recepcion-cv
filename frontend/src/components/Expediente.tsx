import React, { useEffect, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  UserCheck,
  FileCheck,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
  Download,
  Lock,
  Sparkles,
  Layers,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { api, Documento, ExpedienteStatus, User } from '../services/api';

interface ExpedienteProps {
  user: User;
}

interface SlotDefinition {
  code: string;
  key: string;
  title: string;
  description: string;
}

const SLOTS: SlotDefinition[] = [
  { code: 'A', key: 'FICHA_INSCRIPCION', title: 'Ficha de Inscripción', description: 'Formulario oficial de inscripción del postulante al concurso.' },
  { code: 'B', key: 'DECLARACION_JURADA', title: 'Declaración Jurada', description: 'Declaración jurada suscrita según art. 49 del TUO Ley 27444.' },
  { code: 'C', key: 'DNI', title: 'Documento Nacional de Identidad', description: 'Copia legible del DNI vigente por ambas caras.' },
  { code: 'D', key: 'HOJA_VIDA', title: 'Hoja de Vida / CV', description: 'Curriculum Vitae documentado en orden cronológico.' },
  { code: 'E', key: 'GRADO_TITULO', title: 'Grado Académico / Título', description: 'Título profesional o grado universitario/técnico equivalente.' },
  { code: 'F', key: 'CONSTANCIA_TRABAJO', title: 'Constancias de Experiencia', description: 'Certificados de trabajo o constancias de desempeño profesional.' },
  { code: 'G', key: 'FICHA_SUNEDU', title: 'Ficha SUNEDU / Registro', description: 'Constancia de inscripción de título en SUNEDU o Colegio Profesional.' },
  { code: 'H', key: 'OTROS', title: 'Otros Documentos', description: 'Documentación complementaria solicitada en las bases.' },
];

export const Expediente: React.FC<ExpedienteProps> = ({ user }) => {
  const [documentos, setDocumentos] = useState<Record<string, Documento>>({});
  const [expedienteStatus, setExpedienteStatus] = useState<ExpedienteStatus | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Declaración Jurada form state
  const [declaracionChecked, setDeclaracionChecked] = useState<boolean>(false);
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [finalizationSuccessMessage, setFinalizationSuccessMessage] = useState<string | null>(null);

  const fetchExpedienteData = async () => {
    setLoading(true);
    try {
      const [docs, status] = await Promise.all([
        api.getDocumentos(),
        api.getExpedienteStatus(),
      ]);

      const docMap: Record<string, Documento> = {};
      docs.forEach((doc) => {
        docMap[doc.slot] = doc;
      });
      setDocumentos(docMap);
      setExpedienteStatus(status);

      if (status.declaracion_aceptada === 1) {
        setDeclaracionChecked(true);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Error al cargar los documentos de su expediente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpedienteData();
  }, []);

  const handleFileUpload = async (slotKey: string, file: File) => {
    setSlotErrors((prev) => ({ ...prev, [slotKey]: '' }));

    if (file.type !== 'application/pdf') {
      setSlotErrors((prev) => ({ ...prev, [slotKey]: 'Rechazado: El archivo debe ser únicamente un PDF (.pdf).' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSlotErrors((prev) => ({ ...prev, [slotKey]: 'Rechazado: El archivo supera el tamaño máximo permitido de 10MB.' }));
      return;
    }

    setUploadingSlot(slotKey);

    try {
      const res = await api.uploadDocumento(slotKey, file);
      setDocumentos((prev) => ({
        ...prev,
        [slotKey]: res.documento,
      }));
    } catch (err: any) {
      setSlotErrors((prev) => ({
        ...prev,
        [slotKey]: err.message || 'Error al subir el documento. Verifique que sea PDF vertical A4.',
      }));
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleFinalizarExpediente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFinalizationSuccessMessage(null);

    if (!declaracionChecked) {
      setGeneralError('Debe marcar obligatoriamente el checkbox de la Declaración Jurada Digital (Art. 49 TUO Ley 27444).');
      return;
    }

    const loadedCount = Object.keys(documentos).length;
    if (loadedCount === 0) {
      setGeneralError('Debe subir al menos un documento del checklist antes de finalizar y foliar su expediente.');
      return;
    }

    setFinalizing(true);

    try {
      const res = await api.finalizarExpediente(declaracionChecked);
      setExpedienteStatus(res.expediente);
      setFinalizationSuccessMessage(res.message || 'Expediente foliado y firmado digitalmente con éxito.');
    } catch (err: any) {
      setGeneralError(err.message || 'Error al procesar la consolidación y foliado del expediente.');
    } finally {
      setFinalizing(false);
    }
  };

  const countCargados = Object.keys(documentos).length;
  const isFinalizado = expedienteStatus?.estado === 'FINALIZADO';
  const isCorregido = expedienteStatus?.resultado_final === 'CORREGIDO';
  const isObservado = expedienteStatus?.estado === 'OBSERVADO' && !isCorregido;


  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
      {/* Profile & Status Header */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: isFinalizado ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        boxShadow: isFinalizado ? '0 0 30px rgba(20, 184, 166, 0.15)' : 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isFinalizado
              ? 'linear-gradient(135deg, #059669, #0d9488)'
              : 'linear-gradient(135deg, var(--primary), var(--accent-teal))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.2rem',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
          }}>
            <UserCheck size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              {user.nombres} {user.apellidos}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
              <span><strong>DNI:</strong> {user.dni}</span>
              <span>&bull;</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.3rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado del Expediente</span>
          {isFinalizado && expedienteStatus?.resultado_final === 'APTO' ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#4ade80',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <CheckCircle size={16} />
              POSTULANTE APTO
            </span>
          ) : isFinalizado && expedienteStatus?.resultado_final === 'NO_APTO' ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <XCircle size={16} />
              POSTULANTE NO APTO
            </span>
          ) : isFinalizado ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <Sparkles size={16} />
              FINALIZADO Y FOLIADO
            </span>
          ) : isObservado ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#fde047',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <AlertCircle size={16} />
              OBSERVADO (Subsanación)
            </span>
          ) : isCorregido ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#c084fc',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <RefreshCw size={16} />
              CORREGIDO
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <Clock size={16} />
              EN PROCESO ({countCargados}/8 Slots)
            </span>
          )}
        </div>
      </div>

      {/* SUCCESS CERTIFICATE BANNER (POST-FINALIZACIÓN) */}
      {isFinalizado && expedienteStatus && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(30, 41, 59, 0.8))',
          border: '1px solid rgba(45, 212, 191, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(13, 148, 136, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2dd4bf', fontWeight: 700, fontSize: '1.15rem' }}>
                <ShieldCheck size={24} />
                <span>Certificado de Verificación Digital (CVD) Generado</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                Su expediente ha sido foliado automáticamente conforme al numeral 6.3 del comunicado oficial y cuenta con validez legal digital.
              </p>
            </div>

            {expedienteStatus.pdf_consolidado_url && (
              <a
                href={expedienteStatus.pdf_consolidado_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.25rem',
                  background: 'linear-gradient(135deg, #0d9488, #059669)',
                  boxShadow: '0 4px 15px rgba(13, 148, 136, 0.4)',
                  margin: 0
                }}
              >
                <Download size={18} />
                <span>Descargar Expediente Consolidado (.pdf)</span>
              </a>
            )}
          </div>

          {/* Audit Metadata Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>CÓDIGO DE VERIFICACIÓN (CVD)</div>
              <div style={{ fontSize: '0.9rem', color: '#5eead4', fontWeight: 700, fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {expedienteStatus.hash_cvd?.substring(0, 18).toUpperCase()}...
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>TOTAL DE FOLIOS ESTAMPADOS</div>
              <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} style={{ color: '#2dd4bf' }} />
                <span>{expedienteStatus.total_paginas} Hojas (Folio 1 al {expedienteStatus.total_paginas})</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>AUDITORÍA DE DECLARACIÓN JURADA</div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                <strong>IP:</strong> {expedienteStatus.declaracion_ip || 'Localhost'}<br />
                <strong>Fecha:</strong> {expedienteStatus.declaracion_fecha ? new Date(expedienteStatus.declaracion_fecha).toLocaleString() : 'Reciente'}
              </div>
            </div>
          </div>
        </div>
      )}

      {generalError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#fca5a5',
          fontSize: '0.9rem'
        }}>
          {generalError}
        </div>
      )}

      {finalizationSuccessMessage && !isFinalizado && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#86efac',
          fontSize: '0.9rem'
        }}>
          {finalizationSuccessMessage}
        </div>
      )}

      {/* OBSERVADO BANNER */}
      {isObservado && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(234, 179, 8, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fde047', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            <AlertCircle size={24} />
            <span>Expediente Observado - Subsanación Requerida</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#fef08a', marginBottom: '1rem', lineHeight: '1.5' }}>
            El comité evaluador ha revisado su expediente y ha determinado que requiere subsanación. Por favor, actualice los documentos indicados y vuelva a enviar su expediente.
          </p>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600, marginBottom: '0.4rem' }}>MOTIVO DE LA OBSERVACIÓN:</div>
            <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {expedienteStatus?.observacion_general || 'No se proporcionaron detalles generales.'}
            </div>

            {expedienteStatus?.detalles?.some(d => !d.cumple) && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>Documentos que requieren corrección o están observados:</div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  {expedienteStatus.detalles.filter(d => !d.cumple).map((det, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#fef08a' }}>{det.criterio} (Anexo {det.slot_requerido}):</strong>
                      <span style={{ display: 'block', color: '#fca5a5', marginTop: '0.2rem' }}>{det.observacion ? `- ${det.observacion}` : '- No cumple con los requisitos mínimos.'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APTO BANNER */}
      {isFinalizado && expedienteStatus?.resultado_final === 'APTO' && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={24} />
            <span>Resultado de Evaluación: POSTULANTE APTO</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#86efac', margin: 0, lineHeight: '1.5' }}>
            ¡Felicitaciones! Su expediente cumple con todos los requisitos del perfil de Operador Tecnológico y ha sido declarado APTO.
          </p>
          {expedienteStatus.observacion_general && (
            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, marginBottom: '0.4rem' }}>OBSERVACIONES DEL COMITÉ:</div>
              <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {expedienteStatus.observacion_general}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NO APTO BANNER */}
      {isFinalizado && expedienteStatus?.resultado_final === 'NO_APTO' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            <XCircle size={24} />
            <span>Resultado de Evaluación: POSTULANTE NO APTO</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '1rem', lineHeight: '1.5' }}>
            El comité evaluador ha revisado su expediente y ha determinado que no cumple con los requisitos mínimos del perfil de Operador Tecnológico.
          </p>
          {(expedienteStatus.observacion_general || expedienteStatus?.detalles?.some(d => !d.cumple)) && (
            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {expedienteStatus.observacion_general && (
                <>
                  <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, marginBottom: '0.4rem' }}>MOTIVO DEL RECHAZO:</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {expedienteStatus.observacion_general}
                  </div>
                </>
              )}

              {expedienteStatus?.detalles?.some(d => !d.cumple) && (
                <div style={{ marginTop: expedienteStatus.observacion_general ? '1rem' : '0', borderTop: expedienteStatus.observacion_general ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingTop: expedienteStatus.observacion_general ? '1rem' : '0' }}>
                  <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>Criterios no cumplidos (Documentos rechazados):</div>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    {expedienteStatus.detalles.filter(d => !d.cumple).map((det, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fca5a5' }}>{det.criterio} (Anexo {det.slot_requerido}):</strong>
                        <span style={{ display: 'block', color: '#f87171', marginTop: '0.2rem' }}>{det.observacion ? `- ${det.observacion}` : '- No cumple con los requisitos mínimos.'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', margin: 0 }}>
            Checklist de Carga Documental (A–H)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Suba cada documento en formato <strong>PDF vertical A4</strong> (máx. 10MB por archivo).
          </p>
        </div>
        <button
          onClick={fetchExpedienteData}
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
          <span>Actualizar</span>
        </button>
      </div>

      {/* Grid of Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {SLOTS.map((slot) => {
          const doc = documentos[slot.key];
          const isUploaded = Boolean(doc);
          const isUploading = uploadingSlot === slot.key;
          const slotError = slotErrors[slot.key];

          return (
            <div
              key={slot.key}
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: isUploaded
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: isUploaded ? '0 4px 20px rgba(34, 197, 94, 0.08)' : 'none'
              }}
            >
              <div>
                {/* Header of Slot Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      background: isUploaded ? 'rgba(34, 197, 94, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                      color: isUploaded ? '#4ade80' : 'var(--primary-light)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {slot.code}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                      {slot.title}
                    </h3>
                  </div>

                  {/* Badge */}
                  {isUploaded ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: slotError ? 'rgba(168, 85, 247, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      border: slotError ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                      color: slotError ? '#c084fc' : '#4ade80',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px'
                    }}>
                      <CheckCircle2 size={12} />
                      {slotError ? 'Corregido' : 'Cargado'}
                    </span>
                  ) : (
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
                      Pendiente
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {slot.description}
                </p>

                {/* Document Details if uploaded */}
                {isUploaded && doc && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.3rem' }}>
                      <FileCheck size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#4ade80' }} />
                      {doc.nombre_original}
                    </div>
                    <div style={{ color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tamaño: {formatBytes(doc.tamano_bytes)}</span>
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary-light)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <span>Ver PDF</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {slotError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.8rem',
                    marginBottom: '1rem',
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{slotError}</span>
                  </div>
                )}
              </div>

              {/* Action Button & Hidden Input */}
              <div>
                <input
                  type="file"
                  id={`file-input-${slot.key}`}
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  disabled={isFinalizado}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(slot.key, file);
                    }
                    e.target.value = '';
                  }}
                />

                <label
                  htmlFor={`file-input-${slot.key}`}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: isUploaded ? 'rgba(30, 41, 59, 0.8)' : 'linear-gradient(135deg, var(--primary), #1d4ed8)',
                    border: isUploaded ? '1px solid var(--border-card)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: (isUploading || isFinalizado) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    opacity: (isUploading || isFinalizado) ? 0.7 : 1
                  }}
                >
                  <Upload size={14} />
                  <span>
                    {isUploading
                      ? 'Validando y Subiendo...'
                      : isUploaded
                      ? 'Reemplazar Documento PDF'
                      : 'Subir Documento (PDF A4)'}
                  </span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECCIÓN DECLARACIÓN JURADA DIGITAL (ART. 49 TUO LEY 27444) & FOLIADO */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '3rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <FileSpreadsheet className="process-banner-icon" size={24} style={{ color: 'var(--primary-light)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#fff', margin: 0 }}>
            Declaración Jurada Digital y Foliado Electrónico
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
          Al presionar el botón de finalización, el sistema unificará todos los archivos cargados, calculará el total de folios $N$, y estampará un <strong>Código de Verificación Digital (CVD - SHA256)</strong> con foliado automático <code>Folio k/N</code> en el pie de página de cada hoja.
        </p>

        <form onSubmit={handleFinalizarExpediente}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={declaracionChecked}
                onChange={(e) => setDeclaracionChecked(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                <strong>DECLARACIÓN JURADA (Art. 49 TUO de la Ley N.º 27444):</strong> Declaro bajo juramento que toda la información contenida en el presente expediente es verídica, los documentos adjuntos son copia fiel de los originales y cumplo con los requisitos exigidos en las bases de la convocatoria, sujetándome a las sanciones administrativas, civiles y penales correspondientes en caso de falsedad.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={finalizing || !declaracionChecked || countCargados === 0}
            style={{
              padding: '1rem',
              fontSize: '1rem',
              background: isFinalizado
                ? 'linear-gradient(135deg, #0d9488, #059669)'
                : 'linear-gradient(135deg, var(--primary), #1d4ed8)',
              opacity: (!declaracionChecked || countCargados === 0 || finalizing) ? 0.6 : 1,
              cursor: (!declaracionChecked || countCargados === 0 || finalizing) ? 'not-allowed' : 'pointer'
            }}
          >
            {finalizing ? (
              <span>Unificando PDF, calculando Hash CVD y Foliando...</span>
            ) : isFinalizado ? (
              <>
                <RefreshCw size={18} />
                <span>Volver a Consolidar y Re-Foliar Expediente</span>
              </>
            ) : isObservado ? (
              <>
                <Upload size={18} />
                <span>Volver a Enviar Expediente (Subsanación)</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span>Finalizar y Foliar Expediente Digital</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
