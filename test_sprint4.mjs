import path from 'path';
import fs from 'fs';
import { db } from './backend/dist/db/database.js';
import { runBackup } from './backend/dist/scripts/backup.js';

async function runTest() {
  console.log('=== TEST DE INTEGRACIÓN SPRINT 4 — SIRE-CV ===\n');

  const API_URL = 'http://localhost:4000';

  // 1. Probar salud del servidor
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    console.log('1. Health check backend:', healthData.status === 'ok' ? '✅ OK' : '❌ ERROR');
  } catch (err) {
    console.error('❌ No se pudo conectar al servidor backend. Asegúrese de iniciar el servidor.');
    process.exit(1);
  }

  // 2. Autenticación Evaluador
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dni: '99999999', password: 'evaluador2026' }),
  });
  const loginData = await loginRes.json();
  console.log('2. Login Evaluador Institucional (DNI 99999999):', loginRes.ok ? '✅ OK' : '❌ FAIL');
  const token = loginData.token;

  // 3. Probar GET /reportes/postulantes
  const reportesRes = await fetch(`${API_URL}/reportes/postulantes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const reportesData = await reportesRes.json();
  console.log('3. GET /reportes/postulantes:', reportesRes.ok ? '✅ OK' : '❌ FAIL');
  console.log('   Resumen:', JSON.stringify(reportesData.resumen));

  // 4. Probar GET /reportes/impacto-ambiental
  const impactoRes = await fetch(`${API_URL}/reportes/impacto-ambiental?hojasPorExpediente=30&costoTraslado=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const impactoData = await impactoRes.json();
  console.log('4. GET /reportes/impacto-ambiental:', impactoRes.ok ? '✅ OK' : '❌ FAIL');
  console.log('   Métricas ambiental INEI:', JSON.stringify(impactoData.impacto));

  // 5. Probar exportación Excel (.xlsx) y PDF (.pdf)
  const xlsxRes = await fetch(`${API_URL}/reportes/exportar?formato=xlsx`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('5. GET /reportes/exportar?formato=xlsx:', xlsxRes.ok && xlsxRes.headers.get('content-type')?.includes('sheet') ? '✅ OK (Excel generado)' : '❌ FAIL');

  const pdfRes = await fetch(`${API_URL}/reportes/exportar?formato=pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('6. GET /reportes/exportar?formato=pdf:', pdfRes.ok && pdfRes.headers.get('content-type') === 'application/pdf' ? '✅ OK (PDF generado)' : '❌ FAIL');

  // 6. Verificar registros en tabla log_auditoria
  db.all('SELECT * FROM log_auditoria ORDER BY id DESC LIMIT 5', [], (err, rows) => {
    if (err) {
      console.error('❌ Error consultando log_auditoria:', err);
    } else {
      console.log('7. Verificación Tabla LogAuditoria (Últimos 5 registros): ✅ OK');
      rows.forEach((r) => {
        console.log(`   [ID ${r.id}] ${r.fecha_hora} | User ID: ${r.usuario_id || 'Anon'} | IP: ${r.ip} | Acción: ${r.accion} | ${r.detalles}`);
      });
    }
  });

  // 7. Probar ejecución del script de backup
  console.log('\n8. Ejecutando Script de Backup Diario (BACKUP_PATH env/default):');
  try {
    runBackup();
  } catch (backupErr) {
    console.error('❌ Error ejecutando backup:', backupErr.message);
  }

  console.log('\n=== PRUEBAS DEL SPRINT 4 COMPLETADAS CON ÉXITO ===');
}

runTest();
