import React, { useState } from 'react';
import { IdCard, Lock, User as UserIcon, Mail, ArrowRight, ShieldCheck, FileCheck2, UserPlus, LogIn, UserCheck } from 'lucide-react';
import { api, setToken, User } from '../services/api';

interface AuthProps {
  onSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'registro'>('login');

  // Form states
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(dni, password);
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (dni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.registro({ dni, nombres, apellidos, email, password });
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el postulante.');
    } finally {
      setLoading(false);
    }
  };

  const fillEvaluadorDemo = () => {
    setActiveTab('login');
    setDni('99999999');
    setPassword('evaluador2026');
  };

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="card-header">
        <h1 className="card-title">Portal de Acceso</h1>
        <p className="card-subtitle">
          Sistema Integrado de Recepción Electrónica (SIRE-CV)
        </p>
      </div>

      <div className="process-banner">
        <FileCheck2 className="process-banner-icon" size={18} />
        <div className="process-banner-text">
          <strong>Concurso Magisterial 2026</strong>
          <div>Convocatoria: Operador Tecnológico</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '0.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--input-border)'
      }}>
        <button
          type="button"
          onClick={() => { setActiveTab('login'); setError(null); }}
          style={{
            flex: 1,
            padding: '0.6rem',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'login' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'login' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
        >
          <LogIn size={16} />
          <span>Iniciar Sesión</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('registro'); setError(null); }}
          style={{
            flex: 1,
            padding: '0.6rem',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'registro' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'registro' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
        >
          <UserPlus size={16} />
          <span>Registro Postulante</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.825rem',
          color: '#fca5a5',
          lineHeight: '1.4'
        }}>
          {error}
        </div>
      )}

      {activeTab === 'login' ? (
        /* LOGIN FORM */
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-dni" className="form-label">
              <span>Número de DNI</span>
            </label>
            <div className="input-wrapper">
              <input
                id="login-dni"
                type="text"
                className="form-input"
                placeholder="Ingrese sus 8 dígitos de DNI"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="username"
              />
              <IdCard className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              <span>Contraseña</span>
            </label>
            <div className="input-wrapper">
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <span>{loading ? 'Verificando...' : 'Ingresar al Sistema'}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        /* REGISTRO FORM */
        <form onSubmit={handleRegistro}>
          <div className="form-group">
            <label htmlFor="reg-dni" className="form-label">
              <span>Número de DNI</span>
            </label>
            <div className="input-wrapper">
              <input
                id="reg-dni"
                type="text"
                className="form-input"
                placeholder="8 dígitos numéricos"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                required
              />
              <IdCard className="input-icon" size={18} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="reg-nombres" className="form-label">
                <span>Nombres</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="reg-nombres"
                  type="text"
                  className="form-input"
                  placeholder="Nombres completos"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                />
                <UserIcon className="input-icon" size={18} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-apellidos" className="form-label">
                <span>Apellidos</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="reg-apellidos"
                  type="text"
                  className="form-input"
                  placeholder="Apellidos completos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
                <UserIcon className="input-icon" size={18} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">
              <span>Correo Electrónico</span>
            </label>
            <div className="input-wrapper">
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              <span>Contraseña</span>
            </label>
            <div className="input-wrapper">
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="Cree una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <span>{loading ? 'Registrando...' : 'Crear Cuenta e Ingresar'}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      )}

      {/* Acceso directo Evaluador */}
      <div style={{
        marginTop: '1.25rem',
        paddingTop: '1rem',
        borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <button
          type="button"
          onClick={fillEvaluadorDemo}
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            padding: '0.4rem 0.75rem',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <UserCheck size={14} style={{ color: 'var(--primary-light)' }} />
          <span>Acceso Evaluador (DNI: 99999999)</span>
        </button>
      </div>

      <div className="legal-notice">
        <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
        Sistema seguro conforme al TUO de la Ley N.º 27444 y Ley N.º 29733.
      </div>
    </div>
  );
};
