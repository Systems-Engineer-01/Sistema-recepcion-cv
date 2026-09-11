import crypto from 'crypto';

const DEFAULT_KEY_SECRET = 'sire_cv_secret_encryption_key_2026_institutional_inei';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || DEFAULT_KEY_SECRET;
  return crypto.createHash('sha256').update(secret).digest(); // Retorna 32 bytes
}

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const MAGIC_HEADER = Buffer.from('SIRECV_ENC_V1:');

/**
 * Cifra un buffer (PDF) usando AES-256-CBC y le añade la cabecera mágica e IV.
 */
export function encryptBuffer(buffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([MAGIC_HEADER, iv, encrypted]);
}

/**
 * Descifra un buffer si contiene la cabecera cifrada. Si es un archivo legado plano, lo devuelve intacto.
 */
export function decryptBuffer(buffer: Buffer): Buffer {
  if (
    buffer.length < MAGIC_HEADER.length + IV_LENGTH ||
    !buffer.subarray(0, MAGIC_HEADER.length).equals(MAGIC_HEADER)
  ) {
    return buffer;
  }

  const key = getEncryptionKey();
  const iv = buffer.subarray(MAGIC_HEADER.length, MAGIC_HEADER.length + IV_LENGTH);
  const encryptedData = buffer.subarray(MAGIC_HEADER.length + IV_LENGTH);

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  } catch (err) {
    console.error('[Error Descifrado] No se pudo descifrar el archivo. Clave incorrecta o corrupto:', err);
    throw new Error('Error al descifrar el archivo almacenado.');
  }
}

/**
 * Retorna true si el buffer está cifrado con la firma de SIRE-CV.
 */
export function isEncrypted(buffer: Buffer): boolean {
  return buffer.length >= MAGIC_HEADER.length && buffer.subarray(0, MAGIC_HEADER.length).equals(MAGIC_HEADER);
}
