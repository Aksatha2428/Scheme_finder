import React from 'react';
import { X, ExternalLink, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, Scale, FileText } from 'lucide-react';

export default function SchemeComparisonModal({ schemes, evaluations, onClose, onSelectScheme, onApplyDraft }) {
  if (!schemes || schemes.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '1050px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-glass-strong)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Scale size={24} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0 }}>
                Side-by-Side Scheme Comparison ({schemes.length} Schemes)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Compare benefits, eligibility prerequisites, required documents, and application procedures.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Comparison Matrix Table */}
        <div style={{ overflowX: 'auto', padding: '1rem 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.9rem', borderBottom: '2px solid var(--border-glass)', width: '22%', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Attribute
                </th>
                {schemes.map(s => {
                  const ev = evaluations[s.id];
                  const status = ev ? ev.status : 'Unknown';
                  return (
                    <th key={s.id} style={{ padding: '0.9rem', borderBottom: '2px solid var(--border-glass)', width: `${78 / schemes.length}%`, verticalAlign: 'top' }}>
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                        {s.authority}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', margin: '0.3rem 0', color: 'var(--text-main)' }}>
                        {s.name}
                      </h3>
                      {ev && (
                        <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`scheme-card-badge ${status === 'Eligible' ? 'badge-eligible' : status === 'Potentially Eligible' ? 'badge-potential' : 'badge-rejected'}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                            {status === 'Eligible' && <CheckCircle2 size={12} />}
                            {status === 'Potentially Eligible' && <AlertTriangle size={12} />}
                            {status === 'Not Eligible' && <XCircle size={12} />}
                            {status}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {ev.matchPercentage}% Match
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Category & Ministry */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Ministry / Sector
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.category}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.ministry || s.authority}</div>
                  </td>
                ))}
              </tr>

              {/* Domicile State */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  State / Jurisdiction
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    {s.state}
                  </td>
                ))}
              </tr>

              {/* Financial & Welfare Benefits */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Key Benefit
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    <div style={{ background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px', color: '#34d399', fontWeight: 600 }}>
                      {s.benefits}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Age Limits */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Eligible Age Limit
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    {s.eligibility.minAge} to {s.eligibility.maxAge} years
                  </td>
                ))}
              </tr>

              {/* Income Threshold */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Max Family Income
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem', fontWeight: 600 }}>
                    ₹{s.eligibility.maxIncome.toLocaleString('en-IN')} / year
                  </td>
                ))}
              </tr>

              {/* Eligible Occupations */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Target Occupations
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    {s.eligibility.occupation.join(', ')}
                  </td>
                ))}
              </tr>

              {/* Social Category */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Eligible Categories
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    {s.eligibility.category.join(', ')}
                  </td>
                ))}
              </tr>

              {/* Required Documents */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Mandatory Documents
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                    <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                      {s.requiredDocuments.map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Application Portal */}
              <tr>
                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Official Portal
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.82rem' }}>
                    <a 
                      href={s.officialUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Visit Portal <ExternalLink size={13} />
                    </a>
                  </td>
                ))}
              </tr>

              {/* Action Buttons Row */}
              <tr>
                <td style={{ padding: '0.8rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Actions
                </td>
                {schemes.map(s => (
                  <td key={s.id} style={{ padding: '0.8rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => { onClose(); onSelectScheme(s, evaluations[s.id]); }}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', justifyContent: 'center' }}
                      >
                        Detailed View
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={() => { onClose(); onApplyDraft(s); }}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', justifyContent: 'center' }}
                      >
                        Generate Draft Summary
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
