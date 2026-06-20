import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Minus, X, Save, FolderOpen, Trash2, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { createMatch, addPlayers, saveTeam, getAllSavedTeams, getSavedTeamWithPlayers, deleteSavedTeam } from '../db/database';
import { MATCH_TYPES } from '../utils/cricketEngine';
import { showToast } from '../components/Toast';

const STEPS = ['Match Setup', 'Team A Players', 'Team B Players', 'Toss'];

const MATCH_TYPE_OVERS = {
  [MATCH_TYPES.T20]: 20,
  [MATCH_TYPES.ODI]: 50,
  [MATCH_TYPES.TEST]: 0,
  [MATCH_TYPES.CUSTOM]: 20,
};

function defaultPlayers(count = 11) {
  return Array.from({ length: count }, (_, i) => ({
    name: '',
    number: i + 1,
    role: 'Batsman',
  }));
}

// ── Save Team Modal ───────────────────────────────────────────────────────────
function SaveTeamModal({ teamName, players, onClose, onSaved }) {
  const [name, setName] = useState(teamName || '');
  const [saving, setSaving] = useState(false);

  const validCount = players.filter(p => p.name?.trim()).length;

  const handleSave = async () => {
    if (!name.trim()) { showToast('Enter a team name'); return; }
    if (validCount === 0) { showToast('Add at least one player'); return; }
    setSaving(true);
    try {
      await saveTeam(name, players);
      showToast(`"${name}" saved with ${validCount} players ✅`);
      onSaved();
      onClose();
    } catch (e) {
      showToast('Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal centered"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>💾</div>
          <div className="modal-title" style={{ marginBottom: 4 }}>Save Team</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {validCount} player{validCount !== 1 ? 's' : ''} will be saved
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Team Name</label>
          <input
            className="form-input"
            placeholder="e.g. Mumbai Indians"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Player preview */}
        <div style={{
          background: 'var(--bg-surface-2)',
          borderRadius: 8,
          padding: '10px 12px',
          maxHeight: 160,
          overflowY: 'auto',
          marginBottom: 16,
        }}>
          {players.filter(p => p.name?.trim()).map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 24 }}>#{p.number}</span>
              <span style={{ fontWeight: 600, flex: 1 }}>{p.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{p.role}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><Save size={16} /> Save Team</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Load Team Modal ───────────────────────────────────────────────────────────
function LoadTeamModal({ onLoad, onClose }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const t = await getAllSavedTeams();
    setTeams(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSelect = async (team) => {
    const full = await getSavedTeamWithPlayers(team.id);
    if (!full) return;
    onLoad(full.players.map(p => ({ name: p.name, number: p.number, role: p.role })));
    onClose();
    showToast(`Loaded "${team.name}" (${full.players.length} players) ✅`);
  };

  const handleDelete = async (e, teamId) => {
    e.stopPropagation();
    setDeleting(teamId);
    await deleteSavedTeam(teamId);
    showToast('Team deleted');
    await load();
    setDeleting(null);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal animate-slide-up"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
      >
        <div className="modal-handle" />
        <div className="modal-title">📂 Load Saved Team</div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div className="spinner" />
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-state-icon">🏏</div>
            <h3>No saved teams yet</h3>
            <p>Fill in players and tap "Save Team" to create one.</p>
          </div>
        ) : (
          <div className="player-list">
            {teams.map(team => (
              <motion.button
                key={team.id}
                className="player-option"
                style={{ justifyContent: 'space-between' }}
                onClick={() => handleSelect(team)}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="player-avatar">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{team.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {team.playerCount || '?'} players • Saved {new Date(team.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <button
                  style={{
                    background: '#fee2e2', color: '#dc2626', border: 'none',
                    borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onClick={e => handleDelete(e, team.id)}
                  disabled={deleting === team.id}
                >
                  {deleting === team.id
                    ? <span className="spinner" style={{ width: 14, height: 14 }} />
                    : <Trash2 size={14} />
                  }
                </button>
              </motion.button>
            ))}
          </div>
        )}

        <button className="btn btn-ghost btn-full" style={{ marginTop: 12 }} onClick={onClose}>
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

// ── Main CreateMatch ──────────────────────────────────────────────────────────
export default function CreateMatch() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showSaveTeam, setShowSaveTeam] = useState(null);   // 0 = team A, 1 = team B
  const [showLoadTeam, setShowLoadTeam] = useState(null);   // 0 = team A, 1 = team B

  const [form, setForm] = useState({
    name: '',
    matchType: MATCH_TYPES.T20,
    totalOvers: 20,
    venue: '',
    teams: ['', ''],
    tossWinner: '',
    electedTo: 'bat',
    lastManStanding: false,
    playersPerTeam: 11,
  });

  const [teamAPlayers, setTeamAPlayers] = useState(defaultPlayers(11));
  const [teamBPlayers, setTeamBPlayers] = useState(defaultPlayers(11));

  // Update overs when match type changes
  useEffect(() => {
    if (form.matchType !== MATCH_TYPES.CUSTOM) {
      setForm(f => ({ ...f, totalOvers: MATCH_TYPE_OVERS[f.matchType] }));
    }
  }, [form.matchType]);

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // Adjust team arrays when playersPerTeam changes
  useEffect(() => {
    const newCount = form.playersPerTeam || 11;
    const adjustPlayers = (prev) => {
      if (newCount > prev.length) {
        return [...prev, ...Array.from({length: newCount - prev.length}, (_, i) => ({ name: '', number: prev.length + i + 1, role: 'Batsman' }))];
      } else {
        return prev.slice(0, newCount);
      }
    };
    setTeamAPlayers(adjustPlayers);
    setTeamBPlayers(adjustPlayers);
  }, [form.playersPerTeam]);

  const updatePlayer = (team, index, field, value) => {
    const setter = team === 0 ? setTeamAPlayers : setTeamBPlayers;
    setter(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPlayer = (team) => {
    const players = team === 0 ? teamAPlayers : teamBPlayers;
    const setter = team === 0 ? setTeamAPlayers : setTeamBPlayers;
    setter([...players, { name: '', number: players.length + 1, role: 'Batsman' }]);
  };

  const removePlayer = (team, index) => {
    const setter = team === 0 ? setTeamAPlayers : setTeamBPlayers;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  // Load a saved team into the player list
  const handleLoadTeam = (teamIdx, players) => {
    // Pad/trim to fit but keep all players from the saved team
    const filled = players.map((p, i) => ({
      name: p.name || '',
      number: p.number || i + 1,
      role: p.role || 'Batsman',
    }));
    if (teamIdx === 0) setTeamAPlayers(filled.length > 0 ? filled : defaultPlayers(11));
    else setTeamBPlayers(filled.length > 0 ? filled : defaultPlayers(11));
  };

  const canProceed = () => {
    if (step === 0) {
      return form.name.trim() && form.teams[0].trim() && form.teams[1].trim() &&
        form.teams[0].trim() !== form.teams[1].trim();
    }
    if (step === 1) return teamAPlayers.some(p => p.name.trim());
    if (step === 2) return teamBPlayers.some(p => p.name.trim());
    if (step === 3) return form.tossWinner;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      showToast(
        step === 0
          ? 'Fill match name and unique team names'
          : step === 3
          ? 'Select toss winner'
          : 'Add at least one player'
      );
      return;
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleStart();
  };

  const handleStart = async () => {
    setSaving(true);
    try {
      const matchId = await createMatch({
        name: form.name.trim(),
        matchType: form.matchType,
        totalOvers: Number(form.totalOvers),
        venue: form.venue.trim(),
        teams: [form.teams[0].trim(), form.teams[1].trim()],
        tossWinner: form.tossWinner,
        electedTo: form.electedTo,
        lastManStanding: form.lastManStanding,
        innings: [],
        currentInnings: 0,
        status: 'live',
      });

      const aValid = teamAPlayers.filter(p => p.name.trim());
      const bValid = teamBPlayers.filter(p => p.name.trim());
      await addPlayers(matchId, 0, aValid);
      await addPlayers(matchId, 1, bValid);

      navigate(`/match/${matchId}/live`, { replace: true });
    } catch (e) {
      showToast('Failed to create match');
      setSaving(false);
    }
  };

  const currentTeamIdx = step === 1 ? 0 : step === 2 ? 1 : null;
  const currentPlayers = currentTeamIdx === 0 ? teamAPlayers : teamBPlayers;

  const renderStep = () => {
    switch (step) {
      case 0: return <StepMatchSetup form={form} updateForm={updateForm} />;
      case 1:
        return (
          <StepPlayers
            teamName={form.teams[0] || 'Team A'}
            players={teamAPlayers}
            onChange={(i, f, v) => updatePlayer(0, i, f, v)}
            onAdd={() => addPlayer(0)}
            onRemove={i => removePlayer(0, i)}
            onSaveTeam={() => setShowSaveTeam(0)}
            onLoadTeam={() => setShowLoadTeam(0)}
          />
        );
      case 2:
        return (
          <StepPlayers
            teamName={form.teams[1] || 'Team B'}
            players={teamBPlayers}
            onChange={(i, f, v) => updatePlayer(1, i, f, v)}
            onAdd={() => addPlayer(1)}
            onRemove={i => removePlayer(1, i)}
            onSaveTeam={() => setShowSaveTeam(1)}
            onLoadTeam={() => setShowLoadTeam(1)}
          />
        );
      case 3: return <StepToss form={form} updateForm={updateForm} />;
      default: return null;
    }
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Top Header */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)} style={{ padding: 6, borderRadius: '50%' }}>
            <ChevronLeft size={24} color="var(--text-primary)" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Create Match
            </h1>
            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-secondary)' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: 8, borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, maxWidth: 680, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= step ? 'var(--color-primary)' : 'var(--border-color)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20, paddingBottom: 32 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={18} /> Previous
            </button>
          )}

          {step === 0 && (
            <div className="card" style={{ marginBottom: 16, width: '100%' }}>
              <div className="card-body">
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.lastManStanding}
                    onChange={e => updateForm('lastManStanding', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Last Man Standing</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allow the last batsman to bat alone without a non-striker.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleNext}
            disabled={saving}
          >
            {saving
              ? <span className="spinner" />
              : step === STEPS.length - 1
              ? '🏏 Start Match'
              : <> Next <ChevronRight size={18} /></>
            }
          </button>
        </div>
      </div>

      {/* Save Team Modal */}
      <AnimatePresence>
        {showSaveTeam !== null && (
          <SaveTeamModal
            teamName={form.teams[showSaveTeam] || ''}
            players={showSaveTeam === 0 ? teamAPlayers : teamBPlayers}
            onClose={() => setShowSaveTeam(null)}
            onSaved={() => {}}
          />
        )}
        {showLoadTeam !== null && (
          <LoadTeamModal
            onLoad={(players) => handleLoadTeam(showLoadTeam, players)}
            onClose={() => setShowLoadTeam(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step: Match Setup ─────────────────────────────────────────────────────────
function StepMatchSetup({ form, updateForm }) {
  return (
    <div>
      <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8 }}>BASIC INFORMATION</p>
      <div className="card" style={{ marginBottom: 24, background: 'var(--bg-surface-2)', border: 'none' }}>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Match Name</label>
            <input
              className="form-input"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '10px 14px' }}
              placeholder="e.g. India vs Australia"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Team A Name</label>
            <input
              className="form-input"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '10px 14px' }}
              placeholder="e.g. India"
              value={form.teams[0]}
              onChange={e => updateForm('teams', [e.target.value, form.teams[1]])}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Team B Name</label>
            <input
              className="form-input"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '10px 14px' }}
              placeholder="e.g. Australia"
              value={form.teams[1]}
              onChange={e => updateForm('teams', [form.teams[0], e.target.value])}
            />
          </div>
        </div>
      </div>

      <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Match Type</p>
      <div className="card" style={{ marginBottom: 24, background: 'var(--bg-surface-2)', border: 'none' }}>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
              {Object.values(MATCH_TYPES).map(type => (
                <button
                  key={type}
                  onClick={() => updateForm('matchType', type)}
                  style={{
                    padding: '8px 4px', borderRadius: 8, border: 'none',
                    background: form.matchType === type ? 'var(--color-primary)' : 'var(--bg-surface)',
                    color: form.matchType === type ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontSize: '0.8rem',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', background: 'var(--color-primary-ultra-light)', borderRadius: 8, border: '1px solid rgba(22, 163, 74, 0.2)' }}>
              <span style={{ color: 'var(--color-primary)' }}>ℹ️</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {form.matchType} Match • {form.totalOvers} Overs • {form.playersPerTeam || 11} Players
              </span>
            </div>
          </div>

        </div>
      </div>

      <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Match Settings</p>
      <div className="card" style={{ marginBottom: 24, background: 'var(--bg-surface-2)', border: 'none' }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Overs Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>⏱️</span> Overs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', background: 'var(--bg-surface)' }} onClick={() => updateForm('totalOvers', Math.max(1, form.totalOvers - 1))}>
                <Minus size={14} />
              </button>
              <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{form.totalOvers}</span>
              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', background: 'var(--bg-surface)' }} onClick={() => updateForm('totalOvers', form.totalOvers + 1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Players Per Team Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
              <Users size={16} /> Players Per Team
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                style={{ padding: '4px 8px', background: 'var(--bg-surface)' }} 
                onClick={() => updateForm('playersPerTeam', Math.max(2, (form.playersPerTeam || 11) - 1))}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{form.playersPerTeam || 11}</span>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                style={{ padding: '4px 8px', background: 'var(--bg-surface)' }} 
                onClick={() => updateForm('playersPerTeam', Math.min(15, (form.playersPerTeam || 11) + 1))}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* End Match Settings */}
        </div>
      </div>

    </div>
  );
}

// ── Step: Players ─────────────────────────────────────────────────────────────
function StepPlayers({ teamName, players, onChange, onAdd, onRemove, onSaveTeam, onLoadTeam }) {
  const validCount = players.filter(p => p.name.trim()).length;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{teamName} Squad</h3>
          <p style={{ fontSize: '0.8rem', margin: '2px 0 0', color: 'var(--text-muted)' }}>
            {validCount} player{validCount !== 1 ? 's' : ''} added
          </p>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={onAdd}>
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Save / Load team action bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <button
          className="btn btn-sm"
          onClick={onLoadTeam}
          style={{
            background: 'var(--color-primary-ultra-light)',
            color: 'var(--color-primary)',
            border: '1.5px solid var(--color-primary)',
            fontWeight: 600,
          }}
        >
          <FolderOpen size={15} /> Load Saved Team
        </button>
        <button
          className="btn btn-sm"
          onClick={onSaveTeam}
          disabled={validCount === 0}
          style={{
            background: validCount > 0 ? '#fff' : 'var(--bg-surface-2)',
            color: validCount > 0 ? 'var(--color-primary-dark)' : 'var(--text-muted)',
            border: '1.5px solid',
            borderColor: validCount > 0 ? 'var(--color-primary)' : 'var(--border-color)',
            fontWeight: 600,
          }}
        >
          <Save size={15} /> Save This Team
        </button>
      </div>

      {/* Divider with note */}
      {validCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--color-primary-ultra-light)',
            border: '1px solid var(--color-primary)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: '0.8125rem',
            color: 'var(--color-primary-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={14} />
          {validCount} player{validCount !== 1 ? 's' : ''} ready for {teamName}
        </motion.div>
      )}

      {/* Player rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {players.map((p, i) => (
          <div key={i} className="card">
            <div className="card-body" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {/* Jersey # */}
                <div style={{ width: 44, flexShrink: 0 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>#</label>
                  <input
                    type="number"
                    className="form-input"
                    value={p.number}
                    min={1}
                    onChange={e => onChange(i, 'number', Number(e.target.value))}
                    style={{ padding: '10px 8px', textAlign: 'center' }}
                  />
                </div>
                {/* Name */}
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>Player Name</label>
                  <input
                    className="form-input"
                    placeholder={`Player ${i + 1}`}
                    value={p.name}
                    onChange={e => onChange(i, 'name', e.target.value)}
                  />
                </div>
                {/* Role */}
                <div style={{ width: 118, flexShrink: 0 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>Role</label>
                  <select
                    className="form-select"
                    value={p.role}
                    onChange={e => onChange(i, 'role', e.target.value)}
                    style={{ padding: '10px 8px' }}
                  >
                    {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                {/* Remove */}
                {players.length > 2 && (
                  <button
                    onClick={() => onRemove(i)}
                    style={{ marginTop: 22, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4, flexShrink: 0 }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step: Toss ────────────────────────────────────────────────────────────────
function StepToss({ form, updateForm }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px 0' }}>
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
          style={{
            width: 80, height: 80, margin: '0 auto', background: 'radial-gradient(circle, #facc15, #ca8a04)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.4), inset 0 0 10px rgba(255,255,255,0.5)',
            border: '4px solid #fef08a'
          }}
        >
          <span style={{ fontSize: '2.5rem', transform: 'rotate(-15deg)' }}>🏏</span>
        </motion.div>
      </div>

      <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Toss Winner</p>
      <div className="form-group" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {form.teams.filter(t => t.trim()).map((team, index) => (
            <button
              key={team}
              onClick={() => updateForm('tossWinner', team)}
              style={{
                flex: 1, padding: '20px 10px', borderRadius: 12, border: '2px solid',
                borderColor: form.tossWinner === team ? (index === 0 ? '#3b82f6' : '#eab308') : 'var(--border-color)',
                background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontSize: '1rem',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {form.tossWinner === team && (
                <div style={{ position: 'absolute', top: 6, right: 6, background: index === 0 ? '#3b82f6' : '#eab308', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>
                </div>
              )}
              {team}
            </button>
          ))}
        </div>
      </div>

      <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Choose To</p>
      <div className="form-group" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['bat', 'bowl'].map(choice => (
            <button
              key={choice}
              onClick={() => updateForm('electedTo', choice)}
              style={{
                flex: 1, padding: '16px 10px', borderRadius: 12, border: '2px solid',
                borderColor: form.electedTo === choice ? 'var(--color-primary)' : 'var(--border-color)',
                background: form.electedTo === choice ? 'var(--color-primary-ultra-light)' : 'var(--bg-surface-2)',
                color: form.electedTo === choice ? 'var(--color-primary)' : 'var(--text-primary)',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {choice === 'bat' ? '🏏 Bat' : '🏐 Bowl'}
            </button>
          ))}
        </div>
      </div>

      <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Toss Summary</p>
      <div className="card" style={{ marginBottom: 24, overflow: 'hidden', border: form.tossWinner ? '1px solid var(--color-primary)' : '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', background: form.tossWinner ? 'var(--color-primary-ultra-light)' : 'var(--bg-surface-2)', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
          {form.tossWinner ? (
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--color-primary-dark)', fontWeight: 800 }}>{form.tossWinner}</span> won the toss and elected to <span style={{ color: 'var(--color-primary-dark)', fontWeight: 800 }}>{form.electedTo}</span> first.
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Complete the toss to see summary</div>
          )}
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '10px 12px', background: 'var(--bg-surface-2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Match Type</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{form.matchType}</span>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--bg-surface-2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Overs</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{form.totalOvers}</span>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--bg-surface-2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Players</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{form.playersPerTeam || 11} / Team</span>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--bg-surface-2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Last Man Standing</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{form.lastManStanding ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
