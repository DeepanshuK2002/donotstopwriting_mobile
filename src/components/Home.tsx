import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ChevronDown, Check, ChevronUp, Dumbbell } from 'lucide-react';

const Home: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'minutes' | 'words'>('minutes');
  const [value, setValue] = useState(5);
  const [isHardcore, setIsHardcore] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState<number | ''>('');

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
            <a href="/privacy" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200"><span className="hidden sm:inline">Privacy Policy</span><span className="inline sm:hidden">Privacy</span></a>
            <span className="mx-2.5 opacity-60">·</span>
            <a href="/terms" className="hover:text-primary dark:hover:text-neutral-300 transition-colors duration-200"><span className="hidden sm:inline">Terms & Conditions</span><span className="inline sm:hidden">T&C</span></a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
