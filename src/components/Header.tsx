import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { username, logout } = useAuth();

  return (
    <header style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1rem 0', boxShadow: 'var(--shadow-md)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={28} color="var(--color-accent)" />
          <div>
            <h2 style={{ color: 'white', fontSize: '1.25rem', margin: 0, textShadow: '0 2px 10px rgba(255,255,255,0.2)' }}>InspectHub</h2>
            <span style={{ fontSize: '0.7rem', color: '#A0ADC0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</span>
          </div>
        </div>

        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', display: 'none' }} className="officer-id">
              Inspector: <strong>{username}</strong>
            </span>
            <button onClick={logout} className="btn" style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }} title="Secure Logout">
              <LogOut size={18} />
              <span style={{ marginLeft: '0.5rem' }} className="logout-text">Logout</span>
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @media (max-width: 600px) {
          .officer-id { display: none !important; }
          .logout-text { display: none; }
        }
        @media (min-width: 601px) {
          .officer-id { display: inline-block !important; }
        }
      `}</style>
    </header>
  );
}
