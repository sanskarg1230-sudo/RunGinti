import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ChevronLeft, PlusCircle, Share2, History, RotateCcw, Save } from 'lucide-react';
import { getMatch, updateMatch } from '../db/database';
import { initInnings } from '../utils/cricketEngine';
import { showToast } from '../components/Toast';
import PlayerSelectModal from '../components/PlayerSelectModal';

export default function MatchResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPotmModal, setShowPotmModal] = useState(false);

  useEffect(() => {
    getMatch(Number(id)).then(m => {
      setMatch(m);
      setLoading(false);
      // Show POTM modal if match is completed and has a winner/runs/wickets but no POTM yet
      if (m?.status === 'completed' && m.result && m.result.method !== 'tie' && m.result.method !== 'draw' && !m.potm) {
        setShowPotmModal(true);
      }
    });
  }, [id]);

  if (loading) return <div className="spinner" style={{ margin: 'auto', marginTop: '20vh' }} />;
  if (!match) return null;

  const result = match.result || {};
  let inn1, inn2;
  if (match.innings && match.innings.length > 2 && match.matchType !== 'Test') {
    inn1 = match.innings[match.innings.length - 2];
    inn2 = match.innings[match.innings.length - 1];
  } else {
    inn1 = match.innings?.[0];
    inn2 = match.innings?.[1];
  }

  // Gather all players from both teams who participated
  const getAllPlayers = () => {
    const players = [];
    if (!match.innings) return players;
    match.innings.forEach(inn => {
      inn.batsmen.forEach(b => {
        if (!players.find(p => p.name === b.name)) {
          // Find bowling stats for this player
          const bowlStats = inn.bowlers?.find(bw => bw.name === b.name) || { wickets: 0 };
          players.push({
            id: b.playerId,
            name: b.name,
            team: inn.battingTeam,
            runs: b.runs,
            balls: b.balls,
            wickets: bowlStats.wickets || 0,
            number: b.number || 0,
            role: b.role || 'Player'
          });
        }
      });
      inn.bowlers.forEach(bw => {
        if (!players.find(p => p.name === bw.name)) {
          players.push({
            id: bw.playerId,
            name: bw.name,
            team: inn.bowlingTeam,
            runs: 0,
            balls: 0,
            wickets: bw.wickets,
            number: bw.number || 0,
            role: bw.role || 'Bowler'
          });
        }
      });
    });
    return players;
  };

  const handleSelectPotm = async (player) => {
    const updated = { ...match, potm: player };
    await updateMatch(match.id, { potm: player });
    setMatch(updated);
    setShowPotmModal(false);
    showToast('Player of the Match saved! ⭐');
  };

  const handleStartSuperOver = async () => {
    if (!inn1 || !inn2) return;
    // Team that batted second bats first in super over
    const soTeam1 = inn2.battingTeam;
    const soTeam2 = inn1.battingTeam;

    const soInn = initInnings(soTeam1, soTeam2, 1, true, match.lastManStanding, 11); // true = isSuperOver
    const updatedInnings = [...match.innings, soInn];

    await updateMatch(match.id, {
      innings: updatedInnings,
      currentInnings: updatedInnings.length - 1,
      status: 'live',
      result: null,
    });
    navigate(`/match/${match.id}/live`);
  };

  const handleShare = async () => {
    const text = `🏆 ${match.name}\n${result.winner ? `${result.winner} won by ${result.margin}` : result.margin}\n\n${inn1?.battingTeam}: ${inn1?.runs}/${inn1?.wickets}\n${inn2?.battingTeam}: ${inn2?.runs}/${inn2?.wickets}\n\nShared via RunGinti`;
    if (navigator.share) {
      try { await navigator.share({ title: match.name, text }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(text);
      showToast('Result copied to clipboard!');
    }
  };

  return (
    <div>
      <AnimatePresence>
        {showPotmModal && (
          <PlayerSelectModal
            title="⭐ Select Player of the Match"
            players={getAllPlayers().sort((a, b) => b.runs + (b.wickets * 20) - (a.runs + (a.wickets * 20)))}
            onSelect={handleSelectPotm}
            onClose={() => setShowPotmModal(false)}
          />
        )}
      </AnimatePresence>

      <div style={{ textAlign: 'center', paddingTop: 30, paddingBottom: 20 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
          <Trophy size={80} color="#fcd34d" style={{ filter: 'drop-shadow(0 0 40px rgba(252,211,77,0.4))', margin: '0 auto' }} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
          style={{ 
            fontSize: '2.2rem', marginTop: 16, fontWeight: 900,
            background: result.winner ? 'linear-gradient(135deg, #16a34a, #4ade80)' : 'linear-gradient(135deg, #eab308, #fcd34d)', 
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
          }}
        >
          {result.winner ? `${result.winner} Won` : 'Match Tied'}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>
          {result.winner ? `By ${result.margin}` : (result.method === 'draw' ? 'Match Drawn' : 'Scores Level')}
        </motion.p>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Scores Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="card" style={{ flex: 1, background: 'var(--bg-surface-2)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#3b82f6' }} />
            <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{inn1?.battingTeam || 'Team A'}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>{inn1?.runs || 0}/{inn1?.wickets || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({Math.floor((inn1?.legalBalls || 0) / 6)}.{(inn1?.legalBalls || 0) % 6} Overs)</div>
            </div>
          </div>
          <div className="card" style={{ flex: 1, background: 'var(--bg-surface-2)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#eab308' }} />
            <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#facc15', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{inn2?.battingTeam || 'Team B'}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>{inn2?.runs || 0}/{inn2?.wickets || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({Math.floor((inn2?.legalBalls || 0) / 6)}.{(inn2?.legalBalls || 0) % 6} Overs)</div>
            </div>
          </div>
        </motion.div>

        {/* POTM Card */}
        {match.potm && (
          <>
            <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Player of the Match</p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card" style={{ marginBottom: 24, background: 'var(--bg-surface-2)', border: '1px solid rgba(252, 211, 77, 0.2)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px' }}>
                <div style={{ background: 'var(--bg-surface-3)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{match.potm.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{match.potm.team}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {match.potm.runs > 0 ? `${match.potm.runs} (${match.potm.balls})` : ''} 
                    {match.potm.runs > 0 && match.potm.wickets > 0 ? ' & ' : ''}
                    {match.potm.wickets > 0 ? `${match.potm.wickets} W` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {match.potm.runs > 0 ? 'Runs' : (match.potm.wickets > 0 ? 'Wickets' : 'Excellent fielding')}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Match Summary List */}
        <p className="section-title" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Match Summary</p>
        <div className="card" style={{ marginBottom: 32, background: 'var(--bg-surface-2)', border: 'none' }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Match Type</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.matchType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(match.createdAt).toLocaleDateString()}</span>
            </div>
            {match.venue && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Venue</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.venue}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Toss Winner</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.tossWinner || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chosen To</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.electedTo || '-'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result.method === 'tie' && (
            <button className="btn btn-primary btn-full btn-lg" style={{ background: '#dc2626' }} onClick={handleStartSuperOver}>
              <RotateCcw size={20} /> Start Super Over
            </button>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/match/${match.id}/summary`)} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4, padding: '16px' }}>
              <History size={20} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.85rem' }}>View Scorecard</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              <Save size={20} style={{ color: '#fff' }} />
              <span style={{ fontSize: '0.85rem' }}>Save Match</span>
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/create')} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <PlusCircle size={16} /> Start New Match
            </button>
            <button className="btn btn-ghost" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <Share2 size={16} /> Share Result
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
