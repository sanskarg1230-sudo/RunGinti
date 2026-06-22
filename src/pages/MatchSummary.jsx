import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileJson, ChevronLeft, Trophy, RotateCcw, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getMatch } from '../db/database';
import { formatOvers, calcSR, calcEconomy, getInningsLabel, MATCH_TYPES, DELIVERY_TYPES } from '../utils/cricketEngine';
import { exportMatchPDF } from '../utils/exportPDF';
import { exportMatchJSON } from '../utils/exportJSON';
import { showToast } from '../components/Toast';

function BattingTable({ batsmen, extras, totalRuns, totalWickets, totalBalls, onPlayerClick }) {
  const ext = extras || {};
  const extTotal = (ext.wides||0)+(ext.noBalls||0)+(ext.byes||0)+(ext.legByes||0)+(ext.penalties||0);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="score-table" style={{ minWidth: 500 }}>
        <thead>
          <tr>
            <th style={{ minWidth: 120 }}>Batsman</th>
            <th>Dismissal</th>
            <th>R</th>
            <th>B</th>
            <th>4s</th>
            <th>6s</th>
            <th>SR</th>
          </tr>
        </thead>
        <tbody>
          {(batsmen||[]).map((b, i) => (
            <tr key={i} className={b.isOut ? 'out-row' : ''}>
              <td 
                style={{ fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }} 
                onClick={() => onPlayerClick(b)}
              >
                {b.name}
              </td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {b.isOut ? `${b.dismissal}${b.dismissedBy ? ` b ${b.dismissedBy}` : ''}` : 'not out'}
              </td>
              <td style={{ fontWeight: 700 }}>{b.runs}</td>
              <td>{b.balls}</td>
              <td>{b.fours}</td>
              <td>{b.sixes}</td>
              <td>{calcSR(b.runs, b.balls)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ fontWeight: 600 }}>Extras</td>
            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (w {ext.wides||0}, nb {ext.noBalls||0}, b {ext.byes||0}, lb {ext.legByes||0})
            </td>
            <td style={{ fontWeight: 700 }}>{extTotal}</td>
            <td colSpan={4}></td>
          </tr>
          <tr className="total-row">
            <td style={{ fontWeight: 800 }}>TOTAL</td>
            <td style={{ fontSize: '0.8rem' }}>{totalWickets} wkts, {formatOvers(totalBalls)} ov</td>
            <td style={{ fontWeight: 800 }}>{totalRuns}</td>
            <td colSpan={4}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BowlingTable({ bowlers, overHistory, onPlayerClick }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="score-table">
        <thead>
          <tr>
            <th style={{ minWidth: 120 }}>Bowler</th>
            <th>O</th>
            <th>M</th>
            <th>R</th>
            <th>W</th>
            <th>Econ</th>
            <th>Wd/NB</th>
          </tr>
        </thead>
        <tbody>
          {(bowlers||[]).map((b, i) => (
            <tr key={i}>
              <td 
                style={{ fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }} 
                onClick={() => onPlayerClick(b)}
              >
                {b.name}
              </td>
              <td>{formatOvers(b.legalBalls)}</td>
              <td>{b.maidens}</td>
              <td>{b.runs}</td>
              <td style={{ fontWeight: 700, color: b.wickets > 0 ? 'var(--color-primary)' : undefined }}>{b.wickets}</td>
              <td>{calcEconomy(b.runs, b.legalBalls)}</td>
              <td style={{ fontSize: '0.8rem' }}>{b.wides||0}/{b.noBalls||0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerDetailsModal({ playerInfo, onClose }) {
  if (!playerInfo) return null;
  const { type, data, overHistory } = playerInfo;

  const boxStyle = { background: 'var(--bg-surface-2)', padding: '12px 8px', borderRadius: 12 };
  const valStyle = { fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-primary)' };
  const lblStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4, fontWeight: 600 };

  return (
    <div className="modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal centered animate-scale-in" style={{ maxWidth: 420, width: '90%', padding: '24px' }}>
        <div className="modal-handle" />
        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20, textAlign: 'center' }}>
          {data.name}
        </div>
        
        {type === 'bowler' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, textAlign: 'center', marginBottom: 20 }}>
              <div style={boxStyle}><div style={valStyle}>{formatOvers(data.legalBalls)}</div><div style={lblStyle}>Overs</div></div>
              <div style={boxStyle}><div style={valStyle}>{data.maidens}</div><div style={lblStyle}>Maidens</div></div>
              <div style={boxStyle}><div style={valStyle}>{data.runs}</div><div style={lblStyle}>Runs</div></div>
              <div style={boxStyle}><div style={valStyle}>{data.wickets}</div><div style={lblStyle}>Wickets</div></div>
            </div>
            
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase' }}>Overs Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '40vh', overflowY: 'auto', paddingRight: 4 }}>
              {overHistory && overHistory.filter(oh => oh.bowlerName === data.name).map((oh, j) => (
                <div key={j} style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Over {oh.over + 1}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {oh.balls.map((ball, bi) => {
                      let cls = 'ball-0';
                      let label = ball.runs;
                      if (ball.type === DELIVERY_TYPES.WICKET) { cls = 'ball-W'; label = 'W'; }
                      else if (ball.type === DELIVERY_TYPES.WIDE) { cls = 'ball-Wd'; label = 'Wd'; }
                      else if (ball.type === DELIVERY_TYPES.NO_BALL) { cls = 'ball-NB'; label = 'NB'; }
                      else if (ball.runs === 6) cls = 'ball-6';
                      else if (ball.runs === 4) cls = 'ball-4';
                      else cls = `ball-${ball.runs}`;
                      
                      if (ball.type === DELIVERY_TYPES.BYE) label = `${ball.runs}B`;
                      if (ball.type === DELIVERY_TYPES.LEG_BYE) label = `${ball.runs}LB`;

                      return (
                        <div key={bi} className={`ball-indicator ${cls}`} style={{ width: 28, height: 28, animation: 'none' }}>
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {(!overHistory || !overHistory.some(oh => oh.bowlerName === data.name)) && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No overs recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {type === 'batsman' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, textAlign: 'center', marginBottom: 20 }}>
              <div style={boxStyle}><div style={valStyle}>{data.runs}</div><div style={lblStyle}>Runs</div></div>
              <div style={boxStyle}><div style={valStyle}>{data.balls}</div><div style={lblStyle}>Balls</div></div>
              <div style={boxStyle}><div style={valStyle}>{data.fours}</div><div style={lblStyle}>4s</div></div>
              <div style={boxStyle}><div style={valStyle}>{data.sixes}</div><div style={lblStyle}>6s</div></div>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-surface-2)', padding: '12px', borderRadius: 8 }}>
              Status: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.isOut ? `${data.dismissal} ${data.dismissedBy ? `b ${data.dismissedBy}` : ''}` : 'Not Out'}</span>
            </div>
          </div>
        )}

        <button className="btn btn-secondary btn-full" style={{ marginTop: 24 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function MatchSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    getMatch(Number(id)).then(m => { setMatch(m); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!match) return null;

  const innings = match.innings || [];

  const handlePDF = () => {
    try { exportMatchPDF(match); showToast('PDF exported! 📄'); }
    catch (e) { showToast('PDF export failed'); }
  };

  const handleJSON = () => {
    exportMatchJSON(match);
    showToast('JSON exported! 💾');
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Top Header */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingBottom: '16px',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: 6, borderRadius: '50%' }}>
            <ChevronLeft size={24} color="var(--text-primary)" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {match.name || 'Match Summary'}
            </h1>
            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-secondary)' }}>
              {match.teams?.[0]} vs {match.teams?.[1]}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: 8, borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 16 }}>
        {/* Result Card */}
        {match.result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--color-primary-dark), #166534)', color: 'white', textAlign: 'center' }}
          >
            <div className="card-body-lg">
              <div style={{ fontSize: '2rem', marginBottom: 4 }}>🏆</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>
                {match.result.winner ? `${match.result.winner} Won!` : match.result.margin}
              </div>
              {match.result.winner && (
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: 4 }}>
                  by {match.result.margin}
                </div>
              )}
            </div>
          </motion.div>
        )}



        {/* Innings Tabs */}
        {innings.length > 1 && (
          <div className="tabs" style={{ marginBottom: 12 }}>
            {innings.map((inn, i) => (
              <button
                key={i}
                className={`tab-btn ${activeTab === i ? 'active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {inn.battingTeam || `Inn ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Active Innings Scorecard */}
        {innings.length > 0 && (() => {
          const inn = innings[innings.length > 1 ? activeTab : 0];
          if (!inn) return null;
          return (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-surface-2)', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {getInningsLabel(innings.length > 1 ? activeTab : 0, match.matchType)} — {inn.battingTeam}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>
                    {inn.runs}/{inn.wickets} ({formatOvers(inn.legalBalls)} ov)
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BATTING</div>
                  <BattingTable 
                    batsmen={inn.batsmen} 
                    extras={inn.extras} 
                    totalRuns={inn.runs} 
                    totalWickets={inn.wickets} 
                    totalBalls={inn.legalBalls} 
                    onPlayerClick={(b) => setSelectedPlayer({ type: 'batsman', data: b })}
                  />
                  <div className="divider" style={{ margin: '16px 0' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BOWLING</div>
                  <BowlingTable 
                    bowlers={inn.bowlers} 
                    overHistory={inn.overHistory} 
                    onPlayerClick={(b) => setSelectedPlayer({ type: 'bowler', data: b, overHistory: inn.overHistory })}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Match Info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Toss', `${match.tossWinner} (${match.electedTo})`],
                ['Date', new Date(match.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
                ['Venue', match.venue || 'N/A'],
                ['Match Type', `${match.matchType}${match.totalOvers > 0 ? ` (${match.totalOvers} ov)` : ''}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={handlePDF}>
            <Download size={18} /> Export PDF
          </button>
          <button className="btn btn-secondary" onClick={handleJSON}>
            <FileJson size={18} /> Export JSON
          </button>
        </div>

        {/* Resume if live */}
        {match.status === 'live' && (
          <button className="btn btn-primary btn-full" onClick={() => navigate(`/match/${id}/live`)} style={{ marginBottom: 16 }}>
            <RotateCcw size={18} /> Resume Match
          </button>
        )}
      </div>

      <PlayerDetailsModal playerInfo={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
