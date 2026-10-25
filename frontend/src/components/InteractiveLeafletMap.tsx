import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { Layers, Square, Info } from 'lucide-react';

interface InteractiveLeafletMapProps {
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  onBboxChange: (newBbox: [number, number, number, number]) => void;
}

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  bbox,
  onBboxChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on initial bbox
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const centerLng = (bbox[0] + bbox[2]) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    // 1. ESRI World Imagery (High-Resolution True Optical Satellite Tiles - matches earth-time-machine)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP',
      }
    );

    // 2. OpenStreetMap Layer (Optional street toggle)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    });

    // Default to satellite map
    satelliteLayer.addTo(map);

    // Layer control
    const baseMaps = {
      'Satellite Imagery': satelliteLayer,
      'Street Map': streetLayer,
    };
    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    // Feature group to store drawn shapes
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize Leaflet Draw Control (specifically with Rectangle drawing enabled)
    const drawControl = new (L.Control as any).Draw({
      position: 'topleft',
      draw: {
        rectangle: {
          shapeOptions: {
            color: '#38bdf8',
            weight: 2.5,
            fillColor: '#0ea5e9',
            fillOpacity: 0.25,
            dashArray: '4, 4',
          },
        },
        polyline: false,
        polygon: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Draw initial rectangle bounding box
    const bounds = L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
    const initialRect = L.rectangle(bounds, {
      color: '#38bdf8',
      weight: 2.5,
      fillColor: '#0ea5e9',
      fillOpacity: 0.22,
      dashArray: '4, 4',
    });
    drawnItems.addLayer(initialRect);
    rectangleRef.current = initialRect;

    // Handle user drawing a rectangle on the map
    map.on((L as any).Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      rectangleRef.current = layer;

      const layerBounds: L.LatLngBounds = layer.getBounds();
      const sw = layerBounds.getSouthWest();
      const ne = layerBounds.getNorthEast();

      const newBbox: [number, number, number, number] = [
        parseFloat(sw.lng.toFixed(4)),
        parseFloat(sw.lat.toFixed(4)),
        parseFloat(ne.lng.toFixed(4)),
        parseFloat(ne.lat.toFixed(4)),
      ];

      isInternalUpdateRef.current = true;
      onBboxChange(newBbox);
    });

    // Handle user clicking anywhere on map to reposition footprint
    map.on('click', (e: L.LeafletMouseEvent) => {
      // If clicking directly without using draw tool, center a standard footprint
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const dLat = 0.15;
      const dLng = 0.22;

      const newBbox: [number, number, number, number] = [
        parseFloat((lng - dLng).toFixed(4)),
        parseFloat((lat - dLat).toFixed(4)),
        parseFloat((lng + dLng).toFixed(4)),
        parseFloat((lat + dLat).toFixed(4)),
      ];

      isInternalUpdateRef.current = true;
      onBboxChange(newBbox);

      drawnItems.clearLayers();
      const newBounds = L.latLngBounds([newBbox[1], newBbox[0]], [newBbox[3], newBbox[2]]);
      const newRect = L.rectangle(newBounds, {
        color: '#38bdf8',
        weight: 2.5,
        fillColor: '#0ea5e9',
        fillOpacity: 0.22,
        dashArray: '4, 4',
      });
      drawnItems.addLayer(newRect);
      rectangleRef.current = newRect;
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update bounds when bbox changes externally (e.g. preset clicked)
  useEffect(() => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) return;
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const bounds = L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
    drawnItemsRef.current.clearLayers();

    const newRect = L.rectangle(bounds, {
      color: '#38bdf8',
      weight: 2.5,
      fillColor: '#0ea5e9',
      fillOpacity: 0.22,
      dashArray: '4, 4',
    });
    drawnItemsRef.current.addLayer(newRect);
    rectangleRef.current = newRect;

    mapInstanceRef.current.flyToBounds(bounds, {
      padding: [40, 40],
      duration: 1.2,
      maxZoom: 12,
    });
  }, [bbox]);

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Map Canvas */}
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Instruction Banner (matches earth-time-machine screenshot) */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md text-slate-200 px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 pointer-events-none text-xs flex items-center gap-2">
          <span className="text-sm">👉</span>
          <span className="font-medium text-[11px] text-slate-100">
            Draw a rectangle on the map (use the <strong className="text-cyan-400">▢ tool</strong> on the top-left), or click any preset.
          </span>
        </div>

        {/* Coordinate Badge */}
        <div className="absolute top-3 right-14 z-20 bg-black/80 backdrop-blur-md text-cyan-300 px-3 py-1.5 rounded-xl shadow-lg border border-cyan-500/30 pointer-events-none text-[10px] font-mono font-bold">
          BBox: [{bbox[0].toFixed(2)}, {bbox[1].toFixed(2)}, {bbox[2].toFixed(2)}, {bbox[3].toFixed(2)}]
        </div>
      </div>
    </div>
  );
};
