import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Aperture, House, Sun, Maximize2, Minimize2, PictureInPicture } from 'lucide-react';
import userStore from '@/store/user';
import './pomodoro.css';

type Mode = 'home' | 'focus' | 'ambient';

type TimerPreset = {
  id: string;
  name: string;
  description: string;
  type: 'pomodoro' | 'stopwatch' | 'countdown' | 'custom';
  focusDuration: number; // in minutes (0 for stopwatch)
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many focus sessions
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  isDefault: boolean; // cannot be deleted
};

export default observer(function PomodoroPage() {
  const [mode, setMode] = useState<Mode>('home');
  const [now, setNow] = useState(new Date());
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  // Load settings from localStorage
  const [clockSettings, setClockSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro:clockSettings');
      return saved ? JSON.parse(saved) : { hour12: false, showSeconds: false, showWeekday: false, showDate: false, dateStyle: 'long' };
    } catch {
      return { hour12: false, showSeconds: false, showWeekday: false, showDate: false, dateStyle: 'long' };
    }
  });

  const [appearanceSettings, setAppearanceSettings] = useState(() => {
    // Always start with defaults, will be updated when server settings load
    const defaultWallpaper: any = { selectedWallpaper: 'default', wallpaperStyle: 'fill' };
    const defaultFont: any = { selectedFont: 'system', fontSize: 16, fontColor: '#ffffff' };
    
    return {
      home: {
        wallpaper: defaultWallpaper,
        font: defaultFont,
      },
      focus: {
        wallpaper: defaultWallpaper,
        font: defaultFont,
      },
      ambient: {
        wallpaper: defaultWallpaper,
        font: defaultFont,
      },
    };
  });

  // Sync appearance settings with server state
  useEffect(() => {
    const serverAppearanceSettings = userStore.state.userPomodoroSetting?.appearanceSettings;
    
    if (serverAppearanceSettings) {
      const defaultWallpaper: any = { selectedWallpaper: 'default', wallpaperStyle: 'fill' };
      const defaultFont: any = { selectedFont: 'system', fontSize: 16, fontColor: '#ffffff' };

      setAppearanceSettings({
        home: {
          wallpaper: {
            selectedWallpaper: serverAppearanceSettings.home?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: serverAppearanceSettings.home?.wallpaper?.wallpaperStyle || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverAppearanceSettings.home?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverAppearanceSettings.home?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverAppearanceSettings.home?.font?.fontColor || defaultFont.fontColor,
          },
        },
        focus: {
          wallpaper: {
            selectedWallpaper: serverAppearanceSettings.focus?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: serverAppearanceSettings.focus?.wallpaper?.wallpaperStyle || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverAppearanceSettings.focus?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverAppearanceSettings.focus?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverAppearanceSettings.focus?.font?.fontColor || defaultFont.fontColor,
          },
        },
        ambient: {
          wallpaper: {
            selectedWallpaper: serverAppearanceSettings.ambient?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: serverAppearanceSettings.ambient?.wallpaper?.wallpaperStyle || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverAppearanceSettings.ambient?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverAppearanceSettings.ambient?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverAppearanceSettings.ambient?.font?.fontColor || defaultFont.fontColor,
          },
        },
      });
    }
  }, [userStore.state.userPomodoroSetting?.appearanceSettings]);

  const wallpapers = [
    // Static wallpapers
    { id: 'default', type: 'image', src: '/pomodoro/wallpapers/default.jpg', tags: ['nature'], category: 'static' },
    { id: 'space', type: 'image', src: '/pomodoro/wallpapers/space.jpg', tags: ['space'], category: 'static' },
    { id: 'nature', type: 'image', src: '/pomodoro/wallpapers/nature.jpeg', tags: ['nature'], category: 'static' },
    { id: 'forest', type: 'image', src: '/pomodoro/wallpapers/forest.jpg', tags: ['nature', 'forest'], category: 'static' },
    { id: 'mountain', type: 'image', src: '/pomodoro/wallpapers/mountain.jpg', tags: ['nature', 'mountain'], category: 'static' },
    { id: 'ocean', type: 'image', src: '/pomodoro/wallpapers/ocean.jpg', tags: ['nature', 'ocean'], category: 'static' },
    { id: 'city', type: 'image', src: '/pomodoro/wallpapers/city.jpg', tags: ['urban', 'city'], category: 'static' },
    { id: 'minimalist', type: 'image', src: '/pomodoro/wallpapers/minimalist.jpg', tags: ['minimalist'], category: 'static' },
    // Animated wallpapers
    { id: 'rainy', type: 'video' as const, src: '/pomodoro/wallpapers/rain-desktop.mp4', tags: ['nature', 'live'], category: 'animated' as const },
    { id: 'meteor', type: 'video' as const, src: '/pomodoro/wallpapers/meteor.mp4', tags: ['nature', 'live'], category: 'animated' as const },
    { id: 'evening', type: 'video' as const, src: '/pomodoro/wallpapers/evening.mp4', tags: ['nature', 'live'], category: 'animated' as const },
    { id: 'cloudy', type: 'video' as const, src: '/pomodoro/wallpapers/cloudy.mp4', tags: ['nature', 'live'], category: 'animated' as const },
    { id: 'ocean-waves', type: 'video' as const, src: '/pomodoro/wallpapers/ocean-waves.mp4', tags: ['nature', 'ocean', 'live'], category: 'animated' as const },
  ];

  const fonts = [
    { id: 'system', label: 'System (default)', css: '' },
    { id: 'roboto', label: 'Roboto', css: "'Roboto', sans-serif" },
    { id: 'inter', label: 'Inter', css: "'Inter', sans-serif" },
    { id: 'playfair', label: 'Playfair Display', css: "'Playfair Display', serif" },
    { id: 'lato', label: 'Lato', css: "'Lato', sans-serif" },
    { id: 'montserrat', label: 'Montserrat', css: "'Montserrat', sans-serif" },
    { id: 'opensans', label: 'Open Sans', css: "'Open Sans', sans-serif" },
    { id: 'raleway', label: 'Raleway', css: "'Raleway', sans-serif" },
    { id: 'nunito', label: 'Nunito', css: "'Nunito', sans-serif" },
    { id: 'poppins', label: 'Poppins', css: "'Poppins', sans-serif" },
  ];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load pomodoro settings on mount
  useEffect(() => {
    const loadPomodoroSettings = async () => {
      try {
        await userStore.getUserPomodoroSetting();
      } catch (error) {
        console.error('Failed to load pomodoro settings:', error);
      }
    };

    if (userStore.state.currentUser && !userStore.state.userPomodoroSetting) {
      loadPomodoroSettings();
    }
  }, [userStore.state.currentUser, userStore.state.userPomodoroSetting]);

  // Close PiP when switching away from focus mode
  useEffect(() => {
    if (isPipActive && mode !== 'focus') {
      setIsPipActive(false);
    }
  }, [mode, isPipActive]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement && document.fullscreenElement === innerRef.current));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // The font selected by the user is applied only to the Pomodoro page
  // via inline `fontFamily` on the root container to avoid changing
  // the global application font.
  const fontCss = (() => {
    const f = fonts.find(x => x.id === appearanceSettings[mode].font.selectedFont);
    return f ? f.css : '';
  })();

  const wallpaper = wallpapers.find(w => w.id === appearanceSettings[mode].wallpaper.selectedWallpaper) ?? wallpapers[0];

  // persist clock settings
  useEffect(() => {
    try { localStorage.setItem('pomodoro:clockSettings', JSON.stringify(clockSettings)); } catch (e) { /* ignore */ }
  }, [clockSettings]);

  async function toggleFullscreen() {
    if (!innerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await innerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <section className="@container w-full min-h-full flex flex-col justify-start items-center">
      <div className={`pomodoro-root pomodoro-style-${appearanceSettings[mode].wallpaper.wallpaperStyle} w-full`} style={{ 
        fontFamily: fontCss,
        fontSize: `${appearanceSettings[mode].font.fontSize}px`,
        color: appearanceSettings[mode].font.fontColor,
        '--clock-font-size': `${appearanceSettings[mode].font.fontSize * 0.375}rem`,
        '--timer-font-size': `${appearanceSettings[mode].font.fontSize * 0.45}rem` // Scale timer proportionally: 16px base = 7.2rem timer (16 * 0.45 = 7.2)
      } as React.CSSProperties}>
        <div className="pomodoro-inner" ref={innerRef}>
          <div className="pomodoro-header">
            {/* Add LocuZ logo here */}
          </div>

          <div className="pomodoro-background">
            {wallpaper.type === 'video' ? (
              <video className="pomodoro-bg-video" src={wallpaper.src} autoPlay loop muted playsInline />
            ) : (
              <img className="pomodoro-bg-image" src={wallpaper.src} alt="wallpaper" />
            )}
          </div>

          <div className="pomodoro-content">
        {mode === 'home' && (
          <div className="pomodoro-home">
            <div className="pomodoro-clock" aria-label="current-time">{formatTimeWithSettings(now, clockSettings)}</div>
            {clockSettings.showWeekday || clockSettings.showDate ? (
              <div className="pomodoro-date">{formatDateWithSettings(now, clockSettings)}</div>
            ) : null}
          </div>
        )}

        {mode === 'focus' && <FocusMode isPipActive={isPipActive} setIsPipActive={setIsPipActive} wallpaper={wallpaper} fontSettings={appearanceSettings[mode].font} />}
        {mode === 'ambient' && !isPipActive && <AmbientMode fontSettings={appearanceSettings[mode].font} />}
      </div>

          {/* bottom-right control cluster - moved inside pomodoro-inner so it appears in fullscreen */}
          <div className="control-cluster" role="group" aria-label="Pomodoro controls">
            <div className="segmented-toggle" role="radiogroup" aria-label="Mode">
              <button className={`seg-item ${mode === 'focus' ? 'active' : ''}`} role="radio" aria-checked={mode === 'focus'} onClick={() => setMode('focus')}><Aperture size={20} /></button>
              <button className={`seg-item ${mode === 'home' ? 'active' : ''}`} role="radio" aria-checked={mode === 'home'} onClick={() => setMode('home')}><House size={20} /></button>
              <button className={`seg-item ${mode === 'ambient' ? 'active' : ''}`} role="radio" aria-checked={mode === 'ambient'} onClick={() => setMode('ambient')}><Sun size={20} /></button>
            </div>

            <button className="control-btn fullscreen" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={20} />}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
});

function formatTimeWithSettings(d: Date, settings: any) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: Boolean(settings?.hour12),
  };
  if (settings?.showSeconds) opts.second = '2-digit';
  return d.toLocaleTimeString(undefined, opts);
}

function formatDateWithSettings(d: Date, settings: any) {
  const parts: string[] = [];
  if (settings?.showWeekday) {
    parts.push(d.toLocaleDateString(undefined, { weekday: 'long' }));
  }

  if (settings?.showDate) {
    const style = settings?.dateStyle || 'long';
    if (style === 'numeric') {
      parts.push(d.toLocaleDateString());
    } else if (style === 'short') {
      parts.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    } else {
      parts.push(d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }));
    }
  }

  return parts.join(' • ');
}

function FocusMode({ isPipActive, setIsPipActive, wallpaper, fontSettings }: { isPipActive: boolean; setIsPipActive: (active: boolean) => void; wallpaper: any; fontSettings: any }) {
  type TimerMode = 'focus' | 'short-break' | 'long-break';
  
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0); // Track completed focus sessions
  
  // Get current preset
  const getCurrentPreset = (): TimerPreset | null => {
    try {
      const raw = localStorage.getItem('pomodoro:timerSettings');
      if (raw) {
        const settings = JSON.parse(raw);
        const preset = settings.presets?.find((p: TimerPreset) => p.id === settings.selectedPreset);
        return preset || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  // Get timer duration based on mode and current preset
  const getTimerDuration = (mode: TimerMode): number => {
    const preset = getCurrentPreset();
    if (!preset) {
      // Fallback to classic pomodoro
      switch (mode) {
        case 'focus': return 25 * 60;
        case 'short-break': return 5 * 60;
        case 'long-break': return 15 * 60;
        default: return 25 * 60;
      }
    }

    switch (mode) {
      case 'focus':
        return preset.focusDuration * 60;
      case 'short-break':
        return preset.shortBreakDuration * 60;
      case 'long-break':
        return preset.longBreakDuration * 60;
      default:
        return preset.focusDuration * 60;
    }
  };

  const [secondsLeft, setSecondsLeft] = useState(() => getTimerDuration('focus'));
  const ref = useRef<number | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  // Handle automatic mode switching when timer completes
  const handleTimerComplete = () => {
    const preset = getCurrentPreset();
    if (!preset) return;

    if (timerMode === 'focus') {
      // Focus completed
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Determine break type
      const isLongBreak = newCompletedSessions % preset.longBreakInterval === 0;
      const breakMode: TimerMode = isLongBreak ? 'long-break' : 'short-break';
      
      setTimerMode(breakMode);
      setSecondsLeft(getTimerDuration(breakMode));
      
      if (preset.autoStartBreaks) {
        setRunning(true); // Auto-start break
      } else {
        setRunning(false);
      }
    } else {
      // Break completed, start focus
      setTimerMode('focus');
      setSecondsLeft(getTimerDuration('focus'));
      
      if (preset.autoStartFocus) {
        setRunning(true); // Auto-start focus
      } else {
        setRunning(false);
      }
    }
  };

  useEffect(() => {
    if (running) {
      ref.current = window.setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            // Timer finished
            setRunning(false);
            // Always use preset's auto-start behavior
            handleTimerComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (ref.current) { clearInterval(ref.current); ref.current = null; }
    };
  }, [running]);

  // Update PiP window when timer state changes
  useEffect(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      try {
        pipWindowRef.current.postMessage({
          type: 'pip-update',
          seconds: secondsLeft,
          running: running,
          mode: timerMode
        }, '*');
      } catch (e) {
        // PiP window might be closed
        setIsPipActive(false);
        pipWindowRef.current = null;
      }
    } else if (pipWindowRef.current && pipWindowRef.current.closed && isPipActive) {
      // PIP window was closed externally, update state
      setIsPipActive(false);
      pipWindowRef.current = null;
    }
  }, [secondsLeft, running, timerMode, isPipActive]);

  // Periodic check for PIP window closure as fallback
  useEffect(() => {
    if (!isPipActive) return;

    const checkInterval = setInterval(() => {
      if (pipWindowRef.current && pipWindowRef.current.closed) {
        console.log('PIP window detected as closed via periodic check');
        setIsPipActive(false);
        pipWindowRef.current = null;
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isPipActive]);

  // Listen for messages from PIP window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'pip-control') {
        console.log('Received PIP control message:', event.data.action);
        switch (event.data.action) {
          case 'start':
            console.log('Starting timer from PIP');
            start();
            break;
          case 'stop':
            console.log('Stopping timer from PIP');
            stop();
            break;
          case 'reset':
            console.log('Resetting timer from PIP');
            reset();
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function start() { 
    console.log('start() called, setting running to true');
    setRunning(true); 
  }
  function stop() { 
    console.log('stop() called, setting running to false');
    setRunning(false); 
  }
  function reset() {
    setRunning(false);
    setSecondsLeft(getTimerDuration(timerMode));
  }

  function skip() {
    setRunning(false);
    // Skip advances to next timer based on preset behavior
    handleTimerComplete();
  }

  function switchMode(newMode: TimerMode) {
    setRunning(false);
    setTimerMode(newMode);
    setSecondsLeft(getTimerDuration(newMode));
    // Reset completed sessions when manually switching modes
    if (newMode === 'focus') {
      setCompletedSessions(0);
    }
  }

  async function togglePip() {
    if (isPipActive && pipWindowRef.current) {
      // Close existing PiP window
      try {
        pipWindowRef.current.close();
      } catch (e) {
        // Window might already be closed
      }
      setIsPipActive(false);
      pipWindowRef.current = null;
      return;
    }

    // Check if PiP is supported
    if (!('documentPictureInPicture' in window)) {
      alert('Picture-in-Picture is not supported in this browser.');
      return;
    }

    try {
      // Create PiP window using the new API
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 400,
        height: 250,
        disallowReturnToOpener: false,
      });

      pipWindowRef.current = pipWindow;
      setIsPipActive(true);

      // Handle PiP window close
      pipWindow.addEventListener('pagehide', () => {
        setIsPipActive(false);
        pipWindowRef.current = null;
      });

      // Also listen for unload as fallback
      pipWindow.addEventListener('unload', () => {
        setIsPipActive(false);
        pipWindowRef.current = null;
      });

      // Update PiP window content
      updatePipWindow(pipWindow, wallpaper, fontSettings);

    } catch (error) {
      console.error('Failed to enter Picture-in-Picture mode:', error);
      alert('Failed to enter Picture-in-Picture mode. Please try again.');
    }
  }

  function updatePipWindow(pipWindow: Window, wallpaper: any, fontSettings: any) {
    if (!pipWindow || pipWindow.closed) return;

    // Get the selected font CSS
    const fonts = [
      { id: 'system', label: 'System (default)', css: '' },
      { id: 'roboto', label: 'Roboto', css: "'Roboto', sans-serif" },
      { id: 'inter', label: 'Inter', css: "'Inter', sans-serif" },
      { id: 'playfair', label: 'Playfair Display', css: "'Playfair Display', serif" },
      { id: 'lato', label: 'Lato', css: "'Lato', sans-serif" },
      { id: 'montserrat', label: 'Montserrat', css: "'Montserrat', sans-serif" },
      { id: 'opensans', label: 'Open Sans', css: "'Open Sans', sans-serif" },
      { id: 'raleway', label: 'Raleway', css: "'Raleway', sans-serif" },
      { id: 'nunito', label: 'Nunito', css: "'Nunito', sans-serif" },
      { id: 'poppins', label: 'Poppins', css: "'Poppins', sans-serif" },
    ];
    const selectedFont = fonts.find(f => f.id === fontSettings.selectedFont);
    const fontCss = selectedFont ? selectedFont.css : '';

    // Calculate initial duration for reset state detection
    const initialDuration = getTimerDuration(timerMode);
    const isResetState = !running && secondsLeft === initialDuration;

    try {
      // Create or update the PiP window content
      const pipContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pomodoro Focus Timer</title>
          <style>
        body {
          margin: 0;
          padding: 20px;
          background: ${wallpaper.type === 'video' ? 
            `url('${wallpaper.src}') center/cover no-repeat` : 
            `url('${wallpaper.src}') center/cover no-repeat`};
          color: ${fontSettings.fontColor || '#ffffff'};
          font-family: ${fontCss || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          box-sizing: border-box;
          position: relative;
        }
        body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: -1;
        }
        .timer {
          font-size: 78px;
          font-weight: bold;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .controls {
          display: flex;
          gap: 10px;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        button:hover {
          background: rgba(255,255,255,0.3);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pip-button {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mode-label {
          font-size: 14px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 10px;
          text-align: center;
        }
          </style>
        </head>
        <body>
          <div class="timer" id="timer">${formatTimer(secondsLeft)}</div>
          <div class="controls">
        ${!running ? '<button id="start">Start</button>' : ''}
        ${running ? '<button id="stop">Stop</button>' : ''}
        ${!running && !isResetState ? '<button id="reset">Reset</button>' : ''}
        <button id="skip">Skip</button>
          </div>
          <script>
        let currentSeconds = ${secondsLeft};
        let isRunning = ${running};
        let intervalId = null;

        function updateTimer() {
          const timerEl = document.getElementById('timer');
          const startBtn = document.getElementById('start');
          const stopBtn = document.getElementById('stop');
          const resetBtn = document.getElementById('reset');
          const controlsEl = document.querySelector('.controls');
          
          if (timerEl) timerEl.textContent = formatTimer(currentSeconds);
          
          // Update button visibility based on state
          if (controlsEl) {
            const isResetState = !isRunning && currentSeconds === ${initialDuration};
            controlsEl.innerHTML = 
          (!isRunning ? '<button id="start">Start</button>' : '') +
          (isRunning ? '<button id="stop">Stop</button>' : '') +
          (!isRunning && !isResetState ? '<button id="reset">Reset</button>' : '');
            
            // Re-attach event listeners
            attachEventListeners();
          }
        }

        function formatTimer(secs) {
          const mm = Math.floor(secs / 60).toString().padStart(2, '0');
          const ss = (secs % 60).toString().padStart(2, '0');
          return \`\${mm}:\${ss}\`;
        }

        function startTimer() {
          if (isRunning) return;
          isRunning = true;
          intervalId = setInterval(() => {
            currentSeconds = Math.max(0, currentSeconds - 1);
            updateTimer();
            if (currentSeconds === 0) {
          stopTimer();
            }
          }, 1000);
          updateTimer();
        }

        function stopTimer() {
          isRunning = false;
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          updateTimer();
        }

        function resetTimer() {
          stopTimer();
          currentSeconds = ${initialDuration};
          updateTimer();
        }

        function attachEventListeners() {
          document.getElementById('start')?.addEventListener('click', () => {
            startTimer();
            window.parent.postMessage({ type: 'pip-control', action: 'start' }, '*');
          });
          document.getElementById('stop')?.addEventListener('click', () => {
            stopTimer();
            window.parent.postMessage({ type: 'pip-control', action: 'stop' }, '*');
          });
          document.getElementById('reset')?.addEventListener('click', () => {
            resetTimer();
            window.parent.postMessage({ type: 'pip-control', action: 'reset' }, '*');
          });
        }

        // Initial event listeners
        attachEventListeners();

        // Listen for updates from parent window
        window.addEventListener('message', (event) => {
          if (event.data.type === 'pip-update') {
            currentSeconds = event.data.seconds;
            isRunning = event.data.running;
            if (isRunning && !intervalId) {
          startTimer();
            } else if (!isRunning && intervalId) {
          stopTimer();
            }
            updateTimer();
          }
        });

        // Initial update
        updateTimer();
          </script>
        </body>
        </html>
      `;

      // Write content to PiP window
      pipWindow.document.open();
      pipWindow.document.write(pipContent);
      pipWindow.document.close();

    } catch (error) {
      console.error('Failed to update PiP window:', error);
    }
  }

  return (
    <div className={`pomodoro-mode focus-mode ${running ? 'running' : ''}`} style={{ color: fontSettings.fontColor }}>
      <div className="timer-display" style={{ display: isPipActive ? 'none' : 'block' }}>
        <AnimatedTimer seconds={secondsLeft} />
      </div>
      <div className="timer-controls" style={{ display: isPipActive ? 'none' : 'flex' }}>
        <button onClick={start} disabled={running}>Start</button>
        <button onClick={stop} disabled={!running}>Stop</button>
        <button onClick={reset}>Reset</button>
        {('documentPictureInPicture' in window) && (
          <button onClick={togglePip} className={`pip-button ${isPipActive ? 'active' : ''}`} title={isPipActive ? 'Exit Picture-in-Picture' : 'Open Picture-in-Picture'}>
            <PictureInPicture size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function AmbientMode({ fontSettings }: { fontSettings: any }) {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    try {
      const raw = localStorage.getItem('pomodoro:timerSettings');
      return raw ? JSON.parse(raw).ambientDuration * 60 : 5 * 60;
    } catch (e) {
      return 5 * 60;
    }
  });
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = window.setInterval(() => {
        setSecondsLeft(s => Math.max(0, s - 1));
      }, 1000);
    }
    return () => { if (ref.current) { clearInterval(ref.current); ref.current = null; } };
  }, [running]);

  function start() { setRunning(true); }
  function stop() { setRunning(false); }
  function reset() {
    try {
      const raw = localStorage.getItem('pomodoro:timerSettings');
      const duration = raw ? JSON.parse(raw).ambientDuration * 60 : 5 * 60;
      setRunning(false);
      setSecondsLeft(duration);
    } catch (e) {
      setRunning(false);
      setSecondsLeft(5 * 60);
    }
  }

  return (
    <div className={`pomodoro-mode ambient-mode ${running ? 'running' : ''}`} style={{ color: fontSettings.fontColor }}>
      <div className="timer-display ambient">
        <AnimatedTimer seconds={secondsLeft} />
      </div>
      <div className="timer-controls">
        <button onClick={start} disabled={running}>Start</button>
        <button onClick={stop} disabled={!running}>Stop</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

function formatTimer(seconds: number) {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function AnimatedTimer({ seconds }: { seconds: number }) {
  const prevTimeRef = useRef<string>('');
  const [animatingDigits, setAnimatingDigits] = useState<Set<number>>(new Set());
  
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  const currentTime = `${mm}:${ss}`;
  
  useEffect(() => {
    if (prevTimeRef.current && prevTimeRef.current !== currentTime) {
      const prev = prevTimeRef.current;
      const changes = new Set<number>();
      
      // Check each position for changes
      for (let i = 0; i < currentTime.length; i++) {
        if (i !== 2 && currentTime[i] !== prev[i]) { // Skip the colon
          changes.add(i);
        }
      }
      
      // Only animate the most significant changing digit(s)
      let finalChanges = new Set<number>();
      
      if (changes.has(4)) {
        // Seconds units digit changed - animate only this most common case
        finalChanges.add(4);
      } else if (changes.has(3)) {
        // Seconds tens digit changed (59->00) - animate both seconds digits
        finalChanges.add(3);
        finalChanges.add(4);
      } else if (changes.has(1) || changes.has(0)) {
        // Minutes changed - animate minute digits
        if (changes.has(0)) finalChanges.add(0);
        if (changes.has(1)) finalChanges.add(1);
      }
      
      setAnimatingDigits(finalChanges);
      
      // Remove animation after it completes
      const timer = setTimeout(() => setAnimatingDigits(new Set()), 600);
      return () => clearTimeout(timer);
    }
    
    prevTimeRef.current = currentTime;
  }, [currentTime]);
  
  const getDigitClass = (index: number) => {
    return animatingDigits.has(index) ? 'timer-digit timer-digit-change' : 'timer-digit';
  };
  
  return (
    <div className="timer-digits">
      <span className={getDigitClass(0)}>{mm[0]}</span>
      <span className={getDigitClass(1)}>{mm[1]}</span>
      <span className="timer-separator">:</span>
      <span className={getDigitClass(3)}>{ss[0]}</span>
      <span className={getDigitClass(4)}>{ss[1]}</span>
    </div>
  );
}


