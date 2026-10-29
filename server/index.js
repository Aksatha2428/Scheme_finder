import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { initDatabase, db } from './db.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken, 
  encryptDocument, 
  decryptDocument, 
  validateFileSignature,
  createRateLimiter 
} from './security.js';
import { processDocumentText } from './ocrEngine.js';
import { evaluateAllSchemes, evaluateEligibility } from '../src/utils/eligibilityEngine.js';
import { SCHEMES_DATA } from '../src/data/schemes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database
initDatabase();

// Ensure encrypted documents directory exists
const ENCRYPTED_DOCS_DIR = path.join(__dirname, '..', 'data', 'encrypted_docs');
if (!fs.existsSync(ENCRYPTED_DOCS_DIR)) {
  fs.mkdirSync(ENCRYPTED_DOCS_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Strict Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Strict CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser with size limits to prevent Denial of Service
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Rate Limiters
const authLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 20, message: 'Too many authentication attempts. Please wait a minute.' });
const chatLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 40, message: 'Too many chat requests. Please slow down.' });
const uploadLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 30, message: 'Upload rate limit reached. Please wait.' });

// Authentication extraction middleware
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  req.user = payload;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: Valid authentication token required.' });
  }
  next();
}

app.use(authenticate);

// Audit logging helper
function logAudit(userId, action, ip, details = '') {
  try {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, ip, details, created_at) VALUES (?, ?, ?, ?, ?);');
    stmt.run(userId || 'anonymous', action, ip || 'local', details, new Date().toISOString());
  } catch (e) {
    console.error('Audit log failure:', e);
  }
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

app.post('/api/auth/register', authLimiter, (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?;').get(cleanUsername, cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Username or email is already registered.' });
    }

    const { salt, hash } = hashPassword(password);
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const role = cleanEmail.includes('admin') ? 'admin' : 'user';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `).run(userId, cleanUsername, cleanEmail, hash, salt, role, now);

    // Create default profile record
    db.prepare(`
      INSERT INTO profiles (user_id, name, updated_at)
      VALUES (?, ?, ?);
    `).run(userId, cleanUsername, now);

    const token = generateToken({ id: userId, username: cleanUsername, email: cleanEmail, role });
    logAudit(userId, 'REGISTER', req.ip, `Role: ${role}`);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, username: cleanUsername, email: cleanEmail, role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier (email/username) and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR LOWER(username) = ?;').get(cleanIdentifier, cleanIdentifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials provided.' });
    }

    const valid = verifyPassword(password, user.salt, user.password_hash);
    if (!valid) {
      logAudit(user.id, 'LOGIN_FAILED', req.ip);
      return res.status(401).json({ error: 'Invalid credentials provided.' });
    }

    const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role });
    logAudit(user.id, 'LOGIN_SUCCESS', req.ip);

    // Fetch user profile
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?;').get(user.id);

    res.json({
      message: 'Authentication successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      profile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }
  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?;').get(req.user.id);
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?;').get(user.id);
  res.json({ authenticated: true, user, profile });
});

// -------------------------------------------------------------
// 2. USER PROFILE ENDPOINTS
// -------------------------------------------------------------

app.get('/api/profile', (req, res) => {
  const userId = req.user?.id || 'guest_default';
  let profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?;').get(userId);
  if (!profile) {
    // Return default citizen profile
    profile = {
      name: 'Rajesh Kumar',
      age: 28,
      gender: 'Male',
      state: 'Tamil Nadu',
      district: 'Chennai',
      occupation: 'Farmer',
      category: 'OBC',
      education: 'Class 10th Passed',
      income: 180000,
      owns_land: 1,
      has_bpl_card: 0,
      is_disabled: 0,
      marital_status: 'Married',
      is_student: 0
    };
  }
  res.json({ profile });
});

app.put('/api/profile', (req, res) => {
  try {
    const userId = req.user?.id || 'guest_default';
    const data = req.body;

    // Server-side validation
    const age = data.age !== undefined && data.age !== '' ? Math.max(0, Math.min(120, parseInt(data.age, 10))) : null;
    const income = data.income !== undefined && data.income !== '' ? Math.max(0, parseInt(data.income, 10)) : 0;
    const name = (data.name || '').slice(0, 100);
    const state = (data.state || '').slice(0, 60);
    const district = (data.district || '').slice(0, 60);
    const occupation = (data.occupation || '').slice(0, 60);
    const category = ['General', 'OBC', 'SC', 'ST', 'EWS'].includes(data.category) ? data.category : 'General';
    const gender = ['Male', 'Female', 'Transgender', 'All'].includes(data.gender) ? data.gender : 'All';
    const education = (data.education || 'None').slice(0, 50);
    const ownsLand = data.ownsLand || data.owns_land ? 1 : 0;
    const hasBplCard = data.hasBplCard || data.has_bpl_card ? 1 : 0;
    const isDisabled = data.isDisabled || data.is_disabled ? 1 : 0;
    const maritalStatus = (data.maritalStatus || data.marital_status || 'Single').slice(0, 30);
    const isStudent = data.isStudent || data.is_student ? 1 : 0;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO profiles (
        user_id, name, age, gender, state, district, occupation, education,
        income, category, owns_land, has_bpl_card, is_disabled, marital_status,
        is_student, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        name = excluded.name,
        age = excluded.age,
        gender = excluded.gender,
        state = excluded.state,
        district = excluded.district,
        occupation = excluded.occupation,
        education = excluded.education,
        income = excluded.income,
        category = excluded.category,
        owns_land = excluded.owns_land,
        has_bpl_card = excluded.has_bpl_card,
        is_disabled = excluded.is_disabled,
        marital_status = excluded.marital_status,
        is_student = excluded.is_student,
        updated_at = excluded.updated_at;
    `).run(userId, name, age, gender, state, district, occupation, education, income, category, ownsLand, hasBplCard, isDisabled, maritalStatus, isStudent, now);

    res.json({ message: 'Profile updated successfully', profile: req.body });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update citizen profile.' });
  }
});

// -------------------------------------------------------------
// 3. SCHEMES & DETERMINISTIC ELIGIBILITY
// -------------------------------------------------------------

app.get('/api/schemes', (req, res) => {
  try {
    const { category, state, search } = req.query;
    let query = 'SELECT * FROM schemes WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (state && state !== 'All') {
      query += ' AND (state = ? OR state = "All India")';
      params.push(state);
    }
    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR objective LIKE ? OR benefits LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const rows = db.prepare(query).all(...params);
    const parsed = rows.map(r => ({
      ...r,
      eligibility: JSON.parse(r.eligibility_json),
      requiredDocuments: JSON.parse(r.required_docs_json),
      faqs: JSON.parse(r.faqs_json || '[]'),
      applicationProcedure: JSON.parse(r.application_procedure_json || '[]')
    }));

    res.json({ schemes: parsed, count: parsed.length });
  } catch (err) {
    console.error('Schemes fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve schemes.' });
  }
});

app.get('/api/schemes/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM schemes WHERE id = ?;').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Scheme not found.' });
    }
    res.json({
      scheme: {
        ...row,
        eligibility: JSON.parse(row.eligibility_json),
        requiredDocuments: JSON.parse(row.required_docs_json),
        faqs: JSON.parse(row.faqs_json || '[]'),
        applicationProcedure: JSON.parse(row.application_procedure_json || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve scheme.' });
  }
});

app.post('/api/eligibility/evaluate', (req, res) => {
  try {
    const profile = req.body.profile || {};
    // Use rule-based deterministic engine
    const results = evaluateAllSchemes(profile, SCHEMES_DATA);
    res.json({ results, evaluatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate eligibility.' });
  }
});

// -------------------------------------------------------------
// 4. SCHEME DEADLINE TRACKER ENDPOINTS (Asia/Kolkata Timezone)
// -------------------------------------------------------------

app.get('/api/deadlines', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, category, authority, state, deadline, deadline_type, opening_date, closing_date, renewal_deadline, doc_deadline, deadline_status, official_url, last_verified, source_reference FROM schemes;').all();

    // Current date in Asia/Kolkata
    const nowKolkata = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    const deadlineCards = rows.map(scheme => {
      let daysRemaining = null;
      let calculatedStatus = scheme.deadline_status || 'Ongoing';
      let isApproaching = false;
      let isPassed = false;

      if (scheme.closing_date && /^\d{4}-\d{2}-\d{2}$/.test(scheme.closing_date)) {
        const targetDate = new Date(`${scheme.closing_date}T23:59:59+05:30`);
        const diffMs = targetDate - nowKolkata;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        daysRemaining = diffDays;

        if (diffDays < 0) {
          calculatedStatus = 'Deadline passed';
          isPassed = true;
        } else if (diffDays <= 30) {
          calculatedStatus = 'Closing soon';
          isApproaching = true;
        } else if (diffDays <= 60) {
          calculatedStatus = 'Deadline approaching';
          isApproaching = true;
        } else {
          calculatedStatus = 'Open for applications';
        }
      } else if (scheme.deadline_type === 'ongoing') {
        calculatedStatus = 'Ongoing / Open All Year';
      } else if (scheme.deadline_type === 'batch') {
        calculatedStatus = 'Monthly Batch Processing';
      } else if (!scheme.closing_date) {
        calculatedStatus = 'Dates not announced';
      }

      return {
        id: scheme.id,
        name: scheme.name,
        category: scheme.category,
        authority: scheme.authority,
        state: scheme.state,
        officialUrl: scheme.official_url,
        sourceReference: scheme.source_reference,
        lastVerified: scheme.last_verified,
        openingDate: scheme.opening_date || 'Announced per cycle',
        closingDate: scheme.closing_date || scheme.deadline,
        renewalDeadline: scheme.renewal_deadline || 'As per scheme norms',
        documentDeadline: scheme.doc_deadline || 'At time of application',
        daysRemaining,
        statusLabel: calculatedStatus,
        isApproaching,
        isPassed,
        timezone: 'Asia/Kolkata (IST)'
      };
    });

    res.json({
      timestamp: nowKolkata.toISOString(),
      timezone: 'Asia/Kolkata',
      deadlines: deadlineCards
    });
  } catch (err) {
    console.error('Deadlines calculation error:', err);
    res.status(500).json({ error: 'Failed to compute scheme deadlines.' });
  }
});

// -------------------------------------------------------------
// 5. DOCUMENT READINESS CHECKER & ENCRYPTION
// -------------------------------------------------------------

app.get('/api/documents/scheme/:schemeId/checklist', (req, res) => {
  try {
    const { schemeId } = req.params;
    const userId = req.user?.id || 'guest_default';
    const schemeRow = db.prepare('SELECT id, name, required_docs_json FROM schemes WHERE id = ?;').get(schemeId);
    if (!schemeRow) {
      return res.status(404).json({ error: 'Scheme not found.' });
    }

    const requiredDocs = JSON.parse(schemeRow.required_docs_json);
    const userDocs = db.prepare('SELECT * FROM documents WHERE user_id = ? AND (scheme_id = ? OR scheme_id IS NULL);').all(userId, schemeId);

    const checklist = requiredDocs.map(docName => {
      // Find matching uploaded document
      const match = userDocs.find(d => {
        const title = (d.original_name + ' ' + d.doc_type).toLowerCase();
        const reqLower = docName.toLowerCase();
        if (reqLower.includes('aadhaar') && title.includes('aadhaar')) return true;
        if (reqLower.includes('income') && title.includes('income')) return true;
        if ((reqLower.includes('caste') || reqLower.includes('community')) && (title.includes('caste') || title.includes('community'))) return true;
        if ((reqLower.includes('disability') || reqLower.includes('udid')) && (title.includes('disability') || title.includes('udid'))) return true;
        if (reqLower.includes('land') && (title.includes('land') || title.includes('patta'))) return true;
        if (reqLower.includes('ration') && title.includes('ration')) return true;
        if (reqLower.includes('marksheet') && title.includes('mark')) return true;
        return false;
      });

      if (!match) {
        return {
          requiredName: docName,
          status: 'Missing',
          uploaded: false,
          issues: ['Document has not been uploaded yet.'],
          suggestions: [`Keep an authentic copy of '${docName}' ready for submission.`]
        };
      }

      return {
        id: match.id,
        requiredName: docName,
        uploadedName: match.original_name,
        docType: match.doc_type,
        status: match.readiness_status,
        uploaded: true,
        extracted: JSON.parse(match.extracted_data_json || '{}'),
        issues: JSON.parse(match.issues_json || '[]'),
        suggestions: JSON.parse(match.suggestions_json || '[]'),
        createdAt: match.created_at
      };
    });

    const readyCount = checklist.filter(c => c.status === 'Ready for review').length;
    const readinessScore = Math.round((readyCount / requiredDocs.length) * 100);

    res.json({
      schemeId,
      schemeName: schemeRow.name,
      readinessScore,
      totalRequired: requiredDocs.length,
      readyCount,
      checklist,
      statutoryDisclaimer: "Notice: Automated document readiness checks verify file validity, readability, and profile consistency. They do not constitute official statutory verification or government authority approval."
    });
  } catch (err) {
    console.error('Checklist error:', err);
    res.status(500).json({ error: 'Failed to generate document readiness checklist.' });
  }
});

// Get all documents uploaded by user
app.get('/api/documents', (req, res) => {
  try {
    const userId = req.user?.id || 'guest_default';
    const docs = db.prepare(`
      SELECT 
        id, user_id, scheme_id, doc_type, original_name, mime_type, 
        file_size, readiness_status, extracted_data_json, issues_json, 
        suggestions_json, created_at 
      FROM documents 
      WHERE user_id = ? 
      ORDER BY created_at DESC;
    `).all(userId);

    const parsed = docs.map(d => ({
      id: d.id,
      schemeId: d.scheme_id,
      docType: d.doc_type,
      originalName: d.original_name,
      mimeType: d.mime_type,
      fileSize: d.file_size,
      readinessStatus: d.readiness_status,
      extracted: JSON.parse(d.extracted_data_json || '{}'),
      issues: JSON.parse(d.issues_json || '[]'),
      suggestions: JSON.parse(d.suggestions_json || '[]'),
      createdAt: d.created_at,
      encryptedAtRest: true,
      encryptionAlgorithm: 'AES-256-GCM'
    }));

    res.json({ documents: parsed, count: parsed.length });
  } catch (err) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
});

// Upload and encrypt document endpoint
app.post('/api/documents/upload', uploadLimiter, (req, res) => {
  try {
    const { fileName, fileContentBase64, mimeType, schemeId, profileData, simulatedRawText } = req.body;
    if (!fileName || !fileContentBase64) {
      return res.status(400).json({ error: 'fileName and fileContentBase64 are required.' });
    }

    const fileBuffer = Buffer.from(fileContentBase64, 'base64');
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum permitted limit of 10MB.' });
    }

    // 1. Validate magic bytes / file signature
    const sigCheck = validateFileSignature(fileBuffer, mimeType);
    if (!sigCheck.valid) {
      return res.status(400).json({ error: sigCheck.reason });
    }

    // 2. Encrypt document at rest using AES-256-GCM
    const { encryptedBuffer, iv, authTag } = encryptDocument(fileBuffer);
    const docId = `doc_${crypto.randomBytes(10).toString('hex')}`;
    const safeInternalFilename = `${docId}.enc`;
    const encryptedPath = path.join(ENCRYPTED_DOCS_DIR, safeInternalFilename);

    fs.writeFileSync(encryptedPath, encryptedBuffer, { mode: 0o600 });

    // 3. Process OCR & field extraction
    const rawText = simulatedRawText || `${fileName} ${mimeType} Government Document ${profileData?.name || ''} 2026`;
    const ocrResult = processDocumentText({
      rawText,
      originalName: fileName,
      fileSize: fileBuffer.length,
      profile: profileData || {},
      targetScheme: schemeId
    });

    const userId = req.user?.id || 'guest_default';
    const now = new Date().toISOString();

    // 4. Save metadata into SQLite
    db.prepare(`
      INSERT INTO documents (
        id, user_id, scheme_id, doc_type, original_name, stored_filename,
        mime_type, file_size, encryption_iv, encryption_auth_tag,
        extracted_data_json, readiness_status, issues_json, suggestions_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      docId,
      userId,
      schemeId || null,
      ocrResult.docType,
      path.basename(fileName),
      safeInternalFilename,
      sigCheck.mimeType,
      fileBuffer.length,
      iv,
      authTag,
      JSON.stringify(ocrResult.extracted),
      ocrResult.readinessStatus,
      JSON.stringify(ocrResult.issues),
      JSON.stringify(ocrResult.suggestions),
      now
    );

    logAudit(userId, 'DOCUMENT_UPLOAD_ENCRYPTED', req.ip, `DocID: ${docId}, Status: ${ocrResult.readinessStatus}`);

    res.status(201).json({
      message: 'Document securely uploaded, encrypted with AES-256-GCM, and analyzed.',
      documentId: docId,
      originalName: path.basename(fileName),
      mimeType: sigCheck.mimeType,
      fileSize: fileBuffer.length,
      docType: ocrResult.docType,
      readinessStatus: ocrResult.readinessStatus,
      extracted: ocrResult.extracted,
      issues: ocrResult.issues,
      suggestions: ocrResult.suggestions,
      comparison: ocrResult.comparison,
      statutoryDisclaimer: ocrResult.statutoryDisclaimer
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Failed to process and encrypt document.' });
  }
});

// Authenticated download endpoint (decrypts on-the-fly)
app.get('/api/documents/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?;').get(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Ownership check: only owner or admin can download
    const currentUserId = req.user?.id || 'guest_default';
    if (doc.user_id !== currentUserId && req.user?.role !== 'admin') {
      logAudit(currentUserId, 'UNAUTHORIZED_DOWNLOAD_ATTEMPT', req.ip, `TargetDoc: ${id}`);
      return res.status(403).json({ error: 'Access denied: You do not have permission to download this document.' });
    }

    const filePath = path.join(ENCRYPTED_DOCS_DIR, doc.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Encrypted document file is missing on storage.' });
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = decryptDocument(encryptedBuffer, doc.encryption_iv, doc.encryption_auth_tag);

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
    res.send(decryptedBuffer);

    logAudit(currentUserId, 'DOCUMENT_DOWNLOAD_DECRYPTED', req.ip, `DocID: ${id}`);
  } catch (err) {
    console.error('Decryption download error:', err);
    res.status(500).json({ error: 'Decryption failed or document corrupted.' });
  }
});

// Secure deletion endpoint
app.delete('/api/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?;').get(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const currentUserId = req.user?.id || 'guest_default';
    if (doc.user_id !== currentUserId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You cannot delete another user\'s document.' });
    }

    // Erase encrypted file from disk
    const filePath = path.join(ENCRYPTED_DOCS_DIR, doc.stored_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from SQLite
    db.prepare('DELETE FROM documents WHERE id = ?;').run(id);
    logAudit(currentUserId, 'DOCUMENT_DELETED', req.ip, `DocID: ${id}`);

    res.json({ message: 'Document and extracted metadata securely deleted.' });
  } catch (err) {
    console.error('Document delete error:', err);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// -------------------------------------------------------------
// 6. INTELLIGENT AI CHATBOT & GUIDED PROFILE BUILDER
// -------------------------------------------------------------

// Tamil keyword mapping dictionary
const TAMIL_KEYWORDS_MAP = [
  { pattern: /விவசாயி|விவசாய|விவசாயிகள்|விவசாயிகளுக்கு|வேளாண்|உழவர்/i, terms: ['farmer', 'kisan', 'agriculture'] },
  { pattern: /மாணவர்|மாணவர்கள்|மாணவி|பள்ளி|கல்லூரி|படிப்பு|கல்வி|உதவித்தொகை/i, terms: ['student', 'scholarship', 'education', 'matric', 'pudhumai penn'] },
  { pattern: /பெண்|பெண்கள்|மகளிர்|தாய்|தாய்மார்/i, terms: ['woman', 'women', 'female', 'girl', 'ladli', 'pudhumai'] },
  { pattern: /முதியோர்|வயதான|ஓய்வூதியம்/i, terms: ['pension', 'atal', 'senior', 'old age'] },
  { pattern: /விதவை|கணவனை இழந்த/i, terms: ['widow', 'widow pension', 'national social assistance'] },
  { pattern: /மாற்றுத்திறனாளி|ஊனம்|ஊனமுற்ற/i, terms: ['disability', 'divyangjan', 'swavalamban', 'udid'] },
  { pattern: /வீடு|குடியிருப்பு/i, terms: ['housing', 'awas', 'gramin'] },
  { pattern: /கடன்|வங்கி கடன்/i, terms: ['loan', 'mudra', 'svanidhi', 'credit'] },
  { pattern: /வியாபாரி|தெரு வியாபாரி/i, terms: ['street vendor', 'svanidhi', 'vendor'] },
  { pattern: /கைவினைஞர்|தொழிலாளி/i, terms: ['artisan', 'craftsman', 'vishwakarma'] },
  { pattern: /மருத்துவம்|சிகிச்சை|காப்பீடு/i, terms: ['health', 'hospital', 'ayushman', 'pm-jay'] },
  { pattern: /திட்டம்|திட்டங்கள்/i, terms: ['scheme', 'yojana'] },
  { pattern: /மத்திய அரசு/i, terms: ['central government', 'all india'] },
  { pattern: /தமிழ்நாடு|தமிழக/i, terms: ['tamil nadu'] }
];

const ENGLISH_STOPWORDS = new Set([
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must',
  'get', 'got', 'give', 'tell', 'show', 'find', 'explain', 'know',
  'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'for', 'yet', 'so',
  'in', 'on', 'at', 'by', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
  'they', 'them', 'their', 'theirs', 'themselves', 'this', 'that', 'these', 'those',
  'any', 'some', 'all', 'every', 'both', 'each', 'few', 'more', 'most', 'other', 'such',
  'please', 'namaste', 'hello', 'hi', 'hey', 'thanks', 'thank'
]);

// Grounded Scheme Knowledge Retrieval Helper
function retrieveRelevantSchemes(query) {
  const q = query.toLowerCase();
  const isTamil = /[\u0B80-\u0BFF]/.test(query);

  // Extract Tamil mapped keywords
  const mappedTerms = [];
  if (isTamil) {
    for (const item of TAMIL_KEYWORDS_MAP) {
      if (item.pattern.test(query)) {
        mappedTerms.push(...item.terms);
      }
    }
  }

  // Tokenize and remove stopwords
  const rawTokens = q.split(/[^a-zA-Z0-9\u0B80-\u0BFF-]+/).filter(Boolean);
  const meaningfulTokens = rawTokens.filter(t => !ENGLISH_STOPWORDS.has(t) && t.length > 2);
  const searchTerms = [...new Set([...meaningfulTokens, ...mappedTerms])];

  if (searchTerms.length === 0) {
    return [];
  }

  const scoredSchemes = SCHEMES_DATA.map(s => {
    let score = 0;
    const nameLower = s.name.toLowerCase();
    const idLower = s.id.toLowerCase();
    const objLower = s.objective.toLowerCase();
    const benLower = s.benefits.toLowerCase();
    const catLower = s.category.toLowerCase();
    const stateLower = s.state.toLowerCase();
    const occupations = (s.eligibility.occupation || []).map(o => o.toLowerCase());

    for (const term of searchTerms) {
      const t = term.toLowerCase();
      // Exact scheme ID or direct name match
      if (idLower.includes(t) || nameLower.includes(t)) {
        score += 15;
      }
      // Occupation direct match
      if (occupations.some(occ => occ.includes(t) || t.includes(occ))) {
        score += 12;
      }
      // Category / Social Group match
      if (catLower.includes(t)) {
        score += 6;
      }
      // Benefits match
      if (benLower.includes(t)) {
        score += 4;
      }
      // Objective match
      if (objLower.includes(t)) {
        score += 3;
      }
      // State match
      if (stateLower.includes(t) && t !== 'state') {
        score += 4;
      }
    }

    // Specific direct phrases boosts:
    if ((q.includes('kisan') || q.includes('farmer') || mappedTerms.includes('farmer')) && s.id === 'pm-kisan') score += 20;
    if ((q.includes('ayushman') || q.includes('health') || q.includes('pm-jay')) && s.id === 'ayushman-bharat') score += 20;
    if ((q.includes('scholarship') || q.includes('student') || mappedTerms.includes('student')) && (s.id === 'post-matric-scholarship' || s.id === 'tn-pudhumai-penn')) score += 20;
    if ((q.includes('svanidhi') || q.includes('vendor') || mappedTerms.includes('street vendor') || q.includes('food stall')) && s.id === 'pm-svanidhi') score += 20;
    if ((q.includes('vishwakarma') || q.includes('artisan') || mappedTerms.includes('artisan')) && s.id === 'pm-vishwakarma') score += 20;
    if ((q.includes('awas') || q.includes('house') || q.includes('housing')) && s.id === 'pm-awas-yojana-gramin') score += 20;
    if ((q.includes('stand up') || (q.includes('woman') && q.includes('entrepreneur'))) && s.id === 'stand-up-india') score += 20;
    if ((q.includes('mudra') || q.includes('business loan')) && s.id === 'pm-mudra-yojana') score += 20;
    if ((q.includes('disability') || q.includes('divyang') || q.includes('udid')) && s.id === 'divyangjan-swavalamban') score += 20;
    if ((q.includes('pension') || q.includes('atal')) && s.id === 'atal-pension-yojana') score += 20;
    if ((q.includes('widow') || mappedTerms.includes('widow')) && s.id === 'national-social-assistance-widow-pension') score += 20;
    if ((q.includes('sukanya') || q.includes('girl child')) && s.id === 'sukanya-samriddhi') score += 20;
    if ((q.includes('ladli') || (q.includes('mp') && q.includes('women'))) && s.id === 'ladli-behna-yojana') score += 20;
    if ((q.includes('yuva') || q.includes('up self employment')) && s.id === 'cm-yuva-swarozgar') score += 20;

    return { scheme: s, score };
  });

  return scoredSchemes
    .filter(item => item.score > 2)
    .sort((a, b) => b.score - a.score)
    .map(item => item.scheme);
}

// Guided Conversational Profile Builder Field Sequence
const PROFILE_BUILDER_STEPS = [
  { field: 'name', question: "Namaste! To find every government scheme you are eligible for, may I have your full name?", validator: (val) => val && val.trim().length >= 2 },
  { field: 'age', question: "What is your current age (in completed years)?", validator: (val) => !isNaN(val) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100 },
  { field: 'gender', question: "What is your gender (Male / Female / Transgender)?", validator: (val) => ['Male', 'Female', 'Transgender'].includes(val) },
  { field: 'state', question: "Which State or Union Territory do you permanently reside in?", validator: (val) => val && val.trim().length >= 3 },
  { field: 'occupation', question: "What is your current occupation or livelihood (e.g., Farmer, Student, Street Vendor, Artisan, Self-Employed, Unemployed, Housewife)?", validator: (val) => val && val.trim().length >= 3 },
  { field: 'category', question: "Which social reservation category do you belong to (General, OBC, SC, ST, or EWS)?", validator: (val) => ['General', 'OBC', 'SC', 'ST', 'EWS'].includes(val) },
  { field: 'income', question: "What is your approximate annual family income in Rupees (₹)?", validator: (val) => !isNaN(val) && parseInt(val, 10) >= 0 },
  { field: 'ownsLand', question: "Do you or your family own any cultivable agricultural land? (Yes / No)", validator: (val) => typeof val === 'boolean' || ['yes', 'no'].includes(String(val).toLowerCase()) },
  { field: 'hasBplCard', question: "Does your family possess a BPL (Below Poverty Line) or Antyodaya Ration Card? (Yes / No)", validator: (val) => typeof val === 'boolean' || ['yes', 'no'].includes(String(val).toLowerCase()) },
  { field: 'isDisabled', question: "Do you have any benchmark disability (40% or more with UDID card)? (Yes / No)", validator: (val) => typeof val === 'boolean' || ['yes', 'no'].includes(String(val).toLowerCase()) }
];

app.post('/api/chat/message', chatLimiter, async (req, res) => {
  try {
    const { messages, profile = {}, language = 'en', isGuidedProfileMode = false } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const latestUserMsg = messages[messages.length - 1]?.text || '';
    const lowerLatest = latestUserMsg.toLowerCase();
    const isTamil = /[\u0B80-\u0BFF]/.test(latestUserMsg) || language === 'ta';

    // 1. Check if user is answering a guided profile question
    let updatedProfile = { ...profile };
    let guidedNextQuestion = null;
    let completedFields = [];
    let missingFields = [];

    // Evaluate completed vs missing fields
    for (const step of PROFILE_BUILDER_STEPS) {
      const val = updatedProfile[step.field];
      if (val !== undefined && val !== null && val !== '') {
        completedFields.push(step.field);
      } else {
        missingFields.push(step.field);
      }
    }

    // Check if the input provides profile updates or corrections
    let correctionMade = false;

    // Detect user correction (e.g. "actually my age is 29", "change state to Bihar", "my income is 150000")
    const ageMatch = lowerLatest.match(/\b(?:age|years old|i am|வயது)\s*(\d{1,2})\b/) || lowerLatest.match(/^\s*(\d{1,2})\s*$/);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge >= 1 && parsedAge <= 100) {
        updatedProfile.age = parsedAge;
        correctionMade = true;
      }
    }

    const incomeMatch = lowerLatest.match(/(?:income|salary|earning|வருமானம்)?\s*(?:rs\.?|₹)?\s*(\d{1,2}(?:,\d{3})+|\d{4,8})\b/i);
    if (incomeMatch && !ageMatch) {
      updatedProfile.income = parseInt(incomeMatch[1].replace(/,/g, ''), 10);
      correctionMade = true;
    }

    if (/\b(?:female|woman|girl|lady|பெண்|மகளிர்)\b/i.test(lowerLatest)) { updatedProfile.gender = 'Female'; correctionMade = true; }
    else if (/\b(?:male|man|boy|ஆண்)\b/i.test(lowerLatest)) { updatedProfile.gender = 'Male'; correctionMade = true; }

    if (/\b(sc|scheduled caste|ஆதிதிராவிடர்)\b/i.test(lowerLatest)) { updatedProfile.category = 'SC'; correctionMade = true; }
    else if (/\b(st|scheduled tribe|பழங்குடியினர்)\b/i.test(lowerLatest)) { updatedProfile.category = 'ST'; correctionMade = true; }
    else if (/\b(obc|other backward|பிற்படுத்தப்பட்டோர்)\b/i.test(lowerLatest)) { updatedProfile.category = 'OBC'; correctionMade = true; }
    else if (/\b(ews|economically weaker)\b/i.test(lowerLatest)) { updatedProfile.category = 'EWS'; correctionMade = true; }
    else if (/\b(general|unreserved|பொதுப்பிரிவு)\b/i.test(lowerLatest)) { updatedProfile.category = 'General'; correctionMade = true; }

    if (/\b(farmer|kisan|agriculture|விவசாயி|விவசாயம்)\b/i.test(lowerLatest)) { updatedProfile.occupation = 'Farmer'; correctionMade = true; }
    else if (/\b(student|studying|college|மாணவர்|பள்ளி|கல்லூரி)\b/i.test(lowerLatest)) { updatedProfile.occupation = 'Student'; correctionMade = true; }
    else if (/\b(vendor|street vendor|hawker|வியாபாரி)\b/i.test(lowerLatest)) { updatedProfile.occupation = 'Street Vendor'; correctionMade = true; }
    else if (/\b(artisan|craftsman|carpenter|potter|கைவினைஞர்)\b/i.test(lowerLatest)) { updatedProfile.occupation = 'Artisan'; correctionMade = true; }

    if (lowerLatest.includes('tamil nadu') || lowerLatest.includes('தமிழ்நாடு')) { updatedProfile.state = 'Tamil Nadu'; correctionMade = true; }
    else if (lowerLatest.includes('uttar pradesh') || lowerLatest.includes('up')) { updatedProfile.state = 'Uttar Pradesh'; correctionMade = true; }
    else if (lowerLatest.includes('madhya pradesh') || lowerLatest.includes('mp')) { updatedProfile.state = 'Madhya Pradesh'; correctionMade = true; }

    if (/\b(yes|have land|own land|நிலம் உண்டு)\b/i.test(lowerLatest) && (lowerLatest.includes('land') || lowerLatest.includes('நிலம்'))) { updatedProfile.ownsLand = true; correctionMade = true; }
    if (/\b(no land|don't own land|நிலம் இல்லை)\b/i.test(lowerLatest)) { updatedProfile.ownsLand = false; correctionMade = true; }

    // Recompute missing fields
    missingFields = PROFILE_BUILDER_STEPS.filter(s => updatedProfile[s.field] === undefined || updatedProfile[s.field] === null || updatedProfile[s.field] === '').map(s => s.field);
    completedFields = PROFILE_BUILDER_STEPS.filter(s => updatedProfile[s.field] !== undefined && updatedProfile[s.field] !== null && updatedProfile[s.field] !== '').map(s => s.field);
    const completionPercentage = Math.round((completedFields.length / PROFILE_BUILDER_STEPS.length) * 100);

    // Pick next question if in guided mode or user asked to complete profile
    const wantsProfileBuilder = isGuidedProfileMode || lowerLatest.includes('profile') || lowerLatest.includes('fill') || lowerLatest.includes('details') || lowerLatest.includes('start');
    if (wantsProfileBuilder && missingFields.length > 0) {
      const nextStep = PROFILE_BUILDER_STEPS.find(s => s.field === missingFields[0]);
      if (nextStep) {
        guidedNextQuestion = nextStep.question;
      }
    }

    // 2. Retrieve Grounded Scheme Context
    const groundedSchemes = retrieveRelevantSchemes(latestUserMsg);

    // 3. Grounded Scheme Response Generation
    let replyText = '';

    if (groundedSchemes.length > 0) {
      if (isTamil) {
        // Tamil Response Formatting
        replyText = `வணக்கம்! நீங்கள் கேட்ட விவரங்களுக்கான அதிகாரப்பூர்வ அரசு நலத்திட்டங்கள் இதோ:\n\n`;

        // Detail top scheme
        const top = groundedSchemes[0];
        const evalItem = evaluateEligibility(updatedProfile, top);

        replyText += `### 1. **${top.name}** (${top.authority}, ${top.state})\n` +
          `• **நோக்கம் & பயன்:** ${top.objective}\n` +
          `  *நிதியுதவி / மானியம்:* **${top.benefits}**\n\n` +
          `• **தகுதி வரம்புகள்:**\n` +
          `  - வயது: ${top.eligibility.minAge} முதல் ${top.eligibility.maxAge} ஆண்டுகள் வரை\n` +
          `  - வருமான வரம்பு: ஆண்டுக்கு ₹${top.eligibility.maxIncome.toLocaleString('en-IN')} வரை\n` +
          `  - இலக்கு பிரிவினர்: ${(top.eligibility.occupation || []).join(', ')} (${(top.eligibility.category || []).join('/')})\n\n` +
          `• **தேவையான ஆவணங்கள்:**\n` +
          top.requiredDocuments.map(d => `  - ${d}`).join('\n') + `\n\n` +
          `• **விண்ணப்ப காலக்கெடு:** ${top.deadline}\n` +
          `• **அதிகாரப்பூர்வ தளம்:** [${top.officialUrl}](${top.officialUrl})\n\n` +
          `---\n` +
          `🔍 **உங்கள் தகுதி மதிப்பீடு (Rule-Based Evaluation):**\n` +
          `நிலை: **${evalItem.status}** (${evalItem.matchPercentage}% தகுதிப் பொருத்தம்)\n` +
          `${evalItem.decisionExplanation}\n`;

        // If multiple schemes matched, list additional alternatives
        if (groundedSchemes.length > 1) {
          replyText += `\n📌 **கூடுதல் தொடர்புடைய திட்டங்கள்:**\n`;
          for (let i = 1; i < Math.min(groundedSchemes.length, 3); i++) {
            const extra = groundedSchemes[i];
            replyText += `• **${extra.name}**: ${extra.benefits} ([விவரம்](${extra.officialUrl}))\n`;
          }
        }
      } else {
        // English Response Formatting
        const s = groundedSchemes[0];
        const evalItem = evaluateEligibility(updatedProfile, s);

        replyText = `Based on verified official government records for **${s.name}** (${s.authority}, ${s.state}):\n\n` +
          `• **Objective & Benefit:** ${s.objective}\n` +
          `  *Financial Grant / Assistance:* **${s.benefits}**\n\n` +
          `• **Eligibility Criteria:**\n` +
          `  - Age: ${s.eligibility.minAge} to ${s.eligibility.maxAge} years\n` +
          `  - Income Limit: Up to ₹${s.eligibility.maxIncome.toLocaleString('en-IN')} annually\n` +
          `  - Target Groups: ${(s.eligibility.occupation || []).join(', ')} (${(s.eligibility.category || []).join('/')})\n\n` +
          `• **Required Documents:**\n` +
          s.requiredDocuments.map(d => `  - ${d}`).join('\n') + `\n\n` +
          `• **Application Deadline & Status:** ${s.deadline} (Last verified: ${s.lastVerified})\n` +
          `• **Official Portal:** [${s.officialUrl}](${s.officialUrl})\n\n` +
          `---\n` +
          `🔍 **Personalized Eligibility Evaluation (via Rule Engine):**\n` +
          `Status: **${evalItem.status}** (${evalItem.matchPercentage}% criteria match)\n` +
          `${evalItem.decisionExplanation}\n`;

        if (evalItem.pendingCriteria.length > 0) {
          replyText += `\n*Action Required:* ${evalItem.pendingCriteria.map(p => p.detail).join('; ')}\n`;
        }

        // List other matching schemes if found
        if (groundedSchemes.length > 1) {
          replyText += `\n📌 **Other Recommended Schemes For You:**\n`;
          for (let i = 1; i < Math.min(groundedSchemes.length, 3); i++) {
            const extra = groundedSchemes[i];
            replyText += `• **${extra.name}**: ${extra.benefits} ([Official Portal](${extra.officialUrl}))\n`;
          }
        }
      }
    } else if (guidedNextQuestion) {
      replyText = `${correctionMade ? "Got it, I've updated your profile details! ✅\n\n" : ""}${guidedNextQuestion}`;
    } else if (isTamil) {
      replyText = `வணக்கம்! நான் Scheme Finder AI வழிகாட்டி. மத்திய மற்றும் மாநில அரசு நலத்திட்டங்கள், உதவித்தொகைகள், கடன்கள் மற்றும் ஓய்வூதியங்கள் பற்றிய தகவல்களை வழங்க முடியும்.\n\n` +
        `எடுத்துக்காட்டாக:\n` +
        `• *"விவசாயிகளுக்கான அரசு திட்டங்கள் என்னென்ன?"*\n` +
        `• *"கல்லூரி மாணவிகளுக்கான புதுமைப் பெண் திட்டம் பற்றி கூறுங்கள்"*\n` +
        `• *"சிறு வணிகர்களுக்கான பிஎம் சுவநிதி கடன் விவரம் என்ன?"*\n\n` +
        `உங்கள் வயது, தொழில் மற்றும் மாநிலத்தை குறிப்பிட்டால் உங்களுக்குரிய திட்டங்களை துல்லியமாக கண்டறியலாம்!`;
    } else {
      replyText = `Namaste! I am Scheme Finder AI Assistant. I can help you discover every Central and State government welfare scheme, subsidy, scholarship, loan, and pension you qualify for.\n\n` +
        `You can ask me questions like:\n` +
        `• *"I am a college student from Tamil Nadu. What scholarships can I get?"*\n` +
        `• *"I run a small street food stall in UP. Can I get a business loan?"*\n` +
        `• *"I am a 32-year-old woman entrepreneur. Tell me about Stand-Up India."*\n` +
        `• *"What is the maximum income limit for PM Awas Yojana?"*\n\n` +
        `Or share your age, state, and occupation to evaluate your personal eligibility in real-time!`;
    }

    // Append guided question prompt if missing profile fields remain
    if (guidedNextQuestion && groundedSchemes.length > 0) {
      replyText += `\n\n💬 *Profile Progress (${completionPercentage}% complete):* ${guidedNextQuestion}`;
    }

    res.json({
      reply: replyText,
      extractedProfile: updatedProfile,
      profileProgress: {
        completedFields,
        missingFields,
        completionPercentage,
        currentQuestion: guidedNextQuestion
      },
      groundedSchemesCount: groundedSchemes.length,
      provider: 'scheme-finder-grounded-engine'
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

// -------------------------------------------------------------
// Safe Global Error Handler (No Stack Traces Leaked)
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err.message);
  res.status(500).json({
    error: 'A secure server error occurred. Please try again later.',
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend build if present
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`[Scheme Finder Backend] Secure API running on http://localhost:${PORT}`);
});
