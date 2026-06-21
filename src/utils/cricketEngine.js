// ─── Cricket Engine ──────────────────────────────────────────────────────────
// Pure functions for cricket scoring logic

export const DELIVERY_TYPES = {
  NORMAL: 'normal',
  WIDE: 'wide',
  NO_BALL: 'noball',
  BYE: 'bye',
  LEG_BYE: 'legbye',
  WICKET: 'wicket',
};

export const DISMISSAL_TYPES = {
  BOWLED: 'Bowled',
  CAUGHT: 'Caught',
  LBW: 'LBW',
  RUN_OUT: 'Run Out',
  STUMPED: 'Stumped',
  HIT_WICKET: 'Hit Wicket',
  CAUGHT_BEHIND: 'Caught Behind',
  HANDLED_BALL: 'Handled Ball',
  RETIRED_OUT: 'Retired Out',
  RETIRED_HURT: 'Retired Hurt',
};

export const MATCH_TYPES = {
  T20: 'T20',
  ODI: 'ODI',
  TEST: 'Test',
  CUSTOM: 'Custom',
};

// Check if a delivery is a legal delivery (counts towards over)
export function isLegalDelivery(type) {
  return type !== DELIVERY_TYPES.WIDE && type !== DELIVERY_TYPES.NO_BALL;
}

// Format overs: balls → "X.Y" string
export function formatOvers(legalBalls) {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

// Parse overs string to legal balls count
export function parseBalls(oversStr) {
  const [o, b] = oversStr.toString().split('.').map(Number);
  return (o * 6) + (b || 0);
}

// Calculate Current Run Rate
export function calcCRR(runs, legalBalls) {
  if (legalBalls === 0) return 0;
  return ((runs / legalBalls) * 6).toFixed(2);
}

// Calculate Required Run Rate
export function calcRRR(target, currentRuns, legalBalls, totalOvers) {
  const totalBalls = totalOvers * 6;
  const remaining = totalBalls - legalBalls;
  const needed = target - currentRuns;
  if (remaining <= 0 || needed <= 0) return 0;
  return ((needed / remaining) * 6).toFixed(2);
}

// Calculate strike rate
export function calcSR(runs, balls) {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
}

// Calculate economy rate
export function calcEconomy(runs, legalBalls) {
  if (legalBalls === 0) return '0.00';
  return ((runs / legalBalls) * 6).toFixed(2);
}

// Initialize a fresh innings state
export function initInnings(battingTeam, bowlingTeam, totalOvers, isSuperOver = false, lastManStanding = false, teamSize = 11) {
  return {
    battingTeam,
    bowlingTeam,
    totalOvers: isSuperOver ? 1 : totalOvers,
    isSuperOver,
    lastManStanding,
    teamSize,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 },
    batsmen: [],       // { playerId, name, runs, balls, fours, sixes, dismissal, isOut, isStriker, isOnCrease }
    bowlers: [],       // { playerId, name, overs, runs, wickets, maidens, legalBalls, currentOverRuns }
    currentBowlerIndex: null,
    strikerIndex: null,
    nonStrikerIndex: null,
    overHistory: [],   // Array of over summaries
    currentOverBalls: [], // balls in current over
    isComplete: false,
    endReason: null,   // 'allout' | 'overs' | 'target' | 'declared'
  };
}

// Initialize batsman entry
export function initBatsman(playerId, name) {
  return {
    playerId,
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    dismissal: null,
    dismissedBy: null,
    isOut: false,
    isStriker: false,
    isOnCrease: true,
  };
}

// Initialize bowler entry
export function initBowler(playerId, name) {
  return {
    playerId,
    name,
    legalBalls: 0,
    runs: 0,
    wickets: 0,
    maidens: 0,
    currentOverRuns: 0,
    noBalls: 0,
    wides: 0,
  };
}

// Process a delivery and return updated innings state
export function processDelivery(innings, delivery, target = null) {
  // delivery: { type, runs, extras, wicket, dismissalType, dismissedBatsmanIndex, newBatsmanId, newBatsmanName }
  const state = deepClone(innings);
  const { type, runs = 0, extras = 0 } = delivery;

  const bowler = state.bowlers[state.currentBowlerIndex];
  const striker = state.batsmen[state.strikerIndex];

  const legal = isLegalDelivery(type);
  const totalRunsThisBall = runs + extras;

  // ── Update extras ────────────────────────────────────────────────────────
  if (type === DELIVERY_TYPES.WIDE) {
    state.extras.wides += 1 + extras;
    state.runs += 1 + extras;
    bowler.runs += 1 + extras;
    bowler.wides += 1;
    bowler.currentOverRuns += 1 + extras;
  } else if (type === DELIVERY_TYPES.NO_BALL) {
    state.extras.noBalls += 1;
    state.runs += 1 + runs;
    bowler.runs += 1 + runs;
    bowler.noBalls += 1;
    bowler.currentOverRuns += 1 + runs;
    if (striker) {
      striker.runs += runs;
      striker.balls += 1;
      if (runs === 4) striker.fours += 1;
      if (runs === 6) striker.sixes += 1;
    }
  } else if (type === DELIVERY_TYPES.BYE) {
    state.extras.byes += runs;
    state.runs += runs;
    bowler.runs += runs;
    bowler.currentOverRuns += runs;
    if (striker) striker.balls += 1;
    if (legal) bowler.legalBalls += 1;
  } else if (type === DELIVERY_TYPES.LEG_BYE) {
    state.extras.legByes += runs;
    state.runs += runs;
    bowler.runs += runs;
    bowler.currentOverRuns += runs;
    if (striker) striker.balls += 1;
    if (legal) bowler.legalBalls += 1;
  } else if (type === DELIVERY_TYPES.NORMAL || type === DELIVERY_TYPES.WICKET) {
    state.runs += runs;
    bowler.runs += runs;
    bowler.currentOverRuns += runs;
    if (striker) {
      striker.runs += runs;
      striker.balls += 1;
      if (runs === 4) striker.fours += 1;
      if (runs === 6) striker.sixes += 1;
    }
    if (legal) bowler.legalBalls += 1;
  }

  // ── Update legal ball count for innings ──────────────────────────────────
  if (legal) {
    state.legalBalls += 1;
    state.currentOverBalls.push({ type, runs, extras });
  } else {
    state.currentOverBalls.push({ type, runs, extras });
  }

  // ── Handle wicket ────────────────────────────────────────────────────────
  if (type === DELIVERY_TYPES.WICKET) {
    const dismissedIdx = delivery.dismissedBatsmanIndex ?? state.strikerIndex;
    const dismissed = state.batsmen[dismissedIdx];
    if (dismissed) {
      dismissed.isOut = true;
      dismissed.isOnCrease = false;
      dismissed.isStriker = false;
      dismissed.dismissal = delivery.dismissalType || DISMISSAL_TYPES.BOWLED;
      dismissed.dismissedBy = delivery.dismissedBy || bowler?.name;
    }
    // Bowler gets credit for non-run-out wickets
    const runOutTypes = [DISMISSAL_TYPES.RUN_OUT, DISMISSAL_TYPES.RETIRED_OUT, DISMISSAL_TYPES.RETIRED_HURT, DISMISSAL_TYPES.HANDLED_BALL];
    if (!runOutTypes.includes(delivery.dismissalType)) {
      bowler.wickets += 1;
    }
    state.wickets += 1;
    // New batsman will be set separately
    if (dismissedIdx === state.strikerIndex) {
      state.strikerIndex = null;
    } else if (dismissedIdx === state.nonStrikerIndex) {
      state.nonStrikerIndex = null;
    }

    // If Last Man Standing is active, and only 1 player is left (nonStriker is not null, but striker is null)
    if (state.lastManStanding && state.strikerIndex === null && state.nonStrikerIndex !== null) {
      // The last remaining player (non-striker) becomes the striker
      state.strikerIndex = state.nonStrikerIndex;
      state.nonStrikerIndex = null;
      state.batsmen[state.strikerIndex].isStriker = true;
    }
  }

  // ── Strike rotation ──────────────────────────────────────────────────────
  if (type !== DELIVERY_TYPES.WICKET) {
    const oddRuns = (runs + extras) % 2 === 1;
    if (oddRuns && state.nonStrikerIndex !== null) {
      // Swap striker and non-striker
      const temp = state.strikerIndex;
      state.strikerIndex = state.nonStrikerIndex;
      state.nonStrikerIndex = temp;
      // Update isStriker flags
      state.batsmen.forEach((b, i) => {
        if (b.isOnCrease && !b.isOut) b.isStriker = i === state.strikerIndex;
      });
    }
  }

  // ── Over completion ──────────────────────────────────────────────────────
  const overComplete = state.legalBalls % 6 === 0 && state.legalBalls > 0;
  if (overComplete && legal) {
    // Check maiden
    const overRuns = bowler.currentOverRuns;
    if (overRuns === 0) bowler.maidens += 1;
    bowler.currentOverRuns = 0;

    // Push to over history
    state.overHistory.push({
      over: Math.floor(state.legalBalls / 6),
      bowlerName: bowler.name,
      runs: overRuns,
      balls: [...state.currentOverBalls],
    });
    state.currentOverBalls = [];

    // Swap strike at end of over
    if (state.nonStrikerIndex !== null) {
      const temp = state.strikerIndex;
      state.strikerIndex = state.nonStrikerIndex;
      state.nonStrikerIndex = temp;
      state.batsmen.forEach((b, i) => {
        if (b.isOnCrease && !b.isOut) b.isStriker = i === state.strikerIndex;
      });
    }

    // Reset current bowler (must select new)
    state.currentBowlerIndex = null;
  }

  // ── Check innings completion ─────────────────────────────────────────────
  const maxOvers = state.totalOvers;
  const oversComplete = maxOvers > 0 && state.legalBalls >= maxOvers * 6;
  const maxWickets = state.lastManStanding ? (state.teamSize || 11) : ((state.teamSize || 11) - 1);
  const allOut = state.wickets >= (state.isSuperOver ? 2 : maxWickets);
  const targetChased = target !== null && state.runs >= target;

  if (allOut) {
    state.isComplete = true;
    state.endReason = 'allout';
  } else if (oversComplete) {
    state.isComplete = true;
    state.endReason = 'overs';
  } else if (targetChased) {
    state.isComplete = true;
    state.endReason = 'target';
  }

  return state;
}

// Add a new batsman to innings
export function addBatsman(innings, playerId, name, isStriker = true) {
  const state = deepClone(innings);
  const batsman = initBatsman(playerId, name);
  batsman.isStriker = isStriker;
  state.batsmen.push(batsman);
  const idx = state.batsmen.length - 1;
  if (isStriker) {
    state.strikerIndex = idx;
  } else {
    state.nonStrikerIndex = idx;
  }
  state.batsmen[idx].isStriker = isStriker;
  return state;
}

// Add a new bowler to innings
export function addBowler(innings, playerId, name) {
  const state = deepClone(innings);
  // Check if bowler already exists
  const existing = state.bowlers.findIndex(b => b.playerId === playerId);
  if (existing !== -1) {
    state.currentBowlerIndex = existing;
    state.bowlers[existing].currentOverRuns = 0;
    return state;
  }
  const bowler = initBowler(playerId, name);
  state.bowlers.push(bowler);
  state.currentBowlerIndex = state.bowlers.length - 1;
  return state;
}

export function calculateResult(matchData) {
  const { innings, matchType } = matchData;
  if (!innings || innings.length < 2) return null;

  if (matchType === MATCH_TYPES.TEST) {
    return calculateTestResult(matchData);
  }

  let inn1, inn2;
  // Handle Super Overs (more than 2 innings)
  if (innings.length > 2) {
    if (innings.length % 2 === 1) return null; // Wait for the second team to bat in super over
    inn1 = innings[innings.length - 2];
    inn2 = innings[innings.length - 1];
  } else {
    inn1 = innings[0];
    inn2 = innings[1];
  }

  if (inn2.runs > inn1.runs) {
    const wicketsLeft = (inn2.isSuperOver ? 2 : 10) - inn2.wickets;
    return {
      winner: inn2.battingTeam,
      loser: inn1.battingTeam,
      margin: `${wicketsLeft} Wicket${wicketsLeft !== 1 ? 's' : ''}`,
      method: 'wickets',
    };
  } else if (inn1.runs > inn2.runs) {
    const runDiff = inn1.runs - inn2.runs;
    return {
      winner: inn1.battingTeam,
      loser: inn2.battingTeam,
      margin: `${runDiff} Run${runDiff !== 1 ? 's' : ''}`,
      method: 'runs',
    };
  } else {
    return { winner: null, margin: 'Match Tied', method: 'tie' };
  }
}

function calculateTestResult(matchData) {
  const { innings } = matchData;
  // Sum runs for each team
  const teamA = matchData.teams[0];
  const teamB = matchData.teams[1];

  const teamARuns = innings
    .filter(i => i.battingTeam === teamA)
    .reduce((s, i) => s + i.runs, 0);
  const teamBRuns = innings
    .filter(i => i.battingTeam === teamB)
    .reduce((s, i) => s + i.runs, 0);

  if (teamARuns > teamBRuns) {
    return { winner: teamA, loser: teamB, margin: `${teamARuns - teamBRuns} runs`, method: 'runs' };
  } else if (teamBRuns > teamARuns) {
    return { winner: teamB, loser: teamA, margin: `${teamBRuns - teamARuns} runs`, method: 'runs' };
  }
  return { winner: null, margin: 'Match Drawn', method: 'draw' };
}

// Get innings number label
export function getInningsLabel(index, matchType) {
  if (matchType === MATCH_TYPES.TEST) {
    const labels = ['1st', '2nd', '3rd', '4th'];
    return `${labels[index] || (index + 1) + 'th'} Innings`;
  }
  return index === 0 ? '1st Innings' : '2nd Innings';
}

// Get max innings for match type
export function getMaxInnings(matchType) {
  return matchType === MATCH_TYPES.TEST ? 4 : 2;
}

// Check if innings should swap (Test: each team bats max 2 times)
export function shouldSwapTeams(inningsIndex, matchType, innings) {
  if (matchType !== MATCH_TYPES.TEST) return inningsIndex % 2 === 1;
  // For test: team 0 bats in innings 0, 2; team 1 bats in innings 1, 3
  return true; // always alternate
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
