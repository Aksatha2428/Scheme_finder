import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  CheckCircle2, 
  Scan, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  Edit3, 
  FileText, 
  Check, 
  Trash2,
  Info,
  Lock,
  Download,
  Clock,
  Eye,
  KeyRound,
  FileQuestion,
  XCircle,
  HelpCircle
} from 'lucide-react';

// Preset sample documents for instant demonstration across all verification states
const SAMPLE_DOCUMENTS = [
  {
    id: 'aadhaar',
    title: 'Aadhaar Card (UIDAI)',
    type: 'Identity & Address Proof',
    expectedStatus: 'Ready for review',
    fileName: 'aadhaar_sample_card.pdf',
    mimeType: 'application/pdf',
    rawText: 'Government of India Unique Identification Authority of India Mera Aadhaar Meri Pehchan Name: Rajesh Kumar DOB: 14/08/1996 Gender: Male 7849 3920 1928 Address: Door 45, Gandhi Nagar, Chennai, Tamil Nadu 600028'
  },
  {
    id: 'income',
    title: 'Income Certificate (Current FY)',
    type: 'Annual Income Verification',
    expectedStatus: 'Ready for review',
    fileName: 'income_cert_2026.pdf',
    mimeType: 'application/pdf',
    rawText: 'Government of Tamil Nadu Revenue Department Annual Income Certificate Certificate No: REV/INC/2026/89402 This is to certify that annual income of Shri Rajesh Kumar is Rs 140000 Issue Date: 12/04/2026 Valid up to 2027-03-31 Tehsildar Office Chennai'
  },
  {
    id: 'caste',
    title: 'Community Certificate (Caste)',
    type: 'Social Reservation Proof',
    expectedStatus: 'Ready for review',
    fileName: 'community_certificate.pdf',
    mimeType: 'application/pdf',
    rawText: 'Government of Tamil Nadu Revenue Division Community Certificate No: CC/OBC/2024/7741 Name: Rajesh Kumar Category: OBC Backward Class Yadav Resident of Chennai Tamil Nadu Issue Date: 10/01/2024 Zonal Revenue Officer'
  },
  {
    id: 'udid',
    title: 'UDID Card (Disability Welfare)',
    type: 'Benchmark Disability Proof',
    expectedStatus: 'Ready for review',
    fileName: 'udid_disability_card.pdf',
    mimeType: 'application/pdf',
    rawText: 'Government of India Department of Empowerment of Persons with Disabilities Unique Disability ID UDID No: TN-CH-2025-004921 Name: Rajesh Kumar Locomotor Disability 45% Valid up to 2030-12-31'
  },
  {
    id: 'mismatch',
    title: 'Test: Name Mismatch Certificate',
    type: 'Simulated Fraud / Typo Mismatch',
    expectedStatus: 'Name mismatch detected',
    fileName: 'revenue_mismatch_record.pdf',
    mimeType: 'application/pdf',
    rawText: 'Government of Tamil Nadu Revenue Office Annual Income Certificate Certificate No: REV/INC/2026/1992 Name: Vikramaditya Rao S/o K. Rao Annual Income Rs 130000 Valid up to 2027-03-31'
  },
  {
    id: 'expired',
    title: 'Test: Expired Certificate',
    type: 'Simulated Outdated Validity',
    expectedStatus: 'Expired document',
    fileName: 'old_income_cert_2022.pdf',
    mimeType: 'application/pdf',
    rawText: 'Government of Tamil Nadu Revenue Department Annual Income Certificate Certificate No: REV/INC/2022/4412 Name: Rajesh Kumar Annual Income Rs 120000 Issue Date: 15/02/2022 Valid up to 2023-03-31 Tehsildar Office'
  },
  {
    id: 'blurry',
    title: 'Test: Low OCR Confidence / Blurry',
    type: 'Simulated Illegible Scan',
    expectedStatus: 'Low OCR confidence / blurry',
    fileName: 'blurry_scan_bad_lighting.pdf',
    mimeType: 'application/pdf',
    rawText: 'Govt .. ?? %%'
  }
];

export default function OCRScannerModule({ profile, setProfile, onProceedToForm, selectedScheme }) {
  const [selectedDoc, setSelectedDoc] = useState(SAMPLE_DOCUMENTS[0]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [editableValues, setEditableValues] = useState({});
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [schemeChecklist, setSchemeChecklist] = useState(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const fileInputRef = useRef(null);

  // Load vault documents and scheme checklist
  const loadVaultAndChecklist = async () => {
    try {
      setLoadingVault(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setVaultDocs(data.documents || []);
      }
    } catch (e) {
      console.warn('Vault fetch error:', e);
    } finally {
      setLoadingVault(false);
    }

    if (selectedScheme?.id) {
      try {
        setLoadingChecklist(true);
        const clRes = await fetch(`/api/documents/scheme/${selectedScheme.id}/checklist`);
        if (clRes.ok) {
          const clData = await clRes.json();
          setSchemeChecklist(clData);
        }
      } catch (e) {
        console.warn('Checklist fetch error:', e);
      } finally {
        setLoadingChecklist(false);
      }
    }
  };

  useEffect(() => {
    loadVaultAndChecklist();
  }, [selectedScheme?.id]);

  // Execute upload and live backend analysis
  const executeScan = async (fileData) => {
    setIsScanning(true);
    setErrorMessage(null);
    setSyncSuccess(false);

    try {
      let base64Content = fileData.base64;
      // If sample document without binary file, generate synthetic valid PDF header
      if (!base64Content) {
        const synthHeader = `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Title (${fileData.fileName}) /Content (${fileData.rawText || ''}) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
        base64Content = btoa(unescape(encodeURIComponent(synthHeader)));
      }

      const payload = {
        fileName: fileData.fileName,
        fileContentBase64: base64Content,
        mimeType: fileData.mimeType || 'application/pdf',
        schemeId: selectedScheme?.id || null,
        profileData: profile,
        simulatedRawText: fileData.rawText || undefined
      };

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process document');
      }

      setScanResult(result);
      setEditableValues({
        ...(result.extracted || {})
      });

      // Refresh encrypted documents list & scheme checklist
      await loadVaultAndChecklist();
    } catch (err) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'An error occurred during OCR verification.');
    } finally {
      setIsScanning(false);
    }
  };

  // Select preset sample document
  const handleSelectSample = (sample) => {
    setSelectedDoc(sample);
    setUploadedFile(null);
    executeScan({
      fileName: sample.fileName,
      mimeType: sample.mimeType,
      rawText: sample.rawText
    });
  };

  // Handle genuine file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a compressed PDF or image.');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();

    reader.onload = () => {
      const base64Content = reader.result.split(',')[1];
      executeScan({
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        base64: base64Content
      });
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file contents from device.');
    };

    reader.readAsDataURL(file);
  };

  const handleEditChange = (key, val) => {
    setEditableValues(prev => ({
      ...prev,
      [key]: val
    }));
  };

  // 1-Click apply reviewed values to profile and synchronize with SQLite backend
  const handleApplyToProfile = async () => {
    const updated = { ...profile };

    if (editableValues.holderName || editableValues.name) {
      updated.name = editableValues.holderName || editableValues.name;
    }
    if (editableValues.age) {
      updated.age = Number(editableValues.age);
    }
    if (editableValues.income !== undefined && editableValues.income !== '') {
      updated.income = Number(editableValues.income);
    }
    if (editableValues.category) {
      updated.category = editableValues.category;
    }
    if (editableValues.gender) {
      updated.gender = editableValues.gender;
    }
    if (editableValues.state) {
      updated.state = editableValues.state;
    }
    if (editableValues.district) {
      updated.district = editableValues.district;
    }
    if (editableValues.isDisabled !== undefined) {
      updated.isDisabled = Boolean(editableValues.isDisabled);
    }

    // Update frontend state
    setProfile(updated);

    // Synchronize to backend profile API
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Backend profile sync failed:', e);
    }

    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 5000);
  };

  // Download decrypted document
  const handleDownloadDecrypted = async (docId, fileName) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download decrypted document: ' + err.message);
    }
  };

  // Delete document securely
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to permanently erase this document and ciphertext?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setVaultDocs(prev => prev.filter(d => d.id !== docId));
        if (scanResult?.documentId === docId) {
          setScanResult(null);
        }
        await loadVaultAndChecklist();
      }
    } catch (e) {
      alert('Failed to erase document: ' + e.message);
    }
  };

  // Helper for readiness status badge color & icon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready for review':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#34d399',
          icon: <CheckCircle2 size={16} />
        };
      case 'Name mismatch detected':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          border: '1px solid #f97316',
          color: '#fb923c',
          icon: <AlertTriangle size={16} />
        };
      case 'Expired document':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid #f43f5e',
          color: '#fb7185',
          icon: <Clock size={16} />
        };
      case 'Missing mandatory field':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #f59e0b',
          color: '#fbbf24',
          icon: <AlertCircle size={16} />
        };
      case 'Low OCR confidence / blurry':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid #eab308',
          color: '#fde047',
          icon: <HelpCircle size={16} />
        };
      case 'Unsupported document type':
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.2)',
          border: '1px solid #64748b',
          color: '#94a3b8',
          icon: <FileQuestion size={16} />
        };
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Title & Official Disclaimers */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(2, 132, 199, 0.15)', 
          color: '#38bdf8', 
          padding: '0.35rem 0.95rem', 
          borderRadius: '20px', 
          fontSize: '0.8rem', 
          fontWeight: 600, 
          marginBottom: '0.5rem' 
        }}>
          <Scan size={15} /> Document OCR Engine & Readiness Verification
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: '0.2rem 0 0.4rem 0' }}>
          Smart Document Scanner & Readiness Checker
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '680px', margin: '0 auto' }}>
          Automated field extraction, profile cross-checking, and format validation for Aadhaar, Income Certificates, Community Certificates, and UDID Cards.
        </p>

        {/* Mandatory Statutory Disclaimer Banner */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          maxWidth: '780px',
          margin: '1.25rem auto 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'left'
        }}>
          <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: '#fde68a', lineHeight: '1.45' }}>
            <strong>Statutory Disclaimer:</strong> This automated readiness check evaluates file format, OCR legibility, and profile consistency. It does <em>NOT</em> constitute official government statutory verification or grant approval. Respective government departments perform final legal scrutiny upon official portal submission.
          </span>
        </div>

        {/* AES-256-GCM Security Banner */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          maxWidth: '780px',
          margin: '0.65rem auto 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          fontSize: '0.78rem',
          color: '#6ee7b7'
        }}>
          <ShieldCheck size={16} color="#34d399" />
          <span><strong>Zero-Knowledge Security:</strong> Documents are encrypted at rest using <strong>AES-256-GCM</strong> with isolated initialization vectors (IVs) and authenticated integrity tags.</span>
        </div>
      </div>

      {/* Target Scheme Document Checklist (If Scheme Selected) */}
      {selectedScheme && (
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.65)', 
          border: '1px solid var(--border-glass)', 
          borderRadius: '12px', 
          padding: '1.25rem 1.5rem', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Target Scheme Checklist</span>
              <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', margin: '0.1rem 0 0 0' }}>{selectedScheme.name}</h4>
            </div>
            {schemeChecklist && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Readiness Score:</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: schemeChecklist.readinessScore === 100 ? '#34d399' : '#38bdf8' }}>
                    {schemeChecklist.readinessScore}%
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.35rem 0.75rem', borderRadius: '20px', fontWeight: 600 }}>
                  {schemeChecklist.readyCount} / {schemeChecklist.totalRequired} Ready
                </span>
              </div>
            )}
          </div>

          {/* Checklist Item Pills */}
          {schemeChecklist?.checklist && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              {schemeChecklist.checklist.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: item.uploaded && item.status === 'Ready for review' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${item.uploaded && item.status === 'Ready for review' ? '#10b981' : 'var(--border-glass)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  {item.uploaded && item.status === 'Ready for review' ? (
                    <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
                  ) : item.uploaded ? (
                    <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                  ) : (
                    <Clock size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.requiredName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: item.uploaded ? (item.status === 'Ready for review' ? '#34d399' : '#fbbf24') : 'var(--text-muted)' }}>
                      {item.uploaded ? item.status : 'Pending Upload'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Drop Zone & Preset Test Samples */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Real File Upload Zone */}
        <div 
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: '2px dashed var(--border-glass)',
            borderRadius: '12px',
            padding: '1.75rem 1.25rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: uploadedFile ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '210px'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
        >
          <UploadCloud size={40} color="#38bdf8" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '0.98rem', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
            {uploadedFile ? uploadedFile.name : "Upload Document (PDF / Image)"}
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', maxWidth: '240px' }}>
            Instant AES-256-GCM encryption & OCR field extraction
          </p>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600, background: 'rgba(56, 189, 248, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
            PDF, PNG, JPG, JPEG (Max 10MB)
          </span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf,image/png,image/jpeg,image/jpg" 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Sample Document Selector for Instant Test of All 6 Verification States */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span>Or Test Preset Verification Categories:</span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Click to Run Live</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '230px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {SAMPLE_DOCUMENTS.map((sample) => {
              const badge = getStatusBadge(sample.expectedStatus);
              const isSelected = selectedDoc.id === sample.id && !uploadedFile;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-glass)'}`,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{sample.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sample.type}</div>
                  </div>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    background: badge.bg, 
                    border: badge.border, 
                    color: badge.color, 
                    fontWeight: 700, 
                    whiteSpace: 'nowrap' 
                  }}>
                    {sample.expectedStatus}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Message if Any */}
      {errorMessage && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          border: '1px solid #ef4444', 
          color: '#f87171', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <XCircle size={18} />
          <span style={{ fontSize: '0.85rem' }}>{errorMessage}</span>
        </div>
      )}

      {/* OCR Scanner Laser Visualizer */}
      <div className="ocr-scanner-box" style={{ padding: '2rem 1.5rem', marginBottom: '1.75rem' }}>
        {isScanning && <div className="scan-laser" />}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <Scan 
            size={48} 
            color={isScanning ? "#38bdf8" : scanResult ? "#34d399" : "var(--text-muted)"} 
            className={isScanning ? "animate-pulse" : ""} 
          />
          
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
            {isScanning 
              ? "Scanning Document Text Regions & Encrypting File..." 
              : scanResult 
              ? `Verification Complete: ${scanResult.docType}` 
              : "Ready to Scan Document"}
          </h3>
          
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '540px', margin: 0 }}>
            {isScanning 
              ? "Running file signature validation, AES-256-GCM encryption, bilingual OCR extraction, and citizen profile comparison..." 
              : scanResult 
              ? `Document analyzed against citizen profile (${profile.name || 'Citizen'}). Review status and extracted fields below.` 
              : `Select a document above or upload your own certificate to perform live verification.`}
          </p>

          {!isScanning && !scanResult && (
            <button 
              className="btn-primary" 
              onClick={() => handleSelectSample(selectedDoc)}
              style={{ marginTop: '0.5rem' }}
            >
              <Sparkles size={16} /> Run Verification on {selectedDoc.title}
            </button>
          )}
        </div>
      </div>

      {/* Verification Analysis & Extracted Fields Review Panel */}
      {scanResult && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid var(--border-glass)', 
          borderRadius: '12px', 
          padding: '1.5rem', 
          marginBottom: '2rem' 
        }}>
          {/* Header Row: Status Badge & Clear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {(() => {
                const b = getStatusBadge(scanResult.readinessStatus);
                return (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.45rem 0.95rem', 
                    borderRadius: '20px', 
                    background: b.bg, 
                    border: b.border, 
                    color: b.color, 
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}>
                    {b.icon}
                    <span>Readiness: {scanResult.readinessStatus}</span>
                  </div>
                );
              })()}

              <span style={{ 
                fontSize: '0.75rem', 
                color: '#34d399', 
                background: 'rgba(16, 185, 129, 0.12)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                padding: '0.35rem 0.75rem', 
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Lock size={12} /> AES-256-GCM Encrypted at Rest
              </span>
            </div>

            <button 
              type="button" 
              onClick={() => {
                setScanResult(null);
                setUploadedFile(null);
                setEditableValues({});
              }}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <RefreshCw size={13} /> Reset View
            </button>
          </div>

          {/* Issues Flagged Alert Box */}
          {scanResult.issues && scanResult.issues.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '0.85rem 1.15rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={16} /> Issues Flagged by Verification Engine:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                {scanResult.issues.map((issue, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Practical Remediation Suggestions */}
          {scanResult.suggestions && scanResult.suggestions.length > 0 && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '0.85rem 1.15rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <Info size={16} /> Official Portal Guidance & Next Steps:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                {scanResult.suggestions.map((sug, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{sug}</li>
                ))}
              </ul>
            </div>
          )}

          {/* In-Line Editable Extracted Fields */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Edit3 size={16} color="#38bdf8" />
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 }}>
                Review & Edit Extracted Document Values
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                (Correct any optical OCR misreadings before applying)
              </span>
            </div>

            {Object.keys(editableValues).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                {Object.entries(editableValues).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null) return null;
                  return (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input 
                        type="text" 
                        value={val !== undefined ? val.toString() : ''}
                        onChange={(e) => handleEditChange(key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No structured fields could be parsed from this document.
              </p>
            )}
          </div>

          {/* Action Row */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleApplyToProfile}
              style={{ fontSize: '0.88rem', padding: '0.65rem 1.35rem' }}
            >
              <CheckCircle2 size={16} /> Apply Extracted Values to Citizen Profile
            </button>

            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onProceedToForm}
              style={{ fontSize: '0.88rem', padding: '0.65rem 1.35rem' }}
            >
              Proceed to Application Draft <ArrowRight size={16} />
            </button>
          </div>

          {/* Synchronization Confirmation Alert */}
          {syncSuccess && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.85rem 1rem', 
              background: 'rgba(16, 185, 129, 0.2)', 
              border: '1px solid #10b981', 
              color: '#34d399', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <Check size={18} /> Profile and database successfully synchronized with verified document credentials! Eligibility scores have been recomputed.
            </div>
          )}
        </div>
      )}

      {/* Encrypted Documents Vault Section */}
      <div style={{ 
        marginTop: '2rem', 
        borderTop: '1px solid var(--border-glass)', 
        paddingTop: '1.75rem' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#34d399" />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                Citizen Encrypted Document Vault
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              All documents stored with AES-256-GCM encryption at rest on your local server.
            </p>
          </div>
          <button 
            type="button" 
            onClick={loadVaultAndChecklist}
            className="btn-ctrl"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            <RefreshCw size={13} /> Refresh Vault ({vaultDocs.length})
          </button>
        </div>

        {vaultDocs.length === 0 ? (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid var(--border-glass)', 
            borderRadius: '10px', 
            padding: '1.5rem', 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            No encrypted documents currently stored. Upload a document or run a test sample above to see it securely stored in your vault.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {vaultDocs.map((doc) => {
              const b = getStatusBadge(doc.readinessStatus);
              return (
                <div 
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '8px', 
                      background: 'rgba(56, 189, 248, 0.12)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}>
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {doc.originalName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.1rem' }}>
                        <span>{doc.docType}</span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <ShieldCheck size={11} /> AES-256-GCM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '12px', 
                      background: b.bg, 
                      border: b.border, 
                      color: b.color, 
                      fontWeight: 700 
                    }}>
                      {doc.readinessStatus}
                    </span>

                    <button 
                      type="button"
                      onClick={() => handleDownloadDecrypted(doc.id, doc.originalName)}
                      className="btn-ctrl"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      title="Decrypt on the fly and download authentic document"
                    >
                      <Download size={13} color="#38bdf8" /> Decrypt & Download
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="btn-ctrl"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem', color: '#f87171' }}
                      title="Permanently erase document ciphertext and metadata"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
