import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type Inspection } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, ArrowLeft, Image as ImageIcon, Navigation } from 'lucide-react';
import { getHighlyAccurateLocation } from '../utils/geo';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  lat1 = Number(lat1); lon1 = Number(lon1); lat2 = Number(lat2); lon2 = Number(lon2);
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { username } = useAuth();
  const navigate = useNavigate();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const blueDotRef = useRef<any>(null);
  
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const toggleLocationWatch = () => {
    if (isWatchingLocation) {
      if (watchIdRef.current !== null) {
        clearInterval(watchIdRef.current as any);
        watchIdRef.current = null;
      }
      setIsWatchingLocation(false);
      setCurrentLocation(null);
    } else {
      setIsWatchingLocation(true);
      
      const updateLocation = async () => {
        try {
          const pos = await getHighlyAccurateLocation();
          setCurrentLocation({ lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy });
        } catch (err) {
          console.error("Location error:", err);
          alert("Could not update location. Please ensure location services are enabled.");
        }
      };
      
      updateLocation(); // run first tick immediately
      watchIdRef.current = window.setInterval(updateLocation, 5000) as any;
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) clearInterval(watchIdRef.current as any);
    };
  }, []);

  useEffect(() => {
    if (username && id) {
      loadData();
    }
  }, [username, id]);

  const loadData = async () => {
    try {
      const all = await db.getInspections(username!);
      const found = all.find(i => i.id === id);
      setInspection(found || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Render Google Map if available
  useEffect(() => {
    if (inspection?.location && mapContainerRef.current && window.google && window.google.maps) {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: inspection.location.lat, lng: inspection.location.lng },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });
        new window.google.maps.Marker({
          position: { lat: inspection.location.lat, lng: inspection.location.lng },
          map: mapInstanceRef.current,
        });
      }
    }
  }, [inspection]);

  // Update Blue Dot tracker
  useEffect(() => {
    if (mapInstanceRef.current && window.google && window.google.maps) {
      if (currentLocation) {
        if (!blueDotRef.current) {
          blueDotRef.current = new window.google.maps.Marker({
            position: { lat: currentLocation.lat, lng: currentLocation.lng },
            map: mapInstanceRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: "Your Current Location"
          });
        } else {
          blueDotRef.current.setPosition({ lat: currentLocation.lat, lng: currentLocation.lng });
        }
      } else if (blueDotRef.current) {
        blueDotRef.current.setMap(null);
        blueDotRef.current = null;
      }
    }
  }, [currentLocation]);

  if (loading) {
    return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading details...</div>;
  }

  if (!inspection) {
    return (
      <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Inspection Not Found</h2>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ marginTop: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem', borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Inspection Report</h1>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <Calendar size={18} />
            <span style={{ fontWeight: 600 }}>{new Date(inspection.date).toLocaleString()}</span>
          </div>
          
          {inspection.location && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--color-text)' }}>
              <MapPin size={18} color="var(--color-accent)" style={{ marginTop: '0.1rem' }} />
              <div>
                <span style={{ fontWeight: 600 }}>{inspection.location.address || 'GPS Coordinates Only'}</span>
                <div style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)', fontSize: '0.8rem', marginTop: '0.4rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  Latitude:&nbsp; {inspection.location.lat.toFixed(6)} <br/>
                  Longitude: {inspection.location.lng.toFixed(6)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
           <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Inspector Notes</h3>
           <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{inspection.description}</p>
        </div>

        {inspection.location && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Location Map</h3>
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '300px', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}
            />
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} /> Evidence Photos ({inspection.photos?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button onClick={toggleLocationWatch} className={isWatchingLocation ? 'btn btn-primary' : 'btn btn-outline'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Navigation size={14} />
                {isWatchingLocation ? 'Live Distance Active' : 'Check Distance to Photos'}
              </button>
              {currentLocation && (
                <div style={{ fontSize: '0.65rem', color: 'var(--color-primary-light)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Live Tracker Feed:</div>
                  <span style={{ fontFamily: 'monospace' }}>Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}</span><br/>
                  GPS Accuracy: ±{Math.round(currentLocation.accuracy)}m
                  {currentLocation.accuracy > 500 && " (ISP/Low Accuracy!)"}
                </div>
              )}
            </div>
          </div>
          
          {inspection.photos && inspection.photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {inspection.photos.map((photo, i) => {
                const isObj = typeof photo !== 'string';
                const src = isObj ? (photo as any).dataUrl : (photo as string);
                const loc = isObj ? (photo as any).location : null;
                const ts = isObj ? (photo as any).timestamp : null;
                
                return (
                  <div key={i} style={{ borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '200px', width: '100%' }}>
                      <img src={src} alt={`Evidence ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {isObj ? (
                      <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
                          <Calendar size={12} /> {new Date(ts).toLocaleString()}
                        </div>
                        {loc ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                            <MapPin size={12} style={{ marginTop: '0.1rem', flexShrink: 0 }} /> 
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {loc.address && (
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {loc.address}
                                </span>
                              )}
                              <span style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)', fontSize: '0.7rem' }}>
                                Lat: {loc.lat.toFixed(5)} <br/>
                                Lng: {loc.lng.toFixed(5)}
                              </span>
                              {currentLocation && (
                                <div style={{ marginTop: '0.25rem', padding: '0.35rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                                  <Navigation size={12} style={{ transform: 'rotate(45deg)' }} /> 
                                  {Math.round(getDistance(currentLocation.lat, currentLocation.lng, loc.lat, loc.lng))} meters away
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={12} /> Tracker Unavailable
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', fontStyle: 'italic', textAlign: 'center' }}>
                        Legacy Photo: No enriched metadata available.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
             <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)' }}>
               No photos attached to this report.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
