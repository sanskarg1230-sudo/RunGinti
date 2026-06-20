import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { getStats } from '../db/database';
import { formatOvers, calcCRR } from '../utils/cricketEngine';

const COLORS = ['#16a34a', '#ef4444', '#3b82f6', '#f59e0b'];

function StatBox({ value, label, icon, color }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="stat-card-icon" style={{ background: `${color}20` }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      </div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </motion.div>
  );
}

export default function Statistics() {
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const { matches = [], totalRuns, highestScore, lowestScore, totalMatches, completedMatches, totalWins } = stats;

  // Win/Loss pie data
  const pieData = [
    { name: 'Won', value: totalWins },
    { name: 'Lost/Draw', value: completedMatches - totalWins },
  ].filter(d => d.value > 0);

  // Match type breakdown
  const typeCount = {};
  matches.forEach(m => {
    typeCount[m.matchType] = (typeCount[m.matchType] || 0) + 1;
  });
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  // Runs per match (last 10)
  const runsData = matches
    .filter(m => m.innings?.length > 0)
    .slice(-10)
    .map(m => ({
      name: m.name?.substring(0, 12) || 'Match',
      team1: m.innings?.[0]?.runs || 0,
      team2: m.innings?.[1]?.runs || 0,
    }));

  // Average team score
  const allInnings = matches.flatMap(m => m.innings || []).filter(Boolean);
  const avgScore = allInnings.length
    ? Math.round(allInnings.reduce((s, i) => s + (i.runs || 0), 0) / allInnings.length)
    : 0;

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
            Statistics
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: 8, borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
        </div>
      </header>

      <div className="container" style={{ padding: '0 16px' }}>
        {totalMatches === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No data yet</h3>
            <p>Play some matches to see statistics!</p>
          </div>
        ) : (
          <>
            {/* Stat Grid */}
            <p className="section-title">Overview</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <StatBox value={totalMatches} label="Total Matches" icon="🏏" color="#16a34a" />
              <StatBox value={totalWins} label="Total Wins" icon="🏆" color="#f59e0b" />
              <StatBox value={totalRuns.toLocaleString()} label="Total Runs" icon="🏃" color="#3b82f6" />
              <StatBox value={avgScore} label="Avg Team Score" icon="📈" color="#8b5cf6" />
              <StatBox value={highestScore} label="Highest Score" icon="⬆️" color="#16a34a" />
              <StatBox value={lowestScore === Infinity ? 0 : lowestScore} label="Lowest Score" icon="⬇️" color="#ef4444" />
            </div>

            {/* Win/Loss Pie */}
            {pieData.length > 0 && (
              <div className="chart-container" style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Win / Loss Record</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Match Type Breakdown */}
            {typeData.length > 0 && (
              <div className="chart-container" style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Matches by Type</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={typeData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Runs per Match */}
            {runsData.length > 0 && (
              <div className="chart-container" style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Team Scores — Recent Matches</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={runsData} margin={{ top: 0, right: 8, bottom: 20, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="team1" name="1st Inn" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="team2" name="2nd Inn" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
