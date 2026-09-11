import { db } from './backend/dist/db/database.js';

async function runTest() {
  console.log('=== TEST DE INTEGRACIÓN SEGURIDAD NTP-ISO/IEC 27001:2022 — SIRE-CV ===\n');

  const API_URL = 'http://localhost:4000';
  const testDni = '77777777';
  const testPass = 'PasswordSegura123';

  // 1. Crear o reiniciar usuario de prueba para test de bloqueo
  await new Promise((resolve) => {
    db.run(
      `INSERT INTO postulantes (dni, nombres, apellidos, email, password_hash, rol, intentos_fallidos, bloqueado_hasta)
       VALUES (?, 'Test', 'Seguridad ISO', 'test.iso@sirecv.gob.pe', 'hash_invalido', 'POSTULANTE', 0, NULL)
       ON CONFLICT(dni) DO UPDATE SET intentos_fallidos = 0, bloqueado_hasta = NULL`,
      [testDni],
      () => resolve(true)
    );
  });

  // 2. Simular 5 intentos fallidos consecutivos de contraseña
  console.log('1. Forzando 5 intentos fallidos consecutivos para DNI 77777777 (Control A.8.5 ISO 27001)...');
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0' },
      body: JSON.stringify({ dni: testDni, password: 'password_errada' }),
    });
    const data = await res.json();
    console.log(`   Intento ${i}: Status ${res.status} | ${data.error}`);
  }

  // 3. Probar 6° intento (Debe ser rechazado inmediatamente con HTTP 429 Bloqueo)
  console.log('\n2. Probando 6° intento mientras la cuenta está bloqueada:');
  const resLocked = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dni: testDni, password: 'password_errada' }),
  });
  const dataLocked = await resLocked.json();
  console.log('   6° Intento Status:', resLocked.status === 429 ? '✅ 429 Bloqueado (Éxito)' : '❌ FAIL');
  console.log('   Mensaje Bloqueo:', dataLocked.error);

  // 4. Desbloqueo manual de la cuenta
  console.log('\n3. Login Evaluador Institucional para desbloquear la cuenta...');
  const loginEval = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dni: '99999999', password: 'evaluador2026' }),
  });
  const dataEval = await loginEval.json();
  const tokenEval = dataEval.token;

  const resUnlock = await fetch(`${API_URL}/auth/desbloquear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEval}` },
    body: JSON.stringify({ dni: testDni }),
  });
  const dataUnlock = await resUnlock.json();
  console.log('   Desbloqueo:', resUnlock.ok ? '✅ OK' : '❌ FAIL', '|', dataUnlock.message);

  // 5. Probar consulta de logs de telemetría (NTP-ISO/IEC 27001:2022)
  console.log('\n4. Consultando GET /seguridad/logs con telemetría extendida:');
  const resLogs = await fetch(`${API_URL}/seguridad/logs?limit=5`, {
    headers: { Authorization: `Bearer ${tokenEval}` },
  });
  const dataLogs = await resLogs.json();
  console.log('   Status Logs:', resLogs.ok ? '✅ OK' : '❌ FAIL');
  console.log('   Total Logs en BD:', dataLogs.paginacion?.total);

  console.log('\n   Muestra de Telemetría Registrada (Último log):');
  const lastLog = dataLogs.logs[0];
  if (lastLog) {
    console.log(`   - Acción: ${lastLog.accion}`);
    console.log(`   - IP: ${lastLog.ip}`);
    console.log(`   - Sistema Operativo: ${lastLog.sistema_operativo}`);
    console.log(`   - Navegador: ${lastLog.navegador}`);
    console.log(`   - Dispositivo: ${lastLog.dispositivo}`);
    console.log(`   - Ubicación: ${lastLog.ubicacion_aproximada}`);
  }

  console.log('\n=== PRUEBAS DE SEGURIDAD NTP-ISO/IEC 27001:2022 COMPLETADAS CON ÉXITO ===');
}

runTest();
