import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  FileText, 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  ShieldAlert, 
  Printer, 
  Check, 
  FileCheck, 
  HelpCircle,
  Building,
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ApplicationFormModal({ scheme, profile, onClose }) {
  if (!scheme) return null;

  const [contactNumber, setContactNumber] = useState(profile.mobileNumber || '');
  const [docChecklist, setDocChecklist] = useState(
    (scheme.requiredDocuments || []).reduce((acc, doc) => ({ ...acc, [doc]: false }), {})
  );
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [draftRefId] = useState(`YS-DRAFT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isGenerated, setIsGenerated] = useState(false);

  // Field validation
  const validateForm = () => {
    const errs = {};
    if (!profile.name || profile.name.trim().length < 2) {
      errs.name = "Full name is required in citizen profile.";
    }
    if (profile.age === undefined || profile.age === null || profile.age === '') {
      errs.age = "Valid age is required.";
    }
    if (!profile.state) {
      errs.state = "State of residence is required.";
    }
    if (contactNumber && !/^\d{10}$/.test(contactNumber.replace(/[\s-]/g, ''))) {
      errs.contact = "Contact number should be a valid 10-digit mobile number.";
    }
    if (!agreedToDisclaimer) {
      errs.disclaimer = "Please acknowledge that this is a preparation draft and not an official government submission.";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleDocItem = (doc) => {
    setDocChecklist(prev => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  // Generate PDF via jsPDF with prominent Draft Watermark & Disclaimers
  const generateDraftPDF = () => {
    if (!validateForm()) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Background Watermark text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(230, 235, 240);
      doc.text('DRAFT PREPARATION AID', 25, 140, { angle: 45 });
      doc.text('NOT OFFICIAL SUBMISSION', 20, 180, { angle: 45 });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 28, 'F');

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('Scheme Finder - Draft Application Summary', 14, 12);

      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text('Unofficial Pre-Filing Worksheet & Document Readiness Checklist', 14, 18);
      doc.text(`Worksheet Ref: ${draftRefId}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 23);

      // Prominent Warning Box
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.rect(14, 32, 182, 20, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(146, 64, 14); // amber-900
      doc.setFont('helvetica', 'bold');
      doc.text('IMPORTANT STATUTORY NOTICE:', 18, 38);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(
        'This document is a citizen preparation worksheet and NOT an official government submission. Actual submissions',
        18,
        43
      );
      doc.text(
        `must be submitted directly through the designated official portal: ${scheme.officialUrl}`,
        18,
        48
      );

      // Scheme Information Section
      let currentY = 58;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199); // sky-600
      doc.text('1. TARGET SCHEME INFORMATION', 14, currentY);

      currentY += 6;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 22, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Scheme Name: ${scheme.name}`, 18, currentY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ministry/Authority: ${scheme.ministry || scheme.authority}  |  Category: ${scheme.category}`, 18, currentY + 11);
      doc.text(`Official Application Portal: ${scheme.officialUrl}`, 18, currentY + 16);

      // Applicant Credentials Section
      currentY += 28;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text('2. APPLICANT CREDENTIALS', 14, currentY);

      currentY += 6;
      doc.rect(14, currentY, 182, 38, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      // Row 1
      doc.text(`Full Name: ${profile.name || 'N/A'}`, 18, currentY + 6);
      doc.text(`Age: ${profile.age || 'N/A'} Years`, 110, currentY + 6);

      // Row 2
      doc.text(`Gender: ${profile.gender || 'N/A'}`, 18, currentY + 13);
      doc.text(`Social Category: ${profile.category || 'General'}`, 110, currentY + 13);

      // Row 3
      doc.text(`State / District: ${profile.state || 'N/A'}, ${profile.district || 'N/A'}`, 18, currentY + 20);
      doc.text(`Occupation: ${profile.occupation || 'N/A'}`, 110, currentY + 20);

      // Row 4
      doc.text(`Annual Family Income: Rs. ${(profile.income || 0).toLocaleString('en-IN')}`, 18, currentY + 27);
      doc.text(`Education: ${profile.education || 'None'}`, 110, currentY + 27);

      // Row 5
      doc.text(`Benchmark Disability: ${profile.isDisabled ? 'Yes (40%+)' : 'No'}`, 18, currentY + 34);
      doc.text(`Contact: ${contactNumber || 'Not specified'}`, 110, currentY + 34);

      // Document Preparation Checklist Section
      currentY += 44;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text('3. REQUIRED DOCUMENTS CHECKLIST', 14, currentY);

      currentY += 6;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Verify you possess original and photocopies of each item before visiting the official portal or CSC center:', 14, currentY);

      currentY += 5;
      (scheme.requiredDocuments || []).forEach((item) => {
        const isChecked = docChecklist[item];
        doc.rect(18, currentY - 3, 3.5, 3.5);
        if (isChecked) {
          doc.setFont('helvetica', 'bold');
          doc.text('X', 18.5, currentY);
          doc.setFont('helvetica', 'normal');
        }
        doc.text(item, 25, currentY);
        currentY += 6;
      });

      // Official Submission Procedure Steps
      currentY += 4;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text('4. STEP-BY-STEP OFFICIAL PORTAL SUBMISSION GUIDE', 14, currentY);

      currentY += 6;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      (scheme.applicationProcedure || []).slice(0, 5).forEach((step, idx) => {
        const wrappedLines = doc.splitTextToSize(`${idx + 1}. ${step}`, 180);
        doc.text(wrappedLines, 14, currentY);
        currentY += (wrappedLines.length * 4.5);
      });

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Generated by Scheme Finder. Unofficial draft aid. All trademarks and scheme copyrights belong to their respective government ministries.',
        14,
        287
      );

      doc.save(`Draft_Summary_${scheme.id}_${draftRefId}.pdf`);
      setIsGenerated(true);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print stream if jsPDF throws unexpected canvas issue
      printDocumentSummary();
    }
  };

  const printDocumentSummary = () => {
    if (!validateForm()) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Draft Application Worksheet - ${draftRefId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
          .draft-banner { background: #fef3c7; border: 2px solid #f59e0b; padding: 12px; border-radius: 6px; color: #92400e; font-size: 13px; font-weight: bold; margin-bottom: 20px; text-align: center; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; color: #0284c7; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; }
          .checklist { list-style: none; padding: 0; font-size: 13px; }
          .checklist li { margin-bottom: 6px; }
          .footer { font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="draft-banner">
          DRAFT APPLICATION WORKSHEET & PREPARATION SUMMARY (NOT AN OFFICIAL SUBMISSION)<br>
          <span style="font-weight: normal; font-size: 12px;">Official applications must be submitted directly on: ${scheme.officialUrl}</span>
        </div>

        <div class="header">
          <h2 style="margin: 0; color: #0284c7;">Scheme Finder - Application Preparation Draft</h2>
          <p style="margin: 4px 0; font-size: 12px; color: #64748b;">Reference ID: ${draftRefId} | Date: ${new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div class="section">
          <div class="section-title">TARGET SCHEME</div>
          <div class="box">
            <strong>${scheme.name}</strong><br>
            Authority: ${scheme.ministry || scheme.authority} | Category: ${scheme.category}<br>
            Benefit: ${scheme.benefits}<br>
            Official Portal: ${scheme.officialUrl}
          </div>
        </div>

        <div class="section">
          <div class="section-title">APPLICANT CREDENTIALS</div>
          <div class="grid">
            <div class="box"><strong>Name:</strong> ${profile.name}</div>
            <div class="box"><strong>Age / Gender:</strong> ${profile.age} Yrs / ${profile.gender}</div>
            <div class="box"><strong>Location:</strong> ${profile.state}, ${profile.district}</div>
            <div class="box"><strong>Occupation:</strong> ${profile.occupation}</div>
            <div class="box"><strong>Category:</strong> ${profile.category}</div>
            <div class="box"><strong>Annual Income:</strong> ₹${(profile.income || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">REQUIRED SUPPORTING DOCUMENTS CHECKLIST</div>
          <ul class="checklist">
            ${(scheme.requiredDocuments || []).map(d => `<li>[ ${docChecklist[d] ? 'X' : ' '} ] ${d}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          This worksheet is provided as a preparation checklist. Please proceed to the official government portal to complete your official registration.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setIsGenerated(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '750px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
                Application Draft & Readiness Worksheet
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Pre-submission review and checklist for {scheme.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem' }}>
          {/* Statutory Draft Disclaimer Banner */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid #f59e0b',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.8rem',
            alignItems: 'flex-start'
          }}>
            <ShieldAlert size={22} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ color: '#fbbf24', fontSize: '0.9rem', margin: '0 0 0.3rem 0', fontWeight: 700 }}>
                DRAFT SUMMARY & CHECKLIST — NOT AN OFFICIAL GOVERNMENT SUBMISSION
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                This tool prepares a verified draft summary to help you gather required documents and review your qualifications. <strong>Official applications can only be submitted directly through the designated government portal.</strong>
              </p>
            </div>
          </div>

          {/* Validation Alert */}
          {Object.keys(validationErrors).length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '0.8rem 1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <AlertCircle size={16} /> Required Information Incomplete
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                {Object.values(validationErrors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Applicant Pre-filled Summary */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', marginBottom: '0.6rem', fontWeight: 700 }}>
              Applicant Credentials (From Profile)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Applicant Name</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.name || 'Not provided'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Age / Gender</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.age || 'N/A'} Yrs / {profile.gender}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>State & District</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.state}, {profile.district}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Occupation & Category</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.occupation} ({profile.category})</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Annual Family Income</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>₹{(profile.income || 0).toLocaleString('en-IN')}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Mobile Contact</span>
                <input 
                  type="text"
                  placeholder="10-digit mobile"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    width: '100%',
                    marginTop: '2px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Document Readiness Checklist */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fbbf24', marginBottom: '0.4rem', fontWeight: 700 }}>
              Required Supporting Documents Checklist
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Check off the documents you have ready before heading to the official government portal:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(scheme.requiredDocuments || []).map((doc, idx) => (
                <label 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.6rem', 
                    fontSize: '0.85rem', 
                    color: docChecklist[doc] ? '#34d399' : 'var(--text-main)',
                    cursor: 'pointer',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    background: docChecklist[doc] ? 'rgba(5, 150, 105, 0.1)' : 'transparent'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={!!docChecklist[doc]}
                    onChange={() => toggleDocItem(doc)}
                    style={{ accentColor: '#34d399' }}
                  />
                  <span>{doc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mandatory User Consent & Acknowledgment */}
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={agreedToDisclaimer}
                onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
                style={{ marginTop: '3px', accentColor: '#38bdf8' }}
              />
              <span>
                I understand that this is a <strong>preparation summary draft</strong> for informational purposes. Final eligibility evaluation, document verification, and statutory benefit approval can only be processed on the official government website.
              </span>
            </label>
          </div>

          {/* Actions: Download PDF Draft & Proceed to Official Portal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={generateDraftPDF}
                style={{ fontSize: '0.85rem' }}
                title="Download formatted draft PDF summary"
              >
                <Download size={15} /> Download PDF Draft
              </button>

              <button 
                type="button" 
                className="btn-secondary"
                onClick={printDocumentSummary}
                style={{ fontSize: '0.85rem' }}
                title="Print or save worksheet"
              >
                <Printer size={15} /> Print Worksheet
              </button>
            </div>

            <a 
              href={scheme.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: '0.9rem', padding: '0.75rem 1.4rem' }}
            >
              <span>Submit on Official Portal</span>
              <ExternalLink size={15} />
            </a>
          </div>

          {isGenerated && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(5, 150, 105, 0.15)', border: '1px solid #059669', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> Draft application worksheet generated successfully! Keep it as a guide while applying on the official portal.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
