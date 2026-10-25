import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileImage,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
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
            // Determine target:
            // 1. If user specifically focused 'after' or ('before' already has image and user didn't explicitly target 'before')
            if (activeTarget === 'after' || (beforeFile && activeTarget !== 'before')) {
              handleAfterSelect(file);
              setActiveTarget(null);
            } else {
              handleBeforeSelect(file);
              setActiveTarget('after'); // auto-prepare next paste for 'after'
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
      setErrorMsg('Please provide both Baseline (Before) and Comparison (After) scenes.');
      return;
    }
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await uploadPair(beforeFile, afterFile);
      onUploadComplete(res.pairId, res);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="spectra-card bg-white p-6 rounded-3xl max-w-xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="spectra-badge mb-1.5">SPECTRA Ingestion Hub</div>
          <h2 className="text-xl font-extrabold text-[#102543] font-['Outfit']">
            Upload Image Pair for Change Analysis
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select optical rasters (PNG, JPG) • <span className="text-indigo-600 font-bold">Paste with Ctrl+V</span> or drag & drop directly
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dual Upload Dropzones with Paste & Drag-and-Drop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Target 1: Before Image */}
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
            className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] relative overflow-hidden group outline-none ${
              isDraggingBefore || activeTarget === 'before'
                ? 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50/70'
                : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30'
            }`}
          >
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
                  alt="Before Preview"
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      beforeInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg"
                  >
                    Change Image
                  </button>
                  <span className="text-[10px] text-white/80">or press Ctrl+V</span>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  BASELINE (BEFORE)
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBeforeFile(null);
                    setBeforePreview(null);
                    setActiveTarget('before');
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-rose-600 flex items-center justify-center transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="space-y-1.5 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">Baseline (Before)</div>
                <div className="text-[10px] text-slate-500 font-medium">Click, drag & drop, or</div>
                <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-indigo-700 border border-indigo-200 rounded shadow-xs">
                  Ctrl + V
                </kbd>
              </div>
            )}
          </div>

          {/* Target 2: After Image */}
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
            className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] relative overflow-hidden group outline-none ${
              isDraggingAfter || activeTarget === 'after'
                ? 'border-cyan-600 ring-2 ring-cyan-200 bg-cyan-50/70'
                : 'border-cyan-200 hover:border-cyan-400 bg-cyan-50/30'
            }`}
          >
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
                  alt="After Preview"
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      afterInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg"
                  >
                    Change Image
                  </button>
                  <span className="text-[10px] text-white/80">or press Ctrl+V</span>
                </div>
                <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  COMPARISON (AFTER)
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAfterFile(null);
                    setAfterPreview(null);
                    setActiveTarget('after');
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-rose-600 flex items-center justify-center transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="space-y-1.5 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">Comparison (After)</div>
                <div className="text-[10px] text-slate-500 font-medium">Click, drag & drop, or</div>
                <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-cyan-700 border border-cyan-200 rounded shadow-xs">
                  Ctrl + V
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Guidance Note */}
        <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-5 leading-relaxed">
          <span className="font-bold text-indigo-700">Analytical Advisory:</span> Pairs must be geographically aligned or co-registered. Unregistered visual images will be evaluated with Euclidean RGB change difference; geographic km² calculations are withheld on non-georeferenced optical uploads.
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!beforeFile || !afterFile || isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading & Aligning...</span>
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
  );
};
