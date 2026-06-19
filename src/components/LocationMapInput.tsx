import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Search, MapPin } from "lucide-react";

interface LocationMapInputProps {
  onLocationSelect: (location: { lat?: number; lon?: number; region?: string; city?: string; town?: string; neighborhood?: string }) => void;
  pollutionTag?: string;
}

export default function LocationMapInput({ onLocationSelect, pollutionTag }: LocationMapInputProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const currentCoords = useRef<{lat: number, lng: number} | null>(null);

  const getMarkerColorClass = (tag?: string) => {
    switch(tag) {
      case "Clean": return "bg-[#00450d]"; // safe
      case "Slightly Polluted": return "bg-[#00450d]";
      case "Highly Polluted": return "bg-[#d97706]";
      case "Extremely Polluted": return "bg-[#b91c1c]"; // critical
      case "Moderately Polluted": 
      default: return "bg-[#d97706]"; // moderate
    }
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Cameroon center
    const map = L.map(mapContainerRef.current, {
      center: [5.6, 12.0],
      zoom: 6,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Handle map clicks
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      await reverseGeocode(lat, lng);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && currentCoords.current) {
      const colorClass = getMarkerColorClass(pollutionTag);
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer">
            <div class="absolute h-9 w-9 rounded-full ${colorClass} opacity-30 animate-ping duration-1000"></div>
            <div class="h-6 w-6 rounded-full border-2 border-white shadow-md ${colorClass} flex items-center justify-center text-[10px] font-extrabold text-white font-mono scale-100 group-hover:scale-110 transition-transform">
               📍
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      markerRef.current.setIcon(customIcon);
    }
  }, [pollutionTag]);

  const updateMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    currentCoords.current = { lat, lng };
    
    const colorClass = getMarkerColorClass(pollutionTag);
    const customIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div class="relative flex items-center justify-center group cursor-pointer">
          <div class="absolute h-9 w-9 rounded-full ${colorClass} opacity-30 animate-ping duration-1000"></div>
          <div class="h-6 w-6 rounded-full border-2 border-white shadow-md ${colorClass} flex items-center justify-center text-[10px] font-extrabold text-white font-mono scale-100 group-hover:scale-110 transition-transform">
             📍
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(customIcon);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        // Approximate mappings to our system
        const state = address.state || address.region || "";
        const city = address.city || address.town || address.county || "";
        const suburb = address.suburb || address.quarter || address.neighbourhood || address.residential || "";

        onLocationSelect({
          lat, lon,
          region: state,
          city: city,
          neighborhood: suburb
        });
      }
    } catch (err) {
      console.warn("Reverse geocode failed", err);
      onLocationSelect({ lat, lon });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowResults(true);
    try {
      // Append Cameroon to hints if not present to favor local searches
      const query = searchQuery.toLowerCase().includes("cameroon") ? searchQuery : `${searchQuery}, Cameroon`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Geocoding search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 14);
      updateMarker(lat, lon);
      reverseGeocode(lat, lon);
    }
    
    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3 shadow-3xs space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-500" />
        <div>
          <h3 className="text-xs font-bold tracking-tight text-gray-800 uppercase">Map Location</h3>
          <p className="text-[10px] text-gray-500 leading-tight">Search or tap the map to autofill location. If you can't find it, use manual entry below.</p>
        </div>
      </div>
      
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-3xs focus-within:ring-1 focus-within:border-primary transition-all">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search neighborhood or city in Cameroon..."
            className="flex-1 h-10 px-3 text-xs text-gray-800 outline-none"
          />
          <button 
            type="button" 
            onClick={handleSearch}
            className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors border-l border-gray-200"
          >
            {isSearching ? <span className="animate-pulse">...</span> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-xl max-h-48 overflow-y-auto">
            {searchResults.map((res: any) => (
              <div 
                key={res.place_id} 
                className="px-3 py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-left last:border-0"
                onClick={() => selectSearchResult(res)}
              >
                <p className="text-xs font-bold text-gray-800">{res.display_name.split(',')[0]}</p>
                <p className="text-[10px] text-gray-500 truncate">{res.display_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="aspect-[16/7] w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "200px", zIndex: 1 }} />
      </div>
    </div>
  );
}
