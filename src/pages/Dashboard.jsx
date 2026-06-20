import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusCircle, History, BarChart3, Trophy, Target,
  Users, Bell, RefreshCcw, Moon, Sun, Play, TrendingUp, Star, Verified,
  Calendar, Activity, UserPlus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getAllMatches } from '../db/database';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMatches().then(m => { setMatches(m); setLoading(false); });
  }, []);

  const completed = matches.filter(m => m.status === 'completed');
  const won = completed.filter(m => m.result?.winner).length;
  const lost = completed.length - won;
  const recent = matches.slice(0, 5);

  const stats = [
    { 
      icon: <BarChart3 size={24} />, value: matches.length, label: 'Total Matches', subLabel: 'All Time', 
      color: 'var(--color-primary)', bg: 'rgba(34, 197, 94, 0.2)', trendText: '20% from last month', trendIcon: <TrendingUp size={16} /> 
    },
    { 
      icon: <Trophy size={24} />, value: won, label: 'Matches Won', subLabel: matches.length > 0 ? `${Math.round((won/matches.length)*100)}% Win Rate` : '0% Win Rate', 
      color: '#ca94ff', bg: 'rgba(202, 148, 255, 0.2)', trendText: 'Top Performance', trendIcon: <Star size={16} /> 
    },
    { 
      icon: <Activity size={24} />, value: lost, label: 'Matches Lost', subLabel: 'Keep It Up!', 
      color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.2)', trendText: 'Perfect Defense', trendIcon: <Verified size={16} /> 
    },
    { 
      icon: <History size={24} />, value: completed.length, label: 'Completed', subLabel: matches.length > 0 ? `${Math.round((completed.length/matches.length)*100)}% Completed` : '0% Completed', 
      color: '#b4c5ff', bg: 'rgba(180, 197, 255, 0.2)', trendText: `In Progress: ${matches.length - completed.length}`, trendIcon: <History size={16} /> 
    },
  ];

  return (
    <div style={{ paddingBottom: 40, paddingLeft: 16, paddingRight: 16 }}>
      {/* Top Header */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
            RunGinti
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: 8, borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        style={{
          margin: '0 16px 24px', borderRadius: 20, overflow: 'hidden', position: 'relative',
          height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBO3XA7M5kAaYhOkYI789oS1y9eUgO7_lB665KzCq3wtvt-GPkLrH6rKT7JxPixxDozhF2mff5axeHaGLQ9RMZGILU_QTOdo8G_CceH-8uIgFySPw6orUOFoFl3Bw5tItWoVKZyzk7Slz5f5ZrtGnpJj8yRlrx5cgPssD2IHGjm9O9A2aI4HyXGQY_Zp36eFkPUjShOE_TSz65kC0hVfFbKtj4Rcuaet2SO6zNoAg7K1iQqTntoPIewwAjYNtX467_E4U9Gdl7PKRY6')",
          transition: 'transform 0.7s',
        }} className="hover-scale-bg" />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5, 11, 24, 0) 0%, rgba(5, 11, 24, 0.9) 100%)',
          display: 'flex', alignItems: 'flex-end', padding: '24px'
        }}>
          <div style={{ maxWidth: 500, position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 12, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Let's Make Every Over Count!
            </h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/create')}
              style={{ 
                padding: '8px 24px', fontSize: '0.875rem', fontWeight: 600, borderRadius: 999,
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <PlusCircle size={20} /> Create New Match
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)', borderRadius: 16, padding: 16,
              transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: 8
            }}
            whileHover={{ y: -4, borderColor: 'var(--color-primary)' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: 4 }}>{s.value}</div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions & Recent Matches */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <style>{`
          @media (min-width: 1024px) {
            .bento-grid { grid-template-columns: 1fr 2fr !important; }
          }
        `}</style>
        <div className="bento-grid" style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr' }}>
          
          {/* Quick Actions */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, paddingLeft: 8 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: <PlusCircle size={24} />, label: 'New Match', color: '#4be277', path: '/create' },
                { icon: <History size={24} />, label: 'Match History', color: '#b4c5ff', path: '/history' },
                { icon: <BarChart3 size={24} />, label: 'Statistics', color: '#ca94ff', path: '/stats' }
              ].map((action, i) => (
                <motion.button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)', borderRadius: 16, padding: 24,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                    cursor: 'pointer', color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 999, background: action.bg || `${action.color}15`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {action.icon}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Matches */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingLeft: 8 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Matches</h3>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/history'); }} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)' }}>View All</a>
            </div>
            
            <motion.div 
              whileHover={{ y: -4, borderColor: 'var(--color-primary)' }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)', borderRadius: 24, overflow: 'hidden',
                position: 'relative', transition: 'all 0.3s ease'
              }}
            >
              {/* Glow Effect */}
              <div style={{ position: 'absolute', right: -80, top: -80, width: 250, height: 250, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />
              
              <div style={{ padding: 32, position: 'relative', zIndex: 10 }}>
                {recent.length > 0 ? (() => {
                  const m = recent[0];
                  return (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ background: 'var(--bg-surface-2)', padding: 8, borderRadius: 8 }}>
                            <Calendar size={20} color="var(--color-primary)" />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                            {new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ padding: '6px 16px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--color-primary)', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {m.status === 'completed' ? 'Completed' : 'Live'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <style>{`
                          @media (min-width: 768px) {
                            .match-vs-layout { flex-direction: row !important; align-items: center; justify-content: space-between; }
                            .match-team-left { text-align: left; flex-direction: row !important; align-items: flex-start !important; }
                            .match-team-right { text-align: right; flex-direction: row-reverse !important; align-items: flex-end !important; }
                            .match-divider { flex-direction: column !important; }
                            .match-divider-line { width: 1px !important; height: 48px !important; }
                          }
                        `}</style>
                        <div className="match-vs-layout" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                          
                          {/* Team 1 */}
                          <div style={{ flex: 1 }}>
                            <div className="match-team-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--bg-surface-2)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                {m.teams?.[0]?.substring(0,3).toUpperCase()}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{m.teams?.[0]}</h4>
                                {m.innings?.[0] && (
                                  <>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1, marginBottom: 4 }}>
                                      {m.innings[0].runs}/{m.innings[0].wickets}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>({Math.floor(m.innings[0].legalBalls/6)}.{m.innings[0].legalBalls%6} Overs)</div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* VS Divider */}
                          <div className="match-divider" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <div className="match-divider-line" style={{ width: 48, height: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)' }} />
                            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                              VS
                            </div>
                            <div className="match-divider-line" style={{ width: 48, height: 1, background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.2), transparent)' }} />
                          </div>

                          {/* Team 2 */}
                          <div style={{ flex: 1 }}>
                            <div className="match-team-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--bg-surface-2)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                {m.teams?.[1]?.substring(0,3).toUpperCase()}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{m.teams?.[1]}</h4>
                                {m.innings?.[1] ? (
                                  <>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
                                      {m.innings[1].runs}/{m.innings[1].wickets}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>({Math.floor(m.innings[1].legalBalls/6)}.{m.innings[1].legalBalls%6} Overs)</div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Yet to bat</div>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ca94ff', margin: '0 0 24px 0' }}>
                          {m.result ? (m.result.winner ? `${m.result.winner} won by ${m.result.margin}` : 'Match Tied') : 'Match in progress'}
                        </p>
                        <button 
                          onClick={() => m.status === 'completed' ? navigate(`/match/${m.id}/summary`) : navigate(`/match/${m.id}/live`)}
                          style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          View Full Scorecard
                        </button>
                      </div>
                    </>
                  );
                })() : (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <span style={{ fontSize: '3rem' }}>🏏</span>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>No matches yet. Play your first match!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Season Progress */}
      <section style={{ 
        background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24,
        position: 'relative', overflow: 'hidden', marginTop: 24, marginBottom: 120
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'rgba(34, 197, 94, 0.1)', filter: 'blur(40px)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 8, height: 32, background: 'var(--color-primary)', borderRadius: 4 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Season Progress</h3>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span>Win Rate</span>
              <span>{matches.length > 0 ? Math.round((won/matches.length)*100) : 0}%</span>
            </div>
            <div style={{ height: 12, background: 'var(--bg-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #b4c5ff, var(--color-primary))',
                width: `${matches.length > 0 ? (won/matches.length)*100 : 0}%`,
                borderRadius: 999
              }} />
            </div>
          </div>
          
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
            Next target: Win 2 more matches to reach {matches.length > 0 ? Math.min(100, Math.round((won/matches.length)*100) + 10) : 50}%
          </p>
        </div>
      </section>

    </div>
  );
}
