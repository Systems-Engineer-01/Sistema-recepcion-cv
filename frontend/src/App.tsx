import React, { useEffect, useState } from 'react';
import { Auth } from './components/Auth';
import { Expediente } from './components/Expediente';
import { EvaluadorBandeja } from './components/EvaluadorBandeja';
import { EvaluadorDetalle } from './components/EvaluadorDetalle';
import { Reporteria } from './components/Reporteria';
import { AuditoriaSeguridad } from './components/AuditoriaSeguridad';
import { api, getToken, removeToken, User } from './services/api';
import { LogOut, UserCheck, Inbox, BarChart3, ShieldCheck, Info } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Evaluator Navigation State
  const [activeTab, setActiveTab] = useState<'bandeja' | 'reportes' | 'seguridad'>('bandeja');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<number | null>(null);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setSelectedExpedienteId(null);
    setActiveTab('bandeja');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.95rem'
      }}>
        Cargando sesión SIRE-CV...
      </div>
    );
  }

  const isEvaluador = user?.rol === 'EVALUADOR';

  return (
    <div className="app-container">
      {/* Banner de Entorno de Demostración INEI (NTP-ISO/IEC 27001:2022) */}
      <div className="bg-amber-500 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          ENTORNO DE DEMOSTRACIÓN Y PRUEBAS INEI &bull; SISTEMA DE GESTIÓN DE SEGURIDAD NTP-ISO/IEC 27001:2022 VIGENTE &bull; LEY N.º 29733
        </span>
      </div>

      {/* Header Bar */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand-badge">
            <div className="brand-icon">CV</div>
            <div>
              <div className="brand-title">SIRE-CV</div>
              <div className="brand-sub">Sistema Integrado de Recepción Electrónica</div>
            </div>
          </div>

          {/* Navigation Tabs for Evaluator */}
          {user && isEvaluador && (
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 p-1 rounded-xl">
              <button
                onClick={() => {
                  setSelectedExpedienteId(null);
                  setActiveTab('bandeja');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'bandeja' && !selectedExpedienteId
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Bandeja Evaluador</span>
              </button>

              <button
                onClick={() => {
                  setSelectedExpedienteId(null);
                  setActiveTab('reportes');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'reportes'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reportería & INEI</span>
              </button>

              <button
                onClick={() => {
                  setSelectedExpedienteId(null);
                  setActiveTab('seguridad');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'seguridad'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Seguridad & ISO 27001</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="header-status">
              <span className="status-dot"></span>
              <span>
                {isEvaluador ? 'Panel Evaluador — Concurso 2026' : 'Postulante — Recepción CV'}
              </span>
            </div>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {isEvaluador && <UserCheck size={14} style={{ color: '#4ade80' }} />}
                  {user.nombres} ({user.rol})
                </span>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <LogOut size={14} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {!user ? (
          <Auth onSuccess={(loggedUser) => setUser(loggedUser)} />
        ) : isEvaluador ? (
          activeTab === 'seguridad' ? (
            <AuditoriaSeguridad />
          ) : activeTab === 'reportes' ? (
            <Reporteria />
          ) : selectedExpedienteId ? (
            <EvaluadorDetalle
              expedienteId={selectedExpedienteId}
              onBack={() => setSelectedExpedienteId(null)}
            />
          ) : (
            <EvaluadorBandeja
              onSelectExpediente={(id) => setSelectedExpedienteId(id)}
            />
          )
        ) : (
          <Expediente user={user} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          SIRE-CV v0.5.0 &bull; Entorno de Pruebas INEI &bull; Seguridad NTP-ISO/IEC 27001:2022 &bull; Ley N.º 29733 (Servidor Local)
        </div>
      </footer>
    </div>
  );
};

export default App;
