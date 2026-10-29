import React from 'react';
import { ShieldCheck, Moon, Sun, Volume2, VolumeX, Sparkles, Lock, Bookmark } from 'lucide-react';

export default function Header({ 
  theme, 
  setTheme, 
  audioEnabled, 
  setAudioEnabled, 
  language, 
  setLanguage,
  onOpenOCR,
  onOpenPrivacy,
  savedCount = 0,
  onViewSaved
}) {
  return (
    <header className="header-bar">
      <div className="header-logo-group">
        <div className="logo-badge">
          SF
        </div>
        <div className="logo-text">
          <h1>Scheme Finder</h1>
          <p>Government Scheme Discovery & Application Assistance System</p>
        </div>
      </div>

      <div className="header-controls">
        {/* Bookmarked schemes pill if any */}
        {savedCount > 0 && (
          <button 
            className="btn-ctrl"
            onClick={onViewSaved}
            style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8' }}
            title="View Bookmarked Schemes"
          >
            <Bookmark size={15} />
            <span>Saved ({savedCount})</span>
          </button>
        )}

        {/* Privacy & Data Management */}
        <button 
          className="btn-ctrl" 
          onClick={onOpenPrivacy}
          title="Citizen Privacy & Local Data Management"
        >
          <Lock size={15} color="#38bdf8" />
          <span>Privacy & Data</span>
        </button>

        {/* Voice Toggle */}
        <button 
          className="btn-ctrl" 
          onClick={() => setAudioEnabled(!audioEnabled)}
          title="Toggle Text-to-Speech Voice Guidance"
        >
          {audioEnabled ? <Volume2 size={16} color="#34d399" /> : <VolumeX size={16} />}
          <span>{audioEnabled ? "Voice ON" : "Voice OFF"}</span>
        </button>

        {/* Smart OCR shortcut */}
        <button 
          className="btn-ctrl" 
          onClick={onOpenOCR}
          style={{ background: 'rgba(2, 132, 199, 0.15)', borderColor: '#0284c7' }}
          title="Document Verification & Form Builder"
        >
          <Sparkles size={15} color="#38bdf8" />
          <span>OCR Scanner</span>
        </button>

        {/* Language selector */}
        <select 
          className="btn-ctrl" 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={{ cursor: 'pointer' }}
          aria-label="Interface Language"
        >
          <option value="en">English (English)</option>
          <option value="hi">हिंदी (Hindi)</option>
          <option value="ta">தமிழ் (Tamil)</option>
        </select>

        {/* Theme Toggle */}
        <button 
          className="btn-ctrl" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light/Dark Theme"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#1e40af" />}
        </button>
      </div>
    </header>
  );
}
