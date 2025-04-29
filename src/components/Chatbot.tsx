import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import * as turf from '@turf/turf';
import { ToastContainer, toast } from 'react-toastify';

interface Coords {
  lat: number;
  lng: number;
}

const LocationMarker: React.FC<{ position: Coords }> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position?.lat && position?.lng) {
      map.flyTo(position, 10, { duration: 2 });
    }
  }, [position, map]);

  return (
    
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{ color: 'blue', fillColor: '#3b82f6', fillOpacity: 0.7 }}
    >
      <Popup>You are here 📍</Popup>
    </CircleMarker>
  );
};

export default function KerichoMap() {
  const [geoData, setGeoData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [checkedInside, setCheckedInside] = useState(false);

  useEffect(() => {
    // Load GeoJSON from public folder
    fetch('/kericho.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("GeoJSON load error:", err));
  }, []);

  useEffect(() => {
    // Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setUserLocation(coords);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Check if user is in Kericho (trigger only once)
  useEffect(() => {
    if (userLocation && geoData && !checkedInside) {
      const point = turf.point([userLocation.lng, userLocation.lat]);
      const polygon = turf.featureCollection(
        geoData.features.map((f: any) => turf.feature(f))
      );

      const isInside = geoData.features.some((feature: any) =>
        turf.booleanPointInPolygon(point, feature)
      );

      if (!isInside) {
        toast.warning("You are currently *outside* Kericho County!", {
          position: "bottom-right",
          autoClose: 5000,
        });
      } else {
        toast.success("Welcome to Kericho 🍃", {
          position: "bottom-right",
          autoClose: 3000,
        });
      }

      setCheckedInside(true);
    }
  }, [userLocation, geoData, checkedInside]);

  // Style to uniquely highlight Kericho
  const highlightStyle = {
    color: "#065f46",
    weight: 5,
    fillColor: "#34d399",
    fillOpacity: 0.4,
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature?.properties?.name) {
      layer.bindPopup(`<strong>${feature.properties.name}</strong><br/>
        ☔️ Heavy Rainfall Zone<br/>
        🌱 Ideal for Tea, Maize, Potatoes`);
    }

    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 6,
          color: '#10b981',
          fillOpacity: 0.5,
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(highlightStyle);
      }
    });
  };

  return (
    <div className="relative w-full h-[90vh] border-4 border-emerald-600 shadow-xl rounded-xl overflow-hidden">
      <div className="absolute z-50 top-0 left-0 bg-white/90 text-emerald-800 font-bold px-6 py-2 rounded-br-xl">
        🌍 Kericho County | Smart Rain + Soil Intelligence
      </div>

      <ToastContainer />

      <MapContainer center={[-0.367, 35.283]} zoom={8.3} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoData && (
          <GeoJSON
            data={geoData}
            style={highlightStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {userLocation && <LocationMarker position={userLocation} />}
      </MapContainer>
    </div>
  );
}
