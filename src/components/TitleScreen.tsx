import React from 'react';
import { BookOpen, Sparkles, Cloud, Volume2, VolumeX, Play } from 'lucide-react';
import { CloudSlotSummary } from '../game/cloudSave';
import { synthAudio } from '../audio/synthAudio';

interface TitleScreenProps {
  onStartGame: (slotId: number) => void;
  cloudSlots: CloudSlotSummary[];
  activeSlotId: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  cloudSlots,
  activeSlotId,
  isMuted,
  onToggleMute,
}) => {
  const [selectedSlot, setSelectedSlot] = React.useState<number>(activeSlotId);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        synthAudio.playButtonClick();
        onStartGame(selectedSlot);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlot, onStartGame]);

  return (
    <div className="absolute inset-0 pointer-events-auto flex flex-col justify-between p-6 md:p-12 z-40 bg-gradient-to-b from-stone-950/70 via-stone-900/35 to-stone-950/80 text-stone-100 select-none">
      {/* Top Bar with Mute and Cloud Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-stone-900/80 border border-amber-900/40 px-3.5 py-1.5 rounded-full text-xs text-amber-200/90 shadow-lg">
          <Cloud className="w-3.5 h-3.5 text-amber-400" />
          <span>Cloud Saves Enabled</span>
        </div>

        <button
          onClick={() => {
            synthAudio.playButtonClick();
            onToggleMute();
          }}
          className="p-2.5 rounded-full bg-stone-900/80 border border-stone-700/60 hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition-colors cursor-pointer"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Hero Centerpiece & Inline SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center text-center my-auto max-w-2xl mx-auto">
        {/* Bespoke inline SVG logo badge */}
        <div className="mb-4">
          <svg className="w-20 h-20 text-amber-400 mx-auto drop-shadow-md" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
            <path d="M50 20 L50 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M22 36 C35 30, 48 34, 50 40 C52 34, 65 30, 78 36 L78 72 C65 66, 52 70, 50 76 C48 70, 35 66, 22 72 Z" fill="#78350f" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="40" r="4" fill="#fbbf24" />
            <path d="M38 48 C42 46, 46 47, 48 49" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M62 48 C58 46, 54 47, 52 49" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <span className="text-amber-400 font-cinzel tracking-widest text-xs uppercase mb-1">
          A Cozy 3D Isometric Sanctuary
        </span>

        <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-amber-100 tracking-tight drop-shadow-lg mb-3">
          Bibliotheca
        </h1>

        <p className="text-sm md:text-base text-stone-300 font-playfair italic max-w-lg mb-8 leading-relaxed">
          Shelve forgotten volumes, unlock rare vintage editions, brew soothing herbal infusions, and keep the hearth warm in your quiet library haven.
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => {
            synthAudio.playButtonClick();
            onStartGame(selectedSlot);
          }}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-amber-50 font-cinzel font-semibold tracking-wider text-sm rounded-xl border border-amber-400/50 shadow-xl shadow-amber-950/50 hover:shadow-amber-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer mb-6"
        >
          <Play className="w-4 h-4 fill-current text-amber-200" />
          <span>Enter Library</span>
          <span className="text-xs text-amber-200/80 font-mono font-normal">
            [Space / Enter]
          </span>
        </button>

        {/* Cloud Save Slots selector */}
        <div className="w-full max-w-md bg-stone-900/90 border border-amber-950/60 p-3.5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2 px-1">
            <span className="font-cinzel text-amber-300/80">Select Save Archive</span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400/70">
              <Cloud className="w-3 h-3" /> Auto-Synced
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {cloudSlots.map((slot) => {
              const isSelected = selectedSlot === slot.slotId;
              return (
                <button
                  key={slot.slotId}
                  onClick={() => {
                    synthAudio.playButtonClick();
                    setSelectedSlot(slot.slotId);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    isSelected
                      ? 'bg-amber-900/50 border-amber-500/80 text-amber-100 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-stone-800/60 border-stone-700/50 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs font-cinzel">Slot {slot.slotId}</span>
                    {isSelected && <Sparkles className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-[11px] truncate">{slot.slotName}</div>
                  <div className="text-[10px] text-stone-400/80">
                    {slot.isEmpty ? 'Empty Tome' : `Lvl ${slot.level} · ${slot.booksShelved} books`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flat Single-line Control Hint */}
      <div className="text-center text-xs text-stone-400/90 font-mono tracking-wide py-2">
        <span className="text-amber-300 font-medium">Click / Drag</span> Rotate View · <span className="text-amber-300 font-medium">Click Stations</span> Interact · <span className="text-amber-300 font-medium">Space</span> Quick Action · <span className="text-amber-300 font-medium">Esc</span> Pause
      </div>
    </div>
  );
};
