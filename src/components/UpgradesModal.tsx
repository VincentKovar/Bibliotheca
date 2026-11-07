import React from 'react';
import { X, Award, Check, Sparkles, BookOpen, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LibraryUpgrade } from '../types/game';
import { LIBRARY_UPGRADES } from '../game/bookGenerator';
import { synthAudio } from '../audio/synthAudio';

interface UpgradesModalProps {
  unlockedUpgradeIds: string[];
  deweyPoints: number;
  gildedRibbons: number;
  libraryLevel: number;
  onPurchaseUpgrade: (upgrade: LibraryUpgrade) => void;
  onClose: () => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  unlockedUpgradeIds,
  deweyPoints,
  gildedRibbons,
  libraryLevel,
  onPurchaseUpgrade,
  onClose,
}) => {
  const isUnlocked = (id: string) => unlockedUpgradeIds.includes(id);

  const handleBuy = (upgrade: LibraryUpgrade) => {
    if (
      deweyPoints >= upgrade.costPoints &&
      gildedRibbons >= upgrade.costRibbons &&
      libraryLevel >= upgrade.levelRequired
    ) {
      synthAudio.playUpgradeUnlock();
      confetti({
        particleCount: 45,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6'],
      });
      onPurchaseUpgrade(upgrade);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100">
                Library Sanctuary Expansions
              </h2>
              <p className="text-xs text-stone-400">
                Level up library wings, install ornate furnishings, and adopt animal companions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs font-mono bg-stone-950 px-3.5 py-1.5 rounded-2xl border border-stone-800">
              <span className="flex items-center gap-1 text-amber-300">
                <BookOpen className="w-3.5 h-3.5" /> {deweyPoints} Dewey
              </span>
              <span className="flex items-center gap-1 text-yellow-300">
                <Award className="w-3.5 h-3.5" /> {gildedRibbons} Ribbons
              </span>
            </div>

            <button
              onClick={() => {
                synthAudio.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIBRARY_UPGRADES.map((upgrade) => {
            const unlocked = isUnlocked(upgrade.id);
            const canAfford =
              deweyPoints >= upgrade.costPoints && gildedRibbons >= upgrade.costRibbons;
            const levelMet = libraryLevel >= upgrade.levelRequired;

            return (
              <div
                key={upgrade.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  unlocked
                    ? 'bg-amber-950/20 border-emerald-600/40'
                    : canAfford && levelMet
                    ? 'bg-stone-950/80 border-amber-600/60 shadow-lg'
                    : 'bg-stone-950/40 border-stone-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-cinzel font-bold text-base text-amber-100">
                      {upgrade.title}
                    </span>
                    {unlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                        <Check className="w-3.5 h-3.5" /> Installed
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-stone-400">
                        Requires Lvl {upgrade.levelRequired}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed mb-2.5">
                    {upgrade.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-[11px] text-amber-200/90 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{upgrade.perkDescription}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={deweyPoints >= upgrade.costPoints ? 'text-amber-300' : 'text-stone-500'}>
                      {upgrade.costPoints} Dewey
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className={gildedRibbons >= upgrade.costRibbons ? 'text-yellow-300' : 'text-stone-500'}>
                      {upgrade.costRibbons} Ribbons
                    </span>
                  </div>

                  {!unlocked && (
                    <button
                      onClick={() => handleBuy(upgrade)}
                      disabled={!canAfford || !levelMet}
                      className={`px-4 py-2 rounded-xl text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                        canAfford && levelMet
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-amber-50 shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {!levelMet
                        ? `Locked (Lvl ${upgrade.levelRequired})`
                        : canAfford
                        ? 'Install Upgrade'
                        : 'Insufficient Funds'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
