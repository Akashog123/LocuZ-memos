import { observer } from "mobx-react-lite";
import { useEffect, useState, useRef } from "react";
import { isEqual } from "lodash-es";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/utils/i18n";
import { userStore } from "@/store";
import { UserSetting_PomodoroSetting, UserSetting_TimerPreset, UserSetting_AppearanceSettings } from "@/types/proto/api/v1/user_service";

type ClockSettings = {
  hour12: boolean;
  showSeconds: boolean;
  showWeekday: boolean;
  showDate: boolean;
  dateStyle: 'long' | 'short' | 'numeric';
};

type WallpaperSettings = {
  selectedWallpaper: string;
  wallpaperStyle: 'fill' | 'center' | 'stretch' | 'tile';
};

type FontSettings = {
  selectedFont: string;
  fontSize: number;
  fontColor: string;
};

type AppearanceSettings = {
  home: {
    wallpaper: WallpaperSettings;
    font: FontSettings;
  };
  focus: {
    wallpaper: WallpaperSettings;
    font: FontSettings;
  };
  ambient: {
    wallpaper: WallpaperSettings;
    font: FontSettings;
  };
};

type TimerSettings = {
  focusDuration: number; // in minutes
  ambientDuration: number; // in minutes
  selectedPreset: string; // ID of selected preset
  presets: UserSetting_TimerPreset[]; // Array of available presets
};

// Default timer presets
const getDefaultPresets = (): UserSetting_TimerPreset[] => [
  {
    id: 'pomodoro-classic',
    name: 'Classic Pomodoro',
    description: '25 minutes focus, 5 minutes break, 15 minutes long break',
    type: 'pomodoro',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartFocus: true,
    isDefault: true,
  },
  {
    id: 'pomodoro-short',
    name: 'Short Pomodoro',
    description: '15 minutes focus, 3 minutes break, 10 minutes long break',
    type: 'pomodoro',
    focusDuration: 15,
    shortBreakDuration: 3,
    longBreakDuration: 10,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartFocus: true,
    isDefault: true,
  },
  {
    id: '52-17-rule',
    name: '52/17 Rule',
    description: '52 minutes focus, 17 minutes break',
    type: 'pomodoro',
    focusDuration: 52,
    shortBreakDuration: 17,
    longBreakDuration: 17,
    longBreakInterval: 1,
    autoStartBreaks: true,
    autoStartFocus: true,
    isDefault: true,
  },
  {
    id: 'animedoro',
    name: 'Animedoro',
    description: 'Perfect for anime watching: 90 minutes focus, 15 minutes break',
    type: 'pomodoro',
    focusDuration: 90,
    shortBreakDuration: 15,
    longBreakDuration: 30,
    longBreakInterval: 2,
    autoStartBreaks: true,
    autoStartFocus: true,
    isDefault: true,
  },
  {
    id: 'stopwatch',
    name: 'Stopwatch',
    description: 'Count up timer for flexible timing',
    type: 'stopwatch',
    focusDuration: 0,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    isDefault: true,
  },
  {
    id: 'countdown-60',
    name: 'Countdown 60',
    description: '60 minutes countdown timer',
    type: 'countdown',
    focusDuration: 60,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 1,
    autoStartBreaks: false,
    autoStartFocus: false,
    isDefault: true,
  },
  {
    id: 'countdown-30',
    name: 'Countdown 30',
    description: '30 minutes countdown timer',
    type: 'countdown',
    focusDuration: 30,
    shortBreakDuration: 5,
    longBreakDuration: 10,
    longBreakInterval: 1,
    autoStartBreaks: false,
    autoStartFocus: false,
    isDefault: true,
  },
];

type Wallpaper = {
  id: string;
  type: 'image' | 'video';
  src: string;
  tags: string[];
  category: 'static' | 'animated';
};

function WallpaperPreview({ wallpaper, isSelected, onSelect }: {
  wallpaper: Wallpaper;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      {wallpaper.type === 'video' ? (
        <video
          src={wallpaper.src}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => e.currentTarget.pause()}
        />
      ) : (
        <img
          src={wallpaper.src}
          alt={wallpaper.id}
          className="w-full h-full object-cover"
        />
      )}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-white text-xs font-medium">
          {wallpaper.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
      </div>
    </div>
  );
}

const PomodoroSection = observer(() => {
  const t = useTranslate();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPreset, setEditingPreset] = useState<UserSetting_TimerPreset | null>(null);
  const [selectKey, setSelectKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [localSelectedPreset, setLocalSelectedPreset] = useState<string>('pomodoro-classic');
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Load pomodoro settings from server on mount
  useEffect(() => {
    const loadPomodoroSettings = async () => {
      try {
        await userStore.getUserPomodoroSetting();
      } catch (error) {
        console.error('Failed to load pomodoro settings:', error);
        // Fallback to localStorage if server fails
        try {
          const raw = localStorage.getItem('pomodoro:timerSettings');
          if (raw) {
            const parsed = JSON.parse(raw);
            // Set the userPomodoroSetting in the store from localStorage
            userStore.state.setPartial({
              userPomodoroSetting: {
                selectedPreset: parsed.selectedPreset || 'pomodoro-classic',
                presets: parsed.presets || getDefaultPresets(),
              },
            });
          } else {
            // Use default settings if no localStorage data
            userStore.state.setPartial({
              userPomodoroSetting: {
                selectedPreset: 'pomodoro-classic',
                presets: getDefaultPresets(),
              },
            });
          }
        } catch (localStorageError) {
          console.error('Failed to load from localStorage:', localStorageError);
          // Use default settings as final fallback
          userStore.state.setPartial({
            userPomodoroSetting: {
              selectedPreset: 'pomodoro-classic',
              presets: getDefaultPresets(),
            },
          });
        }
      }
    };

    if (userStore.state.currentUser) {
      loadPomodoroSettings();
    }
  }, [userStore.state.currentUser]);

  // Clock settings
  const [clockSettings, setClockSettings] = useState<ClockSettings>(() => {
    try {
      const raw = localStorage.getItem('pomodoro:clockSettings');
      return raw ? JSON.parse(raw) : {
        hour12: true,
        showSeconds: true,
        showWeekday: true,
        showDate: true,
        dateStyle: 'long' as const,
      };
    } catch (e) {
      return {
        hour12: true,
        showSeconds: true,
        showWeekday: true,
        showDate: true,
        dateStyle: 'long' as const,
      };
    }
  });

  // Appearance settings (per mode) - loaded from server
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(() => {
    const defaultWallpaper: WallpaperSettings = {
      selectedWallpaper: 'default',
      wallpaperStyle: 'fill' as const,
    };
    const defaultFont: FontSettings = {
      selectedFont: 'system',
      fontSize: 16,
      fontColor: '#ffffff',
    };

    // Load from server settings
    const serverSettings = userStore.state.userPomodoroSetting?.appearanceSettings;
    if (serverSettings) {
      return {
        home: {
          wallpaper: {
            selectedWallpaper: serverSettings.home?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: (serverSettings.home?.wallpaper?.wallpaperStyle as WallpaperSettings['wallpaperStyle']) || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverSettings.home?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverSettings.home?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverSettings.home?.font?.fontColor || defaultFont.fontColor,
          },
        },
        focus: {
          wallpaper: {
            selectedWallpaper: serverSettings.focus?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: (serverSettings.focus?.wallpaper?.wallpaperStyle as WallpaperSettings['wallpaperStyle']) || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverSettings.focus?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverSettings.focus?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverSettings.focus?.font?.fontColor || defaultFont.fontColor,
          },
        },
        ambient: {
          wallpaper: {
            selectedWallpaper: serverSettings.ambient?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: (serverSettings.ambient?.wallpaper?.wallpaperStyle as WallpaperSettings['wallpaperStyle']) || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverSettings.ambient?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverSettings.ambient?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverSettings.ambient?.font?.fontColor || defaultFont.fontColor,
          },
        },
      };
    }

    // Fallback to localStorage for migration
    try {
      const raw = localStorage.getItem('pomodoro:appearanceSettings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          home: {
            wallpaper: parsed.home?.wallpaper || defaultWallpaper,
            font: parsed.home?.font || defaultFont,
          },
          focus: {
            wallpaper: parsed.focus?.wallpaper || defaultWallpaper,
            font: parsed.focus?.font || defaultFont,
          },
          ambient: {
            wallpaper: parsed.ambient?.wallpaper || defaultWallpaper,
            font: parsed.ambient?.font || defaultFont,
          },
        };
      }
    } catch (e) {
      // ignore
    }

    // Try to migrate from old settings
    try {
      const oldWallpaper = localStorage.getItem('pomodoro:wallpaperSettings');
      const oldFont = localStorage.getItem('pomodoro:fontSettings');
      
      if (oldWallpaper || oldFont) {
        const wallpaperData = oldWallpaper ? JSON.parse(oldWallpaper) : defaultWallpaper;
        const fontData = oldFont ? JSON.parse(oldFont) : defaultFont;
        
        const migratedSettings = {
          home: {
            wallpaper: wallpaperData,
            font: fontData,
          },
          focus: {
            wallpaper: wallpaperData,
            font: fontData,
          },
          ambient: {
            wallpaper: wallpaperData,
            font: fontData,
          },
        };
        
        return migratedSettings;
      }
    } catch (e) {
      // ignore migration errors
    }

    // Default settings
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

  // Flag to prevent saving when syncing from server
  const [isSyncingFromServer, setIsSyncingFromServer] = useState(false);

  // Track original appearance settings for comparison
  const [originalAppearanceSettings, setOriginalAppearanceSettings] = useState<AppearanceSettings | null>(null);

  // Current appearance tab (mode being edited)
  const [appearanceTab, setAppearanceTab] = useState<'home' | 'focus' | 'ambient'>('home');

  // Get timer settings from user store or fallback to defaults
  const timerSettings: TimerSettings = (() => {
    const serverSettings = userStore.state.userPomodoroSetting;
    if (serverSettings) {
      // Find the selected preset
      const selectedPresetData = serverSettings.presets.find(p => p.id === serverSettings.selectedPreset) || getDefaultPresets().find(p => p.id === 'pomodoro-classic');
      const result = {
        focusDuration: selectedPresetData?.focusDuration || 25,
        ambientDuration: selectedPresetData?.shortBreakDuration || 5,
        selectedPreset: serverSettings.selectedPreset,
        presets: serverSettings.presets,
      };
      return result;
    }

    // Fallback to localStorage or defaults
    try {
      const raw = localStorage.getItem('pomodoro:timerSettings');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure presets exist, merge with defaults if needed
        if (!parsed.presets) {
          parsed.presets = getDefaultPresets();
        } else {
          // Merge existing presets with defaults, keeping user customizations
          const defaultPresets = getDefaultPresets();
          const mergedPresets = defaultPresets.map(defaultPreset => {
            const existing = parsed.presets.find((p: UserSetting_TimerPreset) => p.id === defaultPreset.id);
            return existing || defaultPreset;
          });
          // Add any new default presets that don't exist
          parsed.presets.forEach((preset: UserSetting_TimerPreset) => {
            if (!mergedPresets.find(p => p.id === preset.id)) {
              mergedPresets.push(preset);
            }
          });
          parsed.presets = mergedPresets;
        }
        // Ensure selectedPreset exists
        if (!parsed.selectedPreset) {
          parsed.selectedPreset = 'pomodoro-classic';
        }
        // Calculate durations from selected preset
        const selectedPresetData = parsed.presets.find((p: UserSetting_TimerPreset) => p.id === parsed.selectedPreset) || getDefaultPresets().find(p => p.id === 'pomodoro-classic');
        parsed.focusDuration = selectedPresetData?.focusDuration || 25;
        parsed.ambientDuration = selectedPresetData?.shortBreakDuration || 5;
        return parsed;
      }
    } catch (e) {
      // ignore
    }
    return {
      focusDuration: 25,
      ambientDuration: 5,
      selectedPreset: 'pomodoro-classic',
      presets: getDefaultPresets(),
    };
  })();

  // Force re-render when selectedPreset changes and sync local state
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
    if (timerSettings.selectedPreset) {
      setLocalSelectedPreset(timerSettings.selectedPreset);
    }
  }, [timerSettings.selectedPreset]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('pomodoro:clockSettings', JSON.stringify(clockSettings));
    } catch (e) { /* ignore */ }
  }, [clockSettings]);

  // Sync appearance settings state when server settings change
  useEffect(() => {
    const serverAppearanceSettings = userStore.state.userPomodoroSetting?.appearanceSettings;
    if (serverAppearanceSettings) {
      setIsSyncingFromServer(true);
      const defaultWallpaper: WallpaperSettings = {
        selectedWallpaper: 'default',
        wallpaperStyle: 'fill' as const,
      };
      const defaultFont: FontSettings = {
        selectedFont: 'system',
        fontSize: 16,
        fontColor: '#ffffff',
      };

      const syncedSettings = {
        home: {
          wallpaper: {
            selectedWallpaper: serverAppearanceSettings.home?.wallpaper?.selectedWallpaper || defaultWallpaper.selectedWallpaper,
            wallpaperStyle: (serverAppearanceSettings.home?.wallpaper?.wallpaperStyle as WallpaperSettings['wallpaperStyle']) || defaultWallpaper.wallpaperStyle,
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
            wallpaperStyle: (serverAppearanceSettings.focus?.wallpaper?.wallpaperStyle as WallpaperSettings['wallpaperStyle']) || defaultWallpaper.wallpaperStyle,
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
            wallpaperStyle: (serverAppearanceSettings.ambient?.wallpaper?.wallpaperStyle as WallpaperSettings['wallpaperStyle']) || defaultWallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: serverAppearanceSettings.ambient?.font?.selectedFont || defaultFont.selectedFont,
            fontSize: serverAppearanceSettings.ambient?.font?.fontSize || defaultFont.fontSize,
            fontColor: serverAppearanceSettings.ambient?.font?.fontColor || defaultFont.fontColor,
          },
        },
      };

      setAppearanceSettings(syncedSettings);
      setOriginalAppearanceSettings(syncedSettings);

      // Reset the flag after state update using useEffect
      setTimeout(() => setIsSyncingFromServer(false), 0);
    }
  }, [userStore.state.userPomodoroSetting?.appearanceSettings]);

  const handleClockSettingChange = (key: keyof ClockSettings, value: any) => {
    setClockSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleWallpaperSettingChange = (key: keyof WallpaperSettings, value: any) => {
    setAppearanceSettings(prev => {
      const newSettings = {
        ...prev,
        [appearanceTab]: {
          ...prev[appearanceTab],
          wallpaper: {
            ...prev[appearanceTab].wallpaper,
            [key]: value
          }
        }
      };
      return newSettings;
    });
  };

  const handleFontSettingChange = (key: keyof FontSettings, value: any) => {
    setAppearanceSettings(prev => {
      const newSettings = {
        ...prev,
        [appearanceTab]: {
          ...prev[appearanceTab],
          font: {
            ...prev[appearanceTab].font,
            [key]: value
          }
        }
      };
      return newSettings;
    });
  };

  const handleSaveAppearanceSettings = async () => {
    try {
      const serverAppearanceSettings: UserSetting_AppearanceSettings = {
        home: {
          wallpaper: {
            selectedWallpaper: appearanceSettings.home.wallpaper.selectedWallpaper,
            wallpaperStyle: appearanceSettings.home.wallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: appearanceSettings.home.font.selectedFont,
            fontSize: appearanceSettings.home.font.fontSize,
            fontColor: appearanceSettings.home.font.fontColor,
          },
        },
        focus: {
          wallpaper: {
            selectedWallpaper: appearanceSettings.focus.wallpaper.selectedWallpaper,
            wallpaperStyle: appearanceSettings.focus.wallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: appearanceSettings.focus.font.selectedFont,
            fontSize: appearanceSettings.focus.font.fontSize,
            fontColor: appearanceSettings.focus.font.fontColor,
          },
        },
        ambient: {
          wallpaper: {
            selectedWallpaper: appearanceSettings.ambient.wallpaper.selectedWallpaper,
            wallpaperStyle: appearanceSettings.ambient.wallpaper.wallpaperStyle,
          },
          font: {
            selectedFont: appearanceSettings.ambient.font.selectedFont,
            fontSize: appearanceSettings.ambient.font.fontSize,
            fontColor: appearanceSettings.ambient.font.fontColor,
          },
        },
      };

      await userStore.updateUserPomodoroSetting(
        { appearanceSettings: serverAppearanceSettings },
        ['appearanceSettings']
      );

      // Update original settings to reflect the saved state
      setOriginalAppearanceSettings(appearanceSettings);
      toast.success(t("message.update-succeed"));
    } catch (error: any) {
      console.error('Failed to save appearance settings:', error);
      toast.error(error.details || 'Failed to save appearance settings');
    }
  };

  const handleTimerSettingChange = async (key: keyof TimerSettings, value: any) => {
    if (key === 'selectedPreset') {
      try {
        await handlePresetOperation('select', { newSelectedPreset: value });
      } catch (error) {
        // Error already handled in handlePresetOperation
      }
    } else if (key === 'focusDuration' || key === 'ambientDuration') {
      // Update the selected preset with new duration
      const currentPreset = timerSettings.presets.find(p => p.id === timerSettings.selectedPreset);
      if (currentPreset && !currentPreset.isDefault) {
        const updatedPreset = {
          ...currentPreset,
          [key === 'focusDuration' ? 'focusDuration' : 'shortBreakDuration']: value,
        };
        try {
          const updatedPresets = timerSettings.presets.map(p =>
            p.id === currentPreset.id ? updatedPreset : p
          );
          await userStore.updateUserPomodoroSetting(
            { presets: updatedPresets },
            ['presets']
          );
        } catch (error) {
          console.error('Failed to update preset duration:', error);
        }
      }
    }
    // For other keys, we might need different handling
  };

  // Unified function to handle all preset operations with proper backend sync
  const handlePresetOperation = async (
    operation: 'create' | 'delete' | 'select',
    presetData?: {
      preset?: UserSetting_TimerPreset;
      presetId?: string;
      newSelectedPreset?: string;
    }
  ) => {
    setIsOperationLoading(true);
    try {
      let updateData: Partial<UserSetting_PomodoroSetting> = {};
      let updateFields: string[] = [];

      switch (operation) {
        case 'create':
          if (!presetData?.preset) throw new Error('Preset data required for create operation');
          updateData = {
            selectedPreset: presetData.preset.id,
            presets: [...timerSettings.presets, presetData.preset],
          };
          updateFields = ['selectedPreset', 'presets'];
          // Update local state immediately
          setLocalSelectedPreset(presetData.preset.id);
          break;

        case 'delete':
          if (!presetData?.presetId || !presetData?.newSelectedPreset) {
            throw new Error('Preset ID and new selected preset required for delete operation');
          }
          updateData = {
            selectedPreset: presetData.newSelectedPreset,
            presets: timerSettings.presets.filter(p => p.id !== presetData.presetId),
          };
          updateFields = ['selectedPreset', 'presets'];
          // Update local state immediately
          setLocalSelectedPreset(presetData.newSelectedPreset);
          break;

        case 'select':
          if (!presetData?.newSelectedPreset) {
            throw new Error('New selected preset required for select operation');
          }
          updateData = {
            selectedPreset: presetData.newSelectedPreset,
            presets: timerSettings.presets,
          };
          updateFields = ['selectedPreset', 'presets'];
          // Update local state immediately
          setLocalSelectedPreset(presetData.newSelectedPreset);
          break;
      }

      await userStore.updateUserPomodoroSetting(updateData, updateFields);
      setSelectKey(prev => prev + 1);

    } catch (error) {
      console.error(`Failed to ${operation} preset:`, error);
      // Revert local state on error
      setLocalSelectedPreset(timerSettings.selectedPreset);
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsOperationLoading(false);
    }
  };

  const formatTimePreview = (settings: ClockSettings) => {
    const now = new Date();
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.hour12,
    };
    if (settings.showSeconds) opts.second = '2-digit';
    return now.toLocaleTimeString(undefined, opts);
  };

  const formatDatePreview = (settings: ClockSettings) => {
    const now = new Date();
    const parts: string[] = [];
    if (settings.showWeekday) {
      parts.push(now.toLocaleDateString(undefined, { weekday: 'long' }));
    }
    if (settings.showDate) {
      const style = settings.dateStyle;
      if (style === 'numeric') {
        parts.push(now.toLocaleDateString());
      } else if (style === 'short') {
        parts.push(now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      } else {
        parts.push(now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }));
      }
    }
    return parts.join(' • ');
  };

  const wallpapers: Wallpaper[] = [
    // Static wallpapers
    { id: 'default', type: 'image' as const, src: '/pomodoro/wallpapers/default.jpg', tags: ['nature'], category: 'static' as const },
    { id: 'space', type: 'image' as const, src: '/pomodoro/wallpapers/space.jpg', tags: ['space'], category: 'static' as const },
    { id: 'snow', type: 'image' as const, src: '/pomodoro/wallpapers/nature.jpeg', tags: ['nature'], category: 'static' as const },
    { id: 'forest', type: 'image' as const, src: '/pomodoro/wallpapers/forest.jpg', tags: ['nature', 'forest'], category: 'static' as const },
    { id: 'mountain', type: 'image' as const, src: '/pomodoro/wallpapers/mountain.jpg', tags: ['nature', 'mountain'], category: 'static' as const },
    { id: 'ocean', type: 'image' as const, src: '/pomodoro/wallpapers/ocean.jpg', tags: ['nature', 'ocean'], category: 'static' as const },
    { id: 'city', type: 'image' as const, src: '/pomodoro/wallpapers/city.jpg', tags: ['urban', 'city'], category: 'static' as const },
    { id: 'minimalist', type: 'image' as const, src: '/pomodoro/wallpapers/minimalist.jpg', tags: ['minimalist'], category: 'static' as const },
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

  return (
    <div className="w-full flex flex-col gap-4 pt-2 pb-4 pomodoro-settings-container">
      {/* Clock Settings */}
      <div className="space-y-4">
        <p className="font-medium text-muted-foreground">Clock Display</p>

        <div className="space-y-3">
          <div className="w-full flex flex-row justify-between items-center">
            <span>12-hour clock</span>
            <Switch
              checked={clockSettings.hour12}
              onCheckedChange={(checked) => handleClockSettingChange('hour12', checked)}
            />
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Show seconds</span>
            <Switch
              checked={clockSettings.showSeconds}
              onCheckedChange={(checked) => handleClockSettingChange('showSeconds', checked)}
            />
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Show weekday</span>
            <Switch
              checked={clockSettings.showWeekday}
              onCheckedChange={(checked) => handleClockSettingChange('showWeekday', checked)}
            />
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Show date</span>
            <Switch
              checked={clockSettings.showDate}
              onCheckedChange={(checked) => handleClockSettingChange('showDate', checked)}
            />
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Date style</span>
            <Select
              value={clockSettings.dateStyle}
              onValueChange={(value) => handleClockSettingChange('dateStyle', value as ClockSettings['dateStyle'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clock Preview */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <div className="text-2xl font-mono">{formatTimePreview(clockSettings)}</div>
          {(clockSettings.showWeekday || clockSettings.showDate) && (
            <div className="text-sm mt-1">{formatDatePreview(clockSettings)}</div>
          )}
        </div>
      </div>

      <Separator />

      {/* Timer Presets */}
      <div className="space-y-4">
        <p className="font-medium text-muted-foreground">Focus Timer Presets</p>

        {/* Current Preset Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Manage Presets</span>
            <button
              onClick={async () => {
                const newPreset: UserSetting_TimerPreset = {
                  id: `custom-${Date.now()}`,
                  name: 'Custom Preset',
                  description: 'A custom timer preset',
                  type: 'custom',
                  focusDuration: 25,
                  shortBreakDuration: 5,
                  longBreakDuration: 15,
                  longBreakInterval: 4,
                  autoStartBreaks: true,
                  autoStartFocus: true,
                  isDefault: false,
                };
                try {
                  await handlePresetOperation('create', { preset: newPreset });
                } catch (error) {
                  // Error already handled in handlePresetOperation
                }
              }}
              disabled={isOperationLoading}
              className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {isOperationLoading ? 'Creating...' : '+ New Preset'}
            </button>
          </div>
          <Select
            key={`select-${selectKey}-${forceUpdate}`}
            value={localSelectedPreset}
            onValueChange={(value) => handleTimerSettingChange('selectedPreset', value)}
            disabled={isOperationLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timerSettings.presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preset Details */}
        {(() => {
          const currentPreset = timerSettings.presets.find(p => p.id === localSelectedPreset);
          if (!currentPreset) return null;

          if (isEditing && editingPreset?.id === currentPreset.id) {
            // Edit mode
            return (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Edit Preset</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (!editingPreset) return;
                        
                        try {
                          const updatedPresets = timerSettings.presets.map(p =>
                            p.id === editingPreset.id ? editingPreset : p
                          );
                          await userStore.updateUserPomodoroSetting(
                            { presets: updatedPresets },
                            ['presets']
                          );
                          setIsEditing(false);
                          setEditingPreset(null);
                          setSelectKey(prev => prev + 1);
                        } catch (error) {
                          console.error('Failed to update preset:', error);
                        }
                      }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditingPreset(null);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={editingPreset.name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={editingPreset.description}
                      onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Focus Duration (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="480"
                      value={editingPreset.focusDuration}
                      onChange={(e) => setEditingPreset({ ...editingPreset, focusDuration: parseInt(e.target.value) || 25 })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Break (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={editingPreset.shortBreakDuration}
                      onChange={(e) => setEditingPreset({ ...editingPreset, shortBreakDuration: parseInt(e.target.value) || 5 })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Long Break (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={editingPreset.longBreakDuration}
                      onChange={(e) => setEditingPreset({ ...editingPreset, longBreakDuration: parseInt(e.target.value) || 15 })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Long Break After (sessions)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={editingPreset.longBreakInterval}
                      onChange={(e) => setEditingPreset({ ...editingPreset, longBreakInterval: parseInt(e.target.value) || 4 })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingPreset.autoStartBreaks}
                        onCheckedChange={(checked) => setEditingPreset({ ...editingPreset, autoStartBreaks: checked })}
                      />
                      <label className="text-sm">Auto-start breaks</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingPreset.autoStartFocus}
                        onCheckedChange={(checked) => setEditingPreset({ ...editingPreset, autoStartFocus: checked })}
                      />
                      <label className="text-sm">Auto-start focus</label>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            // View mode
            return (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{currentPreset.name}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        // If this is a default preset, create a user-specific copy first
                        let presetToEdit = currentPreset;
                        if (currentPreset.isDefault) {
                          const userCopy: UserSetting_TimerPreset = {
                            ...currentPreset,
                            id: `custom-${Date.now()}`,
                            name: `${currentPreset.name} (Custom)`,
                            isDefault: false,
                            type: 'custom',
                          };
                          
                          // Immediately enter edit mode for the new preset
                          setEditingPreset({ ...userCopy });
                          setIsEditing(true);
                          
                          try {
                            await handlePresetOperation('create', { preset: userCopy });
                            // Update the editing preset with the latest data from server
                            setEditingPreset({ ...userCopy });
                          } catch (error) {
                            console.error('Failed to create user copy of preset:', error);
                            // Revert edit mode and local state on error
                            setIsEditing(false);
                            setEditingPreset(null);
                            setLocalSelectedPreset(timerSettings.selectedPreset);
                            return;
                          }
                        } else {
                          // For custom presets, directly enter edit mode
                          setEditingPreset({ ...currentPreset });
                          setIsEditing(true);
                        }
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    {!currentPreset.isDefault && (
                      <button
                        onClick={async () => {
                          const updatedPresets = timerSettings.presets.filter(p => p.id !== currentPreset.id);
                          const newSelectedPreset = localSelectedPreset === currentPreset.id ? 'pomodoro-classic' : localSelectedPreset;
                          try {
                            await handlePresetOperation('delete', {
                              presetId: currentPreset.id,
                              newSelectedPreset
                            });
                          } catch (error) {
                            // Error already handled in handlePresetOperation
                          }
                        }}
                        disabled={isOperationLoading}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {isOperationLoading ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {currentPreset.type}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{currentPreset.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Focus:</span>
                    <span className="ml-2 font-medium">
                      {currentPreset.focusDuration === 0 ? '∞' : `${currentPreset.focusDuration}m`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Short Break:</span>
                    <span className="ml-2 font-medium">{currentPreset.shortBreakDuration}m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Long Break:</span>
                    <span className="ml-2 font-medium">{currentPreset.longBreakDuration}m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Long Break After:</span>
                    <span className="ml-2 font-medium">{currentPreset.longBreakInterval} sessions</span>
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Auto-start breaks:</span>
                    <span className={`font-medium ${currentPreset.autoStartBreaks ? 'text-green-600' : 'text-red-600'}`}>
                      {currentPreset.autoStartBreaks ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Auto-start focus:</span>
                    <span className={`font-medium ${currentPreset.autoStartFocus ? 'text-green-600' : 'text-red-600'}`}>
                      {currentPreset.autoStartFocus ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })()}
      </div>

      <Separator />

      {/* Appearance Settings */}
      <div className="space-y-6">
        <p className="font-medium text-muted-foreground">Appearance</p>

        {/* Mode Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              appearanceTab === 'home' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setAppearanceTab('home')}
          >
            Home
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              appearanceTab === 'focus' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setAppearanceTab('focus')}
          >
            Focus
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              appearanceTab === 'ambient' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setAppearanceTab('ambient')}
          >
            Ambient
          </button>
        </div>

        {/* Wallpaper Settings */}
        <div className="space-y-4">
          <div className="w-full flex flex-row justify-between items-center">
            <span>Wallpaper</span>
            <Select
              value={appearanceSettings[appearanceTab].wallpaper.selectedWallpaper}
              onValueChange={(value) => handleWallpaperSettingChange('selectedWallpaper', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wallpapers.map((wallpaper) => (
                  <SelectItem key={wallpaper.id} value={wallpaper.id}>
                    {wallpaper.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Wallpaper style</span>
            <Select
              value={appearanceSettings[appearanceTab].wallpaper.wallpaperStyle}
              onValueChange={(value) => handleWallpaperSettingChange('wallpaperStyle', value as WallpaperSettings['wallpaperStyle'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="stretch">Stretch</SelectItem>
                <SelectItem value="tile">Tile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wallpaper Previews */}
          <div className="space-y-4">
            {/* Static Wallpapers */}
            <div>
              <h4 className="text-sm font-medium mb-3">Static Wallpapers</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {wallpapers.filter(w => w.category === 'static').map((wallpaper) => (
                  <WallpaperPreview
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    isSelected={appearanceSettings[appearanceTab].wallpaper.selectedWallpaper === wallpaper.id}
                    onSelect={() => handleWallpaperSettingChange('selectedWallpaper', wallpaper.id)}
                  />
                ))}
              </div>
            </div>

            {/* Animated Wallpapers */}
            <div>
              <h4 className="text-sm font-medium mb-3">Animated Wallpapers</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {wallpapers.filter(w => w.category === 'animated').map((wallpaper) => (
                  <WallpaperPreview
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    isSelected={appearanceSettings[appearanceTab].wallpaper.selectedWallpaper === wallpaper.id}
                    onSelect={() => handleWallpaperSettingChange('selectedWallpaper', wallpaper.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Font Settings */}
        <div className="space-y-4">
          <div className="w-full flex flex-row justify-between items-center">
            <span>Font</span>
            <Select
              value={appearanceSettings[appearanceTab].font.selectedFont}
              onValueChange={(value) => handleFontSettingChange('selectedFont', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem key={font.id} value={font.id}>{font.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Font Size (px)</span>
            <Input
              type="number"
              min="12"
              max="40"
              value={appearanceSettings[appearanceTab].font.fontSize}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 12 && value <= 40) {
                  handleFontSettingChange('fontSize', value);
                }
              }}
              className="w-20"
            />
          </div>

          <div className="w-full flex flex-row justify-between items-center">
            <span>Font Color</span>
            <Input
              type="color"
              value={appearanceSettings[appearanceTab].font.fontColor}
              onChange={(e) => handleFontSettingChange('fontColor', e.target.value)}
              className="w-20 h-10 p-1 border rounded cursor-pointer"
            />
          </div>

          {/* Font Previews */}
          <div>
            <h4 className="text-sm font-medium mb-3">Font Preview</h4>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg" style={{ 
                fontFamily: fonts.find(f => f.id === appearanceSettings[appearanceTab].font.selectedFont)?.css || '',
                fontSize: `${appearanceSettings[appearanceTab].font.fontSize}px`,
                color: appearanceSettings[appearanceTab].font.fontColor
              }}>
                The quick brown fox jumps over the lazy dog
              </p>
              <p className="text-sm text-muted-foreground mt-2" style={{ 
                fontFamily: fonts.find(f => f.id === appearanceSettings[appearanceTab].font.selectedFont)?.css || '',
                fontSize: `${appearanceSettings[appearanceTab].font.fontSize}px`,
                color: appearanceSettings[appearanceTab].font.fontColor
              }}>
                0123456789
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            disabled={!originalAppearanceSettings || isEqual(appearanceSettings, originalAppearanceSettings)}
            onClick={handleSaveAppearanceSettings}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default PomodoroSection;