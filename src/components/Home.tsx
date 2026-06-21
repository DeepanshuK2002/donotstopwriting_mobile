import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ChevronDown, Check, ChevronUp, Dumbbell } from 'lucide-react';

const Home: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'minutes' | 'words'>('minutes');
  const [value, setValue] = useState(5);
  const [isHardcore, setIsHardcore] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState<number | ''>('');
  const [showPromoCard, setShowPromoCard] = useState(true);
  const [activePromo, setActivePromo] = useState<'dropdata' | 'install'>('dropdata');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; lines: string[] }>({ title: '', lines: [] });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const minuteOptions = [3, 5, 10, 15, 30, 60];
  const wordOptions = [250, 500, 1000, 2000];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    };
  }, []);

  useEffect(() => {
    if (!showPromoCard) return;
    const timer = setInterval(() => {
      setActivePromo((prev) => (prev === 'dropdata' ? 'install' : 'dropdata'));
    }, 6000);
    return () => clearInterval(timer);
  }, [showPromoCard]);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setShowInstallModal(false);
    } else if (isIOS) {
      alert("To add Do Not Stop Writing to your home screen:\n\n1. Tap the Share button at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
      setShowInstallModal(false);
    } else {
      alert("To install this app as a shortcut:\n\n- On desktop Chrome/Edge: Click the install icon in the address bar.\n- On mobile: Tap the browser menu and select 'Add to Home screen' or 'Install app'.");
      setShowInstallModal(false);
    }
  };

  useEffect(() => {
    const input = customInputRef.current;
    if (!input) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      const step = tab === 'minutes' ? 1 : 50;
      const minVal = 1;
      const maxVal = tab === 'minutes' ? 1440 : 100000;

      setCustomValue((prev) => {
        const currentVal = typeof prev === 'number' ? prev : 0;
        return Math.max(minVal, Math.min(maxVal, currentVal + direction * step));
      });
    };

    input.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      input.removeEventListener('wheel', handleWheel);
    };
  }, [isCustom, tab]);

  const handleStart = () => {
    const url = `/write?${tab === 'minutes' ? 'time' : 'words'}=${value}&hardcore=${isHardcore}`;
    window.location.href = url;
  };

  return (
    <div className="relative z-30 min-h-screen flex flex-col items-center justify-center px-6 pt-24">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl animate-fade-in mt-8">
        <h1 className="text-[64px] md:text-[80px] font-serif leading-[0.92] tracking-tight mb-5 text-primary dark:text-neutral-100 font-medium">
          Do Not<br />Stop Writing.
        </h1>

        <p className="text-[16px] md:text-[19px] text-[#555555] dark:text-neutral-400 max-w-[420px] mb-5 font-serif leading-relaxed opacity-90">
          If you stop typing for too long,<br />your work disappears.
        </p>

        {/* Dropdown Selector */}
        <div className="relative mb-3" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-between w-[280px] px-5 py-3 bg-white dark:bg-[#111111] border border-[#D1D5DB] dark:border-neutral-800 shadow-sm transition-all cursor-pointer text-left
              ${isOpen ? 'rounded-t-lg rounded-b-none border-b-neutral-200 dark:border-b-neutral-800' : 'rounded-lg hover:border-neutral-400 dark:hover:border-neutral-700'}`}
          >
            <span className="text-sm text-primary dark:text-neutral-200 font-serif font-semibold flex items-center gap-1.5">
              {tab === 'minutes' ? `${value} minutes` : `${value} words`}
              {isHardcore && (
                <span className="flex items-center text-[#E52525] ml-1 select-none font-sans font-normal gap-1">
                  + <Dumbbell size={14} className="stroke-[2.5]" />
                </span>
              )}
            </span>
            {isOpen ? <ChevronUp size={16} className="text-primary dark:text-neutral-400" /> : <ChevronDown size={16} className="text-primary dark:text-neutral-400" />}
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 w-full bg-white dark:bg-[#111111] border-x border-b border-[#D1D5DB] dark:border-neutral-800 rounded-b-lg shadow-xl overflow-hidden z-50">
              <div className="flex border-b border-[#E5E7EB] dark:border-neutral-800">
                <button
                  onClick={() => { setTab('minutes'); setValue(5); setIsCustom(false); }}
                  className={`flex-1 py-2.5 text-[13px] transition-all relative ${tab === 'minutes' ? 'text-primary dark:text-white font-semibold' : 'text-[#9CA3AF] dark:text-neutral-500 font-semibold'}`}
                >
                  Minutes
                  {tab === 'minutes' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-[#E52525]" />}
                </button>
                <button
                  onClick={() => { setTab('words'); setValue(250); setIsCustom(false); }}
                  className={`flex-1 py-2.5 text-[13px] transition-all relative ${tab === 'words' ? 'text-primary dark:text-white font-semibold' : 'text-[#9CA3AF] dark:text-neutral-500 font-semibold'}`}
                >
                  Words
                  {tab === 'words' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-[#E52525]" />}
                </button>
              </div>

              <div className="py-1 bg-white dark:bg-[#111111] max-h-[220px] overflow-y-auto">
                {(tab === 'minutes' ? minuteOptions : wordOptions).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setValue(opt); setIsOpen(false); setIsCustom(false); }}
                    className={`w-full px-5 py-2 text-left text-sm flex items-center justify-between transition-colors font-serif ${value === opt && !isCustom ? 'bg-[#FAF0EE] dark:bg-[#E52525]/15 text-primary dark:text-white font-semibold' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-primary dark:text-neutral-300 font-semibold'}`}
                  >
                    <span>{opt} {tab === 'minutes' ? 'minutes' : 'words'}</span>
                    {value === opt && !isCustom && <Check size={14} className="text-primary dark:text-[#E52525]" />}
                  </button>
                ))}

                {isCustom ? (
                  <div className="px-5 py-2 flex items-center space-x-2 border-t border-neutral-100 dark:border-neutral-800 mt-1 bg-neutral-50/50 dark:bg-neutral-900/20">
                    <input
                      ref={customInputRef}
                      type="number"
                      min="1"
                      max={tab === 'minutes' ? 1440 : 100000}
                      value={customValue}
                      onChange={(e) => setCustomValue(parseInt(e.target.value) || '')}
                      placeholder={tab === 'minutes' ? "Mins..." : "Words..."}
                      className="w-24 px-2.5 py-1 text-sm border border-neutral-300 dark:border-neutral-800 rounded bg-transparent text-primary dark:text-neutral-100 font-serif focus:outline-none focus:border-[#E52525]"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (typeof customValue === 'number' && customValue > 0) {
                          setValue(customValue);
                          setIsOpen(false);
                        }
                      }}
                      className="px-3 py-1 bg-[#111111] dark:bg-[#151515] text-white text-xs rounded font-serif hover:opacity-95 cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setIsCustom(true); setCustomValue(value); }}
                    className="w-full px-5 py-2 text-left text-sm flex items-center justify-between transition-colors font-serif border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-[#E52525] font-semibold cursor-pointer"
                  >
                    <span>Custom...</span>
                  </button>
                )}
              </div>

              <div className="px-5 py-3 bg-white dark:bg-[#111111] border-t border-[#E5E7EB] dark:border-neutral-800">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isHardcore}
                    onChange={() => setIsHardcore(!isHardcore)}
                    className="sr-only"
                  />
                  {/* Custom Checkbox */}
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all mr-3
                      ${isHardcore
                        ? 'bg-[#E52525] border-[#E52525] text-white shadow-[0_2px_8px_rgba(229,37,37,0.3)]'
                        : 'border-[#D1D5DB] dark:border-neutral-700 bg-transparent group-hover:border-neutral-400 dark:group-hover:border-neutral-600'
                      }`}
                  >
                    {isHardcore && (
                      <svg className="w-2.5 h-2.5 stroke-white fill-none stroke-[3]" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left select-none">
                    <div className="text-sm font-semibold text-primary dark:text-neutral-200 font-serif">Hardcore mode</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          className="w-[280px] py-3 bg-[#111111] dark:bg-[#151515] text-white dark:text-neutral-200 border border-transparent dark:border-neutral-800 rounded-xl font-serif text-[19px] hover:opacity-90 dark:hover:bg-neutral-900 transition-all cursor-pointer mb-8"
        >
          Start Writing
        </button>

        <div className="flex flex-col items-center gap-4 mb-12 select-none">
          <div className="flex items-center space-x-2 text-[#E52525]">
            <AlertTriangle size={18} strokeWidth={1.5} />
            <span className="text-sm font-serif">If you stop typing for too long, everything will be lost.</span>
          </div>
          <div className="flex items-center text-[13px] font-serif text-[#777777] dark:text-neutral-500">
            <a href="/about" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200">About</a>
            <span className="mx-2.5 opacity-60">·</span>
            <a href="/contact" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200">Contact</a>
            <span className="mx-2.5 opacity-60">·</span>
            <a href="/tools" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200">Tools</a>
            <span className="mx-2.5 opacity-60">·</span>
            <a href="/privacy" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200"><span className="hidden sm:inline">Privacy Policy</span><span className="inline sm:hidden">Privacy</span></a>
            <span className="mx-2.5 opacity-60">·</span>
            <a href="/terms" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200"><span className="hidden sm:inline">Terms & Conditions</span><span className="inline sm:hidden">T&C</span></a>
          </div>
        </div>
      </div>

      {/* Apple-style Rotating Try dropdata & Install PWA Card in the bottom-right corner */}
      {showPromoCard && (
        <div className="absolute bottom-6 right-6 z-40 w-[240px] md:w-[265px] hidden sm:block select-none">
          <div className="relative group">
            {/* Card 1: Try dropdata */}
            <div className={`transition-all duration-700 ease-in-out ${
              activePromo === 'dropdata'
                ? 'opacity-100 scale-100 rotate-0 pointer-events-auto relative z-10'
                : 'opacity-0 scale-95 rotate-2 pointer-events-none absolute inset-0 z-0'
            }`}>
              <a 
                href="/dropdata"
                className="block p-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 no-underline text-left pr-8"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <img src="/dropdata-icon.png" alt="dropdata logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[12px] font-sans font-bold text-slate-800 dark:text-neutral-200 leading-tight">
                      Try peer file sharing
                    </p>
                    <p className="text-[10px] font-sans text-slate-500 dark:text-neutral-400 mt-1.5 leading-normal font-medium">
                      Transfer files directly tab-to-tab, securely and instantly.
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Card 2: Add Shortcut */}
            <div className={`transition-all duration-700 ease-in-out ${
              activePromo === 'install'
                ? 'opacity-100 scale-100 rotate-0 pointer-events-auto relative z-10'
                : 'opacity-0 scale-95 -rotate-2 pointer-events-none absolute inset-0 z-0'
            }`}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowInstallModal(true);
                }}
                className="w-full block p-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 no-underline text-left pr-8 cursor-pointer focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex items-center justify-center gap-1.5 shrink-0 text-slate-800 dark:text-neutral-200">
                    {/* Apple Logo */}
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current shrink-0" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                    </svg>
                    {/* Microsoft Logo */}
                    <svg viewBox="0 0 23 23" className="w-[16px] h-[16px] fill-current shrink-0" aria-hidden="true">
                      <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-sans font-bold text-slate-800 dark:text-neutral-200 leading-tight">
                      Add to Home Screen
                    </p>
                    <p className="text-[10px] font-sans text-slate-500 dark:text-neutral-400 mt-1.5 leading-normal font-medium">
                      Install DNSW as a shortcut on your desktop or mobile.
                    </p>
                  </div>
                </div>
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPromoCard(false);
              }}
              className="absolute top-2.5 right-2.5 p-1 text-slate-450 hover:text-slate-650 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors border-0 cursor-pointer focus:outline-none z-20"
              aria-label="Dismiss card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}      {/* Premium Apple-inspired PWA install modal */}
      {showInstallModal && (
        <div 
          className="fixed inset-0 bg-[#0A0A0C]/60 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowInstallModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#1C1C1E] border border-neutral-200/50 dark:border-neutral-800/50 rounded-[28px] shadow-2xl max-w-2xl w-full text-left relative overflow-hidden animate-scale-in flex flex-col md:flex-row select-none"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          >
            {/* Close Button in top-right */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-650 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-full transition-colors border-0 cursor-pointer focus:outline-none z-20"
              aria-label="Close dialog"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Left Panel: App Branding */}
            <div className="w-full md:w-[42%] flex flex-col items-center justify-center p-8 bg-neutral-50/40 dark:bg-[#151517]/30 text-center border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800/80">
              {/* App Icon SQUIRCLE */}
              <div className="w-20 h-20 bg-[#111111] dark:bg-white text-white dark:text-[#111111] rounded-[22px] flex items-center justify-center font-serif font-bold text-base tracking-wider shadow-md mb-5 select-none">
                DNSW
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 tracking-tight font-sans">
                Don't Stop Writing
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-450 mt-2 max-w-[180px] leading-relaxed font-sans">
                Add to your home screen for quick access
              </p>
            </div>

            {/* Right Panel: Installation Instructions */}
            <div className="w-full md:w-[58%] flex flex-col justify-center p-8 relative">
              <h2 className="text-xl font-sans font-bold text-slate-900 dark:text-neutral-100 tracking-tight leading-snug">
                Install DNSW <span className="font-normal text-slate-500 dark:text-neutral-400 block md:inline md:before:content-['\a'] before:whitespace-pre">for the best experience</span>
              </h2>

              {/* Rows */}
              <div className="my-6 space-y-4 font-sans">
                {/* Row 1: Desktop */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800/80 flex items-center justify-center text-slate-700 dark:text-neutral-300 shrink-0 border border-neutral-100 dark:border-neutral-800">
                    {/* Monitor Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 dark:text-neutral-200">On desktop (Chrome/Edge)</h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-normal">Click the install icon in the address bar.</p>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="h-[1px] w-full bg-neutral-100 dark:bg-neutral-800/60" />

                {/* Row 2: Mobile */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800/80 flex items-center justify-center text-slate-700 dark:text-neutral-300 shrink-0 border border-neutral-100 dark:border-neutral-800">
                    {/* Smartphone Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 dark:text-neutral-200">On mobile</h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-450 mt-0.5 leading-normal">
                      Tap the menu ( <span className="font-bold">⋮</span> ) and select 'Add to Home screen' or 'Install app'.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-[#111111] dark:bg-white text-white dark:text-black hover:opacity-90 font-sans font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm focus:outline-none"
                >
                  {/* Download Icon */}
                  <svg xmlns="http://www.w3.org/2500/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Got it
                </button>
                
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="text-[11px] font-sans font-medium text-slate-450 dark:text-neutral-500 hover:text-slate-650 dark:hover:text-neutral-300 transition-colors bg-transparent border-0 cursor-pointer focus:outline-none w-full text-center"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
