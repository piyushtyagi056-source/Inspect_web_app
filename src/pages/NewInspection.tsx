import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, ArrowLeft, FlipHorizontal, Loader, AlertTriangle, X, Maximize, Minimize } from 'lucide-react';
import { getHighlyAccurateLocation } from '../utils/geo';
import { loadGoogleMaps } from '../utils/googleMaps';
import { useAuth } from '../context/AuthContext';
import { db, type Location, type CapturedPhoto } from '../services/db';

declare global {
  interface Window {
    google: any;
  }
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function NewInspection() {
  const { username } = useAuth();
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [isLocationManuallySet, setIsLocationManuallySet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  
  // Live camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps().then(setIsGoogleMapsReady);
  }, []);

  // Unmount cleanup for camera
  useEffect(() => {
    return () => {
      if (cameraStream) stopCamera(cameraStream);
    };
  }, [cameraStream]);

  // Attach camera stream to video element when it mounts
  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  // Render Google Map automatically when location is acquired
  useEffect(() => {
    if (location && mapContainerRef.current && isGoogleMapsReady && window.google && window.google.maps) {
      if (!mapInstanceRef.current) {
        // Initialize Map ONCE
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });

        markerInstanceRef.current = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapInstanceRef.current,
          draggable: true
        });

        const handleManualPosition = async (newLat: number, newLng: number) => {
          setIsGettingLocation(true);
          setIsLocationManuallySet(true);
          setLocation(prev => ({ 
            lat: newLat, 
            lng: newLng, 
            address: prev?.address || "Updating address..." 
          }));

          let newAddress = `Approx. manually set near ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;
          try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat: newLat, lng: newLng } });
            if (response.results && response.results.length > 0) {
              newAddress = response.results[0].formatted_address;
            }
          } catch (e) {
            console.warn("Manual Geocoding Failed");
          }
          setLocation({ lat: newLat, lng: newLng, address: newAddress });
          setIsGettingLocation(false);
        };

        window.google.maps.event.addListener(markerInstanceRef.current, 'dragend', () => {
          const pos = markerInstanceRef.current.getPosition();
          if (pos) handleManualPosition(pos.lat(), pos.lng());
        });

        window.google.maps.event.addListener(mapInstanceRef.current, 'click', (event: any) => {
          if (event.latLng) {
            markerInstanceRef.current.setPosition(event.latLng);
            handleManualPosition(event.latLng.lat(), event.latLng.lng());
          }
        });
      } else {
        // Smoothly pan map if location changes from other sources without rebuilding iframe
        mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
        markerInstanceRef.current.setPosition({ lat: location.lat, lng: location.lng });
      }
    }
  }, [isGoogleMapsReady, location]);

  // Automatically fetch location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError('');
    
    try {
      const position = await getHighlyAccurateLocation();
      const coords = { lat: position.lat, lng: position.lng };
      let address = `Approx. Address near ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (±${Math.round(position.accuracy)}m)`;
      
      try {
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          const response = await geocoder.geocode({ location: coords });
          if (response.results && response.results.length > 0) {
            address = response.results[0].formatted_address;
          }
        }
      } catch (err) {
        console.warn("Geocoding failed, maybe API key is not set up correctly yet.", err);
      }
      
      setLocation({ ...coords, address });
    } catch (error: any) {
      setLocationError(`Location access denied or unavailable (${error.message}).`);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const startCamera = async () => {
    try {
      let stream: MediaStream;
      try {
        // Try requesting environment (rear) camera first which is ideal for inspections
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
      } catch (innerErr) {
        // Fallback to any available camera if environment camera is not matched (e.g. laptops)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Make sure no other app is using it. Error: " + (err.message || "Unknown error"));
    }
  };

  const stopCamera = (stream = cameraStream) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const captureLivePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturingPhoto(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        let photoLocation: Location | null = null;
        if (!isLocationManuallySet) {
          try {
            const position = await getHighlyAccurateLocation();
            photoLocation = { lat: position.lat, lng: position.lng };
            
            if (window.google && window.google.maps) {
              const geocoder = new window.google.maps.Geocoder();
              const response = await geocoder.geocode({ location: photoLocation });
              if (response.results[0]) {
                photoLocation.address = response.results[0].formatted_address;
              }
            }
          } catch (e) {
            console.warn("Failed individual photo GPS. Falling back to global location.", e);
          }
        }

        // Critical fallback: If independent tracking times out or location was manually set, inherit the overall inspection site location
        let finalLocation = isLocationManuallySet ? location : (photoLocation || location);
        
        // Anti micro-drift snap: If you took a photo within 15 meters of the inspection starting point, 
        // lock it to the main address so they visually match identically.
        if (!isLocationManuallySet && photoLocation && location) {
           const dist = getDistance(location.lat, location.lng, photoLocation.lat, photoLocation.lng);
           if (dist < 15) {
             finalLocation = location;
           }
        }

        setPhotos(prev => [...prev, {
          dataUrl,
          location: finalLocation,
          timestamp: new Date().toISOString()
        }]);
      }
      setIsCapturingPhoto(false);
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setIsSaving(true);
    
    try {
      const newRecord = {
        id: crypto.randomUUID(),
        username,
        date: new Date().toISOString(),
        description,
        location,
        photos
      };
      
      await db.saveInspection(newRecord);
      // Navigate back to dashboard after successful save
      navigate('/');
    } catch (error) {
      console.error("Error saving inspection:", error);
      alert("Failed to save inspection report. Try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginTop: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>New Inspection Form</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Capture site evidence and details
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          
          {/* Location Section */}
          <div className="form-group" style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--color-accent)" /> 
                Site Location
              </label>
              <button type="button" onClick={handleGetLocation} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                Refresh GPS
              </button>
            </div>
            
            {isGettingLocation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                <Loader size={16} className="spinner" /> Acquiring coordinates...
              </div>
            ) : locationError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                <AlertTriangle size={16} /> {locationError}
              </div>
            ) : location ? (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{location.address}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                  <span>Lat: {location.lat.toFixed(6)}</span>
                  <span>Lng: {location.lng.toFixed(6)}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div 
                    ref={mapContainerRef} 
                    style={{ 
                      ...(isMapFullscreen 
                        ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, borderRadius: 0 } 
                        : { width: '100%', height: '180px', borderRadius: 'var(--border-radius)' }
                      ),
                      border: '1px solid var(--color-border)', 
                      overflow: 'hidden' 
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    style={{
                      position: isMapFullscreen ? 'fixed' : 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10000,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-text)'
                    }}
                  >
                    {isMapFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                  {isMapFullscreen && (
                    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>
                      Drag the red pin to set location
                    </div>
                  )}
                </div>
                {!isMapFullscreen && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-primary-light)', marginTop: '0.5rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                     Not accurate enough? Drag the red pin or click the map to set location manually.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Photos Section */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Photographic Evidence</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Capture multiple photos directly using the live camera.
            </p>
            
            {isCameraOpen ? (
              <div style={{ 
                ...(isCameraFullscreen 
                  ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, borderRadius: 0, background: '#000', display: 'flex', flexDirection: 'column' }
                  : { marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }
                )
              }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted 
                    style={{ width: '100%', ...(isCameraFullscreen ? { height: '100%' } : { height: '400px', maxHeight: '50vh' }), backgroundColor: '#000', objectFit: 'cover', borderBottom: isCameraFullscreen ? 'none' : '1px solid var(--color-border)', transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsCameraFullscreen(!isCameraFullscreen)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10000,
                      background: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-primary-light)'
                    }}
                  >
                    {isCameraFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: isCameraFullscreen ? '#111' : 'var(--color-surface)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: isCameraFullscreen ? '2rem' : '1rem' }}>
                  <button type="button" onClick={() => setIsMirrored(!isMirrored)} className="btn btn-outline" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Flip Camera Orientation">
                    <FlipHorizontal size={20} />
                  </button>
                  <button type="button" onClick={captureLivePhoto} disabled={isCapturingPhoto} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                    {isCapturingPhoto ? <Loader size={18} className="spinner" /> : <Camera size={18} />} 
                    {isCapturingPhoto ? ' Logging GPS...' : ' Capture Snapshot'}
                  </button>
                  <button type="button" onClick={() => stopCamera()} className="btn btn-outline" style={{ padding: '0.5rem' }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button type="button" onClick={startCamera} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                  <Camera size={18} /> Open Live Camera
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <img src={photo.dataUrl} alt={`Evidence ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {photo.location && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px', backgroundColor: 'rgba(0,0,0,0.85)', fontSize: '0.55rem', color: 'var(--color-primary-dark)', display: 'flex', flexDirection: 'column', gap: '2px', backdropFilter: 'blur(4px)' }}>
                      {photo.location.address && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           <MapPin size={8} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'text-bottom' }} />
                           {photo.location.address}
                        </div>
                      )}
                      <div style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {photo.location.lat.toFixed(5)}, {photo.location.lng.toFixed(5)}
                      </div>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removePhoto(index)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Inspection Notes / Details</label>
            <textarea
              id="description"
              className="form-control"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Record findings, issues, or clear site status..."
              required
            ></textarea>
          </div>

          {(!location || photos.length === 0 || !description.trim()) && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--border-radius)', color: 'var(--color-warning)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>You must acquire GPS coordinates, capture at least one photo, and add a description before submitting.</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: (!location || photos.length === 0 || !description.trim()) ? '1rem' : '2rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => navigate(-1)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSaving || !location || photos.length === 0 || !description.trim()}
              style={{ flex: 2, opacity: (!location || photos.length === 0 || !description.trim()) ? 0.5 : 1 }}
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={18} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
