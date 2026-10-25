import React from 'react';
import { BookOpen, ExternalLink, Code2, Award, ShieldAlert, Cpu } from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="spectra-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-extrabold text-[#102543] font-['Outfit']">
            Scientific Methodology & Mathematical Formulas
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl">
          SPECTRA is built on deterministic remote-sensing algorithms and peer-reviewed spectral reflectance indices. The mathematical definitions below are implemented strictly without approximations or heuristic smoothing that alters physical measurements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NDVI */}
        <div className="spectra-card p-5 space-y-2">
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
            Vegetation Index
          </span>
          <h3 className="font-bold text-base text-[#102543]">
            NDVI (Normalized Difference Vegetation Index)
          </h3>
          <div className="font-mono text-xs font-bold text-indigo-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            NDVI = (B08 - B04) / (B08 + B04 + ε)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Where <span className="font-mono font-bold">B08</span> is Sentinel-2 Near-Infrared (842 nm, 10m ground resolution) and <span className="font-mono font-bold">B04</span> is Red (665 nm, 10m). ε = 10⁻⁶ prevents division by zero over nodata or water absorption. Healthy photosynthetic vegetation yields values between 0.3 and 0.8; clear-cut or dead matter drops below 0.15.
          </p>
        </div>

        {/* NDWI */}
        <div className="spectra-card p-5 space-y-2">
          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full uppercase">
            Water Extent Index
          </span>
          <h3 className="font-bold text-base text-[#102543]">
            NDWI (McFeeters Open Water Index)
          </h3>
          <div className="font-mono text-xs font-bold text-cyan-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            NDWI = (B03 - B08) / (B03 + B08 + ε)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Where <span className="font-mono font-bold">B03</span> is Green (560 nm, 10m) and <span className="font-mono font-bold">B08</span> is Near-Infrared. Water absorbs strongly in NIR while reflecting in green wavelengths, yielding positive values (&gt; 0.0) over open water bodies, while terrestrial vegetation and dry soil remain strongly negative.
          </p>
        </div>

        {/* Otsu Thresholding */}
        <div className="spectra-card p-5 space-y-2">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
            Adaptive Segmentation
          </span>
          <h3 className="font-bold text-base text-[#102543]">
            Otsu&apos;s Bimodal Histogram Thresholding
          </h3>
          <div className="font-mono text-xs font-bold text-indigo-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            σ²_b(t) = ω₁(t)ω₂(t) [μ₁(t) - μ₂(t)]²
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Calculates an optimal non-parametric threshold by maximizing between-class variance σ²_b(t) over 256 difference histogram bins. Automatically separates high-contrast real surface modifications from ambient noise without manual guesswork.
          </p>
        </div>

        {/* CVD */}
        <div className="spectra-card p-5 space-y-2">
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase">
            Change Vector Analysis
          </span>
          <h3 className="font-bold text-base text-[#102543]">
            CVD (Change Vector Detection Magnitude)
          </h3>
          <div className="font-mono text-xs font-bold text-purple-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            ||ΔG|| = √(Σ [Band_after_i - Band_before_i]²) / √N
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Multi-spectral vector displacement across all aligned spectral bands. Captures multidimensional shifts in spectral signature even when individual single-band indices experience cancelation.
          </p>
        </div>
      </div>

      {/* Citations & Acknowledgments */}
      <div className="spectra-card p-6">
        <h3 className="font-bold text-base text-[#102543] mb-3 font-['Outfit']">
          Scientific Literature & Open Source Acknowledgements
        </h3>
        <ul className="space-y-2 text-xs text-slate-600 font-medium">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>
              <strong>Lubna Ishaq:</strong> <em>satellite-change-detection</em> (MIT License). Sentinel-2 ingestion and compositing patterns.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>
              <strong>Birendra K. Sharma:</strong> <em>satelite_img_change_detection</em>. Change vector and Otsu segmentation concepts.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>
              <strong>Adaption Labs:</strong> Responses API (v1) and cognitive synthesis integration for environmental reasoning.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>
              <strong>European Space Agency (ESA):</strong> Copernicus Open Access Hub for Sentinel-2 MSI MultiSpectral Instrument data.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
