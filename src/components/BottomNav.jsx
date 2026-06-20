import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, BarChart3, Settings, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/history', icon: Target, label: 'Matches' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/match/') && location.pathname.includes('/live')) return null;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, width: '100%', zIndex: 50,
      background: 'var(--bg-surface)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-color)', borderTopLeftRadius: 16, borderTopRightRadius: 16,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 80, paddingBottom: 'env(safe-area-inset-bottom, 8px)'
    }}>
      {navItems.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path;
        return (
          <button 
            key={path} 
            onClick={() => navigate(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: active ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
              padding: '8px 16px', borderRadius: 12,
              transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
              transform: 'scale(1)'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Icon size={24} fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: 4 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
