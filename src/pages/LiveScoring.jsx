import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, Settings2, RefreshCw } from 'lucide-react';
import {
  getMatch, updateMatch, getPlayers, logBall, deleteLastBall, getBalls, pushUndoHistory, popUndoHistory
} from '../db/database';
import {
  processDelivery, addBatsman, addBowler, initInnings,
  formatOvers, calcCRR, calcRRR, DELIVERY_TYPES, MATCH_TYPES,
  getInningsLabel, getMaxInnings, calculateResult
} from '../utils/cricketEngine';
import PlayerSelectModal from '../components/PlayerSelectModal';
import DismissalModal from '../components/DismissalModal';
import { showToast } from '../components/Toast';

// ── Match Settings Modal ──────────────────────────────────────────────────
function MatchSettingsModal({ match, onSave, onClose }) {
  const [overs, setOvers] = useState(match.totalOvers);
  const [matchType, setMatchType] = useState(match.matchType);

  const handleSave = () => {
    onSave({ totalOvers: Number(overs), matchType });
    onClose();
  };

  return (
    <div className="modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal centered animate-scale-in">
        <div className="modal-title">⚙️ Match Settings</div>
        <div className="form-group">
          <label className="form-label">Match Type</label>
          <select className="form-select" value={matchType} onChange={e => setMatchType(e.target.value)}>
            {Object.values(MATCH_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Total Overs (0 = unlimited)</label>
          <input type="number" className="form-input" value={overs} min={0} onChange={e => setOvers(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Innings Break Panel ───────────────────────────────────────────────────
function InningsBreakPanel({ match, inn1, nextTeam, onStart, matchType, inningsIndex }) {
  const target = inn1.runs + 1;
  const label = getInningsLabel(inningsIndex, matchType);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 }}>
      <motion.div
        className="innings-break-panel"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3 }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏏</div>
        <h2 style={{ color: 'white', marginBottom: 4 }}>Innings Break</h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>
          {inn1.battingTeam} scored {inn1.runs}/{inn1.wickets} in {formatOvers(inn1.legalBalls)} overs
        </p>
        {matchType !== MATCH_TYPES.TEST && (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Target for {nextTeam}</div>
            <div style={{ fontFamily: 'Rajdhani', fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{target}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>runs needed to win</div>
          </div>
        )}
        <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontSize: '0.9375rem' }}>
          {label} — {nextTeam} to bat
        </div>
        <button className="btn btn-lg btn-full" style={{ background: 'white', color: '#16a34a', fontWeight: 700 }} onClick={onStart}>
          Start {label}
        </button>
      </motion.div>
    </div>
  );
}

// ── Player Edit Modal ─────────────────────────────────────────────────────
function EditPlayerModal({ player, onSave, onClose }) {
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(player.number);
  const [role, setRole] = useState(player.role);

  return (
    <div className="modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal centered animate-scale-in">
        <div className="modal-title">Edit Player</div>
        <div className="form-group">
          <label className="form-label">Jersey Number</label>
          <input type="number" className="form-input" value={number} min={1} onChange={e => setNumber(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Player Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
            {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onSave({ name, number, role }); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Extras Modal ──────────────────────────────────────────────────────────────
function ExtrasModal({ type, onConfirm, onClose }) {
  let title = '';
  let options = [];

  if (type === DELIVERY_TYPES.WIDE) {
    title = 'Wide + Extra Runs';
    options = [0, 1, 2, 3, 4];
  } else if (type === DELIVERY_TYPES.NO_BALL) {
    title = 'No Ball + Runs off Bat';
    options = [0, 1, 2, 3, 4, 5, 6];
  } else if (type === DELIVERY_TYPES.BYE) {
    title = 'Byes';
    options = [1, 2, 3, 4];
  } else if (type === DELIVERY_TYPES.LEG_BYE) {
    title = 'Leg Byes';
    options = [1, 2, 3, 4];
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-up">
        <div className="modal-handle" />
        <div className="modal-title">🏏 {title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {options.map(r => (
            <button
              key={r}
              className={`score-btn score-btn-${r}`}
              style={{ minHeight: 48, fontSize: '1.2rem' }}
              onClick={() => onConfirm(type, r)}
            >
              {r}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main Live Scoring ─────────────────────────────────────────────────────
export default function LiveScoring() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const [match, setMatch] = useState(null);
  const [innings, setInnings] = useState(null); // current innings state
  const [allPlayers, setAllPlayers] = useState({ 0: [], 1: [] }); // players by team index
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showStrikerSelect, setShowStrikerSelect] = useState(false);
  const [showNonStrikerSelect, setShowNonStrikerSelect] = useState(false);
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [showDismissal, setShowDismissal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(null);
  const [showEditPlayer, setShowEditPlayer] = useState(null); // player object to edit
  const [pendingWicket, setPendingWicket] = useState(null);
  const [lastBallId, setLastBallId] = useState(null);

  // Load match on mount
  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    const m = await getMatch(matchId);
    if (!m) { navigate('/'); return; }

    const p0 = await getPlayers(matchId, 0);
    const p1 = await getPlayers(matchId, 1);
    setAllPlayers({ 0: p0, 1: p1 });

    setMatch(m);

    // Initialize first innings if not started
    if (!m.innings || m.innings.length === 0) {
      // Correctly determine who bats first using toss winner + their choice
      const tossWinnerIdx2 = m.teams.indexOf(m.tossWinner);
      const battingTeamIdx = m.electedTo === 'bat' ? tossWinnerIdx2 : 1 - tossWinnerIdx2;
      const bowlingTeamIdx = 1 - battingTeamIdx;
      const teamSize = (battingTeamIdx === 0 ? p0.length : p1.length) || 11;
      const inn = initInnings(m.teams[battingTeamIdx], m.teams[bowlingTeamIdx], m.totalOvers, false, m.lastManStanding, teamSize);
      setInnings(inn);
      setLoading(false);
      // Show opener selection
      setShowStrikerSelect(true);
    } else {
      // Resume current innings
      const currentInn = m.innings[m.currentInnings];
      if (currentInn) {
        setInnings(currentInn);
        // If no bowler selected, prompt
        if (currentInn.currentBowlerIndex === null) setShowBowlerSelect(true);
      }
      setLoading(false);
    }
  };

  // Persist innings to match
  const persistInnings = useCallback(async (updatedInnings, extraMatchUpdates = {}) => {
    const m = await getMatch(matchId);
    const updatedMatch = { ...m, ...extraMatchUpdates };
    const inningsArr = [...(updatedMatch.innings || [])];

    const ci = extraMatchUpdates.currentInnings ?? m.currentInnings;
    inningsArr[ci] = updatedInnings;
    updatedMatch.innings = inningsArr;

    await updateMatch(matchId, updatedMatch);
    setMatch(updatedMatch);
  }, [matchId]);

  // Determine batting/bowling team indices for current innings
  const getBattingTeamIdx = useCallback((inningsIndex) => {
    if (!match) return 0;
    // Find which team index the toss winner is
    const tossWinnerIdx = match.teams?.indexOf(match.tossWinner) ?? 0;
    // The team that bats first is determined by toss winner's elected choice
    const battingFirstIdx = match.electedTo === 'bat' ? tossWinnerIdx : 1 - tossWinnerIdx;
    // Innings alternate between the two teams
    return inningsIndex % 2 === 0 ? battingFirstIdx : 1 - battingFirstIdx;
  }, [match]);

  const getBowlingTeamIdx = useCallback((inningsIndex) => 1 - getBattingTeamIdx(inningsIndex), [getBattingTeamIdx]);

  // Get available players for selection
  const getBattingPlayers = useCallback(() => {
    if (!match || !innings) return [];
    const ci = match.currentInnings;
    const teamIdx = getBattingTeamIdx(ci);
    const used = innings.batsmen.map(b => b.playerId);
    return allPlayers[teamIdx]?.map(p => ({
      id: p.id,
      name: p.name,
      number: p.number,
      role: p.role,
    })).filter(p => !used.includes(p.id)) || [];
  }, [match, innings, allPlayers, getBattingTeamIdx]);

  const getBowlingPlayers = useCallback(() => {
    if (!match || !innings) return [];
    const ci = match.currentInnings;
    const teamIdx = getBowlingTeamIdx(ci);
    // Can't bowl consecutive overs (check last bowler)
    const lastBowlerIdx = innings.currentBowlerIndex;
    const overs = Math.floor(innings.legalBalls / 6);
    const lastBowler = lastBowlerIdx !== null && innings.legalBalls % 6 === 0
      ? innings.bowlers[lastBowlerIdx]?.playerId
      : null;

    return allPlayers[teamIdx]?.map(p => ({
      id: p.id,
      name: p.name,
      number: p.number,
      role: p.role,
    })) || [];
  }, [match, innings, allPlayers, getBowlingTeamIdx]);

  // Handle a delivery
  const handleDelivery = async (type, runs = 0, extras = 0) => {
    if (!innings) return;
    if (innings.strikerIndex === null) { showToast('Select opening batsman first'); setShowStrikerSelect(true); return; }
    if (innings.currentBowlerIndex === null) { showToast('Select bowler first'); setShowBowlerSelect(true); return; }
    
    const noMoreBatters = getBattingPlayers().length === 0;
    const isLMSActive = innings.lastManStanding && noMoreBatters;

    if (innings.nonStrikerIndex === null && !isLMSActive) { showToast('Select non-striker first'); setShowNonStrikerSelect(true); return; }

    if (type === DELIVERY_TYPES.WICKET) {
      setPendingWicket({ type, runs, extras });
      setShowDismissal(true);
      return;
    }

    await processAndSave({ type, runs, extras });
  };

  const processAndSave = async (delivery) => {
    const target = match.currentInnings > 0 && match.matchType !== MATCH_TYPES.TEST
      ? (match.innings?.[match.currentInnings - 1]?.runs || 0) + 1
      : null;

    // SAVE PREVIOUS STATE FOR UNDO
    await pushUndoHistory(matchId, JSON.parse(JSON.stringify(innings)));

    const clone = JSON.parse(JSON.stringify(innings));
    if (!clone.teamSize) {
      clone.teamSize = allPlayers[getBattingTeamIdx(match.currentInnings)]?.length || 11;
    }

    let updated = processDelivery(clone, delivery, target);
    setInnings(updated);

    // Log ball
    const ballRecord = {
      matchId,
      inningsIndex: match.currentInnings,
      over: Math.floor(innings.legalBalls / 6),
      ball: innings.legalBalls % 6,
      ...delivery,
    };
    const ballId = await logBall(ballRecord);
    setLastBallId(ballId);

    // Check if over complete → need new bowler
    const overCompleted = updated.legalBalls % 6 === 0 && updated.legalBalls > 0;

    // Check innings complete
    if (updated.isComplete) {
      await persistInnings(updated);
      await handleInningsComplete(updated);
      return;
    }

    // Need new batsman?
    if (updated.strikerIndex === null) {
      await persistInnings(updated);
      setShowNewBatsman(true);
      return;
    }

    // Need new bowler?
    if (overCompleted || updated.currentBowlerIndex === null) {
      await persistInnings(updated);
      setShowBowlerSelect(true);
      return;
    }

    await persistInnings(updated);
  };

  const handleDismissalConfirm = async ({ dismissalType, runs, dismissedBatsmanIndex, fielder }) => {
    setShowDismissal(false);
    const delivery = {
      type: DELIVERY_TYPES.WICKET,
      runs: runs || 0,
      extras: 0,
      dismissalType,
      dismissedBatsmanIndex,
      dismissedBy: fielder || innings.bowlers[innings.currentBowlerIndex]?.name,
    };
    await processAndSave(delivery);
  };

  const handleInningsComplete = async (completedInnings) => {
    const m = await getMatch(matchId);
    const nextInningsIndex = m.currentInnings + 1;
    const maxInnings = getMaxInnings(m.matchType);

    if (nextInningsIndex >= maxInnings) {
      // Match complete
      const allInnings = [...(m.innings || [])];
      allInnings[m.currentInnings] = completedInnings;
      const result = calculateResult({ ...m, innings: allInnings });
      await updateMatch(matchId, {
        innings: allInnings,
        status: 'completed',
        result,
      });
      navigate(`/match/${matchId}/result`);
      return;
    }

    // For Test: check if follow-on or match conditions
    setShowInningsBreak(true);
  };

  const startNextInnings = async () => {
    setShowInningsBreak(false);
    const m = await getMatch(matchId);
    const nextIdx = m.currentInnings + 1;
    const battingTeamIdx = getBattingTeamIdx(nextIdx);
    const bowlingTeamIdx = 1 - battingTeamIdx;
    const teamSize = allPlayers[battingTeamIdx]?.length || 11;
    const newInn = initInnings(m.teams[battingTeamIdx], m.teams[bowlingTeamIdx], m.totalOvers, false, m.lastManStanding, teamSize);

    // Update match
    const updatedMatch = { ...m, currentInnings: nextIdx };
    const inningsArr = [...(m.innings || [])];
    inningsArr[nextIdx] = newInn;
    updatedMatch.innings = inningsArr;
    await updateMatch(matchId, updatedMatch);
    setMatch(updatedMatch);
    setInnings(newInn);
    setShowStrikerSelect(true);
  };

  const handleUndo = async () => {
    const prevInnings = await popUndoHistory(matchId);
    if (!prevInnings) { showToast('Nothing to undo'); return; }

    const deleted = await deleteLastBall(matchId, match.currentInnings);
    if (!deleted) { showToast('Could not delete last ball record'); return; }

    setInnings(prevInnings);
    await persistInnings(prevInnings);
    
    // Also fetch the last ball to update lastBallId if needed
    const balls = await getBalls(matchId, match.currentInnings);
    if (balls.length > 0) setLastBallId(balls[balls.length - 1].id);
    else setLastBallId(null);

    showToast('Last ball undone ↩️');
  };

  const handleSelectStriker = (player) => {
    let updated = innings;
    if (!innings.batsmen.some(b => b.playerId === player.id)) {
      updated = addBatsman(innings, player.id, player.name, true);
    } else {
      // Set as striker
      updated = { ...innings };
      const idx = updated.batsmen.findIndex(b => b.playerId === player.id);
      updated.strikerIndex = idx;
      updated.batsmen = updated.batsmen.map((b, i) => ({ ...b, isStriker: i === idx }));
    }
    setInnings(updated);
    persistInnings(updated);
    if (!updated.nonStrikerIndex !== null) setShowNonStrikerSelect(true);
  };

  const handleSelectNonStriker = (player) => {
    let updated = innings;
    if (!innings.batsmen.some(b => b.playerId === player.id)) {
      updated = addBatsman(innings, player.id, player.name, false);
    }
    setInnings(updated);
    persistInnings(updated);
    if (updated.currentBowlerIndex === null) setShowBowlerSelect(true);
  };

  const handleSelectBowler = (player) => {
    const updated = addBowler(innings, player.id, player.name);
    setInnings(updated);
    persistInnings(updated);
  };

  const handleNewBatsman = (player) => {
    const updated = addBatsman(innings, player.id, player.name, true);
    setInnings(updated);
    persistInnings(updated);
  };

  const handleChangeStrike = () => {
    const updated = {
      ...innings,
      strikerIndex: innings.nonStrikerIndex,
      nonStrikerIndex: innings.strikerIndex,
      batsmen: innings.batsmen.map((b, i) => ({
        ...b,
        isStriker: i === innings.nonStrikerIndex,
      })),
    };
    setInnings(updated);
    persistInnings(updated);
    showToast('Strike changed ↔️');
  };

  const handleRetiredOut = () => {
    if (innings.strikerIndex === null) return;
    const updated = { ...innings };
    const striker = updated.batsmen[updated.strikerIndex];
    if (striker) {
      striker.isOut = true;
      striker.isOnCrease = false;
      striker.dismissal = 'Retired Out';
    }
    updated.wickets += 1;
    updated.strikerIndex = null;
    setInnings(updated);
    persistInnings(updated);
    setShowNewBatsman(true);
  };

  const handleMatchSettings = async (settings) => {
    await updateMatch(matchId, settings);
    const m = await getMatch(matchId);
    setMatch(m);
    // Update innings overs too
    if (innings) {
      const updated = { ...innings, totalOvers: settings.totalOvers };
      setInnings(updated);
      persistInnings(updated);
    }
    showToast('Settings updated ✓');
  };

  const handleEditPlayerSave = async (updatedData) => {
    const { db } = await import('../db/database');
    await db.players.update(showEditPlayer.id, updatedData);
    // Refresh players
    const p0 = await getPlayers(matchId, 0);
    const p1 = await getPlayers(matchId, 1);
    setAllPlayers({ 0: p0, 1: p1 });
    // Update name in innings if they're on crease
    if (innings) {
      const updated = { ...innings };
      updated.batsmen = updated.batsmen.map(b =>
        b.playerId === showEditPlayer.id ? { ...b, name: updatedData.name } : b
      );
      updated.bowlers = updated.bowlers.map(b =>
        b.playerId === showEditPlayer.id ? { ...b, name: updatedData.name } : b
      );
      setInnings(updated);
      persistInnings(updated);
    }
    setShowEditPlayer(null);
    showToast('Player updated ✓');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!match || !innings) return null;

  if (showInningsBreak) {
    const prevInn = match.innings?.[match.currentInnings];
    const nextIdx = match.currentInnings + 1;
    const nextTeamIdx = getBattingTeamIdx(nextIdx);
    return (
      <InningsBreakPanel
        match={match}
        inn1={prevInn || innings}
        nextTeam={match.teams?.[nextTeamIdx] || ''}
        onStart={startNextInnings}
        matchType={match.matchType}
        inningsIndex={nextIdx}
      />
    );
  }

  const striker = innings.batsmen[innings.strikerIndex];
  const nonStriker = innings.batsmen[innings.nonStrikerIndex];
  const currentBowler = innings.bowlers[innings.currentBowlerIndex];
  const target = match.currentInnings > 0 && match.matchType !== MATCH_TYPES.TEST
    ? (match.innings?.[match.currentInnings - 1]?.runs || 0) + 1
    : null;

  const crr = calcCRR(innings.runs, innings.legalBalls);
  const rrr = target ? calcRRR(target, innings.runs, innings.legalBalls, innings.totalOvers) : null;
  const inningsLabel = getInningsLabel(match.currentInnings, match.matchType);

  // Current over balls
  const overBalls = innings.currentOverBalls || [];

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Top Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{match.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inningsLabel} • {match.matchType}</div>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
          <Settings2 size={22} />
        </button>
      </div>

      {/* Scoreboard */}
      <div className="scoreboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="score-team-name">{innings.battingTeam}</div>
            <div className="score-display">{innings.runs}/{innings.wickets}</div>
            <div className="score-overs">
              Overs: {formatOvers(innings.legalBalls)} {innings.totalOvers > 0 ? `/ ${innings.totalOvers}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="crr-badge" style={{ marginBottom: 6 }}>CRR: {crr}</div>
            {rrr && (
              <div style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d', padding: '4px 10px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600 }}>
                RRR: {rrr}
              </div>
            )}
            {target && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginTop: 6 }}>
                Target: {target} ({target - innings.runs} needed)
              </div>
            )}
          </div>
        </div>

        {/* Current Over */}
        {overBalls.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>This Over</div>
            <div className="over-balls">
              {overBalls.map((b, i) => {
                let cls = 'ball-0';
                if (b.type === DELIVERY_TYPES.WICKET) cls = 'ball-W';
                else if (b.type === DELIVERY_TYPES.WIDE) cls = 'ball-Wd';
                else if (b.type === DELIVERY_TYPES.NO_BALL) cls = 'ball-NB';
                else if (b.runs === 6) cls = 'ball-6';
                else if (b.runs === 4) cls = 'ball-4';
                else cls = `ball-${b.runs}`;
                return (
                  <div key={i} className={`ball-indicator ${cls}`}>
                    {b.type === DELIVERY_TYPES.WICKET ? 'W' : b.type === DELIVERY_TYPES.WIDE ? 'Wd' : b.type === DELIVERY_TYPES.NO_BALL ? 'NB' : b.runs}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Overs (Last 3) */}
        {innings.overHistory && innings.overHistory.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Overs</div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
              {innings.overHistory.slice(-3).map((o, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '4px 12px 4px 8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Ov {o.over}
                  </div>
                  <div className="over-balls" style={{ display: 'flex', gap: 4 }}>
                    {o.balls.map((b, i) => {
                      let cls = 'ball-0';
                      if (b.type === DELIVERY_TYPES.WICKET) cls = 'ball-W';
                      else if (b.type === DELIVERY_TYPES.WIDE) cls = 'ball-Wd';
                      else if (b.type === DELIVERY_TYPES.NO_BALL) cls = 'ball-NB';
                      else if (b.runs === 6) cls = 'ball-6';
                      else if (b.runs === 4) cls = 'ball-4';
                      else cls = `ball-${b.runs}`;
                      return (
                        <div key={i} className={`ball-indicator ${cls}`} style={{ width: 22, height: 22, fontSize: '0.65rem' }}>
                          {b.type === DELIVERY_TYPES.WICKET ? 'W' : b.type === DELIVERY_TYPES.WIDE ? 'Wd' : b.type === DELIVERY_TYPES.NO_BALL ? 'NB' : b.runs}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container" style={{ paddingTop: 14 }}>
        {/* Batsmen */}
        <p className="section-title">Batting</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {[striker, nonStriker].filter(Boolean).map((batsman, i) => (
            <motion.div
              key={batsman.playerId}
              layout
              className={`batsman-card ${batsman.isStriker ? 'striker' : ''}`}
              onClick={() => setShowEditPlayer(allPlayers[getBattingTeamIdx(match.currentInnings)]?.find(p => p.id === batsman.playerId))}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {batsman.isStriker && <div className="striker-dot" />}
                  <div className="batsman-name">{batsman.name}</div>
                  {batsman.isStriker && <span style={{ fontSize: '0.7rem', background: 'var(--color-primary)', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>*</span>}
                </div>
                <div className="batsman-stats">
                  4s: {batsman.fours} | 6s: {batsman.sixes} | SR: {(batsman.balls > 0 ? (batsman.runs / batsman.balls * 100).toFixed(1) : '0.0')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="batsman-runs">{batsman.runs}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Inter' }}>* ({batsman.balls})</span></div>
              </div>
            </motion.div>
          ))}
          {(!striker) && (
            <button className="btn btn-secondary btn-full" onClick={() => setShowStrikerSelect(true)}>
              + Select Opening Batsman
            </button>
          )}
          {striker && !nonStriker && (!innings.lastManStanding || getBattingPlayers().length > 0) && (
            <button className="btn btn-secondary btn-full" onClick={() => setShowNonStrikerSelect(true)}>
              + Select Non-Striker
            </button>
          )}
        </div>

        {/* Bowler */}
        <p className="section-title">Bowling</p>
        <div style={{ marginBottom: 14 }}>
          {currentBowler ? (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{currentBowler.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatOvers(currentBowler.legalBalls)} Ov • {currentBowler.runs} Runs • {currentBowler.wickets}W • Econ: {(currentBowler.legalBalls > 0 ? (currentBowler.runs / currentBowler.legalBalls * 6).toFixed(2) : '0.00')}
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowBowlerSelect(true)}>
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-secondary btn-full" onClick={() => setShowBowlerSelect(true)}>
              + Select Bowler
            </button>
          )}
        </div>

        {/* Scoring Buttons */}
        <p className="section-title">Score</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
          {[0, 1, 2, 3, 4, 6].map(runs => (
            <motion.button
              key={runs}
              className={`score-btn score-btn-${runs}`}
              onClick={() => handleDelivery(DELIVERY_TYPES.NORMAL, runs)}
              whileTap={{ scale: 0.93 }}
            >
              {runs}
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 10 }}>
          <motion.button
            className="score-btn score-btn-wicket"
            style={{ minHeight: 56 }}
            onClick={() => handleDelivery(DELIVERY_TYPES.WICKET)}
            whileTap={{ scale: 0.95 }}
          >
            🏏 WICKET
          </motion.button>
        </div>

        {/* Extras */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <motion.button className="score-btn score-btn-wide" onClick={() => setShowExtrasModal(DELIVERY_TYPES.WIDE)} whileTap={{ scale: 0.93 }}>
            Wide
          </motion.button>
          <motion.button className="score-btn score-btn-noball" onClick={() => setShowExtrasModal(DELIVERY_TYPES.NO_BALL)} whileTap={{ scale: 0.93 }}>
            No Ball
          </motion.button>
          <motion.button className="score-btn score-btn-bye" onClick={() => setShowExtrasModal(DELIVERY_TYPES.BYE)} whileTap={{ scale: 0.93 }}>
            Bye
          </motion.button>
          <motion.button className="score-btn score-btn-legbye" onClick={() => setShowExtrasModal(DELIVERY_TYPES.LEG_BYE)} whileTap={{ scale: 0.93 }}>
            Leg Bye
          </motion.button>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleChangeStrike}>
            <RefreshCw size={15} /> Change Strike
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleUndo}>
            <RotateCcw size={15} /> Undo Last Ball
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleRetiredOut}>
            Retired Out
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/match/${matchId}/summary`)}>
            View Scorecard
          </button>
        </div>

        {/* Innings Summary */}
        <div className="card" style={{ marginBottom: 8 }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: 8 }}>
              {[
                ['Wides', innings.extras?.wides || 0],
                ['No Balls', innings.extras?.noBalls || 0],
                ['Byes', innings.extras?.byes || 0],
                ['Leg Byes', innings.extras?.legByes || 0],
                ['Total Extras', (innings.extras?.wides || 0) + (innings.extras?.noBalls || 0) + (innings.extras?.byes || 0) + (innings.extras?.legByes || 0)],
                ['Partnerships', innings.wickets + 1],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '8px 0' }}>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{val}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showBowlerSelect && (
          <PlayerSelectModal
            title="Select Bowler"
            players={getBowlingPlayers()}
            onSelect={handleSelectBowler}
            onClose={() => setShowBowlerSelect(false)}
          />
        )}
        {showStrikerSelect && (
          <PlayerSelectModal
            title="Select Striker (Opening Batsman)"
            players={getBattingPlayers()}
            onSelect={handleSelectStriker}
            onClose={() => setShowStrikerSelect(false)}
            excludeIds={innings.nonStrikerIndex !== null ? [innings.batsmen[innings.nonStrikerIndex]?.playerId] : []}
          />
        )}
        {showNonStrikerSelect && (
          <PlayerSelectModal
            title="Select Non-Striker"
            players={getBattingPlayers()}
            onSelect={handleSelectNonStriker}
            onClose={() => setShowNonStrikerSelect(false)}
            excludeIds={innings.strikerIndex !== null ? [innings.batsmen[innings.strikerIndex]?.playerId] : []}
          />
        )}
        {showNewBatsman && (
          <PlayerSelectModal
            title="Select New Batsman"
            players={getBattingPlayers()}
            onSelect={handleNewBatsman}
            onClose={() => setShowNewBatsman(false)}
          />
        )}
        {showDismissal && (
          <DismissalModal
            batsmen={innings.batsmen}
            bowlers={innings.bowlers}
            onConfirm={handleDismissalConfirm}
            onClose={() => { setShowDismissal(false); setPendingWicket(null); }}
          />
        )}
        {showSettings && (
          <MatchSettingsModal
            match={match}
            onSave={handleMatchSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showEditPlayer && (
          <EditPlayerModal
            player={showEditPlayer}
            onSave={handleEditPlayerSave}
            onClose={() => setShowEditPlayer(null)}
          />
        )}
        {showExtrasModal && (
          <ExtrasModal
            type={showExtrasModal}
            onConfirm={(type, val) => {
              setShowExtrasModal(null);
              if (type === DELIVERY_TYPES.WIDE) handleDelivery(type, 0, val);
              else handleDelivery(type, val, 0);
            }}
            onClose={() => setShowExtrasModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
