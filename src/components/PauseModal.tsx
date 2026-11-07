import React from 'react';
import { X, Play, Cloud, Download, Upload, Volume2, VolumeX, RotateCcw, Home, Sparkles } from 'lucide-react';
import { CloudSlotSummary } from '../game/cloudSave';
import { synthAudio } from '../audio/synthAudio';

interface PauseModalProps {
  onResume: () => void;
  onSaveToCloud: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onReturnToTitle: () => void;
  cloudSlots: CloudSlotSummary[];
  activeSlotId: number;
  onSelectSlot: (slotId: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onSaveToCloud,
  onExportSave,
  onImportSave,
  onReturnToTitle,
  cloudSlots,
  activeSlotId,
  onSelectSlot,
  isMuted,
  onToggleMute,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [sfxVol, setSfxVol] = React.useState(0.7);
  const [musicVol, setMusicVol] = React.useState(0.35);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);

  const handleManualSave = async () => {
    synthAudio.playButtonClick();
    setSaveStatus('Saving to Cloud...');
    await onSaveToCloud();
    setSaveStatus('✨ Cloud Save Synchronized!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      synthAudio.playBookPickup();
      onImportSave(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 pointer-events-auto select-none">
      <div className="relative w-full max-w-xl flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <h2 className="font-cinzel font-bold text-lg text-amber-100">Sanctuary Paused</h2>
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onResume();
            }}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Primary Resume Button */}
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onResume();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 text-amber-50 font-cinzel font-bold tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Organizing [Esc]</span>
          </button>

          {/* Cloud Save & Slots Section */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-cinzel font-semibold">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-amber-400" /> Cloud Save Archive
              </span>
              {saveStatus && <span className="text-emerald-400 font-mono text-[11px]">{saveStatus}</span>}
            </div>

            {/* Cloud Slot Picker */}
            <div className="grid grid-cols-3 gap-2">
              {cloudSlots.map((slot) => {
                const isSelected = activeSlotId === slot.slotId;
                return (
                  <button
                    key={slot.slotId}
                    onClick={() => {
                      synthAudio.playButtonClick();
                      onSelectSlot(slot.slotId);
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-100 ring-1 ring-amber-400/50'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="font-semibold font-cinzel text-xs">Slot {slot.slotId}</div>
                    <div className="text-[10px] text-stone-400 truncate">{slot.slotName}</div>
                    <div className="text-[9px] text-stone-500 font-mono mt-1">
                      {slot.isEmpty ? 'Empty' : `Lvl ${slot.level}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Save / Export / Import Actions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={handleManualSave}
                className="py-2 px-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-600/40 text-[11px] font-cinzel font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Save Now</span>
              </button>

              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onExportSave();
                }}
                className="py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-cinzel transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-cinzel transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Audio Volume Controls */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-cinzel font-semibold">
              <span>Synthesizer Acoustics</span>
              <button
                onClick={() => {
                  synthAudio.playButtonClick();
                  onToggleMute();
                }}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isMuted ? 'Muted' : 'Sound Active'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Sound Effects Volume</span>
                <span className="font-mono text-amber-200">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSfxVol(val);
                  synthAudio.setSfxVolume(val);
                }}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Lo-Fi Ambient Chords</span>
                <span className="font-mono text-amber-200">{Math.round(musicVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMusicVol(val);
                  synthAudio.setMusicVolume(val);
                }}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Controls Reference */}
          <div className="p-3 bg-stone-950/40 rounded-xl border border-stone-800/60 text-[11px] text-stone-400 font-mono space-y-1">
            <div><strong className="text-amber-200">Click & Drag:</strong> Rotate / orbit isometric diorama</div>
            <div><strong className="text-amber-200">Click 3D Props:</strong> Interact with Desk, Stacks, Tea Table, Cat</div>
            <div><strong className="text-amber-200">H:</strong> Toggle Collapsible Bottom Dock</div>
            <div><strong className="text-amber-200">Esc:</strong> Pause / Resume</div>
          </div>

          {/* Return to Title */}
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onReturnToTitle();
            }}
            className="w-full py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-cinzel transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
