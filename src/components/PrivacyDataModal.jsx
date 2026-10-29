import React, { useState } from 'react';
import { X, ShieldCheck, Trash2, Download, Check, AlertTriangle, Lock } from 'lucide-react';

export default function PrivacyDataModal({ onClose, onClearAllData, profile, savedCount }) {
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to permanently delete all locally stored profile credentials, bookmarked schemes, and OCR cache?")) {
      onClearAllData();
      setClearedSuccess(true);
      setTimeout(() => {
        setClearedSuccess(false);
        onClose();
      }, 1500);
    }
  };

  const handleExport = () => {
    const backup = {
      profile,
      exportTimestamp: new Date().toISOString(),
      source: "Scheme Finder Citizen Privacy System"
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `citizen_privacy_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '600px', width: '92%' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
              Citizen Privacy & Data Protection
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Privacy Architecture Notice */}
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.3rem' }}>
              <ShieldCheck size={18} /> Client-Side Local Storage Architecture
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              Your demographic information, income details, and uploaded certificates are processed locally within your browser runtime. No personal identification data is stored on remote unauthorized servers.
            </p>
          </div>

          {/* Current Local Storage Audit */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
              Currently Stored Citizen Session Data
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <li>Citizen Profile: <strong>{profile.name || 'Anonymous User'}</strong> ({profile.state || 'No state'})</li>
              <li>Saved / Bookmarked Schemes: <strong>{savedCount} schemes</strong></li>
              <li>OCR Extraction Cache: <strong>Retained in memory only</strong></li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleExport}
              style={{ justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <Download size={15} /> Export Complete Data Backup (JSON)
            </button>

            <button 
              type="button" 
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} /> Delete All Locally Stored Data & Reset
            </button>
          </div>

          {clearedSuccess && (
            <div style={{ marginTop: '1rem', padding: '0.65rem', background: 'rgba(5, 150, 105, 0.2)', border: '1px solid #059669', color: '#34d399', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} /> All local citizen data and cache successfully purged!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
