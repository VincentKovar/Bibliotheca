import React from 'react';
import {
  BookOpen,
  Sparkles,
  Coffee,
  User,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Cloud,
  Volume2,
  VolumeX,
  Music,
  Pause,
  Clock,
} from 'lucide-react';
import { GameStats, ActiveTeaBuff } from '../types/game';
import { CameraPreset } from '../game/three/scene';
import { synthAudio } from '../audio/synthAudio';

interface HUDProps {
  stats: GameStats;
  comboMultiplier: number;
  comboTimeLeft: number; // 0 to 1
  activeBuff: ActiveTeaBuff | null;
  timeOfDayHour: number;
  onSetTimeOfDay: (hour: number) => void;
  cloudSyncStatus: 'synced' | 'saving' | 'offline';
  isMuted: boolean;
  onToggleMute: () => void;
  isLoFiPlaying: boolean;
  onToggleLoFi: () => void;
  activeCameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onOpenStation: (station: 'desk' | 'tbr' | 'tea' | 'vitrine' | 'avatar' | 'upgrades') => void;
  onOpenPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  comboMultiplier,
  comboTimeLeft,
  activeBuff,
  timeOfDayHour,
  onSetTimeOfDay,
  cloudSyncStatus,
  isMuted,
  onToggleMute,
  isLoFiPlaying,
  onToggleLoFi,
  activeCameraPreset,
  onSelectCameraPreset,
  onOpenStation,
  onOpenPause,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = React.useState(false);

  // Keyboard shortcut 'H' to toggle dock
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format time of day display
  const hourInt = Math.floor(timeOfDayHour);
  const minInt = Math.floor((timeOfDayHour % 1) * 60);
  const period = hourInt >= 12 ? 'PM' : 'AM';
  const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
  const timeFormatted = `${displayHour}:${minInt.toString().padStart(2, '0')} ${period}`;

  let phaseLabel = 'Daylight';
  if (timeOfDayHour >= 5 && timeOfDayHour < 8) phaseLabel = 'Golden Dawn';
  else if (timeOfDayHour >= 8 && timeOfDayHour < 17) phaseLabel = 'Afternoon';
  else if (timeOfDayHour >= 17 && timeOfDayHour < 20) phaseLabel = 'Amber Dusk';
  else phaseLabel = 'Starlight Hearth';

  const isNight = timeOfDayHour < 6 || timeOfDayHour >= 20;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-30 select-none">
      {/* TOP PERIMETER STATUS BAR */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Top-Left: Library Level & Active Buff */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center gap-2.5 bg-stone-900/90 border border-amber-900/50 px-3.5 py-2 rounded-2xl shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 font-cinzel font-bold text-sm">
              {stats.libraryLevel}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-xs font-semibold text-amber-100">
                  {stats.libraryLevel === 1
                    ? 'Attic Book Nook'
                    : stats.libraryLevel === 2
                    ? 'Village Athenaeum'
                    : stats.libraryLevel === 3
                    ? 'Grand Archivist Sanctuary'
                    : 'Mythic Scriptorium'}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  Lvl {stats.libraryLevel}
                </span>
              </div>
              {/* XP Progress Bar */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-amber-900/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (stats.experiencePoints / stats.nextLevelExp) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 tabular-nums">
                  {stats.experiencePoints}/{stats.nextLevelExp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Active Tea Buff Pill */}
          {activeBuff && (
            <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500/50 px-3 py-1.5 rounded-full text-xs text-amber-200 shadow-md">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">{activeBuff.name}</span>
              <span className="text-[10px] bg-amber-900/80 px-1.5 py-0.5 rounded-full text-amber-300 font-mono">
                {Math.max(0, Math.ceil((activeBuff.expiresAt - Date.now()) / 1000))}s
              </span>
            </div>
          )}
        </div>

        {/* Top-Center: Relaxing Day-Night Time of Day & Presets */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-stone-900/90 border border-stone-800/80 px-3 py-1.5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-stone-300">
            {isNight ? (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-mono tabular-nums text-amber-200 font-medium">
              {timeFormatted}
            </span>
            <span className="text-stone-400 text-[11px]">· {phaseLabel}</span>
          </div>

          <div className="h-4 w-px bg-stone-700/60 mx-1" />

          {/* Quick Time Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetTimeOfDay(6.5)}
              title="Dawn (6:30 AM)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                timeOfDayHour >= 5 && timeOfDayHour < 9
                  ? 'bg-amber-800/80 text-amber-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dawn
            </button>
            <button
              onClick={() => onSetTimeOfDay(13.0)}
              title="Noon (1:00 PM)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                timeOfDayHour >= 9 && timeOfDayHour < 17
                  ? 'bg-amber-800/80 text-amber-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onSetTimeOfDay(18.5)}
              title="Sunset (6:30 PM)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                timeOfDayHour >= 17 && timeOfDayHour < 20
                  ? 'bg-amber-800/80 text-amber-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dusk
            </button>
            <button
              onClick={() => onSetTimeOfDay(22.0)}
              title="Night (10:00 PM)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                timeOfDayHour >= 20 || timeOfDayHour < 5
                  ? 'bg-amber-800/80 text-amber-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Night
            </button>
          </div>
        </div>

        {/* Top-Right: Currencies & Combo Multiplier */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Dewey Points */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 border border-amber-900/40 px-3 py-1.5 rounded-2xl shadow-lg">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs font-semibold tabular-nums text-amber-100">
              {stats.deweyPoints}
            </span>
            <span className="text-[10px] text-amber-400/80 font-cinzel">Dewey</span>
          </div>

          {/* Gilded Ribbons */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 border border-amber-900/40 px-3 py-1.5 rounded-2xl shadow-lg">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="font-mono text-xs font-semibold tabular-nums text-yellow-200">
              {stats.gildedRibbons}
            </span>
            <span className="text-[10px] text-yellow-400/80 font-cinzel">Ribbons</span>
          </div>

          {/* Combo Multiplier Meter */}
          <div className="relative flex flex-col items-center bg-stone-900/90 border border-amber-500/50 px-3 py-1.5 rounded-2xl shadow-lg">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 font-mono tabular-nums">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{comboMultiplier.toFixed(1)}x</span>
            </div>
            {/* Combo Decay Bar */}
            <div className="w-14 h-1 bg-stone-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{ width: `${comboTimeLeft * 100}%` }}
              />
            </div>
          </div>

          {/* Cloud Sync Status Indicator */}
          <div
            title={
              cloudSyncStatus === 'synced'
                ? 'Cloud Saved'
                : cloudSyncStatus === 'saving'
                ? 'Saving to Cloud...'
                : 'Offline'
            }
            className="flex items-center gap-1 bg-stone-900/90 border border-stone-800 p-2 rounded-xl text-stone-300 shadow-md"
          >
            <Cloud
              className={`w-4 h-4 ${
                cloudSyncStatus === 'synced'
                  ? 'text-emerald-400'
                  : cloudSyncStatus === 'saving'
                  ? 'text-amber-400 animate-spin'
                  : 'text-stone-500'
              }`}
            />
          </div>

          {/* Pause Button */}
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onOpenPause();
            }}
            className="p-2 bg-stone-900/90 border border-stone-800 hover:bg-stone-800 text-stone-300 hover:text-amber-200 rounded-xl transition-colors cursor-pointer shadow-md"
            title="Pause Menu [Esc]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM DOCK (Zero Viewport Occlusion) */}
      <div className="pointer-events-auto mx-auto flex flex-col items-center max-w-4xl w-full">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => {
            synthAudio.playButtonClick();
            setIsDockCollapsed(!isDockCollapsed);
          }}
          className="mb-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-amber-900/40 text-stone-300 hover:text-amber-200 text-xs font-mono shadow-md cursor-pointer transition-colors"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? 'Show Controls [H]' : 'Hide Controls [H]'}</span>
        </button>

        {/* Dock Container */}
        {!isDockCollapsed && (
          <div className="w-full bg-stone-900/95 border border-amber-900/50 rounded-2xl p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-stone-200">
            {/* Primary Stations Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onOpenStation('desk');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/80 hover:bg-amber-900/90 text-amber-100 border border-amber-700/50 rounded-xl text-xs font-cinzel font-semibold shadow transition-all cursor-pointer hover:scale-[1.02]"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Sorting Desk</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onOpenStation('tbr');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 border border-stone-700/60 rounded-xl text-xs font-cinzel font-medium transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>TBR & Loans</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onOpenStation('tea');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 border border-stone-700/60 rounded-xl text-xs font-cinzel font-medium transition-all cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tea Room</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onOpenStation('vitrine');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 border border-stone-700/60 rounded-xl text-xs font-cinzel font-medium transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rare Codex</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onOpenStation('avatar');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 border border-stone-700/60 rounded-xl text-xs font-cinzel font-medium transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Avatar</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onOpenStation('upgrades');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-900/40 hover:bg-amber-900/70 text-amber-200 border border-amber-600/50 rounded-xl text-xs font-cinzel font-medium transition-all cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-yellow-400" />
                <span>Upgrades</span>
              </button>
            </div>

            {/* Camera Presets & Audio Controls */}
            <div className="flex items-center gap-2">
              {/* Camera Presets */}
              <div className="flex items-center bg-stone-800/90 p-1 rounded-xl border border-stone-700/50 text-[11px] font-mono">
                {(['overview', 'desk', 'stacks', 'tea_room'] as CameraPreset[]).map((cam) => {
                  const isCur = activeCameraPreset === cam;
                  const label = cam === 'tea_room' ? 'Tea' : cam.charAt(0).toUpperCase() + cam.slice(1);
                  return (
                    <button
                      key={cam}
                      onClick={() => {
                        synthAudio.playButtonClick();
                        onSelectCameraPreset(cam);
                      }}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-amber-800/80 text-amber-100 font-semibold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Lo-Fi Synth Ambient Music Toggle */}
              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onToggleLoFi();
                }}
                title={isLoFiPlaying ? 'Mute Lo-Fi Ambient Synth' : 'Play Lo-Fi Ambient Synth'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLoFiPlaying
                    ? 'bg-amber-900/60 border-amber-500/60 text-amber-300'
                    : 'bg-stone-800/80 border-stone-700/50 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
              </button>

              {/* Sound Effects Mute Toggle */}
              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onToggleMute();
                }}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                className="p-2 bg-stone-800/80 border border-stone-700/50 hover:bg-stone-700 text-stone-300 hover:text-amber-200 rounded-xl transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
