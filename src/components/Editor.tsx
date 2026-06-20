import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize, Minimize, AlertTriangle, ChevronDown, Info, Dumbbell } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface EditorProps {
  goalTime: number; // in minutes
  goalWords: number;
  isHardcore?: boolean;
  mode?: 'time' | 'words';
}

const Editor: React.FC<EditorProps> = ({ goalTime: initialGoalTime, goalWords: initialGoalWords, isHardcore: initialIsHardcore = false, mode: initialMode = 'time' }) => {
  // Client-safe parsing of query parameters
  const getParams = () => {
    if (typeof window === 'undefined') {
      return {
        time: initialGoalTime,
        words: initialGoalWords,
        hardcore: initialIsHardcore,
        mode: initialMode
      };
    }
    const searchParams = new URLSearchParams(window.location.search);
    const hasWords = searchParams.has('words');
    const timeVal = searchParams.get('time');
    const wordsVal = searchParams.get('words');
    const hardcoreVal = searchParams.get('hardcore') === 'true';
    
    const parseInteger = (val: string | null, fallback: number) => {
      if (!val) return fallback;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
    };

    return {
      time: parseInteger(timeVal, initialGoalTime),
      words: parseInteger(wordsVal, initialGoalWords),
      hardcore: hardcoreVal,
      mode: hasWords ? 'words' : ('time' as const)
    };
  };

  const params = getParams();

  const [text, setText] = useState('');
  const [lastTyped, setLastTyped] = useState(Date.now());
  const [status, setStatus] = useState<'writing' | 'lost' | 'finished'>('writing');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(params.time * 60);
  const [blurAmount, setBlurAmount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [dangerRatio, setDangerRatio] = useState(0);
  const [encourageIndex, setEncourageIndex] = useState(0);
  const [encourageVisible, setEncourageVisible] = useState(true);
  const [isTypingPostGoal, setIsTypingPostGoal] = useState(false);
  const [bonusElapsed, setBonusElapsed] = useState(0); // seconds elapsed in bonus round
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const BONUS_TIME_SECS = 3 * 60;  // 3 min bonus for time mode
  const BONUS_WORDS = 250;          // 250 extra words bonus for word mode

  const ENCOURAGE_MESSAGES = [
    "You're in the flow — keep going.",
    "The words are coming. Don't stop now.",
    "Your best ideas are just ahead.",
    "Keep the momentum. Every word counts.",
    "You've broken through. Stay with it.",
    "The page is yours. Fill it.",
    "Let the words lead you somewhere new.",
    "You're doing great. Just keep writing.",
  ];
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const encourageRef = useRef<NodeJS.Timeout | null>(null);
  const postGoalIdleRef = useRef<NodeJS.Timeout | null>(null);
  const bonusRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-grow textarea to match content — scroll handled by <main>
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  // Close download dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isGoalReached = params.mode === 'words' 
    ? wordCount >= params.words 
    : (hasStarted && timeLeft <= 0);

  // Calculate the current word being typed (for hardcore blind mode)
  const getCurrentWord = () => {
    if (!text) return '';
    if (/\s$/.test(text)) return '';
    const words = text.trim().split(/\s+/);
    return words[words.length - 1] || '';
  };
  const currentWord = getCurrentWord();

  // Danger threshold: 3s standard, 2s hardcore
  const threshold = params.hardcore ? 2000 : 3000;
  const blurStart = params.hardcore ? 500 : 1000;

  // ── Danger Timer ──────────────────────────────────────────────────────────
  // Re-runs on every keystroke (lastTyped changes). Checks idle time and
  // triggers blur / deletion. Completely independent from the countdown.
  useEffect(() => {
    if (status === 'writing' && hasStarted && !isGoalReached) {
      timerRef.current = setInterval(() => {
        const diff = Date.now() - lastTyped;

        if (diff > threshold) {
          handleLoss();
        } else {
          const ratio = Math.min(1, diff / threshold);
          setDangerRatio(ratio);

          if (diff > blurStart) {
            const amount = Math.min((diff - blurStart) / 100, 20);
            setBlurAmount(amount);
          } else {
            setBlurAmount(0);
          }
        }
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setBlurAmount(0);
      setDangerRatio(0);

      if (isGoalReached && status === 'writing') {
        setStatus('finished');
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lastTyped, status, isGoalReached, hasStarted]);

  // ── Session Countdown ─────────────────────────────────────────────────────
  // Starts once the user begins typing and runs for the full session duration.
  // NOT in the danger-timer effect so keystrokes never reset or clear it.
  useEffect(() => {
    if (params.mode !== 'time') return;
    if (!hasStarted || status !== 'writing') return;

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setStatus('finished');
        }
        return next;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [hasStarted, status]);

  // ── Encouragement Cycling ─────────────────────────────────────────────────
  // When goal is reached, cycles through messages with fade in/out animation.
  useEffect(() => {
    if (status !== 'finished') {
      if (encourageRef.current) clearInterval(encourageRef.current);
      return;
    }

    encourageRef.current = setInterval(() => {
      // Fade out
      setEncourageVisible(false);
      setTimeout(() => {
        setEncourageIndex((prev) => (prev + 1) % ENCOURAGE_MESSAGES.length);
        // Fade back in
        setEncourageVisible(true);
      }, 700);
    }, 4000);

    return () => {
      if (encourageRef.current) clearInterval(encourageRef.current);
    };
  }, [status]);

  // ── Bonus Round Timer (time mode only) ───────────────────────────────────
  // Starts ticking from 0 once the goal is reached, up to BONUS_TIME_SECS.
  useEffect(() => {
    if (status !== 'finished' || params.mode !== 'time') return;

    bonusRef.current = setInterval(() => {
      setBonusElapsed((prev) => {
        if (prev >= BONUS_TIME_SECS) {
          if (bonusRef.current) clearInterval(bonusRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (bonusRef.current) clearInterval(bonusRef.current);
    };
  }, [status]);


  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (status === 'lost') return;

    const newVal = e.target.value;
    
    // Check if the input is a repeating key hold (last 4 characters are identical)
    let isRepeating = false;
    if (newVal.length >= 4) {
      const lastFour = newVal.slice(-4);
      if (lastFour[0] === lastFour[1] && lastFour[1] === lastFour[2] && lastFour[2] === lastFour[3]) {
        isRepeating = true;
      }
    }

    if (!hasStarted) {
      setHasStarted(true);
    }
    setText(newVal);

    if (!isRepeating) {
      setLastTyped(Date.now());
      setBlurAmount(0);
      setDangerRatio(0);
    }

    // Hide encouragement while typing after goal, reappear after 1.5s idle
    if (status === 'finished') {
      setIsTypingPostGoal(true);
      if (postGoalIdleRef.current) clearTimeout(postGoalIdleRef.current);
      postGoalIdleRef.current = setTimeout(() => {
        setIsTypingPostGoal(false);
      }, 1500);
    }
  };

  const handleLoss = () => {
    setStatus('lost');
    setText(''); // Wipe content
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const DOWNLOAD_FORMATS = [
    { ext: 'docx', label: 'Microsoft Word XML document', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', type: 'word' },
    { ext: 'txt', label: 'Plain text document', mime: 'text/plain', type: 'text' },
    { ext: 'pdf', label: 'Portable document format file', mime: 'application/pdf', type: 'pdf' },
    { ext: 'doc', label: 'Older Microsoft Word document', mime: 'application/msword', type: 'word' },
    { ext: 'docm', label: 'Microsoft Word macro-enabled document', mime: 'application/vnd.ms-word.document.macroEnabled.12', type: 'word' },
    { ext: 'dotx', label: 'Microsoft Word template', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template', type: 'word' },
    { ext: 'dotm', label: 'Microsoft Word macro-enabled template', mime: 'application/vnd.ms-word.template.macroEnabled.12', type: 'word' },
    { ext: 'dot', label: 'Older Microsoft Word template', mime: 'application/msword', type: 'word' },
    { ext: 'odt', label: 'OpenDocument text document', mime: 'application/vnd.oasis.opendocument.text', type: 'text' },
    { ext: 'pages', label: 'Apple Pages document', mime: 'application/x-iwork-pages-sffpages', type: 'text' },
    { ext: 'rtf', label: 'Rich text format file', mime: 'application/rtf', type: 'rtf' },
    { ext: 'wps', label: 'Older Microsoft Works document', mime: 'application/vnd.ms-works', type: 'text' },
    { ext: 'wpd', label: 'Corel WordPerfect document', mime: 'application/wordperfect', type: 'text' },
    { ext: 'xml', label: 'Extensible markup language file', mime: 'application/xml', type: 'xml' }
  ];

  const downloadFile = (format: typeof DOWNLOAD_FORMATS[0]) => {
    setIsDropdownOpen(false);
    
    const watermark = "\n\nwritten on donotstopwriting.com";
    
    if (format.type === 'pdf') {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.write(`
          <html>
            <head>
              <title>www.donotstopwriting.com</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  padding: 1.5in; 
                  white-space: pre-wrap; 
                  color: #111;
                  background: #fff;
                }
                .watermark { 
                  margin-top: 80px; 
                  color: #888; 
                  font-size: 11pt; 
                  border-top: 1px solid #eee; 
                  padding-top: 12px; 
                  font-style: italic;
                  font-family: Arial, sans-serif;
                }
              </style>
            </head>
            <body>
              ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              <div class="watermark">written on donotstopwriting.com</div>
            </body>
          </html>
        `);
        doc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 250);
      }
      return;
    }
    
    let content: BlobPart = '';
    
    if (format.type === 'word') {
      content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>donotstopwriting</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
        <style>
        p { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 0 0 12pt 0; }
        .watermark { font-family: Arial, sans-serif; font-size: 10pt; color: #888; margin-top: 48pt; font-style: italic; }
        </style>
        </head>
        <body>
        ${text.split('\n').map(para => `<p>${para.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('')}
        <p class="watermark">written on donotstopwriting.com</p>
        </body>
        </html>
      `;
    } else if (format.type === 'rtf') {
      content = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}\\viewkind4\\uc1\\pard\\f0\\fs24 ${text.replace(/\n/g, '\\par\n')}\\par\\par\\i written on donotstopwriting.com\\i0\\par}`;
    } else if (format.type === 'xml') {
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <content>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</content>\n  <watermark>written on donotstopwriting.com</watermark>\n</document>`;
    } else {
      content = text + watermark;
    }
    
    const file = new Blob([content], {type: format.mime});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `www.donotstopwriting.com.${format.ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetSession = () => {
    window.location.reload();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'lost') {
    return (
      <div className="relative flex flex-col items-center justify-center h-screen bg-background dark:bg-[#080808] text-primary dark:text-white p-6 text-center overflow-hidden transition-colors duration-300">
        {/* Dark Red radial glow in the background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,37,37,0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(229,37,37,0.12)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center max-w-md animate-fade-in">
          <h1 className="text-4xl font-serif font-semibold mb-3 tracking-tight text-primary dark:text-neutral-100">
            Everything is gone.
          </h1>
          
          <p className="text-[15px] font-serif text-neutral-600 dark:text-neutral-400 mb-8 max-w-sm leading-relaxed">
            You stopped writing for too long.<br />Your progress has been deleted forever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button 
              onClick={resetSession}
              className="w-full sm:w-auto px-6 py-2 bg-[#E52525] text-white font-sans rounded-lg font-semibold shadow-[0_4px_12px_rgba(229,37,37,0.3)] hover:bg-[#c21e1e] hover:shadow-[0_4px_16px_rgba(229,37,37,0.4)] transition-all cursor-pointer text-[14px]"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full sm:w-auto px-6 py-2 bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-300 font-sans rounded-lg font-semibold border border-neutral-200 dark:border-neutral-800 hover:text-primary dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer text-[14px]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col h-screen overflow-hidden transition-all duration-300 ${status === 'finished' ? 'bg-neutral-50 dark:bg-neutral-950' : ''}`}>
      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-neutral-100 dark:bg-neutral-800/50 z-50 overflow-visible">
        <div 
          className="h-full relative overflow-visible transition-all duration-300"
          style={{ 
            width: params.mode === 'words'
              ? `${Math.min(100, (wordCount / params.words) * 100)}%`
              : `${Math.min(100, ((params.time * 60 - timeLeft) / (params.time * 60)) * 100)}%`
          }}
        >
          {/* Normal color layer */}
          <div 
            className={`absolute inset-0 transition-colors duration-300 ${status === 'finished' ? 'bg-green-500' : 'bg-[#3B82F6]'}`} 
            style={{
              boxShadow: status === 'finished' 
                ? '0 1px 8px rgba(34, 197, 94, 0.7)' 
                : '0 1px 10px rgba(59, 130, 246, 0.6)'
            }}
          />
          {/* Red overlay layer that fades in as time runs down */}
          {status !== 'finished' && (
            <div 
              className="absolute inset-0 bg-[#E52525] transition-opacity duration-75" 
              style={{ 
                opacity: dangerRatio,
                boxShadow: '0 1px 12px rgba(229, 37, 37, 0.95)'
              }} 
            />
          )}
        </div>
      </div>

      {/* Bonus Progress Bar — appears when goal is exceeded */}
      {status === 'finished' && (
        <div className="absolute top-[3px] left-0 right-0 h-[3px] bg-neutral-100/60 dark:bg-neutral-800/30 z-40 overflow-hidden">
          <div
            className="h-full transition-all duration-1000 ease-linear relative"
            style={{
              width: params.mode === 'words'
                ? `${Math.min(100, ((wordCount - params.words) / BONUS_WORDS) * 100)}%`
                : `${Math.min(100, (bonusElapsed / BONUS_TIME_SECS) * 100)}%`,
              background: 'linear-gradient(90deg, #A855F7, #C084FC)',
              boxShadow: '0 1px 10px rgba(168, 85, 247, 0.65)',
            }}
          />
        </div>
      )}

      {/* Top Toolbar */}
      <header className="h-16 flex items-center justify-between px-6 z-10 border-b border-transparent">
        <button 
          onClick={() => window.location.href = '/'}
          className="p-3 text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors cursor-pointer"
          aria-label="Close and return to home page"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center space-x-3">
          {status === 'finished' && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="mr-2 text-xs font-sans font-semibold border border-neutral-250 dark:border-neutral-800 bg-transparent text-primary dark:text-neutral-200 px-4 py-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Download
                <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-2 mt-2 w-80 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl py-1.5 z-[150] max-h-96 overflow-y-auto animate-fade-in font-sans">
                  {/* Top formats */}
                  <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
                    Primary Formats
                  </div>
                  {DOWNLOAD_FORMATS.slice(0, 3).map((format) => (
                    <button
                      key={format.ext}
                      onClick={() => downloadFile(format)}
                      className="w-full text-left px-4 py-2 text-xs text-primary dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold text-neutral-800 dark:text-white">.{format.ext}</span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">{format.label}</span>
                    </button>
                  ))}
                  
                  <div className="border-t border-neutral-100 dark:border-neutral-800 my-1.5" />
                  
                  <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
                    Other Formats
                  </div>
                  {DOWNLOAD_FORMATS.slice(3).map((format) => (
                    <button
                      key={format.ext}
                      onClick={() => downloadFile(format)}
                      className="w-full text-left px-4 py-2 text-xs text-primary dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">.{format.ext}</span>
                      <span className="text-[10px] text-neutral-450 dark:text-neutral-500 font-normal">{format.label}</span>
                    </button>
                  ))}
                  
                  <div className="border-t border-neutral-100 dark:border-neutral-800 my-1.5" />
                  
                  {/* Promo AI Integration Option */}
                  <div className="px-4 py-2.5 text-xs flex items-center justify-between gap-3 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/10 select-none">
                    <div className="flex flex-wrap items-center gap-2 text-left leading-relaxed">
                      <span className="font-medium text-neutral-450 dark:text-neutral-500">
                        continue with <strong className="font-bold">writingos.ai</strong>
                      </span>
                      <span className="text-[9px] font-sans font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                        coming soon
                      </span>
                    </div>
                    <div className="relative group flex items-center flex-shrink-0">
                      <Info 
                        size={14} 
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help transition-colors" 
                      />
                      {/* Tooltip dialog */}
                      <div className="absolute right-0 bottom-6 hidden group-hover:block w-64 p-3 bg-neutral-900 dark:bg-neutral-850 text-white rounded-lg shadow-xl text-[11px] leading-relaxed z-[200] font-sans font-normal border border-neutral-800 dark:border-neutral-700 select-none animate-fade-in pointer-events-none text-left">
                        <strong className="font-bold">writingos.ai</strong> is an AI-powered writing studio designed to help writers shape unstructured thoughts and ideas into clear, compelling stories.
                        {/* Tooltip arrow */}
                        <div className="absolute right-1 bottom-[-4px] w-2 h-2 bg-neutral-900 dark:bg-neutral-850 border-r border-b border-neutral-800 dark:border-neutral-700 rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <ThemeToggle />
          <button 
            onClick={toggleFullscreen}
            className="p-3 text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors cursor-pointer"
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>

      {/* Main Writing Area — scroll here so bar is at screen right edge */}
      <main className="flex-1 relative flex justify-center overflow-y-auto writing-main-scrollbar">
        <textarea
          id="editor-textarea"
          aria-label="Writing area"
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onCopy={(e) => {
            if (status !== 'finished') {
              e.preventDefault();
            }
          }}
          onCut={(e) => {
            if (status !== 'finished') {
              e.preventDefault();
            }
          }}
          onDragStart={(e) => {
            if (status !== 'finished') {
              e.preventDefault();
            }
          }}
          onSelect={(e) => {
            if (status !== 'finished') {
              const textarea = e.currentTarget;
              textarea.selectionStart = textarea.selectionEnd;
            }
          }}
          onKeyDown={(e) => {
            if (status !== 'finished') {
              // Block Ctrl+A or Cmd+A
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
              }
              // Block Shift + Arrows / Home / End
              if (e.shiftKey && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End')) {
                e.preventDefault();
              }
            }
          }}
          autoFocus
          spellCheck={false}
          className={`w-full max-w-3xl p-8 md:p-12 writing-font-size writing-font bg-transparent border-none outline-none resize-none overflow-hidden transition-all duration-200 leading-relaxed text-primary dark:text-neutral-100 self-start min-h-full
            ${status === 'writing' ? 'placeholder-neutral-300 dark:placeholder-neutral-700' : ''}`}
          placeholder={status === 'finished' ? 'Keep going...' : 'Start typing...'}
          style={{ 
            caretColor: '#E52525',
            userSelect: status !== 'finished' ? 'none' : 'text',
            WebkitUserSelect: status !== 'finished' ? 'none' : 'text',
            filter: params.hardcore && hasStarted && status === 'writing'
              ? 'blur(10px)'
              : `blur(${blurAmount}px)`,
            opacity: status === 'writing' 
              ? (params.hardcore && hasStarted ? 0.08 : 1 - (blurAmount / 15)) 
              : 1
          }}
        />
        
        {params.hardcore && hasStarted && status === 'writing' && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-150"
            style={{ 
              filter: `blur(${blurAmount}px)`,
              opacity: 1 - dangerRatio
            }}
          >
            <div className="text-5xl md:text-7xl font-serif text-primary dark:text-neutral-100 font-semibold tracking-wide text-center max-w-2xl px-6">
              {currentWord}
            </div>
          </div>
        )}

        {/* Encouragement Message — appears after goal is reached */}
        {status === 'finished' && (
          <div
            className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none"
            style={{
              opacity: isTypingPostGoal ? 0 : (encourageVisible ? 1 : 0),
              transition: 'opacity 0.7s ease-in-out',
            }}
          >
            <p className="font-serif text-[13px] md:text-[14px] tracking-wide text-neutral-400 dark:text-neutral-500 italic select-none">
              {ENCOURAGE_MESSAGES[encourageIndex]}
            </p>
          </div>
        )}
      </main>


      {/* Bottom Status Bar */}
      <footer className="h-14 flex items-center justify-center px-8 bg-transparent">
        {params.mode === 'words' ? (
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tabular-nums flex items-center gap-1.5">
            {wordCount} / {params.words} words
            {params.hardcore && (
              <span className="flex items-center text-[#E52525] ml-1 select-none font-sans font-normal gap-1">
                + <Dumbbell size={14} className="stroke-[2.5]" />
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tabular-nums flex items-center gap-1.5">
            {formatTime(timeLeft)}
            {params.hardcore && (
              <span className="flex items-center text-[#E52525] ml-1 select-none font-sans font-normal gap-1">
                + <Dumbbell size={14} className="stroke-[2.5]" />
              </span>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};

export default Editor;
