import Dexie from 'dexie';

export const db = new Dexie('CricketScorerPro');

// v1 — original schema (never change this)
db.version(1).stores({
  matches: '++id, name, status, createdAt, teamA, teamB, matchType, result',
  balls: '++id, matchId, inningsIndex, over, ball, type, runs, extras, wicket, batsmanId, bowlerId, timestamp',
  players: '++id, matchId, teamIndex, name, number, role',
});

// v2 — saved teams feature
db.version(2).stores({
  matches: '++id, name, status, createdAt, teamA, teamB, matchType, result',
  balls: '++id, matchId, inningsIndex, over, ball, type, runs, extras, wicket, batsmanId, bowlerId, timestamp',
  players: '++id, matchId, teamIndex, name, number, role',
  savedTeams: '++id, name, createdAt',
  savedTeamPlayers: '++id, teamId, name, number, role',
});

// ─── Match Helpers ───────────────────────────────────────────────────────────

export async function createMatch(matchData) {
  const id = await db.matches.add({
    ...matchData,
    status: 'setup',
    createdAt: new Date().toISOString(),
    innings: [],
    currentInnings: 0,
    result: null,
  });
  return id;
}

export async function getMatch(id) {
  return db.matches.get(id);
}

export async function getAllMatches() {
  return db.matches.orderBy('createdAt').reverse().toArray();
}

export async function updateMatch(id, changes) {
  return db.matches.update(id, changes);
}

export async function deleteMatch(id) {
  await db.balls.where('matchId').equals(id).delete();
  await db.players.where('matchId').equals(id).delete();
  await db.matches.delete(id);
}

// ─── Undo Helpers ────────────────────────────────────────────────────────────

export async function pushUndoHistory(matchId, inningsState) {
  const m = await db.matches.get(matchId);
  if (!m) return;
  const hist = m.undoHistory || [];
  // Keep last 50 states to prevent bloat
  if (hist.length > 50) hist.shift();
  hist.push(inningsState);
  await db.matches.update(matchId, { undoHistory: hist });
}

export async function popUndoHistory(matchId) {
  const m = await db.matches.get(matchId);
  if (!m) return null;
  const hist = m.undoHistory || [];
  if (hist.length === 0) return null;
  const lastState = hist.pop();
  await db.matches.update(matchId, { undoHistory: hist });
  return lastState;
}

// ─── Player Helpers ──────────────────────────────────────────────────────────

export async function addPlayers(matchId, teamIndex, players) {
  const records = players.map((p, i) => ({
    matchId,
    teamIndex,
    name: p.name,
    number: p.number || i + 1,
    role: p.role || 'batsman',
  }));
  return db.players.bulkAdd(records);
}

export async function getPlayers(matchId, teamIndex) {
  return db.players
    .where('matchId').equals(matchId)
    .and(p => p.teamIndex === teamIndex)
    .toArray();
}

// ─── Ball Helpers ────────────────────────────────────────────────────────────

export async function logBall(ballData) {
  return db.balls.add({ ...ballData, timestamp: new Date().toISOString() });
}

export async function getBalls(matchId, inningsIndex) {
  return db.balls
    .where('matchId').equals(matchId)
    .and(b => b.inningsIndex === inningsIndex)
    .toArray();
}

export async function deleteLastBall(matchId, inningsIndex) {
  const balls = await db.balls
    .where('matchId').equals(matchId)
    .and(b => b.inningsIndex === inningsIndex)
    .reverse()
    .limit(1)
    .toArray();
  if (balls.length > 0) {
    await db.balls.delete(balls[0].id);
    return balls[0];
  }
  return null;
}

export async function getStats() {
  const matches = await db.matches.toArray();
  const completed = matches.filter(m => m.status === 'completed');
  const balls = await db.balls.toArray();

  const totalRuns = balls
    .filter(b => b.type === 'normal' || b.type === 'wide' || b.type === 'noball')
    .reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);

  const teamScores = [];
  for (const m of completed) {
    if (m.innings) {
      for (const inn of m.innings) {
        if (inn.runs !== undefined) teamScores.push(inn.runs);
      }
    }
  }

  const wins = completed.filter(m => m.result && m.result.winner).length;

  return {
    totalMatches: matches.length,
    completedMatches: completed.length,
    totalRuns,
    highestScore: teamScores.length ? Math.max(...teamScores) : 0,
    lowestScore: teamScores.length ? Math.min(...teamScores) : 0,
    totalWins: wins,
    matches,
  };
}

// ─── Saved Teams Helpers ─────────────────────────────────────────────────────

/** Save a team with its players. Returns the new savedTeam id. */
export async function saveTeam(name, players) {
  const teamId = await db.savedTeams.add({
    name: name.trim(),
    createdAt: new Date().toISOString(),
    playerCount: players.filter(p => p.name?.trim()).length,
  });
  const validPlayers = players
    .filter(p => p.name?.trim())
    .map((p, i) => ({
      teamId,
      name: p.name.trim(),
      number: p.number || i + 1,
      role: p.role || 'Batsman',
    }));
  await db.savedTeamPlayers.bulkAdd(validPlayers);
  return teamId;
}

/** Update an existing saved team's name and/or players. */
export async function updateSavedTeam(teamId, name, players) {
  await db.savedTeams.update(teamId, {
    name: name.trim(),
    playerCount: players.filter(p => p.name?.trim()).length,
  });
  // Replace all players
  await db.savedTeamPlayers.where('teamId').equals(teamId).delete();
  const validPlayers = players
    .filter(p => p.name?.trim())
    .map((p, i) => ({
      teamId,
      name: p.name.trim(),
      number: p.number || i + 1,
      role: p.role || 'Batsman',
    }));
  await db.savedTeamPlayers.bulkAdd(validPlayers);
}

/** Get all saved teams (metadata only, no players). */
export async function getAllSavedTeams() {
  return db.savedTeams.orderBy('name').toArray();
}

/** Get a single saved team with its players. */
export async function getSavedTeamWithPlayers(teamId) {
  const team = await db.savedTeams.get(teamId);
  if (!team) return null;
  const players = await db.savedTeamPlayers
    .where('teamId').equals(teamId)
    .toArray();
  return { ...team, players };
}

/** Delete a saved team and all its players. */
export async function deleteSavedTeam(teamId) {
  await db.savedTeamPlayers.where('teamId').equals(teamId).delete();
  await db.savedTeams.delete(teamId);
}

