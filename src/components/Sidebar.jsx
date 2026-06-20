import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  PlusCircle, 
  History, 
  BarChart2, 
  Users, 
  Shield, 
  Settings, 
  HelpCircle 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'New Match', path: '/create', icon: <PlusCircle size={20} /> },
    { name: 'Match History', path: '/history', icon: <History size={20} /> },
    { name: 'Statistics', path: '/stats', icon: <BarChart2 size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="sidebar" style={{
      width: 280,
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      padding: '24px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 8 }}>
        <div style={{ 
          background: 'var(--color-primary)', 
          width: 36, height: 36, 
          borderRadius: 10, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.2rem'
        }}>
          🏏
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>RunGinti</h1>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink 
              key={item.name} 
              to={item.path}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: isActive ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 600,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'var(--shadow-primary)' : 'none',
                }}
              >
                <div style={{ opacity: isActive ? 1 : 0.8 }}>
                  {item.icon}
                </div>
                {item.name}
              </motion.div>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Branding Card */}
      <div style={{ 
        background: 'linear-gradient(180deg, var(--bg-surface-2) 0%, var(--bg-surface) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '20px 16px',
        marginTop: 20,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract shapes / glow */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: 'var(--color-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(15px)' }} />
        
        <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>🏏</div>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
          Score Every Ball.<br/>Remember Every Moment.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>v1.0.0</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34, 197, 94, 0.15)', padding: '4px 8px', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, background: 'var(--color-primary)', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>Offline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
