import React, { useState } from 'react';
import { IdCard, Lock, ArrowRight, ShieldCheck, FileCheck2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`[Sprint 0 Demo] Intento de acceso registrado para DNI: ${dni || 'sin ingresar'}.\nLa autenticación completa con backend se habilitará en el Sprint 1.`);
  };

  return (
    <div className="glass-card">
      <div className="card-header">
        <h1 className="card-title">Iniciar Sesión</h1>
        <p className="card-subtitle">
          Plataforma de Recepción Electrónica de CV (SIRE-CV)
        </p>
      </div>

      <div className="process-banner">
        <FileCheck2 className="process-banner-icon" size={18} />
        <div className="process-banner-text">
          <strong>Concurso Magisterial 2026</strong>
          <div>Convocatoria para Operador Tecnológico</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="dni" className="form-label">
            <span>Número de DNI</span>
          </label>
          <div className="input-wrapper">
            <input
              id="dni"
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
          <label htmlFor="password" className="form-label">
            <span>Contraseña</span>
          </label>
          <div className="input-wrapper">
            <input
              id="password"
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

        <button type="submit" className="btn-primary">
          <span>Ingresar al Sistema</span>
          <ArrowRight size={18} />
        </button>
      </form>

      <div className="form-footer">
        ¿Aún no registrado? <a href="#registro" onClick={(e) => { e.preventDefault(); alert('Registro de postulantes habilitado en Sprint 1.'); }}>Crear cuenta con DNI</a>
      </div>

      <div className="legal-notice">
        <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
        Sistema seguro conforme al TUO de la Ley N.º 27444 y Ley N.º 29733 (Protección de Datos Personales).
      </div>
    </div>
  );
};
