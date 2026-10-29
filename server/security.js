import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Encryption key resolution: environment variable or auto-generated secure secret file
const SECRET_DIR = path.join(__dirname, '..', 'data');
const SECRET_FILE = path.join(SECRET_DIR, '.encryption_secret');

function getMasterKey() {
  if (process.env.DOCUMENT_ENCRYPTION_KEY && process.env.DOCUMENT_ENCRYPTION_KEY.length >= 32) {
    return crypto.createHash('sha256').update(process.env.DOCUMENT_ENCRYPTION_KEY).digest();
  }
  if (!fs.existsSync(SECRET_DIR)) {
    fs.mkdirSync(SECRET_DIR, { recursive: true });
  }
  if (fs.existsSync(SECRET_FILE)) {
    const raw = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    if (raw.length === 64) {
      return Buffer.from(raw, 'hex');
    }
  }
  const newKey = crypto.randomBytes(32);
  fs.writeFileSync(SECRET_FILE, newKey.toString('hex'), { mode: 0o600 });
  return newKey;
}

const MASTER_KEY = getMasterKey();
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt a document buffer at rest using authenticated AES-256-GCM
 */
export function encryptDocument(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt an AES-256-GCM encrypted document buffer
 */
export function decryptDocument(encryptedBuffer, ivHex, authTagHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

/**
 * Password Hashing with Scrypt + random 32-byte salt
 */
export function hashPassword(plainTextPassword) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.scryptSync(plainTextPassword, salt, 64, {
    N: 16384,
    r: 8,
    p: 1
  }).toString('hex');
  return { salt, hash };
}

/**
 * Constant-time password verification to prevent timing attacks
 */
export function verifyPassword(plainTextPassword, salt, storedHash) {
  const testHash = crypto.scryptSync(plainTextPassword, salt, 64, {
    N: 16384,
    r: 8,
    p: 1
  }).toString('hex');

  const bufA = Buffer.from(testHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * HMAC-SHA256 signed stateless session token
 */
export function generateToken(payload, expiresInSeconds = 86400 * 7) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  
  const bufA = Buffer.from(signature);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * File signature (Magic Bytes) content validation
 * Verifies that the file content actually matches an allowed document format.
 */
export function validateFileSignature(buffer, originalMimeType) {
  if (!buffer || buffer.length < 8) {
    return { valid: false, reason: 'File is empty or too small to be a valid document.' };
  }

  // Check PDF (%PDF-)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, mimeType: 'application/pdf', ext: 'pdf' };
  }

  // Check JPEG (FF D8 FF)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mimeType: 'image/jpeg', ext: 'jpg' };
  }

  // Check PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { valid: true, mimeType: 'image/png', ext: 'png' };
  }

  // Check WebP (RIFF .... WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp', ext: 'webp' };
  }

  return {
    valid: false,
    reason: 'Unsupported or disguised file format. Only authentic PDF, JPEG, PNG, and WebP files are supported.'
  };
}

/**
 * Sliding Window In-Memory Rate Limiter
 */
const rateLimitBuckets = new Map();

export function createRateLimiter({ windowMs = 60000, maxRequests = 60, message = 'Too many requests. Please slow down.' }) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    let bucket = rateLimitBuckets.get(key);
    if (!bucket || now - bucket.startTime > windowMs) {
      bucket = { startTime: now, count: 0 };
      rateLimitBuckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((bucket.startTime + windowMs - now) / 1000)
      });
    }

    // Periodically clean stale buckets
    if (rateLimitBuckets.size > 5000) {
      for (const [k, v] of rateLimitBuckets.entries()) {
        if (now - v.startTime > windowMs) rateLimitBuckets.delete(k);
      }
    }

    next();
  };
}
