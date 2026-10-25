import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Satellite,
  ShieldCheck,
  Crosshair,
  Layers,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import { uploadPair } from '../lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (pairId: string, metadata: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<'before' | 'after' | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDraggingBefore, setIsDraggingBefore] = useState<boolean>(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState<boolean>(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleBeforeSelect = (file: File) => {
    setBeforeFile(file);
    setBeforePreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handleAfterSelect = (file: File) => {
    setAfterFile(file);
    setAfterPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  // Clipboard Paste (Ctrl+V) handler
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            if (activeTarget === 'after' || (beforeFile && activeTarget !== 'before')) {
              handleAfterSelect(file);
              setActiveTarget(null);
            } else {
              handleBeforeSelect(file);
              setActiveTarget('after');
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeTarget, beforeFile]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!beforeFile || !afterFile) {
      setErrorMsg('Both T₁ Baseline and T₂ Resurvey rasters are required for bitemporal analysis.');
      return;
    }
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await uploadPair(beforeFile, afterFile);
      onUploadComplete(res.pairId, res);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Raster ingestion and alignment failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="spectra-card bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10">
        {/* Modal Dismiss */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Ingestion Hub"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="spectra-badge flex items-center gap-1.5">
              <Satellite className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Spaceborne Ingestion Hub</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              EO-Raster Pipeline
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#102543] dark:text-white font-['Outfit'] tracking-tight">
            Ingest Bitemporal Optical / Sensor Pair
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Deterministic spectral ingestion for multi-temporal optical imagery, Sentinel-2 rasters, and orthophoto tiles.
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Dual Ingestion Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Target 1: T1 Baseline Pass */}
          <div
            tabIndex={0}
            onFocus={() => setActiveTarget('before')}
            onClick={() => {
              setActiveTarget('before');
              if (!beforePreview) beforeInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingBefore(true);
            }}
            onDragLeave={() => setIsDraggingBefore(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBefore(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) handleBeforeSelect(file);
            }}
            className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] relative overflow-hidden group outline-none ${
              isDraggingBefore || activeTarget === 'before'
                ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-inner'
                : 'border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
          >
            {/* Aerospace Reticle Crosshairs */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-indigo-500/40 pointer-events-none" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-indigo-500/40 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-indigo-500/40 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-indigo-500/40 pointer-events-none" />

            <input
              ref={beforeInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.tif,.tiff"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleBeforeSelect(e.target.files[0])}
            />
            {beforePreview ? (
              <>
                <img
                  src={beforePreview}
                  alt="Baseline Pass"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      beforeInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg border border-white/20 transition-colors"
                  >
                    Replace Raster
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono">or paste with Ctrl+V</span>
                </div>
                <div className="absolute top-2.5 left-2.5 bg-slate-900/90 text-indigo-300 border border-indigo-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-emerald-400" />
                  <span>T₁ BASELINE PASS</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBeforeFile(null);
                    setBeforePreview(null);
                    setActiveTarget('before');
                  }}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors"
                  title="Remove Raster"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-500/30 shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    T₁ Baseline Acquisition
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Reference pass or pre-event raster
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Drop raster or</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-white/10 rounded shadow-xs">
                    Ctrl+V
                  </kbd>
                </div>
              </div>
            )}
          </div>

          {/* Target 2: T2 Resurvey Pass */}
          <div
            tabIndex={0}
            onFocus={() => setActiveTarget('after')}
            onClick={() => {
              setActiveTarget('after');
              if (!afterPreview) afterInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingAfter(true);
            }}
            onDragLeave={() => setIsDraggingAfter(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingAfter(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) handleAfterSelect(file);
            }}
            className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] relative overflow-hidden group outline-none ${
              isDraggingAfter || activeTarget === 'after'
                ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-inner'
                : 'border-slate-200 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-500/50 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
          >
            {/* Aerospace Reticle Crosshairs */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

            <input
              ref={afterInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.tif,.tiff"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAfterSelect(e.target.files[0])}
            />
            {afterPreview ? (
              <>
                <img
                  src={afterPreview}
                  alt="Resurvey Pass"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      afterInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg border border-white/20 transition-colors"
                  >
                    Replace Raster
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono">or paste with Ctrl+V</span>
                </div>
                <div className="absolute top-2.5 left-2.5 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-emerald-400" />
                  <span>T₂ RESURVEY PASS</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAfterFile(null);
                    setAfterPreview(null);
                    setActiveTarget('after');
                  }}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors"
                  title="Remove Raster"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto border border-cyan-200 dark:border-cyan-500/30 shadow-xs">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    T₂ Resurvey Acquisition
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Target comparison or post-event raster
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Drop raster or</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 border border-slate-200 dark:border-white/10 rounded shadow-xs">
                    Ctrl+V
                  </kbd>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Guidance & Co-Registration Advisory Card */}
        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 mb-6 leading-relaxed transition-colors flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              Photogrammetric & Sensor Advisory:
            </span>{' '}
            Bitemporal rasters must be geographically co-registered to ensure sub-pixel change alignment. SPECTRA runs spectral delta variance (NDVI, NDWI, NBR) across co-located pixels, withholding spatial polygon calculations on uncalibrated perspective photos.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
          <span className="text-[10px] font-mono text-slate-400">
            Accepts: GeoTIFF, PNG, JPEG (10m - 0.5m GSD)
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!beforeFile || !afterFile || isUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ingesting & Aligning Rasters...</span>
                </>
              ) : (
                <>
                  <span>Run SPECTRA Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
