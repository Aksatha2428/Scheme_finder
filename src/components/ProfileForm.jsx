import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  IndianRupee, 
  Award, 
  CheckCircle, 
  Sparkles, 
  AlertCircle, 
  RotateCcw, 
  Download, 
  ShieldCheck,
  Check,
  Building,
  HeartHandshake
} from 'lucide-react';
import { STATES_AND_DISTRICTS, OCCUPATIONS, CATEGORIES, EDUCATION_LEVELS } from '../data/statesAndDistricts';

const PROFILE_PRESETS = [
  {
    label: "Small Farmer (TN)",
    profile: {
      name: "Murugan Selvam",
      age: 42,
      gender: "Male",
      state: "Tamil Nadu",
      district: "Madurai",
      occupation: "Farmer",
      category: "OBC",
      education: "Class 10th Passed",
      income: 180000,
      isDisabled: false,
      maritalStatus: "Married",
      ownsLand: true,
      hasBplCard: false,
      isStudent: false
    }
  },
  {
    label: "College Student (SC)",
    profile: {
      name: "Ananya Priya",
      age: 20,
      gender: "Female",
      state: "Tamil Nadu",
      district: "Chennai",
      occupation: "Student",
      category: "SC",
      education: "Class 12th Passed",
      income: 120000,
      isDisabled: false,
      maritalStatus: "Single",
      ownsLand: false,
      hasBplCard: true,
      isStudent: true
    }
  },
  {
    label: "Street Vendor (All India)",
    profile: {
      name: "Ramesh Sharma",
      age: 36,
      gender: "Male",
      state: "Uttar Pradesh",
      district: "Lucknow",
      occupation: "Street Vendor",
      category: "OBC",
      education: "Class 8th Passed",
      income: 150000,
      isDisabled: false,
      maritalStatus: "Married",
      ownsLand: false,
      hasBplCard: true,
      isStudent: false
    }
  },
  {
    label: "Woman Artisan (MP)",
    profile: {
      name: "Sunita Bai",
      age: 34,
      gender: "Female",
      state: "Madhya Pradesh",
      district: "Bhopal",
      occupation: "Artisan",
      category: "General",
      education: "Class 5th Passed",
      income: 160000,
      isDisabled: false,
      maritalStatus: "Married",
      ownsLand: false,
      hasBplCard: true,
      isStudent: false
    }
  }
];

export default function ProfileForm({ profile, setProfile, onCheckEligibility }) {
  const [errors, setErrors] = useState({});
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Validate fields
  const validate = (data = profile) => {
    const errs = {};
    if (!data.name || data.name.trim().length < 2) {
      errs.name = "Full name is required (min 2 characters).";
    }
    if (data.age === undefined || data.age === '' || isNaN(data.age) || data.age < 0 || data.age > 115) {
      errs.age = "Please enter a valid age between 0 and 115.";
    }
    if (data.income === undefined || data.income === '' || isNaN(data.income) || data.income < 0) {
      errs.income = "Please enter a valid non-negative income.";
    }
    if (!data.state) {
      errs.state = "Please select a state of residence.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, val) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: val };
      validate(updated);
      return updated;
    });
  };

  const handleStateChange = (stateName) => {
    const availableDistricts = STATES_AND_DISTRICTS[stateName] || [];
    setProfile(prev => ({
      ...prev,
      state: stateName,
      district: availableDistricts.length > 0 ? availableDistricts[0] : ''
    }));
  };

  const handleApplyPreset = (preset) => {
    setProfile(preset.profile);
    setErrors({});
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset profile information to defaults?")) {
      setProfile({
        name: '',
        age: 25,
        gender: 'Male',
        state: 'Tamil Nadu',
        district: 'Chennai',
        occupation: 'Farmer',
        category: 'OBC',
        education: 'Class 10th Passed',
        income: 180000,
        isDisabled: false,
        maritalStatus: 'Single',
        ownsLand: true,
        hasBplCard: false,
        isStudent: false
      });
      setErrors({});
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `citizen_profile_${profile.name ? profile.name.replace(/\s+/g, '_') : 'data'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onCheckEligibility();
    }
  };

  // Calculate profile completion percentage
  const fieldsToCheck = ['name', 'age', 'gender', 'state', 'district', 'occupation', 'category', 'education', 'income', 'maritalStatus'];
  const filledCount = fieldsToCheck.filter(f => profile[f] !== undefined && profile[f] !== '').length;
  const completionPercent = Math.round((filledCount / fieldsToCheck.length) * 100);

  const currentDistricts = profile.state && STATES_AND_DISTRICTS[profile.state] 
    ? STATES_AND_DISTRICTS[profile.state] 
    : [];

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '850px', margin: '0 auto' }}>
      {/* Header and Title */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.6rem' }}>
          <ShieldCheck size={14} /> Citizen Profile & Demographic Configuration
        </div>
        <h2 style={{ fontSize: '1.65rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Verified Citizen Profile Form
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '640px', margin: '0 auto' }}>
          Input verified demographic, occupational, and income credentials. The evaluation engine applies strict statutory criteria to accurately assess scheme benefits.
        </p>

        {/* Profile Completeness Bar */}
        <div style={{ maxWidth: '400px', margin: '1rem auto 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
            <span>Profile Completeness</span>
            <span style={{ fontWeight: 700, color: completionPercent === 100 ? '#34d399' : '#38bdf8' }}>{completionPercent}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${completionPercent}%`, 
                background: completionPercent === 100 ? '#34d399' : '#38bdf8',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
        </div>

        {/* Persona Presets */}
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
          {PROFILE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Full Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input 
              type="text" 
              className="search-input" 
              placeholder="e.g. Ramesh Chandra"
              value={profile.name || ''} 
              onChange={(e) => handleChange('name', e.target.value)}
              style={{ width: '100%', borderColor: errors.name ? '#f87171' : undefined }}
            />
            {errors.name && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.name}</p>}
          </div>

          {/* Age */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Age (Years): <span style={{ color: '#38bdf8' }}>{profile.age ?? 25}</span> <span style={{ color: '#f87171' }}>*</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={profile.age ?? 25} 
                onChange={(e) => handleChange('age', parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: '#38bdf8' }}
              />
              <input 
                type="number"
                min="0"
                max="115"
                value={profile.age ?? 25}
                onChange={(e) => handleChange('age', parseInt(e.target.value, 10) || 0)}
                style={{ width: '65px', padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', textAlign: 'center' }}
              />
            </div>
            {errors.age && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.age}</p>}
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Gender <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select 
              className="select-dropdown" 
              value={profile.gender || 'Male'} 
              onChange={(e) => handleChange('gender', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Transgender">Transgender</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              State of Domicile <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select 
              className="select-dropdown" 
              value={profile.state || 'Tamil Nadu'} 
              onChange={(e) => handleStateChange(e.target.value)}
              style={{ width: '100%' }}
            >
              {Object.keys(STATES_AND_DISTRICTS).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            {errors.state && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.state}</p>}
          </div>

          {/* District */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              District
            </label>
            <select 
              className="select-dropdown" 
              value={profile.district || (currentDistricts[0] || '')} 
              onChange={(e) => handleChange('district', e.target.value)}
              style={{ width: '100%' }}
            >
              {currentDistricts.map((dst) => (
                <option key={dst} value={dst}>{dst}</option>
              ))}
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Primary Occupation
            </label>
            <select 
              className="select-dropdown" 
              value={profile.occupation || 'Farmer'} 
              onChange={(e) => handleChange('occupation', e.target.value)}
              style={{ width: '100%' }}
            >
              {OCCUPATIONS.map((occ) => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
          </div>

          {/* Social Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Social Category (Reservation Status)
            </label>
            <select 
              className="select-dropdown" 
              value={profile.category || 'General'} 
              onChange={(e) => handleChange('category', e.target.value)}
              style={{ width: '100%' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Highest Education */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Highest Educational Qualification
            </label>
            <select 
              className="select-dropdown" 
              value={profile.education || 'Class 10th Passed'} 
              onChange={(e) => handleChange('education', e.target.value)}
              style={{ width: '100%' }}
            >
              {EDUCATION_LEVELS.map((edu) => (
                <option key={edu} value={edu}>{edu}</option>
              ))}
            </select>
          </div>

          {/* Annual Family Income */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Annual Family Income: <span style={{ color: '#34d399' }}>₹{(profile.income || 0).toLocaleString('en-IN')}</span> <span style={{ color: '#f87171' }}>*</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" 
                max="2000000" 
                step="10000"
                value={profile.income ?? 180000} 
                onChange={(e) => handleChange('income', parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: '#34d399' }}
              />
              <input 
                type="number"
                min="0"
                step="5000"
                value={profile.income ?? 180000}
                onChange={(e) => handleChange('income', parseInt(e.target.value, 10) || 0)}
                style={{ width: '100px', padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', textAlign: 'right' }}
              />
            </div>
            {errors.income && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.income}</p>}
          </div>

          {/* Marital Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Marital Status
            </label>
            <select 
              className="select-dropdown" 
              value={profile.maritalStatus || 'Single'} 
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="Single">Single / Unmarried</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>

          {/* Benchmark Disability */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Benchmark Disability (UDID 40%+)
            </label>
            <select 
              className="select-dropdown" 
              value={profile.isDisabled ? "Yes" : "No"} 
              onChange={(e) => handleChange('isDisabled', e.target.value === "Yes")}
              style={{ width: '100%' }}
            >
              <option value="No">No</option>
              <option value="Yes">Yes (Possesses 40%+ Disability Card)</option>
            </select>
          </div>

          {/* Scheme Specific Conditions Grid */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '0.6rem', fontWeight: 700 }}>
              Specific Verification Attributes (Enhances Precision)
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* Owns Cultivable Land */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Owns Cultivable Land? (e.g. for PM-KISAN)
                </label>
                <select 
                  className="select-dropdown" 
                  value={profile.ownsLand ? "Yes" : "No"} 
                  onChange={(e) => handleChange('ownsLand', e.target.value === "Yes")}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="Yes">Yes (Has Land Record / Patta)</option>
                  <option value="No">No Land Owned</option>
                </select>
              </div>

              {/* BPL / Ration Card */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Has BPL / Antyodaya Ration Card?
                </label>
                <select 
                  className="select-dropdown" 
                  value={profile.hasBplCard ? "Yes" : "No"} 
                  onChange={(e) => handleChange('hasBplCard', e.target.value === "Yes")}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="No">No / APL / Standard</option>
                  <option value="Yes">Yes (BPL / Antyodaya / SECC)</option>
                </select>
              </div>

              {/* Currently Enrolled Student */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Currently Enrolled in Recognized Institution?
                </label>
                <select 
                  className="select-dropdown" 
                  value={profile.isStudent ? "Yes" : "No"} 
                  onChange={(e) => handleChange('isStudent', e.target.value === "Yes")}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="No">No / Finished Studies</option>
                  <option value="Yes">Yes (Active Student)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleReset}
              style={{ fontSize: '0.85rem' }}
              title="Reset profile inputs"
            >
              <RotateCcw size={15} /> Reset
            </button>

            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleExportJSON}
              style={{ fontSize: '0.85rem' }}
              title="Export profile as JSON backup"
            >
              <Download size={15} /> Export JSON
            </button>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', justifyContent: 'center' }}
          >
            <Sparkles size={18} /> Analyze Scheme Eligibility
          </button>
        </div>

        {showExportSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: 'rgba(5, 150, 105, 0.2)', border: '1px solid #059669', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> Profile exported successfully as JSON file.
          </div>
        )}
      </form>
    </div>
  );
}
