import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, type Inspection } from '../services/db';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, Camera, Trash2, CheckCircle2, ClipboardCheck, Map } from 'lucide-react';

export default function Dashboard() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      loadInspections();
    }
  }, [username]);

  const loadInspections = async () => {
    try {
      const data = await db.getInspections(username!);
      // Sort newest first
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInspections(data);
    } catch (error) {
      console.error("Failed to load inspections", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent card click
    if (window.confirm("Are you sure you want to permanently delete this inspection record?")) {
      await db.deleteInspection(username!, id);
      setInspections(prev => prev.filter(insp => insp.id !== id));
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>My Inspections</h1>
        <Link to="/new" className="btn btn-primary">
          <Plus size={18} />
          New Record
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading records...
        </div>
      ) : inspections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed rgba(6, 182, 212, 0.3)', background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.6) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
          <style>
            {`
              @keyframes floatIcon {
                0% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-8px) scale(1.05); }
                100% { transform: translateY(0px) scale(1); }
              }
              @keyframes pulseGlow {
                0% { opacity: 0.1; transform: scale(0.9); }
                50% { opacity: 0.25; transform: scale(1.1); }
                100% { opacity: 0.1; transform: scale(0.9); }
              }
            `}
          </style>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem auto' }}>
            {/* Animated glowing background */}
            <div style={{ position: 'absolute', inset: -10, background: 'var(--color-primary)', filter: 'blur(30px)', borderRadius: '50%', animation: 'pulseGlow 4s ease-in-out infinite' }} />
            
            {/* Center prominent icon container */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', borderRadius: '50%', border: '2px solid rgba(6, 182, 212, 0.4)', boxShadow: 'var(--shadow-lg)' }}>
              <ClipboardCheck size={48} color="var(--color-primary-light)" />
            </div>
            
            {/* Floating satellite icons */}
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', padding: '0.6rem', animation: 'floatIcon 5s ease-in-out infinite', boxShadow: 'var(--shadow-md)', zIndex: 10 }}>
              <Camera size={22} color="var(--color-accent)" />
            </div>
            <div style={{ position: 'absolute', bottom: '5px', left: '-20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', padding: '0.6rem', animation: 'floatIcon 6s ease-in-out infinite', animationDelay: '1s', boxShadow: 'var(--shadow-md)', zIndex: 10 }}>
              <Map size={24} color="var(--color-success)" />
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Your Workspace is Ready</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', maxWidth: '420px', margin: '0 auto 2.5rem auto', lineHeight: '1.6', fontSize: '1rem' }}>
            There are no inspections to show here yet. Start capturing high-precision field data, photos, and GPS tags instantly.
          </p>
          <Link to="/new" className="btn btn-primary" style={{ padding: '0.9rem 2.2rem', fontSize: '1.05rem', borderRadius: '50px' }}>
            <Plus size={22} />
            Start First Inspection
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {inspections.map((insp) => (
            <div 
              key={insp.id} 
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer' }}
              onClick={() => navigate(`/inspection/${insp.id}`)}
              title="View Inspection Details"
            >
              <button
                onClick={(e) => handleDelete(e, insp.id)}
                style={{
                  position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'var(--color-danger)',
                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                }}
                title="Delete Record"
              >
                <Trash2 size={16} />
              </button>
              <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10, backgroundColor: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <CheckCircle2 size={12} /> Synchronized
              </div>
              {insp.photos && insp.photos.length > 0 ? (
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={typeof insp.photos[0] === 'string' ? insp.photos[0] : (insp.photos[0] as any).dataUrl} 
                    alt="Inspection location" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Camera size={14} /> {insp.photos.length}
                  </div>
                </div>
              ) : (
                <div style={{ height: '160px', backgroundColor: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  No Photos
                </div>
              )}
              
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <Calendar size={14} />
                  {new Date(insp.date).toLocaleString()}
                </div>
                
                {insp.location && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    <MapPin size={14} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {insp.location.address && (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {insp.location.address}
                        </span>
                      )}
                      <span style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)', fontSize: '0.65rem' }}>
                        Lat: {insp.location.lat.toFixed(5)}, Lng: {insp.location.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                )}
                
                <p style={{ marginTop: 'auto', fontSize: '0.875rem', color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {insp.description || 'No description provided.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
