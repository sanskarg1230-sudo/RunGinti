import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Download, Upload, Trash2, Info, ChevronRight, Palette
} from 'lucide-react';
import { getAllMatches, deleteMatch, db } from '../db/database';
import { exportAllJSON, importFromJSON } from '../utils/exportJSON';
import { showToast } from '../components/Toast';

function SettingsItem({ icon, label, description, right, onClick, danger }) {
  return (
    <motion.div
      className="settings-item"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...(danger ? { color: 'var(--color-danger)' } : {}) }}
      whileHover={onClick ? { backgroundColor: 'var(--bg-surface-3)' } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: danger ? '#fee2e2' : 'var(--bg-surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: danger ? 'var(--color-danger)' : 'var(--text-secondary)',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: danger ? 'var(--color-danger)' : 'var(--text-primary)' }}>{label}</div>
          {description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
        </div>
      </div>
      {right && <div style={{ marginLeft: 8 }}>{right}</div>}
    </motion.div>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportAll = async () => {
    const matches = await getAllMatches();
    exportAllJSON(matches);
    showToast(`Exported ${matches.length} matches 💾`);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const matches = await importFromJSON(file);
      for (const m of matches) {
        const { id, ...matchData } = m;
        const newId = await createMatch(matchData);
        // Import players if embedded
        if (m.players) {
          for (const p of m.players) {
            const { id: pid, matchId: _, ...pData } = p;
            await db.players.add({ ...pData, matchId: newId });
          }
        }
        // Import innings
        if (m.innings) {
          await db.matches.update(newId, { innings: m.innings, status: m.status, result: m.result });
        }
      }
      showToast(`Imported ${matches.length} match${matches.length !== 1 ? 'es' : ''} ✅`);
    } catch (err) {
      showToast('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'This will permanently delete ALL matches and data. This cannot be undone. Are you sure?'
    );
    if (!confirmed) return;
    const confirmed2 = window.confirm('Are you absolutely sure? All data will be lost forever.');
    if (!confirmed2) return;
    const matches = await getAllMatches();
    for (const m of matches) await deleteMatch(m.id);
    showToast('All data cleared 🗑️');
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Top Header */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Settings
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: 8, borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
        </div>
      </header>

      <div className="container" style={{ padding: '0 16px' }}>
        {/* Appearance */}
        <p className="section-title">Appearance</p>
        <motion.div className="card" style={{ marginBottom: 16, overflow: 'hidden' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <SettingsItem
            icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            label="Dark Mode"
            description={theme === 'dark' ? 'Currently dark theme' : 'Currently light theme'}
            right={
              <label className="toggle-switch">
                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className="toggle-slider" />
              </label>
            }
          />
        </motion.div>

        {/* Data Management */}
        <p className="section-title">Data Management</p>
        <motion.div className="card" style={{ marginBottom: 16, overflow: 'hidden' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <SettingsItem
            icon={<Download size={18} />}
            label="Export All Data"
            description="Download all matches as JSON backup"
            right={<ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
            onClick={handleExportAll}
          />
          <SettingsItem
            icon={importing ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <Upload size={18} />}
            label="Import Backup"
            description="Restore matches from a JSON file"
            right={<ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </motion.div>

        {/* Danger Zone */}
        <p className="section-title" style={{ color: 'var(--color-danger)' }}>Danger Zone</p>
        <motion.div className="card" style={{ marginBottom: 16, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.2)' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(239, 68, 68, 0.12)' }}>
          <SettingsItem
            icon={<Trash2 size={18} />}
            label="Clear All Data"
            description="Permanently delete all matches and history"
            right={<ChevronRight size={16} style={{ color: 'var(--color-danger)' }} />}
            onClick={handleClearAll}
            danger
          />
        </motion.div>

        {/* About */}
        <p className="section-title">About</p>
        <motion.div className="card" style={{ marginBottom: 16, overflow: 'hidden' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
            <motion.div 
              style={{ fontSize: '3rem', marginBottom: 12, display: 'inline-block' }}
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >🏏</motion.div>
            <div style={{ fontWeight: 900, fontSize: '1.4rem', marginBottom: 4, background: 'linear-gradient(135deg, var(--color-primary), #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RunGinti</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, letterSpacing: '0.05em' }}>VERSION 1.0.0</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
              A premium offline cricket scoring app. Works completely offline — no internet required. All data is stored locally.
            </div>
            <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--bg-surface-2)', borderRadius: 12, fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--color-primary)' }}>📱</span> Install as PWA for the best experience
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
