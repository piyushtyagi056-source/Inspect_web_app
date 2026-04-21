export const getHighlyAccurateLocation = async (): Promise<{lat: number, lng: number, accuracy: number, source: string}> => {
  try {
    // Attempt Google Geolocation API first for maximum Desktop Wi-Fi accuracy
    // This requires the Geolocation API to be enabled on the API key.
    const apiKey = "AIzaSyCd0Vw2Ui-6Y5rAlvzOD2mUNJup6BgyVFc";
    const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ considerIp: true })
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        lat: data.location.lat,
        lng: data.location.lng,
        accuracy: data.accuracy,
        source: 'google'
      };
    }
  } catch (e) {
    console.warn("Google Geolocation API failed, falling back to browser.", e);
  }

  // Fallback to HTML5 Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported."));
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'html5'
        }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  });
};
