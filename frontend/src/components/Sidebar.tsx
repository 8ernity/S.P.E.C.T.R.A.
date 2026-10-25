import React from 'react';
import {
  Satellite,
  LayoutDashboard,
  Layers,
  Columns2,
  Trees,
  Droplets,
  Globe,
  Sparkles,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Settings2,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onResetCase?: () => void;
  onOpenUpload?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Change Intelligence', icon: LayoutDashboard },
  { id: 'timetravel', label: 'Global Time-Travel', icon: Globe },
  { id: 'analysis', label: 'Anomaly Regions', icon: Layers },
  { id: 'reports', label: 'Automated Report', icon: FileText },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onResetCase,
  onOpenUpload,
}) => {
  return (
    <aside
      className={`sidebar-mesh h-screen flex flex-col justify-between transition-all duration-300 border-r border-blue-200/50 dark:border-white/10 select-none z-30 shrink-0 ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      {/* Top Brand Section */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            onClick={() => onNavigate('overview')}
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src="/spectra-logo.png"
                alt="SPECTRA Logo"
                className="w-10 h-10 object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xl tracking-tight text-[#102543] dark:text-white font-['Outfit'] transition-colors">
                  SPECTRA
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80 -mt-1">
                  Earth Intelligence
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide space-y-4">
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              PS-05 Change Intelligence
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm shadow-indigo-900/10 font-bold border border-blue-100 dark:border-white/10'
                    : 'text-[#1e3452] dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Quick Upload Action */}
        <div className="pt-2">
          {!collapsed ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-blue-500/5 dark:from-indigo-950/40 dark:via-cyan-950/30 dark:to-blue-950/20 border border-indigo-200/60 dark:border-indigo-500/30 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Upload Custom Pair</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mb-2.5">
                Ingest optical/multispectral before & after scenes for instant anomaly analysis.
              </p>
              <button
                onClick={onOpenUpload}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Pair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenUpload}
              title="Upload Custom Pair"
              className="w-full flex items-center justify-center p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-600/40 cursor-pointer"
            >
              <UploadCloud className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Station Profile at Bottom */}
      <div className="p-3 border-t border-blue-200/40 dark:border-white/10 bg-white/30 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              SP
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#102543] dark:text-white truncate">SPECTRA Station</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">Earth Observation</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1">
              {onResetCase && (
                <button
                  onClick={onResetCase}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-md hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Reload Active Sample"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" title="Online" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
