let googleMapsPromise: Promise<boolean> | null = null;

export const loadGoogleMaps = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.google && window.google.maps) {
    return true;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return false;
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise<boolean>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(Boolean(window.google && window.google.maps)), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.onload = () => resolve(Boolean(window.google && window.google.maps));
      script.onerror = () => reject(new Error('Google Maps failed to load.'));
      document.head.appendChild(script);
    }).catch((error) => {
      googleMapsPromise = null;
      console.warn(error);
      return false;
    });
  }

  return googleMapsPromise ?? false;
};
