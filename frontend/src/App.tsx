import React from 'react';
import { Login } from './components/Login';


export const App: React.FC = () => {
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
          <div className="header-status">
            <span className="status-dot"></span>
            <span>Sprint 0 — Servidor Activo</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <Login />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          SIRE-CV v0.1.0 &bull; Piloto Operador Tecnológico &bull; 2026
        </div>
      </footer>
    </div>
  );
};

export default App;
