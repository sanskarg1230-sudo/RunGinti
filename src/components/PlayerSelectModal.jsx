import { useState } from 'react';
import { X, Search } from 'lucide-react';

export default function PlayerSelectModal({ title, players, onSelect, onClose, excludeIds = [] }) {
  const [search, setSearch] = useState('');

  const filtered = players.filter(p =>
    !excludeIds.includes(p.id) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-up">
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="form-input search-input"
              placeholder="Search player..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="player-list">
          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>
              <span className="empty-state-icon">🔍</span>
              <p>No players found</p>
            </div>
          )}
          {filtered.map(player => {
            const displayName = player.name && player.name.trim() !== '' ? player.name : `Player ${player.number}`;
            return (
              <button
                key={player.id}
                className="player-option"
                onClick={() => { onSelect(player); onClose(); }}
              >
                <div className="player-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    #{player.number} {displayName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player.role}</div>
                </div>
              </button>
            );
          })}
        </div>
        <button className="btn btn-ghost btn-full" style={{ marginTop: 12 }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
