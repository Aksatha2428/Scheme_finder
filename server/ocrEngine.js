/**
 * Document OCR & Readiness Engine
 * Extracts fields from uploaded government documents, validates format & readability,
 * compares credentials against citizen profiles, and computes readiness status.
 */

// Known document type fingerprints
const DOC_PATTERNS = {
  aadhaar: {
    type: 'Aadhaar Card',
    keywords: ['government of india', 'unique identification', 'uidai', 'aadhaar', 'mera aadhaar', 'enrollment no', 'dob'],
    idRegex: /\b\d{4}\s?\d{4}\s?\d{4}\b/
  },
  income: {
    type: 'Income Certificate',
    keywords: ['income certificate', 'annual income', 'revenue department', 'tahsildar', 'tehsildar', 'family income'],
    idRegex: /\b(?:REV|INC|TN|UP|MP|DL)[/-]?[A-Z0-9/-]{6,20}\b/i
  },
  caste: {
    type: 'Community / Caste Certificate',
    keywords: ['community certificate', 'caste certificate', 'scheduled caste', 'scheduled tribe', 'backward class', 'obc', 'sc', 'st', 'revenue'],
    idRegex: /\b(?:CC|COMM|REV|CASTE)[/-]?[A-Z0-9/-]{5,20}\b/i
  },
  udid: {
    type: 'UDID Card (Disability Welfare)',
    keywords: ['unique disability', 'udid', 'disability id', 'disability certificate', 'department of empowerment of persons with disabilities', 'locomotor'],
    idRegex: /\b[A-Z]{2}[/-]?[A-Z0-9]{2}[/-]?[0-9]{4}[/-]?[0-9]{4,8}\b/i
  },
  land: {
    type: 'Land Ownership Record (Patta / Khatauni)',
    keywords: ['land record', 'patta', 'khasra', 'khatauni', 'revenue record', 'cultivable', 'survey number', 'hectare', 'dag'],
    idRegex: /\b(?:PATTA|KHASRA|KHATA|SRV)[/-]?[0-9/-]{3,15}\b/i
  },
  ration: {
    type: 'Ration Card (NFSA / BPL)',
    keywords: ['ration card', 'nfsa', 'civil supplies', 'antyodaya', 'bpl', 'below poverty line', 'fair price'],
    idRegex: /\b(?:RC|NFSA|BPL)[/-]?[0-9]{6,16}\b/i
  },
  marksheet: {
    type: 'Marksheet / Educational Certificate',
    keywords: ['marksheet', 'board of secondary', 'higher secondary', 'class 10th', 'class 12th', 'pass certificate', 'roll no', 'cgpa'],
    idRegex: /\b(?:ROLL|REG|CERT)[/-]?[0-9]{5,15}\b/i
  }
};

/**
 * Clean and normalize text strings for comparison
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Compute similarity score between two name strings
 */
function calculateNameSimilarity(nameA, nameB) {
  const normA = normalizeString(nameA);
  const normB = normalizeString(nameB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const tokensA = normA.split(' ').filter(t => t.length > 1);
  const tokensB = normB.split(' ').filter(t => t.length > 1);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  let commonTokens = 0;
  for (const tA of tokensA) {
    if (tokensB.includes(tA)) commonTokens += 1;
  }
  const tokenOverlap = (2 * commonTokens) / (tokensA.length + tokensB.length);
  return tokenOverlap;
}

/**
 * Parse plain text extracted from a document buffer or simulated OCR
 */
export function processDocumentText({ rawText, originalName, fileSize, profile = {}, targetScheme = null }) {
  const lowerText = (rawText || '').toLowerCase();
  const issues = [];
  const suggestions = [];

  // 1. Basic integrity & readability check
  if (!rawText || rawText.trim().length < 25) {
    return {
      docType: 'Unknown Document',
      extracted: {},
      readinessStatus: 'Low OCR confidence / blurry',
      issues: ['Document text is unreadable, blurry, corrupted, or contains insufficient text content.'],
      suggestions: ['Please upload a clearer, high-resolution scan or original PDF issued by the government authority.'],
      comparison: { nameMatch: false, stateMatch: true, categoryMatch: true }
    };
  }

  // 2. Classify document type based on keyword fingerprinting
  let detectedKey = 'unknown';
  let highestScore = 0;

  for (const [key, def] of Object.entries(DOC_PATTERNS)) {
    let score = 0;
    for (const kw of def.keywords) {
      if (lowerText.includes(kw)) score += 1;
    }
    if (score > highestScore && score >= 2) {
      highestScore = score;
      detectedKey = key;
    }
  }

  // Fallback heuristic based on filename
  if (detectedKey === 'unknown') {
    const fn = (originalName || '').toLowerCase();
    if (fn.includes('aadhaar')) detectedKey = 'aadhaar';
    else if (fn.includes('income')) detectedKey = 'income';
    else if (fn.includes('caste') || fn.includes('community')) detectedKey = 'caste';
    else if (fn.includes('disability') || fn.includes('udid')) detectedKey = 'udid';
    else if (fn.includes('land') || fn.includes('patta')) detectedKey = 'land';
    else if (fn.includes('ration') || fn.includes('bpl')) detectedKey = 'ration';
    else if (fn.includes('mark') || fn.includes('10th') || fn.includes('12th')) detectedKey = 'marksheet';
  }

  const docTypeLabel = DOC_PATTERNS[detectedKey]?.type || 'Government Identity / Welfare Document';

  // 3. Extract Structured Fields
  const extracted = {};

  // Extract Name
  const nameMatch = rawText.match(/(?:name|holder|applicant|shri|smt|kumari|mr|mrs)\s*[:.-]?\s*([A-Za-z\s]{3,35})/i);
  if (nameMatch && !['of', 'india', 'government', 'department'].includes(nameMatch[1].trim().toLowerCase())) {
    extracted.holderName = nameMatch[1].trim();
  } else if (profile.name) {
    // If text contains the profile's name tokens, extract it
    const profileTokens = profile.name.split(' ');
    if (profileTokens.some(t => t.length > 2 && lowerText.includes(t.toLowerCase()))) {
      extracted.holderName = profile.name;
    }
  }

  // Extract ID / Certificate Number
  if (DOC_PATTERNS[detectedKey]?.idRegex) {
    const idMatch = rawText.match(DOC_PATTERNS[detectedKey].idRegex);
    if (idMatch) extracted.certificateNo = idMatch[0].trim();
  }

  // Extract Dates (Issue Date, Expiry Date, DOB)
  const dateMatches = [...rawText.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)];
  if (dateMatches.length > 0) {
    extracted.dates = dateMatches.map(m => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
    extracted.issueDate = extracted.dates[0];
  }

  // Check explicit Expiry Date regex
  const expiryMatch = rawText.match(/(?:valid up to|valid till|expiry date|valid through)\s*[:.-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (expiryMatch) {
    extracted.expiryDate = expiryMatch[1];
  }

  // Extract Income amount if Income Certificate
  const incomeMatch = rawText.match(/(?:annual income|total income|income)\s*[:.-]?\s*(?:rs\.?|₹)?\s*(\d{1,2}(?:,\d{3})+|\d{4,8})/i);
  if (incomeMatch) {
    extracted.income = parseInt(incomeMatch[1].replace(/,/g, ''), 10);
  }

  // Extract Category if Caste Certificate
  if (/\b(?:sc|scheduled caste)\b/i.test(rawText)) extracted.category = 'SC';
  else if (/\b(?:st|scheduled tribe)\b/i.test(rawText)) extracted.category = 'ST';
  else if (/\b(?:obc|other backward class|bc|mbc)\b/i.test(rawText)) extracted.category = 'OBC';
  else if (/\b(?:ews|economically weaker)\b/i.test(rawText)) extracted.category = 'EWS';

  // 4. Compare with Citizen Profile
  let nameMatchOk = true;
  let categoryMatchOk = true;
  let stateMatchOk = true;

  if (extracted.holderName && profile.name) {
    const sim = calculateNameSimilarity(extracted.holderName, profile.name);
    if (sim < 0.5) {
      nameMatchOk = false;
      issues.push(`Holder name on document ('${extracted.holderName}') does not match profile name ('${profile.name}').`);
      suggestions.push(`Verify that this certificate belongs to you. If there is a typo in your profile, update your profile name.`);
    }
  }

  if (extracted.category && profile.category && profile.category !== 'General') {
    if (extracted.category !== profile.category) {
      categoryMatchOk = false;
      issues.push(`Category on certificate ('${extracted.category}') differs from profile category ('${profile.category}').`);
      suggestions.push(`Ensure you upload the correct community certificate matching your registered reservation category.`);
    }
  }

  // 5. Check Expiration & Validity
  let isExpired = false;
  let validityUnknown = false;
  const currentYear = 2026;

  if (extracted.expiryDate) {
    const expTime = new Date(extracted.expiryDate).getTime();
    if (!isNaN(expTime) && expTime < Date.now()) {
      isExpired = true;
      issues.push(`Document expired on ${extracted.expiryDate}.`);
      suggestions.push(`Apply for certificate renewal at your local Tehsil office / e-Seva portal before scheme submission.`);
    }
  } else if (detectedKey === 'income') {
    // Income certificates in India are typically valid for 1 year or 3 years
    if (extracted.issueDate) {
      const issueYear = parseInt(extracted.issueDate.slice(0, 4), 10);
      if (issueYear && (currentYear - issueYear) > 1) {
        isExpired = true;
        issues.push(`Income certificate was issued in ${issueYear} (> 1 financial year old). Most government portals require the current financial year's certificate.`);
        suggestions.push(`Obtain a fresh Income Certificate for FY 2026-27 from the Revenue Department.`);
      }
    } else {
      validityUnknown = true;
      issues.push('Could not determine issue or expiry date on this income certificate.');
      suggestions.push('Ensure the date and Tehsildar stamp are clearly visible.');
    }
  }

  // 6. Final Status Category Resolution (6 Canonical Categories)
  let readinessStatus = 'Ready for review';

  if (detectedKey === 'unknown') {
    readinessStatus = 'Unsupported document type';
  } else if (!nameMatchOk) {
    readinessStatus = 'Name mismatch detected';
  } else if (!categoryMatchOk) {
    readinessStatus = 'Name mismatch detected';
  } else if (isExpired) {
    readinessStatus = 'Expired document';
  } else if (validityUnknown || (!extracted.certificateNo && detectedKey !== 'aadhaar')) {
    readinessStatus = 'Missing mandatory field';
  } else if (issues.length > 0) {
    readinessStatus = 'Name mismatch detected';
  } else {
    readinessStatus = 'Ready for review';
  }

  return {
    docType: docTypeLabel,
    extracted,
    readinessStatus,
    issues,
    suggestions: suggestions.length > 0 ? suggestions : ['Document looks ready. Keep original copies ready during physical verification at the portal or center.'],
    comparison: {
      nameMatch: nameMatchOk,
      categoryMatch: categoryMatchOk,
      stateMatch: stateMatchOk
    },
    statutoryDisclaimer: "Notice: This automated readiness check evaluates file format, OCR legibility, and profile consistency. It does NOT constitute official government statutory verification or grant approval."
  };
}
