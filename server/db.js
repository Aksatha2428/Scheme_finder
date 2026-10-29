import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'schemefinder.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance and durability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      age INTEGER,
      dob TEXT,
      gender TEXT NOT NULL DEFAULT 'All',
      state TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
      residence_type TEXT NOT NULL DEFAULT 'Both',
      occupation TEXT NOT NULL DEFAULT '',
      education TEXT NOT NULL DEFAULT 'None',
      income INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'General',
      owns_land INTEGER NOT NULL DEFAULT 0,
      has_bpl_card INTEGER NOT NULL DEFAULT 0,
      is_disabled INTEGER NOT NULL DEFAULT 0,
      marital_status TEXT NOT NULL DEFAULT 'Single',
      is_student INTEGER NOT NULL DEFAULT 0,
      mobile_number TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      authority TEXT NOT NULL,
      ministry TEXT,
      state TEXT NOT NULL,
      objective TEXT NOT NULL,
      benefits TEXT NOT NULL,
      benefit_type TEXT NOT NULL,
      eligibility_json TEXT NOT NULL,
      required_docs_json TEXT NOT NULL,
      official_url TEXT NOT NULL,
      source_reference TEXT NOT NULL,
      last_verified TEXT NOT NULL,
      deadline TEXT NOT NULL,
      deadline_type TEXT NOT NULL, -- 'ongoing' | 'fixed_date' | 'batch' | 'age_bound'
      opening_date TEXT,
      closing_date TEXT,
      renewal_deadline TEXT,
      doc_deadline TEXT,
      deadline_status TEXT NOT NULL, -- 'Closing soon' | 'Deadline approaching' | 'Ongoing' | 'Dates not announced' | 'Date requires verification'
      faqs_json TEXT,
      application_procedure_json TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      scheme_id TEXT,
      doc_type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      encryption_iv TEXT NOT NULL,
      encryption_auth_tag TEXT NOT NULL,
      extracted_data_json TEXT,
      readiness_status TEXT NOT NULL, -- 'Ready for review' | 'Missing' | 'Unreadable' | 'Expired' | 'Information mismatch' | 'Expiry or validity unknown'
      issues_json TEXT,
      suggestions_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      history_json TEXT NOT NULL,
      profile_state_json TEXT NOT NULL,
      current_question_field TEXT,
      completion_percentage INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      ip TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents (user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_scheme ON documents (scheme_id);
    CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes (category);
  `);

  seedInitialData();
}

import { SCHEMES_DATA } from '../src/data/schemes.js';

function seedInitialData() {
  // Ensure default guest user exists for unauthenticated operations
  const guestExists = db.prepare('SELECT id FROM users WHERE id = ?;').get('guest_default');
  if (!guestExists) {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `).run('guest_default', 'guest', 'guest@schemefinder.local', 'none', 'none', 'user', new Date().toISOString());

    db.prepare(`
      INSERT OR IGNORE INTO profiles (user_id, name, updated_at)
      VALUES (?, ?, ?);
    `).run('guest_default', 'Rajesh Kumar', new Date().toISOString());
  }

  const count = db.prepare('SELECT COUNT(*) as cnt FROM schemes;').get().cnt;
  if (count === 0) {
    const insertScheme = db.prepare(`
      INSERT INTO schemes (
        id, name, category, authority, ministry, state, objective, benefits,
        benefit_type, eligibility_json, required_docs_json, official_url,
        source_reference, last_verified, deadline, deadline_type, opening_date,
        closing_date, renewal_deadline, doc_deadline, deadline_status,
        faqs_json, application_procedure_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    // Scheme deadlines mapping with authoritative source dates
    const DEADLINE_METADATA = {
      'pm-kisan': {
        type: 'ongoing',
        opening: '2019-02-01',
        closing: null,
        renewal: 'Annual e-KYC renewal mandatory',
        docDeadline: 'Continuous submission at CSC/Portal',
        status: 'Ongoing'
      },
      'ayushman-bharat': {
        type: 'ongoing',
        opening: '2018-09-23',
        closing: null,
        renewal: 'Card remains valid indefinitely with periodic e-KYC',
        docDeadline: 'Continuous at empanelled hospitals',
        status: 'Ongoing'
      },
      'sukanya-samriddhi': {
        type: 'age_bound',
        opening: '2015-01-22',
        closing: 'Until child turns 10 years of age',
        renewal: 'Minimum annual deposit of ₹250 before March 31',
        docDeadline: 'At account opening',
        status: 'Ongoing'
      },
      'post-matric-scholarship': {
        type: 'fixed_date',
        opening: '2026-07-01',
        closing: '2026-10-31',
        renewal: 'Every academic year upon passing promotion exam',
        docDeadline: '2026-11-15 (Institutional verification)',
        status: 'Closing soon'
      },
      'pm-svanidhi': {
        type: 'fixed_date',
        opening: '2020-06-01',
        closing: '2026-12-31',
        renewal: 'Second & third tranches upon timely repayment',
        docDeadline: 'Along with digital loan form',
        status: 'Deadline approaching'
      },
      'pm-vishwakarma': {
        type: 'ongoing',
        opening: '2023-09-17',
        closing: null,
        renewal: 'Skill upgrade certificate renewal as per MSME batches',
        docDeadline: 'Continuous enrollment at CSCs',
        status: 'Ongoing'
      },
      'pm-awas-yojana-gramin': {
        type: 'ongoing',
        opening: '2016-11-20',
        closing: null,
        renewal: 'Phased milestone-based geo-tagging verifications',
        docDeadline: 'Before release of second construction tranche',
        status: 'Ongoing'
      },
      'stand-up-india': {
        type: 'ongoing',
        opening: '2016-04-05',
        closing: null,
        renewal: 'Annual banking review of enterprise credit line',
        docDeadline: 'Bank appraisal stage',
        status: 'Ongoing'
      },
      'pm-mudra-yojana': {
        type: 'ongoing',
        opening: '2015-04-08',
        closing: null,
        renewal: 'Working capital limit annual renewal by branch',
        docDeadline: 'At bank loan application submission',
        status: 'Ongoing'
      },
      'divyangjan-swavalamban': {
        type: 'ongoing',
        opening: '2014-10-01',
        closing: null,
        renewal: 'Repayment schedule review as per NHFDC norms',
        docDeadline: 'UDID card verification at submission',
        status: 'Ongoing'
      },
      'atal-pension-yojana': {
        type: 'ongoing',
        opening: '2015-05-09',
        closing: null,
        renewal: 'Monthly auto-debit contribution through savings account',
        docDeadline: 'At bank registration',
        status: 'Ongoing'
      },
      'tn-pudhumai-penn': {
        type: 'fixed_date',
        opening: '2026-08-01',
        closing: '2026-11-30',
        renewal: 'Annual bonafide certificate verification by college',
        docDeadline: '2026-12-10 (College endorsement)',
        status: 'Deadline approaching'
      },
      'ladli-behna-yojana': {
        type: 'batch',
        opening: '2023-03-05',
        closing: 'End of current calendar month',
        renewal: 'Quarterly Aadhaar DBT and Samagra e-KYC validation',
        docDeadline: '10th of each processing month',
        status: 'Closing soon'
      },
      'cm-yuva-swarozgar': {
        type: 'fixed_date',
        opening: '2026-04-01',
        closing: '2027-03-31',
        renewal: 'Annual financial quota basis',
        docDeadline: 'Before DLTFC district interview round',
        status: 'Ongoing'
      },
      'national-social-assistance-widow-pension': {
        type: 'ongoing',
        opening: '1995-08-15',
        closing: null,
        renewal: 'Annual life certificate (Jeevan Pramaan) submission',
        docDeadline: 'During initial Tehsil / BDO enquiry',
        status: 'Ongoing'
      }
    };

    for (const s of SCHEMES_DATA) {
      const meta = DEADLINE_METADATA[s.id] || {
        type: 'ongoing',
        opening: null,
        closing: null,
        renewal: null,
        docDeadline: null,
        status: 'Ongoing'
      };

      insertScheme.run(
        s.id,
        s.name,
        s.category,
        s.authority,
        s.ministry || '',
        s.state,
        s.objective,
        s.benefits,
        s.benefitType,
        JSON.stringify(s.eligibility),
        JSON.stringify(s.requiredDocuments),
        s.officialUrl,
        s.sourceReference,
        s.lastVerified,
        s.deadline,
        meta.type,
        meta.opening,
        meta.closing,
        meta.renewal,
        meta.docDeadline,
        meta.status,
        JSON.stringify(s.faqs || []),
        JSON.stringify(s.applicationProcedure || [])
      );
    }
    console.log(`[Database] Seeded ${SCHEMES_DATA.length} verified government welfare schemes.`);
  }
}
