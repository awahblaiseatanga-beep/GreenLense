/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { EnvironmentalCatalog, CameroonRegion } from "../types";

interface EnvironmentalMapProps {
  catalogs: EnvironmentalCatalog[];
  selectedRegion: CameroonRegion | "All";
  onSelectCatalog: (catalog: EnvironmentalCatalog) => void;
}

export default function EnvironmentalMap({
  catalogs,
  selectedRegion,
  onSelectCatalog,
}: EnvironmentalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Define Cameroon center [latitude, longitude] and standard bounding zoom
    const map = L.map(mapContainerRef.current, {
      center: [5.6, 12.0],
      zoom: 6,
      minZoom: 5,
      maxZoom: 16,
      scrollWheelZoom: true,
      zoomControl: false, // will put custom layout or bottom zoom for neat look
    });

    // Add zoom control at bottom right to maintain professional header spacing
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Apply high contrast clean slate style using OpenStreetMap with refined carto tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Create a markers group
    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    // Fast handle resize glitches
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

  // Update Markers when catalogs or selectedRegion changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear previous markers
    markersLayer.clearLayers();

    // Filter which catalogs are shown on the map
    const activeCatalogs = catalogs.filter(
      (c) => selectedRegion === "All" || c.region === selectedRegion
    );

    const bounds: L.LatLngTuple[] = [];

    activeCatalogs.forEach((catalog) => {
      const { lat, lon } = catalog.coordinates;
      if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) return;

      bounds.push([lat, lon]);

      // Color coding based on Threat Level (pollutionTag) or fallback to envScore
      let scoreColor = "#00450d"; // safe
      let scoreBackground = "bg-primary";
      let textStatus = "Safe State";
      
      if (catalog.pollutionTag) {
        switch(catalog.pollutionTag) {
          case "Clean":
          case "Slightly Polluted":
            scoreBackground = "bg-primary";
            textStatus = catalog.pollutionTag;
            break;
          case "Moderately Polluted":
            scoreBackground = "bg-amber-600";
            textStatus = "Moderate Risk";
            break;
          case "Highly Polluted":
            scoreBackground = "bg-orange-600";
            textStatus = "High Risk";
            break;
          case "Extremely Polluted":
            scoreBackground = "bg-red-700";
            textStatus = "Critical Risk";
            break;
        }
      } else {
        if (catalog.envScore < 50) {
          scoreColor = "#b91c1c"; // Critical (Red)
          scoreBackground = "bg-red-700";
          textStatus = "Heavy Risk";
        } else if (catalog.envScore < 75) {
          scoreColor = "#d97706"; // Moderate (Yellow/Amber)
          scoreBackground = "bg-amber-600";
          textStatus = "Community Managed";
        }
      }

      // Create a gorgeous custom HTML DivIcon (No raw static PNG pin bugs!)
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative group cursor-pointer flex items-center justify-center">
            <!-- Pulsing outer ring -->
            <div class="absolute h-9 w-9 rounded-full ${scoreBackground} opacity-20 animate-ping duration-1000"></div>
            <!-- Main colored circle marker -->
            <div class="h-6 w-6 rounded-full border-2 border-white shadow-md ${scoreBackground} flex items-center justify-center text-[10px] font-extrabold text-white font-mono scale-100 group-hover:scale-110 transition-transform">
              ${catalog.envScore}
            </div>
            <!-- Small pointer tip -->
            <div class="absolute -bottom-1 h-2 w-2 rotate-45 ${scoreBackground} border-r border-b border-white opacity-90"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Construct a modern, rich HTML Leaflet Popup
      const popupContent = `
        <div class="p-3 font-sans min-w-[200px]" id="popup-${catalog.id}">
          <div class="mb-1.5 flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
            <span class="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-wider">${catalog.region} Region</span>
            <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white ${scoreBackground}">${textStatus}</span>
          </div>
          <h4 class="text-sm font-bold text-gray-900 leading-tight mb-0.5">${catalog.neighborhood}</h4>
          <p class="text-[11px] text-gray-500 font-semibold mb-2">${catalog.city}, ${catalog.townOrArrondissement}</p>
          
          <div class="grid grid-cols-2 gap-1 bg-gray-50 p-1.5 rounded mb-2 text-center border border-gray-100">
            <div>
              <span class="text-[8px] text-gray-400 font-bold font-mono tracking-wide uppercase block">Score</span>
              <span class="text-xs font-black text-gray-800 font-mono">${catalog.envScore}/100</span>
            </div>
            <div>
              <span class="text-[8px] text-gray-400 font-bold font-mono tracking-wide uppercase block">Campaigns</span>
              <span class="text-xs font-black text-gray-800 font-mono">${catalog.activeCampaignsCount} Active</span>
            </div>
          </div>
          
          <button 
            id="btn-explore-popup-${catalog.id}"
            class="w-full bg-primary hover:bg-primary-light text-white font-bold text-[10px] py-1.5 px-2 rounded tracking-wide uppercase transition-all duration-150 cursor-pointer text-center flex items-center justify-center gap-1 shadow-3xs"
          >
            <span>Explore Catalog Data</span>
            <span>&rarr;</span>
          </button>
        </div>
      `;

      // Create standard interactive Marker
      const marker = L.marker([lat, lon], { icon: customIcon });
      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10],
        className: "custom-popup-wrapper"
      });

      // Bind actions on click and popup open
      marker.on("popupopen", () => {
        // Let popup UI event listeners settle, then attach standard listener
        setTimeout(() => {
          const exploreBtn = document.getElementById(`btn-explore-popup-${catalog.id}`);
          if (exploreBtn) {
            exploreBtn.onclick = (e) => {
              e.preventDefault();
              onSelectCatalog(catalog);
            };
          }
        }, 50);
      });

      markersLayer.addLayer(marker);
    });

    // Smart pan/fit bounds based on markers
    if (bounds.length > 0) {
      if (selectedRegion === "All") {
        // Center view of Cameroon
        map.setView([5.6, 12.0], 6);
      } else {
        // Zoom specifically to frame selected region nicely
        const boundsGroup = L.latLngBounds(bounds);
        map.fitBounds(boundsGroup, {
          padding: [50, 50],
          maxZoom: 10,
        });
      }
    } else {
      // Force safe fallback centering to guarantee map is initialized and centered without any empty data crashes
      map.setView([5.6, 12.0], 6);
    }
  }, [catalogs, selectedRegion, onSelectCatalog]);

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4" id="map-module-card">
      <div className="flex items-center justify-between" id="map-header">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500 font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Environmental Intelligence Map
          </h3>
          <p className="text-[10px] text-gray-400">
            Real-time geospatial representation of Cameroonian community catalogs based on ecological ratings
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500 font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-primary" />
            <span>&gt;=75</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-600" />
            <span>50-74</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-red-600" />
            <span>&lt;50</span>
          </div>
        </div>
      </div>

      <div className="aspect-[16/9] w-full bg-slate-50 rounded-xl overflow-hidden border border-gray-100 shadow-3xs relative" id="leaflet-container-wrapper">
        <div ref={mapContainerRef} className="w-full h-full" id="environmental-leaflet-id" style={{ minHeight: "280px", zIndex: 1 }} />
      </div>
    </div>
  );
}
