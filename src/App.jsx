import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import CreateMatch from './pages/CreateMatch';
import LiveScoring from './pages/LiveScoring';
import MatchSummary from './pages/MatchSummary';
import MatchResult from './pages/MatchResult';
import MatchHistory from './pages/MatchHistory';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="app-shell">
      <div className="desktop-sidebar">
        <Sidebar />
      </div>
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateMatch />} />
          <Route path="/match/:id/live" element={<LiveScoring />} />
          <Route path="/match/:id/summary" element={<MatchSummary />} />
          <Route path="/match/:id/result" element={<MatchResult />} />
          <Route path="/history" element={<MatchHistory />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <div className="bottom-nav-container">
        <BottomNav />
      </div>
      <Toast />
    </div>
  );
}
