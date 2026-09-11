import path from 'path';
import fs from 'fs';

/**
 * Script de copia de seguridad (Backup) diario para SIRE-CV
 * Copia la carpeta de almacenamiento cifrado (STORAGE_PATH) y la base de datos SQLite (data/sire_cv.sqlite)
 * a una ubicación secundaria configurable por la variable de entorno BACKUP_PATH.
 */

function copyFolderRecursiveSync(source: string, target: string) {
  if (!fs.existsSync(source)) return;

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const srcPath = path.join(source, file);
    const tgtPath = path.join(target, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderRecursiveSync(srcPath, tgtPath);
    } else {
      fs.copyFileSync(srcPath, tgtPath);
    }
  }
}

export function runBackup(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  console.log(`[BACKUP] Iniciando proceso de copia de seguridad diario (${timestamp})...`);

  // 1. Determinar ruta de origen de almacenamiento
  const customStorage = process.env.STORAGE_PATH;
  const storageSource = customStorage
    ? (path.isAbsolute(customStorage) ? customStorage : path.resolve(process.cwd(), customStorage))
    : path.resolve(process.cwd(), 'backend/uploads');

  // 2. Ruta de la base de datos
  const dbSource = path.resolve(process.cwd(), 'backend/data/sire_cv.sqlite');

  // 3. Ruta de destino del backup
  const customBackupBase = process.env.BACKUP_PATH;
  const backupBaseDir = customBackupBase
    ? (path.isAbsolute(customBackupBase) ? customBackupBase : path.resolve(process.cwd(), customBackupBase))
    : path.resolve(process.cwd(), 'backend/backups');

  const currentBackupFolder = path.join(backupBaseDir, `backup_${timestamp.split('T')[0]}_${Date.now()}`);

  if (!fs.existsSync(currentBackupFolder)) {
    fs.mkdirSync(currentBackupFolder, { recursive: true });
  }

  // Copiar carpeta cifrada de almacenamiento
  const targetStorageDir = path.join(currentBackupFolder, 'storage_cifrado');
  if (fs.existsSync(storageSource)) {
    copyFolderRecursiveSync(storageSource, targetStorageDir);
    console.log(`[BACKUP] Almacenamiento cifrado copiado a: ${targetStorageDir}`);
  } else {
    console.warn(`[BACKUP] Advertencia: La carpeta de almacenamiento origen no existe (${storageSource}).`);
  }

  // Copiar archivo de base de datos SQLite
  if (fs.existsSync(dbSource)) {
    const targetDbPath = path.join(currentBackupFolder, 'sire_cv.sqlite');
    fs.copyFileSync(dbSource, targetDbPath);
    console.log(`[BACKUP] Base de datos SQLite copiada a: ${targetDbPath}`);
  } else {
    console.warn(`[BACKUP] Advertencia: El archivo de base de datos SQLite no existe (${dbSource}).`);
  }

  console.log(`[BACKUP] ✅ Backup completado exitosamente en: ${currentBackupFolder}`);
}

if (require.main === module) {
  runBackup();
}
