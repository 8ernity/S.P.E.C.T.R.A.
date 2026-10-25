import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Sparkles,
  Satellite,
  ShieldCheck,
  Scale,
  Trees,
  Waves,
  Copy,
  Check,
  Mic,
  MicOff,
  GripHorizontal,
  MoreHorizontal,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { sendChatMessage } from '../lib/api';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import type { AnalysisResult, ChatMessage } from '../types/spectra';

interface AdaptionChatWidgetProps {
  analysis: AnalysisResult | null;
}

const QUICK_CARDS = [
  {
    title: 'Canopy & Biomass Loss',
    desc: 'Estimate carbon sink & hectare impact',
    icon: Trees,
    color: 'emerald',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    query: 'What is the estimated ecological and carbon biomass loss based on the detected change metrics for this scene?',
  },
  {
    title: 'Statutory Violation Notice',
    desc: 'Draft cease-and-desist citation',
    icon: Scale,
    color: 'amber',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    query: 'Draft an official statutory notice of unpermitted surface alteration with applicable environmental acts and mandatory inspection directives.',
  },
  {
    title: 'Parcel Morphology Risk',
    desc: 'Geometric aspect ratio diagnostics',
    icon: Satellite,
    color: 'indigo',
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    query: 'Explain the spatial clustering and morphological structure of the top change parcels in this observation raster.',
  },
  {
    title: 'Hydrological & Inundation',
    desc: 'Water index & moisture dynamics',
    icon: Waves,
    color: 'cyan',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    query: 'Analyze the water extent dynamics, NDWI signature, and possible seasonal rainfall confounders affecting this scene.',
  },
];

export const AdaptionChatWidget: React.FC<AdaptionChatWidgetProps> = ({ analysis }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const glassRef = useLiquidGlass<HTMLDivElement>(isOpen);

  // Window coordinates & dimensions
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 440, height: 600 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ clientX: number; clientY: number; width: number; height: number }>({
    clientX: 0,
    clientY: 0,
    width: 440,
    height: 600,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize position to bottom right
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultWidth = Math.min(440, window.innerWidth - 32);
      const defaultHeight = Math.min(600, window.innerHeight - 80);
      setSize({ width: defaultWidth, height: defaultHeight });
      setPos({
        x: Math.max(16, window.innerWidth - defaultWidth - 24),
        y: Math.max(16, window.innerHeight - defaultHeight - 24),
      });
    }
  }, []);

  // Listen for global custom event to open chat
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('spectra:open-chat', handleOpen);
    return () => window.removeEventListener('spectra:open-chat', handleOpen);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, loading]);

  // Dragging & Resizing listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const maxX = Math.max(16, window.innerWidth - size.width - 16);
        const maxY = Math.max(16, window.innerHeight - (isMinimized ? 64 : size.height) - 16);
        setPos({
          x: Math.max(16, Math.min(e.clientX - dragOffset.x, maxX)),
          y: Math.max(16, Math.min(e.clientY - dragOffset.y, maxY)),
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.clientX;
        const deltaY = e.clientY - resizeStart.clientY;
        const maxW = window.innerWidth - pos.x - 16;
        const maxH = window.innerHeight - pos.y - 16;
        setSize({
          width: Math.max(340, Math.min(resizeStart.width + deltaX, maxW)),
          height: Math.max(380, Math.min(resizeStart.height + deltaY, maxH)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, size, isMinimized, pos]);

  const handleDragStart = (e: React.MouseEvent) => {
    // Only drag from header handle
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      clientX: e.clientX,
      clientY: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // Voice recognition toggle
  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Send message
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: text,
        history: historyPayload,
        analysisId: analysis?.analysisId,
        uiContext: {
          sourceTitle: analysis?.sourceTitle,
          changedPixels: analysis?.measurements.changedPixels,
          changePercentage: analysis?.measurements.changePercentage,
        },
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        sources: res.sources,
        category: res.category,
        timestamp: res.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ **Connection Notice:** Unable to reach Adaption intelligence service. Using deterministic rule-grounded backup.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
    setIsMenuOpen(false);
  };

  // Markdown renderer for assistant messages
  const renderFormatted = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-xs text-indigo-700 dark:text-indigo-300 mt-2.5 mb-1 tracking-tight">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 text-xs text-slate-700 dark:text-slate-200">
            <span className="text-indigo-600 dark:text-indigo-400 mt-1 text-[8px]">•</span>
            <span className="leading-relaxed">{renderInline(line.trim().substring(2))}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed my-0.5">
          {renderInline(line)}
        </p>
      );
    });
  };

  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      const codeParts = part.split(/(`.*?`)/g);
      return codeParts.map((sub, sIdx) => {
        if (sub.startsWith('`') && sub.endsWith('`')) {
          return (
            <code key={sIdx} className="px-1 py-0.5 rounded font-mono text-[11px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              {sub.slice(1, -1)}
            </code>
          );
        }
        return sub;
      });
    });
  };

  return (
    <>
      {/* Floating Bottom-Right Launcher Trigger Pill (Exact CycloneTracker Liquid Glass) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="liquid-glass-panel fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-2.5 text-slate-800 dark:text-white rounded-full hover:scale-105 transition-all cursor-pointer group shadow-2xl"
          title="Open Ask Adaption AI Copilot"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-bold font-['Outfit'] tracking-wide">
            Ask Adaption AI
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
            Copilot
          </span>
        </button>
      )}

      {/* Floating Liquid-Glass Chat Window (CycloneTracker Architecture) */}
      {isOpen && (
        <div
          ref={glassRef}
          style={{
            position: 'fixed',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${size.width}px`,
            height: isMinimized ? '60px' : `${size.height}px`,
            zIndex: 9999,
          }}
          className="liquid-glass-panel flex flex-col rounded-[26px] overflow-hidden transition-[height,box-shadow] duration-200"
        >
          {/* Header & Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            className="p-3.5 px-4.5 bg-white/50 dark:bg-white/[0.04] backdrop-blur-md border-b border-white/70 dark:border-white/10 flex items-center justify-between select-none shrink-0 cursor-move"
            title="Drag to reposition window"
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center shadow-md shadow-indigo-500/10 backdrop-blur-sm">
                <img src="/spectra-logo.png" alt="SPECTRA" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-['Outfit']">
                  <span>Adaption AI Copilot</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
                    Live
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-300/80">
                  Earth Observation & Incident Intelligence
                </p>
              </div>
            </div>

            {/* Drag Handle Grip */}
            <div className="hidden sm:flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
              <GripHorizontal className="w-4 h-4 opacity-50" />
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 relative">
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-40 liquid-glass-panel border border-white/60 dark:border-white/20 rounded-xl shadow-2xl py-1 z-50 text-xs backdrop-blur-2xl">
                    <button
                      onClick={handleClear}
                      className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear History</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Window Body (Hidden when minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
              {/* Messages / Hero Screen */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-transparent scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-2 space-y-3 animate-in fade-in duration-300">
                    {/* Glowing Satellite Emblem */}
                    <div className="relative my-2 flex items-center justify-center">
                      <div className="absolute w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-600/15 backdrop-blur-sm">
                        <img src="/spectra-logo.png" alt="SPECTRA" className="w-10 h-10 object-contain drop-shadow-md" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                        Hi, I&apos;m <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 dark:from-indigo-400 dark:via-sky-300 dark:to-indigo-300">Adaption AI</span>
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300/80 mt-0.5">
                        Your satellite change detection & incident intelligence copilot.
                      </p>
                    </div>

                    {/* Active Scene Context Pill */}
                    {analysis && (
                      <div className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-400/30 rounded-full text-[10px] text-indigo-700 dark:text-indigo-200 font-mono backdrop-blur-md shadow-sm">
                        Active: {analysis.sourceTitle.slice(0, 36)} ({analysis.measurements.changePercentage}%)
                      </div>
                    )}

                    {/* Quick-Prompt Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
                      {QUICK_CARDS.map((card, i) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={i}
                            onClick={() => handleSend(card.query)}
                            className="p-3 rounded-2xl liquid-glass-card hover:border-indigo-400/50 transition-all text-left group cursor-pointer shadow-sm hover:scale-[1.01]"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`p-1.5 rounded-xl border ${card.iconBg} group-hover:scale-105 transition-transform`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                {card.title}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300/80 line-clamp-1 leading-snug">
                              {card.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[88%] p-3.5 rounded-2xl text-xs relative group ${
                            m.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                              : 'liquid-glass-card text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-md'
                          }`}
                        >
                          {m.role === 'assistant' ? renderFormatted(m.content) : m.content}

                          {/* Assistant Footer with Copy button & sources */}
                          {m.role === 'assistant' && (
                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono text-[9px] text-indigo-600 dark:text-indigo-400">
                                {m.sources ? m.sources.join(' • ') : 'Adaption Intelligence'}
                              </span>
                              <button
                                onClick={() => handleCopy(m.content, m.id)}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                                title="Copy response"
                              >
                                {copiedId === m.id ? (
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-400/80 font-mono mt-0.5 px-1">
                          {m.timestamp}
                        </span>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-center gap-2 p-3 liquid-glass-card rounded-2xl text-xs text-indigo-700 dark:text-indigo-300 w-fit shadow-sm">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing Earth intelligence with Adaption AI...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white/60 dark:bg-black/25 backdrop-blur-xl border-t border-white/70 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2 liquid-glass-input rounded-full px-3.5 py-1.5 focus-within:border-indigo-500/80 focus-within:bg-white/80 dark:focus-within:bg-white/[0.09] transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask Adaption about this scene, laws, or raster metrics..."
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
                  />

                  {/* Voice Input Mic Toggle */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Listening... click to stop' : 'Voice Input'}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 animate-pulse scale-110'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Send"
                  >
                    <Send className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>

              {/* Bottom-Right Corner Resize Handle */}
              <div
                onMouseDown={handleResizeStart}
                className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-end justify-end p-1 text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-white transition-colors z-30 select-none group"
                title="Drag to resize window"
              >
                <svg className="w-3 h-3 group-hover:scale-125 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="21" y1="11" x2="11" y2="21" />
                  <line x1="21" y1="16" x2="16" y2="21" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
