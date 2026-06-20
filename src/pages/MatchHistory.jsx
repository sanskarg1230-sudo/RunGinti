import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Trash2, FileJson, Trophy, Calendar, Filter, SortAsc, SortDesc, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getAllMatches, deleteMatch } from '../db/database';
import { exportMatchJSON } from '../utils/exportJSON';
import { showToast } from '../components/Toast';
import { MATCH_TYPES } from '../utils/cricketEngine';

export default function MatchHistory() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [matches, setMatches] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const m = await getAllMatches();
    setMatches(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = [...matches];
    if (search) result = result.filter(m =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.teams?.some(t => t?.toLowerCase().includes(search.toLowerCase()))
    );
    if (filterType !== 'All') result = result.filter(m => m.matchType === filterType);
    result.sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortAsc ? diff : -diff;
    });
    setFiltered(result);
  }, [matches, search, filterType, sortAsc]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this match?')) return;
    await deleteMatch(id);
    showToast('Match deleted');
    load();
  };

  const handleExport = (e, match) => {
    e.stopPropagation();
    exportMatchJSON(match);
    showToast('Exported! 💾');
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
            Match History
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: 8, borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
        </div>
      </header>

      <div className="container" style={{ padding: '0 16px' }}>
        {/* Search */}
        <div className="form-group" style={{ marginBottom: 10 }}>
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="form-input search-input"
              placeholder="Search by name or team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {['All', ...Object.values(MATCH_TYPES)].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                border: '1.5px solid',
                borderColor: filterType === type ? 'var(--color-primary)' : 'var(--border-color)',
                background: filterType === type ? 'var(--color-primary)' : 'var(--bg-surface)',
                color: filterType === type ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {type}
            </button>
          ))}
          <button
            onClick={() => setSortAsc(s => !s)}
            style={{
              padding: '6px 14px',
              borderRadius: 99,
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {sortAsc ? <SortAsc size={14} /> : <SortDesc size={14} />}
            Date
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>{matches.length === 0 ? 'No matches yet' : 'No matches found'}</h3>
            <p>{matches.length === 0 ? 'Create a match to get started!' : 'Try a different search or filter.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((m, i) => (
              <motion.div
                key={m.id}
                className="match-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => m.status === 'completed' ? navigate(`/match/${m.id}/result`) : navigate(`/match/${m.id}/live`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {m.teams?.[0]} vs {m.teams?.[1]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
                    <span className={`badge ${
                      m.status === 'completed' ? 'badge-green' :
                      m.status === 'live' ? 'badge-amber' : 'badge-gray'
                    }`}>
                      {m.status === 'completed' ? 'Done' : m.status === 'live' ? '🔴 Live' : 'Setup'}
                    </span>
                    <span className="badge badge-blue">{m.matchType}</span>
                  </div>
                </div>

                {m.result ? (
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-surface-2)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Winner: {m.result.winner || 'None (Tie)'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trophy size={14} />
                      {m.result.winner ? `Won By ${m.result.margin}` : m.result.margin}
                    </div>
                  </div>
                ) : null}

                {m.innings?.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {m.innings.map((inn, i) => inn && (
                      <span key={i}>{inn.battingTeam}: {inn.runs}/{inn.wickets}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ padding: '4px 8px' }}
                      onClick={e => handleExport(e, m)}
                      title="Export JSON"
                    >
                      <FileJson size={14} />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none' }}
                      onClick={e => handleDelete(e, m.id)}
                      title="Delete Match"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
