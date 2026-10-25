import React from 'react';
import {
  UploadCloud,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  onOpenUpload: () => void;
  adaptionOnline: boolean;
  isCustomUpload?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  eyebrow = 'EARTH OBSERVATION & SATELLITE CHANGE INTELLIGENCE',
  onOpenUpload,
  theme = 'light',
  onToggleTheme,
}) => {
  return (
    <header className="mb-6">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
        <div>
          <span className="spectra-badge mb-1.5 inline-block">
            {eyebrow}
          </span>
          <h1 className="text-3xl font-extrabold text-[#102543] dark:text-white tracking-tight font-['Outfit'] transition-colors">
            {title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-0.5 transition-colors">
            {subtitle}
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer hover:scale-105 transition-all shadow-sm bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-180 duration-300" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-180 duration-300" />
                  <span>Dark</span>
                </>
              )}
            </button>
          )}

          {/* New Analysis / Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Pair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
