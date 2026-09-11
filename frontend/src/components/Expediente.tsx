import React, { useEffect, useState } from 'react';
import {
  Upload,

  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  UserCheck,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { api, Documento, User } from '../services/api';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fetchDocumentos = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocumentos();
      const docMap: Record<string, Documento> = {};
      docs.forEach((doc) => {
        docMap[doc.slot] = doc;
      });
      setDocumentos(docMap);
    } catch (err: any) {
      setGeneralError(err.message || 'Error al cargar los documentos de su expediente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
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

  const countCargados = Object.keys(documentos).length;
  const progressPercent = Math.round((countCargados / SLOTS.length) * 100);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Profil Banner */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-teal))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.2rem',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            <UserCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              {user.nombres} {user.apellidos}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
              <span><strong>DNI:</strong> {user.dni}</span>
              <span>&bull;</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Progress gauge */}
        <div style={{
          minWidth: '220px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Avance del Expediente</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{countCargados} / {SLOTS.length} Slots</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(to right, var(--primary), var(--accent-teal))',
              transition: 'width 0.4s ease'
            }}></div>
          </div>
        </div>
      </div>

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
          onClick={fetchDocumentos}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.25rem' }}>
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
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px'
                    }}>
                      <CheckCircle2 size={12} />
                      Cargado
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
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    opacity: isUploading ? 0.7 : 1
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
    </div>
  );
};
