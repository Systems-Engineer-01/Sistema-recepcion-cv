import React, { useEffect, useState } from 'react';
import { Auth } from './components/Auth';
import { Expediente } from './components/Expediente';
import { EvaluadorBandeja } from './components/EvaluadorBandeja';
import { EvaluadorDetalle } from './components/EvaluadorDetalle';
import { api, getToken, removeToken, User } from './services/api';
import { LogOut, UserCheck } from 'lucide-react';


export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State for Evaluator navigation
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="header-status">
              <span className="status-dot"></span>
              <span>
                {isEvaluador ? 'Panel Evaluador — Concurso 2026' : 'Sprint 3 — Panel Evaluador & Actas'}
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
          selectedExpedienteId ? (
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
          SIRE-CV v0.3.0 &bull; Concurso de Ascenso Magisterial 2026 &bull; Operador Tecnológico
        </div>
      </footer>
    </div>
  );
};

export default App;
