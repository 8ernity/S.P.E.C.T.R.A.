import React from 'react';
import {
  UploadCloud,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  onOpenUpload: () => void;
  adaptionOnline: boolean;
  isCustomUpload?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  eyebrow = 'EARTH OBSERVATION & SATELLITE CHANGE INTELLIGENCE',
  onOpenUpload,
  adaptionOnline,
}) => {
  return (
    <header className="mb-6">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
        <div>
          <span className="spectra-badge mb-1.5 inline-block">
            {eyebrow}
          </span>
          <h1 className="text-3xl font-extrabold text-[#102543] tracking-tight font-['Outfit']">
            {title}
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* New Analysis / Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Pair</span>
          </button>

          {/* Adaption Status Beacon */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              adaptionOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
            }`}
            title={
              adaptionOnline
                ? 'Adaption Labs AI inference is ready'
                : 'Rule-grounded baseline active. Enter ADAPTION_API_KEY in backend/.env for live AI model'
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">
              {adaptionOnline ? 'Adaption AI Online' : 'AI Assistant Ready'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
