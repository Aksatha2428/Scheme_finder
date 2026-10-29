import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileCheck, 
  Bookmark, 
  BookmarkCheck, 
  Scale, 
  Clock, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import SchemeComparisonModal from './SchemeComparisonModal';

export default function EligibilityResults({ 
  evaluatedSchemes, 
  profile, 
  onSelectScheme, 
  onOpenOCR,
  onOpenDraftModal,
  savedSchemeIds = [],
  onToggleSaveScheme
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Filter categories
  const categories = [
    'All', 
    'Agriculture', 
    'Education & Scholarship', 
    'Women & Child', 
    'Business & Entrepreneurship', 
    'Health & Medical', 
    'Housing', 
    'Social Security', 
    'Disability Welfare',
    'Skill & Employment'
  ];

  // Evaluations dictionary for comparison modal lookup
  const evaluationsMap = {};
  evaluatedSchemes.forEach(ev => {
    evaluationsMap[ev.scheme.id] = ev;
  });

  // Filter list
  const filteredSchemes = evaluatedSchemes.filter(item => {
    const s = item.scheme;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.benefits.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.ministry && s.ministry.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'Eligible') {
      matchesStatus = item.status === 'Eligible';
    } else if (statusFilter === 'Potentially Eligible') {
      matchesStatus = item.status === 'Potentially Eligible';
    } else if (statusFilter === 'Not Eligible') {
      matchesStatus = item.status === 'Not Eligible';
    } else if (statusFilter === 'Saved') {
      matchesStatus = savedSchemeIds.includes(s.id);
    }

    let matchesState = true;
    if (stateFilter === 'Central') {
      matchesState = s.state === 'All India';
    } else if (stateFilter === 'State') {
      matchesState = s.state !== 'All India';
    }

    return matchesSearch && matchesCat && matchesStatus && matchesState;
  });

  const eligibleCount = evaluatedSchemes.filter(s => s.status === 'Eligible').length;
  const potentialCount = evaluatedSchemes.filter(s => s.status === 'Potentially Eligible').length;
  const ineligibleCount = evaluatedSchemes.filter(s => s.status === 'Not Eligible').length;

  const handleToggleCompare = (schemeId) => {
    setSelectedForComparison(prev => {
      if (prev.includes(schemeId)) {
        return prev.filter(id => id !== schemeId);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 schemes at a time.");
        return prev;
      }
      return [...prev, schemeId];
    });
  };

  const schemesToCompare = evaluatedSchemes
    .filter(item => selectedForComparison.includes(item.scheme.id))
    .map(item => item.scheme);

  // Export PDF Report via Print Document Stream
  const exportPDFReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const eligibleItems = evaluatedSchemes.filter(s => s.status === 'Eligible');
    const potentialItems = evaluatedSchemes.filter(s => s.status === 'Potentially Eligible');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scheme Finder - Verified Welfare Eligibility Assessment</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
          .header-box { border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #0284c7; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
          .scheme-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .badge-el { background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block; }
          .badge-pot { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block; }
          .benefit { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 8px 12px; font-size: 13px; font-weight: 600; color: #166534; margin: 8px 0; }
          .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
          .disclaimer { font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1 class="title">Scheme Finder - Government Scheme Eligibility Summary</h1>
          <p class="subtitle">Comprehensive Pre-Evaluation Report Based on Verified Government Databases</p>
        </div>

        <div class="profile-grid">
          <div><strong>Citizen Name:</strong> ${profile.name || 'Citizen'}</div>
          <div><strong>Age:</strong> ${profile.age || 'N/A'} Yrs</div>
          <div><strong>Gender:</strong> ${profile.gender || 'N/A'}</div>
          <div><strong>State / District:</strong> ${profile.state || 'N/A'} (${profile.district || 'N/A'})</div>
          <div><strong>Occupation:</strong> ${profile.occupation || 'N/A'}</div>
          <div><strong>Social Category:</strong> ${profile.category || 'General'}</div>
          <div><strong>Annual Family Income:</strong> ₹${(profile.income || 0).toLocaleString('en-IN')}</div>
          <div><strong>Education:</strong> ${profile.education || 'None'}</div>
          <div><strong>Assessment Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
        </div>

        <h2 style="color: #15803d; font-size: 16px;">Directly Eligible Schemes (${eligibleItems.length})</h2>
        ${eligibleItems.map((item, idx) => `
          <div class="scheme-card">
            <span class="badge-el">✓ Fully Eligible (${item.matchPercentage}% Match)</span>
            <h3 style="margin: 8px 0 4px 0; font-size: 16px;">${idx + 1}. ${item.scheme.name}</h3>
            <div class="meta">${item.scheme.authority} • ${item.scheme.category} • ${item.scheme.state}</div>
            <p style="font-size: 13px; margin: 6px 0;">${item.scheme.objective}</p>
            <div class="benefit">Benefit: ${item.scheme.benefits}</div>
            <div class="meta">Official Portal: ${item.scheme.officialUrl} (Source: ${item.scheme.sourceReference || 'Govt Portal'})</div>
          </div>
        `).join('')}

        <h2 style="color: #b45309; font-size: 16px; margin-top: 25px;">Potentially Eligible Schemes - Requires Verification (${potentialItems.length})</h2>
        ${potentialItems.map((item, idx) => `
          <div class="scheme-card">
            <span class="badge-pot">⚠ Potentially Eligible (${item.matchPercentage}% Match)</span>
            <h3 style="margin: 8px 0 4px 0; font-size: 16px;">${idx + 1}. ${item.scheme.name}</h3>
            <div class="meta">${item.scheme.authority} • ${item.scheme.category}</div>
            <p style="font-size: 13px; margin: 6px 0;">${item.scheme.objective}</p>
            <div class="benefit" style="background: #fffbeb; border-color: #f59e0b; color: #92400e;">Benefit: ${item.scheme.benefits}</div>
            <p style="font-size: 12px; color: #b45309;"><strong>Pending Verification:</strong> ${item.pendingCriteria.map(p => p.detail).join('; ')}</p>
            <div class="meta">Official Portal: ${item.scheme.officialUrl}</div>
          </div>
        `).join('')}

        <div class="disclaimer">
          <strong>Notice:</strong> This document is an informational eligibility assessment generated by Scheme Finder. Final grant approval depends on statutory scrutiny, document verification, and submission on respective official government web portals.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Header Statistics Dashboard */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
              AI Evaluation Dashboard
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Evaluated across {evaluatedSchemes.length} Verified Central & State Databases
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--text-main)', margin: 0 }}>
            Welfare Scheme Discovery for <span style={{ color: '#38bdf8' }}>{profile.name || 'Citizen'}</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {profile.state} • {profile.occupation} • ₹{(profile.income || 0).toLocaleString('en-IN')}/yr • {profile.category}
          </p>
        </div>

        {/* Counts summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '0.4rem 0.8rem', background: 'rgba(5, 150, 105, 0.1)', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', display: 'block' }}>{eligibleCount}</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Fully Eligible</p>
          </div>

          <div style={{ textAlign: 'center', padding: '0.4rem 0.8rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', display: 'block' }}>{potentialCount}</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Potentially Eligible</p>
          </div>

          <div style={{ textAlign: 'center', padding: '0.4rem 0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', display: 'block' }}>{ineligibleCount}</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Not Eligible</p>
          </div>

          <button 
            className="btn-secondary" 
            onClick={exportPDFReport} 
            style={{ background: 'rgba(2, 132, 199, 0.15)', borderColor: '#0284c7' }}
            title="Download printable eligibility report"
          >
            <Download size={15} /> Export Assessment
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="schemes-header" style={{ marginBottom: '1.5rem' }}>
        <div className="search-filter-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 2, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search scheme name, ministry, or benefits..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          {/* Sector Category */}
          <select 
            className="select-dropdown" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ flex: 1, minWidth: '160px' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Sectors' : cat}</option>
            ))}
          </select>

          {/* Eligibility Status Filter */}
          <select 
            className="select-dropdown" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ flex: 1, minWidth: '170px' }}
          >
            <option value="All">All Eligibility Statuses</option>
            <option value="Eligible">Eligible Schemes Only (✓)</option>
            <option value="Potentially Eligible">Potentially Eligible Only (⚠)</option>
            <option value="Not Eligible">Ineligible Schemes Only (✕)</option>
            <option value="Saved">Bookmarked Schemes (★)</option>
          </select>

          {/* State vs Central */}
          <select 
            className="select-dropdown" 
            value={stateFilter} 
            onChange={(e) => setStateFilter(e.target.value)}
            style={{ flex: 1, minWidth: '140px' }}
          >
            <option value="All">All Schemes</option>
            <option value="Central">Central Govt Only</option>
            <option value="State">State Specific Only</option>
          </select>
        </div>
      </div>

      {/* Floating Comparison Tray */}
      {selectedForComparison.length > 0 && (
        <div style={{
          position: 'sticky',
          top: '1rem',
          zIndex: 90,
          background: 'var(--bg-glass-strong)',
          border: '2px solid #38bdf8',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Scale size={20} color="#38bdf8" />
            <div>
              <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-main)' }}>
                Comparing {selectedForComparison.length} of 3 Schemes
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {schemesToCompare.map(s => s.name.split('(')[0].trim()).join(' vs ')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setSelectedForComparison([])}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              Clear
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowComparisonModal(true)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
            >
              <Scale size={14} /> Open Side-by-Side Comparison
            </button>
          </div>
        </div>
      )}

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={40} color="#fbbf24" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No Schemes Match Your Filter Criteria
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Try clearing the search term or switching to "All Sectors" or "All Eligibility Statuses".
          </p>
          <button 
            className="btn-secondary" 
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setStatusFilter('All'); setStateFilter('All'); }}
            style={{ marginTop: '1rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="schemes-grid">
          {filteredSchemes.map((item) => {
            const { 
              scheme, 
              status, 
              matchPercentage, 
              decisionExplanation, 
              matchedCriteria, 
              unmetCriteria, 
              pendingCriteria 
            } = item;

            const isExpanded = expandedSchemeId === scheme.id;
            const isBookmarked = savedSchemeIds.includes(scheme.id);
            const isSelectedToCompare = selectedForComparison.includes(scheme.id);

            return (
              <div 
                key={scheme.id} 
                className="glass-card scheme-card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: isSelectedToCompare ? '2px solid #38bdf8' : undefined
                }}
              >
                <div>
                  {/* Top Bar with Badge, Score & Bookmark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`scheme-card-badge ${status === 'Eligible' ? 'badge-eligible' : status === 'Potentially Eligible' ? 'badge-potential' : 'badge-rejected'}`}>
                      {status === 'Eligible' && <CheckCircle2 size={13} />}
                      {status === 'Potentially Eligible' && <AlertTriangle size={13} />}
                      {status === 'Not Eligible' && <XCircle size={13} />}
                      {status}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="match-score-pill">
                        {matchPercentage}% Match
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSaveScheme(scheme.id)}
                        style={{
                          background: isBookmarked ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isBookmarked ? '#38bdf8' : 'var(--border-glass)'}`,
                          color: isBookmarked ? '#38bdf8' : 'var(--text-muted)',
                          padding: '0.3rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={isBookmarked ? "Remove bookmark" : "Save scheme"}
                      >
                        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Scheme Title & Authority */}
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {scheme.name}
                  </h3>

                  {/* Meta Pills */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      {scheme.authority}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      {scheme.state}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#38bdf8' }}>
                      {scheme.category}
                    </span>
                    {scheme.lastVerified && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ShieldCheck size={11} /> Verified {scheme.lastVerified}
                      </span>
                    )}
                  </div>

                  {/* Objective Description */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '0.85rem' }}>
                    {scheme.objective}
                  </p>

                  {/* Benefits Highlight Box */}
                  <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                      Key Financial / Welfare Benefit:
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>
                      {scheme.benefits}
                    </p>
                  </div>

                  {/* Decision Summary */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.6rem' }}>
                    {decisionExplanation}
                  </div>

                  {/* Expandable Transparency Accordion */}
                  <button 
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0, marginBottom: '0.6rem' }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{isExpanded ? 'Hide Criteria Breakdown' : 'View Matching & Unmet Criteria'}</span>
                  </button>

                  {isExpanded && (
                    <div className="why-qualify-list" style={{ marginTop: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                      {/* Matched Criteria */}
                      {matchedCriteria && matchedCriteria.length > 0 && (
                        <div style={{ marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            ✓ Matched Criteria ({matchedCriteria.length}):
                          </span>
                          {matchedCriteria.map((m, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid #34d399' }}>
                              {m.detail}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pending Verification Criteria */}
                      {pendingCriteria && pendingCriteria.length > 0 && (
                        <div style={{ marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            ⚠ Verification Required ({pendingCriteria.length}):
                          </span>
                          {pendingCriteria.map((p, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem', color: '#fde68a', marginBottom: '0.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid #fbbf24' }}>
                              {p.detail}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Unmet Criteria */}
                      {unmetCriteria && unmetCriteria.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            ✕ Unmet Criteria ({unmetCriteria.length}):
                          </span>
                          {unmetCriteria.map((u, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '0.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid #f87171' }}>
                              {u.detail}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Source Reference */}
                      {scheme.sourceReference && (
                        <div style={{ marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-glass)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <strong>Source:</strong> {scheme.sourceReference}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Row */}
                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-glass)' }}>
                  {/* Compare Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelectedToCompare}
                        onChange={() => handleToggleCompare(scheme.id)}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      Add to Compare
                    </label>

                    <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                      Deadline: {scheme.deadline || 'Ongoing'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => onSelectScheme(scheme, item)} 
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.55rem' }}
                    >
                      <Info size={14} /> Full Details
                    </button>

                    {status !== 'Not Eligible' && (
                      <button 
                        className="btn-primary" 
                        onClick={() => onOpenDraftModal(scheme)} 
                        style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.8rem', padding: '0.55rem' }}
                      >
                        <FileCheck size={14} /> Application Draft
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      {showComparisonModal && (
        <SchemeComparisonModal 
          schemes={schemesToCompare}
          evaluations={evaluationsMap}
          onClose={() => setShowComparisonModal(false)}
          onSelectScheme={(scheme, ev) => onSelectScheme(scheme, ev)}
          onApplyDraft={(scheme) => onOpenDraftModal(scheme)}
        />
      )}
    </div>
  );
}
