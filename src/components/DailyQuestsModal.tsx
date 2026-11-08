import React from 'react';
import {
  X,
  Scroll,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Flame,
  Coffee,
  Clock,
  Leaf,
  Layers,
  Feather,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyQuest } from '../types/game';
import { ALL_QUESTS_DAILY_BONUS } from '../game/questGenerator';
import { synthAudio } from '../audio/synthAudio';

interface DailyQuestsModalProps {
  quests: DailyQuest[];
  allQuestsClaimedBonus: boolean;
  onClaimQuestReward: (questId: string) => void;
  onClaimAllBonus: () => void;
  onRerollQuest: (questId: string) => void;
  onClose: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  quests,
  allQuestsClaimedBonus,
  onClaimQuestReward,
  onClaimAllBonus,
  onRerollQuest,
  onClose,
}) => {
  const completedCount = quests.filter((q) => q.completed).length;
  const allCompleted = quests.length > 0 && quests.every((q) => q.completed);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'leaf':
        return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'feather':
        return <Feather className="w-5 h-5 text-sky-400" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'coffee':
        return <Coffee className="w-5 h-5 text-amber-300" />;
      case 'layers':
        return <Layers className="w-5 h-5 text-purple-400" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-indigo-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleClaim = (quest: DailyQuest) => {
    synthAudio.playUpgradeUnlock();
    confetti({
      particleCount: 35,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6'],
    });
    onClaimQuestReward(quest.id);
  };

  const handleClaimGrandBonus = () => {
    synthAudio.playUpgradeUnlock();
    confetti({
      particleCount: 65,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
    });
    onClaimAllBonus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-lg text-amber-100">
                  Daily Archivist Quests
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/50 text-amber-300">
                  3 Challenges Today
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Complete daily librarian duties to earn extra Dewey points, rare ribbons, and master titles.
              </p>
            </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Daily Grand Bonus Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-500/60 flex items-center justify-center text-yellow-300 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel font-bold text-sm text-amber-100">
                    Grand Daily Seal Bonus
                  </span>
                  <span className="text-[10px] font-mono bg-stone-900 px-2 py-0.5 rounded-full text-amber-300 border border-amber-900/40">
                    {completedCount} / 3 Completed
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-0.5">
                  Complete all 3 daily challenges to earn +{ALL_QUESTS_DAILY_BONUS.deweyPoints} Dewey & +{ALL_QUESTS_DAILY_BONUS.gildedRibbons} Ribbons!
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {allQuestsClaimedBonus ? (
                <span className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-cinzel rounded-xl">
                  <CheckCircle2 className="w-4 h-4" /> Seal Claimed!
                </span>
              ) : allCompleted ? (
                <button
                  onClick={handleClaimGrandBonus}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-amber-950 font-cinzel font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Claim Daily Seal!</span>
                </button>
              ) : (
                <div className="text-xs font-mono text-stone-400 bg-stone-950/60 px-3 py-1.5 rounded-xl border border-stone-800 text-center">
                  Finish remaining quests
                </div>
              )}
            </div>
          </div>

          {/* List of 3 Daily Quests */}
          <div className="space-y-3.5">
            {quests.map((quest) => {
              const progressPct = Math.min(100, Math.round((quest.currentCount / quest.targetCount) * 100));

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    quest.claimed
                      ? 'bg-stone-950/40 border-stone-800 opacity-75'
                      : quest.completed
                      ? 'bg-amber-950/40 border-amber-500/70 shadow-lg ring-1 ring-amber-400/40'
                      : 'bg-stone-950/70 border-stone-800 hover:border-amber-800/60'
                  }`}
                >
                  {/* Left: Icon and Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 shrink-0">
                      {renderIcon(quest.iconName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-cinzel font-bold text-sm text-stone-100 truncate">
                          {quest.title}
                        </h4>
                        {quest.claimed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            Claimed
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                        {quest.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-3 mt-2.5 max-w-sm">
                        <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700/50">
                          <div
                            className={`h-full transition-all duration-300 ${
                              quest.completed
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : 'bg-gradient-to-r from-amber-500 to-amber-300'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-stone-300 tabular-nums shrink-0">
                          {quest.currentCount} / {quest.targetCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rewards & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800/60">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-300">+{quest.rewardPoints} Dewey</span>
                      <span className="text-stone-500">·</span>
                      <span className="text-yellow-300">+{quest.rewardRibbons} Ribbons</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!quest.completed && !quest.claimed && (
                        <button
                          onClick={() => {
                            synthAudio.playButtonClick();
                            onRerollQuest(quest.id);
                          }}
                          title="Reroll this challenge"
                          className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {quest.claimed ? (
                        <div className="flex items-center gap-1 text-xs text-stone-500 font-cinzel px-3 py-1.5 bg-stone-900/60 rounded-xl border border-stone-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Rewarded</span>
                        </div>
                      ) : quest.completed ? (
                        <button
                          onClick={() => handleClaim(quest)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-cinzel font-bold text-xs rounded-xl shadow transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          <span>Claim</span>
                        </button>
                      ) : (
                        <div className="text-[11px] font-mono text-stone-400 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800">
                          In Progress
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono">
            New challenges arrive every calendar day at midnight.
          </span>
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-cinzel transition-colors cursor-pointer"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>
  );
};
