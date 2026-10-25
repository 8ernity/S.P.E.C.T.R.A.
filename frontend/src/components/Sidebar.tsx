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
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onResetCase?: () => void;
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

const navGroups: NavGroup[] = [
  {
    title: 'WORKSPACE',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'compare', label: 'Image Comparison', icon: Columns2 },
      { id: 'analysis', label: 'Change Analysis', icon: Layers },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { id: 'environment', label: 'Environmental Indices', icon: Trees },
      { id: 'water', label: 'Water & Floods', icon: Droplets },
      { id: 'explorer', label: 'Satellite Explorer', icon: Globe },
    ],
  },
  {
    title: 'EVIDENCE & AI',
    items: [
      { id: 'intelligence', label: 'Adaption AI', icon: Sparkles },
      { id: 'reports', label: 'Evidence Dossier', icon: FileText },
      { id: 'methodology', label: 'Methodology', icon: BookOpen },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onResetCase,
}) => {
  return (
    <aside
      className={`sidebar-mesh h-screen flex flex-col justify-between transition-all duration-300 border-r border-blue-200/50 select-none z-30 shrink-0 ${
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Satellite className="w-5 h-5 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xl tracking-tight text-[#102543] font-['Outfit']">
                  SPECTRA
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700/80 -mt-1">
                  Earth Intelligence
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white/60 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm shadow-blue-900/5 font-semibold'
                      : 'text-[#1e3452] hover:bg-white/50 hover:text-indigo-600'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-indigo-600 scale-110' : 'text-slate-500'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Station Profile at Bottom */}
      <div className="p-3 border-t border-blue-200/40 bg-white/30 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              SP
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#102543] truncate">SPECTRA Station</div>
                <div className="text-[10px] text-slate-500 truncate font-medium">Earth Observation</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1">
              {onResetCase && (
                <button
                  onClick={onResetCase}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-white/60 transition-colors"
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
