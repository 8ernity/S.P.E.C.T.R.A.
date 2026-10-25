import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { Square, Trash2, MapPin, Compass } from 'lucide-react';
import { computeBboxDimensions } from '../lib/geo';

// Patch Leaflet.draw strict-mode bug where undeclared `type` causes mouse-move crash during drag
if (typeof window !== 'undefined') {
  (window as any).type = (window as any).type || '';
  if ((L as any).GeometryUtil) {
    (L as any).GeometryUtil.readableArea = function (area: number) {
      if (area >= 1000000) {
        return `${(area / 1000000).toFixed(2)} km²`;
      }
      return `${(area / 10000).toFixed(2)} ha`;
    };
  }
}

const RECTANGLE_DRAW_OPTIONS = {
  shapeOptions: {
    color: '#0284c7',
    weight: 3,
    fillColor: '#38bdf8',
    fillOpacity: 0.35,
    dashArray: '5, 5',
  },
  showArea: false,
  metric: true,
  repeatMode: false,
};

interface InteractiveLeafletMapProps {
  bbox: [number, number, number, number] | null; // [min_lon, min_lat, max_lon, max_lat]
  onBboxChange: (newBbox: [number, number, number, number] | null) => void;
  locationName?: string;
}

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  bbox,
  onBboxChange,
  locationName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);
  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false);

  // Approximate dimensions & area of the selected bounding box
  const bboxStats = useMemo(() => {
    if (!bbox) return null;
    return computeBboxDimensions(bbox);
  }, [bbox]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on initial bbox if provided, otherwise default to a global view
    let initialCenter: [number, number] = [20, 0];
    let initialZoom = 2;

    if (bbox) {
      initialCenter = [(bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2];
      initialZoom = 7;
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // 1. ESRI World Imagery (High-Resolution True Optical Satellite Tiles)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP',
      }
    );

    // 2. OpenStreetMap Layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    });

    satelliteLayer.addTo(map);

    const baseMaps = {
      'Satellite Imagery': satelliteLayer,
      'Street Map': streetLayer,
    };
    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    // Feature group to store user drawn shapes
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize Leaflet Draw Control (purely for custom user sizing)
    const drawControl = new (L.Control as any).Draw({
      position: 'topleft',
      draw: {
        rectangle: RECTANGLE_DRAW_OPTIONS,
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
    drawControlRef.current = drawControl;

    // If initial bbox provided, render it
    if (bbox) {
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
    }

    // Handle user drawing a rectangle on the map (ANY size or ratio)
    map.on((L as any).Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      rectangleRef.current = layer;
      setIsDrawingActive(false);

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

    // Handle editing existing rectangle (resizing via corner handles)
    map.on((L as any).Draw.Event.EDITED, (event: any) => {
      event.layers.eachLayer((layer: any) => {
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
    });

    // Handle user deleting rectangle
    map.on((L as any).Draw.Event.DELETED, () => {
      drawnItems.clearLayers();
      rectangleRef.current = null;
      isInternalUpdateRef.current = true;
      onBboxChange(null);
    });

    map.on((L as any).Draw.Event.DRAWSTART, () => {
      setIsDrawingActive(true);
    });

    map.on((L as any).Draw.Event.DRAWSTOP, () => {
      setIsDrawingActive(false);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map bounds when bbox changes externally (e.g. preset clicked or typed)
  useEffect(() => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) return;
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    drawnItemsRef.current.clearLayers();

    if (!bbox) {
      rectangleRef.current = null;
      return;
    }

    const bounds = L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
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

  // Quick action: programmatically start rectangle draw tool
  const triggerRectangleDraw = () => {
    if (!mapInstanceRef.current || !drawControlRef.current) return;
    const rectDrawer = new (L as any).Draw.Rectangle(
      mapInstanceRef.current,
      RECTANGLE_DRAW_OPTIONS
    );
    rectDrawer.enable();
    setIsDrawingActive(true);
  };

  const handleClear = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
    rectangleRef.current = null;
    onBboxChange(null);
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Map Canvas */}
      <div className="relative w-full h-[430px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top Controls Overlay */}
        <div className="absolute top-3 left-14 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={triggerRectangleDraw}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 shadow-lg border transition-all cursor-pointer backdrop-blur-md ${
              isDrawingActive
                ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse scale-105'
                : 'bg-indigo-600/90 hover:bg-indigo-600 text-white border-indigo-400/40 hover:scale-102'
            }`}
            title="Click then drag on the map to draw your target study area"
          >
            <Square className="w-3.5 h-3.5" />
            <span>{isDrawingActive ? 'Click & Drag to Draw Area...' : 'Draw Custom Study Area'}</span>
          </button>

          {bbox && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-rose-300 bg-black/60 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 backdrop-blur-md shadow-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Clear current bounding box"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Top-Right Info Badge: Exact Coordinates & Ground Area */}
        {bbox && (
          <div className="absolute top-3 right-14 z-20 bg-slate-950/85 backdrop-blur-md text-cyan-300 px-3 py-1.5 rounded-xl shadow-xl border border-cyan-500/40 pointer-events-none text-[11px] font-mono flex flex-col items-end">
            <span className="font-bold text-white">
              BBox: [{bbox[0].toFixed(2)}, {bbox[1].toFixed(2)}, {bbox[2].toFixed(2)}, {bbox[3].toFixed(2)}]
            </span>
            {bboxStats && (
              <span className="text-[10px] text-cyan-400">
                Span: {bboxStats.widthKm} km × {bboxStats.heightKm} km (~{bboxStats.areaKm2.toLocaleString()} km²)
              </span>
            )}
          </div>
        )}

        {/* Bottom Location Indicator Banner */}
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/90 backdrop-blur-md text-slate-200 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Selected Earth Observation Target
              </span>
              <p className="text-xs font-bold text-white truncate font-['Outfit']">
                {locationName ? locationName : bbox ? 'Resolving geographic location...' : 'No Area Selected — Click "Draw Custom Study Area" above or use the ▢ tool'}
              </p>
            </div>
          </div>

          {bboxStats && (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 shrink-0 hidden sm:inline-block">
              Centroid: {bboxStats.centerLat}°, {bboxStats.centerLng}°
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
