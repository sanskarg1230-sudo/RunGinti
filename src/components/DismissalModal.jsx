import { useState } from 'react';
import { DISMISSAL_TYPES } from '../utils/cricketEngine';

const DISMISSALS = Object.values(DISMISSAL_TYPES);

export default function DismissalModal({ batsmen, bowlers, onConfirm, onClose }) {
  const [dismissal, setDismissal] = useState(DISMISSAL_TYPES.BOWLED);
  const [runs, setRuns] = useState(0);
  const [dismissedBatsmanIndex, setDismissedBatsmanIndex] = useState(null);
  const [fielder, setFielder] = useState('');

  const striker = batsmen?.find((b, i) => !b.isOut && b.isStriker);
  const onCrease = batsmen?.filter(b => b.isOnCrease && !b.isOut) || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-up">
        <div className="modal-handle" />
        <div className="modal-title">🏏 Wicket Details</div>

        <div className="form-group">
          <label className="form-label">Dismissal Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DISMISSALS.map(d => (
              <button
                key={d}
                onClick={() => setDismissal(d)}
                className="btn btn-sm"
                style={{
                  background: dismissal === d ? 'var(--color-primary)' : 'var(--bg-surface-2)',
                  color: dismissal === d ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  fontSize: '0.8125rem',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {onCrease.length > 1 && (
          <div className="form-group">
            <label className="form-label">Dismissed Batsman</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {onCrease.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setDismissedBatsmanIndex(batsmen.indexOf(b))}
                  className="player-option"
                  style={{
                    borderColor: dismissedBatsmanIndex === batsmen.indexOf(b) ? 'var(--color-primary)' : undefined
                  }}
                >
                  <div className="player-avatar">{b.name.charAt(0)}</div>
                  <span style={{ fontWeight: 600 }}>{b.name} {b.isStriker ? '★' : ''}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {dismissal === DISMISSAL_TYPES.RUN_OUT && (
          <div className="form-group">
            <label className="form-label">Runs scored on this ball</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2,3,4].map(r => (
                <button
                  key={r}
                  onClick={() => setRuns(r)}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    background: runs === r ? 'var(--color-primary)' : 'var(--bg-surface-2)',
                    color: runs === r ? 'white' : 'var(--text-primary)',
                    border: 'none',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={() => {
              onConfirm({
                dismissalType: dismissal,
                runs: dismissal === DISMISSAL_TYPES.RUN_OUT ? runs : 0,
                dismissedBatsmanIndex: dismissedBatsmanIndex ?? batsmen?.findIndex(b => !b.isOut && b.isStriker),
                fielder,
              });
            }}
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
}
